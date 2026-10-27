import assert from "node:assert/strict";
import postgres from "postgres";
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import type { Asset, Cut, CutSummary, Episode, Version } from "../src/lib/cutdesk/types";

const base = process.env.TEST_BASE_URL || "http://localhost:3007";
const runId = randomUUID();
const suffix = [...runId.replaceAll("-", "").slice(0, 10)].map(c => String.fromCharCode(65 + parseInt(c, 16))).join("");
const code = `EP30_S99_C999_QA${suffix}`;
const title = `[QA CRUD] ${runId}`;
const pathPrefix = `__qa__/crud/${runId}/`;
const results: { check: string; ok: boolean; detail?: string }[] = [];
let cookie = "", createdId = "", assetId = "", uploadKey = "";
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", prepare: false, max: 1, connect_timeout: 15 });
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const tables = ["projects", "episodes", "cuts", "assets", "cut_assets", "versions", "imports"];
async function snapshot() {
  return sql.begin(async tx => {
    await tx`set transaction isolation level repeatable read read only`;
    return Object.fromEntries(await Promise.all(tables.map(async table => {
      const rows = await tx`select to_jsonb(t) value from ${tx("cutdesk")}.${tx(table)} t order by to_jsonb(t)::text`;
      return [table, { count: rows.length, checksum: hash(JSON.stringify(rows)) }];
    })));
  });
}
async function request(path: string, init: RequestInit = {}) {
  return fetch(base + path, { ...init, signal: AbortSignal.timeout(45000), headers: {
    Origin: base, "Content-Type": "application/json", Cookie: cookie, ...init.headers,
  }});
}
async function checked(check: string, action: () => Promise<void>) {
  try { await action(); results.push({check,ok:true}); console.log(`PASS ${check}`); }
  catch (error) { results.push({check,ok:false,detail:error instanceof Error ? error.message : "Unknown failure"}); throw error; }
}
const readCut = async () => {
  const r = await request(`/api/cuts/${createdId}`); assert.equal(r.status,200); return await r.json() as Cut;
};
const saveCut = async (cut: Cut) => {
  const r = await request(`/api/cuts/${createdId}`,{method:"PUT",body:JSON.stringify(cut)});
  assert.equal(r.status,200,`Save status: ${r.status}`); return await r.json() as Cut;
};
let baseline: Awaited<ReturnType<typeof snapshot>> | null = null;
let failure: unknown;
try {
  baseline = await snapshot();
  await checked("인증 없이 작업·백업·에셋 접근 차단",async()=>{
    for(const path of ["/api/workspace","/api/export","/api/assets","/api/source"])
      assert.equal((await request(path)).status,401);
  });
  const auth = await request("/api/session",{method:"POST",body:JSON.stringify({name:"QA 검증",password:process.env.WORKSPACE_ACCESS_CODE})});
  assert.equal(auth.status,200); cookie=auth.headers.get("set-cookie")!.split(";")[0];
  await checked("다른 출처의 변경 요청·잘못된 입력 차단",async()=>{
    assert.equal((await request("/api/workspace",{method:"POST",headers:{Origin:"https://invalid.example"},body:"{}"})).status,403);
    assert.equal((await request("/api/workspace",{method:"POST",body:JSON.stringify({episode:"EP30",code:"EP29_S99_C999_QA",title})})).status,400);
    assert.equal((await request("/api/assets",{method:"POST",body:JSON.stringify({name:"",path:"",role:"",kind:"invalid"})})).status,400);
  });
  await checked("컷 생성·새 조회·중복 번호 거부",async()=>{
    const body=JSON.stringify({episode:"EP30",code,title});const r=await request("/api/workspace",{method:"POST",body});assert.equal(r.status,200);createdId=(await r.json()).id;
    const fresh=await readCut();assert.equal(fresh.code,code);assert.equal(fresh.version,1);assert.equal(fresh.assets.length,0);
    assert.equal((await request("/api/workspace",{method:"POST",body})).status,409);
  });
  const originalMeta={name:`qa-${runId}.png`,path:pathPrefix+"reference.png",role:"QA 참조"};
  await checked("에셋 등록·검색·중복 경로 거부",async()=>{
    const body=JSON.stringify({...originalMeta,kind:"image"});const r=await request("/api/assets",{method:"POST",body});assert.equal(r.status,200);assetId=(await r.json()).id;
    assert.equal((await request("/api/assets",{method:"POST",body})).status,409);
    const items=await(await request(`/api/assets?q=${runId}`)).json() as Asset[];assert.ok(items.some(a=>a.id===assetId));
  });
  const initial=await readCut();
  const update={...initial,title:title+" 수정",status:"작업 중",duration:12.5,story:"줄콘티\n줄바꿈 보존",dialogue:"대사: 정확한 원문",prompt:`기본 프롬프트\n@{${originalMeta.name}}`,work_prompt:"별도 작업 프롬프트",prompt_draft:"별도 MCP 전달문",notes:"QA 작업 메모",assets:[{id:assetId,selected:true,note:"컷별 참조 메모"} as Asset]};
  let current=initial;
  await checked("모든 편집 필드·에셋 연결 저장·새 조회",async()=>{
    current=await saveCut(update);assert.equal(current.version,2);
    const fresh=await readCut();for(const key of ["title","status","duration","story","dialogue","prompt","work_prompt","prompt_draft","notes"] as const)assert.equal(fresh[key],update[key]);
    assert.equal(fresh.assets[0].id,assetId);assert.equal(fresh.assets[0].note,"컷별 참조 메모");assert.equal(fresh.assets[0].selected,true);
  });
  await checked("이전 버전으로 덮어쓰기 거부",async()=>{
    assert.equal((await request(`/api/cuts/${createdId}`,{method:"PUT",body:JSON.stringify(update)})).status,409);
    assert.equal((await readCut()).version,2);
  });
  const nextMeta={name:`qa-edited-${runId}.png`,path:pathPrefix+"edited.png",role:"QA 수정 참조"};
  await checked("에셋 정보 수정·동시 수정 충돌·태그 원문 보존",async()=>{
    const body=JSON.stringify({before:originalMeta,next:nextMeta});assert.equal((await request(`/api/assets/${assetId}`,{method:"PATCH",body})).status,200);
    assert.equal((await request(`/api/assets/${assetId}`,{method:"PATCH",body})).status,409);
    const fresh=await readCut();assert.equal(fresh.assets[0].name,nextMeta.name);assert.equal(fresh.assets[0].path,nextMeta.path);assert.equal(fresh.prompt,update.prompt);
  });
  await checked("누락 파일·잘못된 업로드 형식 거부",async()=>{
    assert.equal((await request(`/api/assets/${assetId}/upload`,{method:"PUT",body:JSON.stringify({key:assetId+"/missing.png"})})).status,404);
    assert.equal((await request(`/api/assets/${assetId}/upload`,{method:"POST",body:JSON.stringify({name:"bad.exe",mime:"application/octet-stream",bytes:10})})).status,400);
  });
  await checked("실파일 업로드·연결·미리보기 원본 일치",async()=>{
    const file=await readFile(new URL("../public/brand/thetent-icon.png",import.meta.url));
    const signed=await request(`/api/assets/${assetId}/upload`,{method:"POST",body:JSON.stringify({name:nextMeta.name,mime:"image/png",bytes:file.length})});assert.equal(signed.status,200);
    const upload=await signed.json();uploadKey=upload.key;assert.equal(new URL(upload.url).origin,new URL(process.env.SUPABASE_URL!).origin);assert.ok(uploadKey.startsWith(assetId+"/"));
    const uploaded=await fetch(upload.url,{method:"PUT",headers:{"Content-Type":"image/png"},body:new Uint8Array(file),signal:AbortSignal.timeout(45000)});assert.ok(uploaded.ok);
    assert.equal((await request(`/api/assets/${assetId}/upload`,{method:"PUT",body:JSON.stringify({key:uploadKey})})).status,200);
    const [stored]=await sql`select mime,bytes from cutdesk.assets where id=${assetId}`;
    assert.equal(stored.mime,"image/png");assert.equal(Number(stored.bytes),file.length);
    const fresh=await readCut();assert.ok(fresh.assets[0].preview);const media=await fetch(fresh.assets[0].preview!,{signal:AbortSignal.timeout(45000)});assert.equal(media.status,200);assert.equal(hash(new Uint8Array(await media.arrayBuffer())),hash(file));
  });
  await checked("에셋 연결 해제·이력에서 복원 후 재저장",async()=>{
    current=await saveCut({...await readCut(),assets:[]});assert.equal(current.version,3);assert.equal((await readCut()).assets.length,0);
    const history=await(await request(`/api/cuts/${createdId}/versions`)).json() as Version[];const old=history.find(v=>v.version===2)!;assert.ok(old);assert.equal(typeof old.snapshot.duration,"number");assert.equal(old.snapshot.assets[0].id,assetId);
    current=await saveCut({...old.snapshot,version:3});assert.equal(current.version,4);const fresh=await readCut();assert.equal(fresh.duration,12.5);assert.equal(fresh.assets[0].id,assetId);assert.equal(fresh.prompt,update.prompt);
  });
  await checked("컷 삭제·휴지통·삭제 상태 편집 거부·복원",async()=>{
    assert.equal((await request(`/api/cuts/${createdId}`,{method:"PATCH",body:JSON.stringify({version:current.version,restore:false})})).status,200);
    const active=await(await request("/api/workspace?episode=EP30")).json() as {cuts:CutSummary[]};assert.ok(!active.cuts.some(c=>c.id===createdId));
    const trash=await(await request("/api/workspace?episode=EP30&trash=1")).json() as {cuts:CutSummary[]};const deleted=trash.cuts.find(c=>c.id===createdId)!;assert.ok(deleted);
    assert.equal((await request(`/api/cuts/${createdId}`,{method:"PUT",body:JSON.stringify({...current,version:deleted.version})})).status,409);
    assert.equal((await request(`/api/cuts/${createdId}`,{method:"PATCH",body:JSON.stringify({version:current.version,restore:true})})).status,409);
    assert.equal((await request(`/api/cuts/${createdId}`,{method:"PATCH",body:JSON.stringify({version:deleted.version,restore:true})})).status,200);
    const restored=await readCut();assert.equal(restored.deleted_at,null);assert.equal(restored.prompt,update.prompt);assert.equal(restored.assets[0].id,assetId);
  });
  await checked("전체 백업·변경 이력·에셋 연결 포함",async()=>{
    const r=await request("/api/export");assert.equal(r.status,200);const data=JSON.parse(gunzipSync(Buffer.from(await r.arrayBuffer())).toString());
    assert.equal(data.format,"cutdesk-v1");assert.ok(data.cuts.some((c:Cut)=>c.id===createdId));assert.ok(data.assets.some((a:Asset)=>a.id===assetId));
    assert.ok(data.links.some((l:{cut_id:string;asset_id:string})=>l.cut_id===createdId&&l.asset_id===assetId));assert.ok(data.versions.filter((v:{cut_id:string})=>v.cut_id===createdId).length>=6);
    assert.ok((data.episodes as Episode[]).length>=30);
  });
} catch (error) { failure=error; }
finally {
  try {
    if(uploadKey){
      assert.ok(assetId&&uploadKey.startsWith(assetId+"/"));
      const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const r=await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/cutdesk`,{method:"DELETE",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[uploadKey]}),signal:AbortSignal.timeout(45000)});assert.ok(r.ok,"Owned upload cleanup failed.");
    }
    await sql.begin(async tx=>{
      if(createdId){const [c]=await tx`select id from cutdesk.cuts where id=${createdId} and source_id is null and code=${code} and title in ${tx([title,title+" 수정"])}`;assert.ok(c,"Fixture identity changed; refuse cleanup.");
        await tx`delete from cutdesk.cut_assets where cut_id=${createdId}`;await tx`delete from cutdesk.versions where cut_id=${createdId}`;await tx`delete from cutdesk.cuts where id=${createdId}`;}
      if(assetId){const [a]=await tx`select id from cutdesk.assets where id=${assetId} and path like ${pathPrefix+"%"}`;assert.ok(a,"Asset identity changed; refuse cleanup.");await tx`delete from cutdesk.assets where id=${assetId}`;}
    });
    if(baseline){const after=await snapshot();assert.deepEqual(after,baseline,"Existing workspace data changed during QA; inspect baseline before assuming cause.");results.push({check:"테스트 데이터 정리·기존 7개 테이블 원본 유지",ok:true});console.log("PASS 테스트 데이터 정리·기존 7개 테이블 원본 유지");}
  } catch(error){results.push({check:"테스트 정리·원본 유지",ok:false,detail:error instanceof Error?error.message:"Cleanup failed"});failure ||=error;}
  await sql.end();
  const report={runId,base,completedAt:new Date().toISOString(),ok:!failure,checks:results,baseline};
  if(process.env.QA_REPORT_PATH)await writeFile(process.env.QA_REPORT_PATH,JSON.stringify(report,null,2),{mode:0o600});
}
if(failure)throw failure;
console.log(`PASS: ${results.length} checks; temporary cut, asset and uploaded file removed.`);
