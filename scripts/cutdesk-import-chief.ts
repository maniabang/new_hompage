/* eslint-disable @typescript-eslint/no-explicit-any -- private import of the user's reviewed legacy report */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import postgres from "postgres";
const [root, archivePath, apply] = process.argv.slice(2);
assert.ok(root && archivePath, "Pass the reviewed report directory and ZIP.");
const digest = (x: string | Buffer) => createHash("sha256").update(x).digest("hex");
const reportChecksum = digest(await readFile(archivePath));
const reports: any[] = [];
for (const ep of await readdir(root)) if (/^EP\d{2}$/.test(ep)) {
  for (const code of await readdir(`${root}/${ep}`)) if (/^EP\d{2}_S\d{2}_C/.test(code)) {
    const folder=`${root}/${ep}/${code}`;const report=JSON.parse(await readFile(`${folder}/컷_매핑.json`,"utf8"));
    const proposal=await readFile(`${folder}/03_참조정리_제안.txt`,"utf8");
    assert.equal(digest(proposal),report.proposedPromptSha256,`${code}: proposal checksum mismatch`);
    reports.push({...report,proposal});
  }
}
assert.equal(reports.length,251);
const sql=postgres(process.env.DATABASE_URL!,{ssl:"require",prepare:false,max:1,connect_timeout:15,onnotice:()=>{}});
try {
  if(apply==="--apply") await sql.unsafe(await readFile(new URL("../supabase/cutdesk.sql",import.meta.url),"utf8"));
  await sql.begin(async tx=>{
    const cuts=await tx`select id,code,source_id,version,(work_prompt <> '') has_work,encode(sha256(convert_to(prompt,'UTF8')),'hex') prompt_hash from cutdesk.cuts where source_id is not null for update`;
    const assets=await tx`select id,path,name,kind from cutdesk.assets`;
    const links=await tx`select ca.*,a.path from cutdesk.cut_assets ca join cutdesk.assets a on a.id=ca.asset_id order by ca.cut_id,ca.sort_order`;
    if(apply==="--apply") {
      const existing=await tx`select report_checksum from cutdesk.chief_reviews limit 1`;
      if(existing.length){assert.equal(existing[0].report_checksum,reportChecksum);console.log("Chief report already imported; no edits overwritten.");return;}
    }
    const bySource=new Map(cuts.map(c=>[c.source_id,c]));const byPath=new Map(assets.map(a=>[a.path,a]));
    const reviews:any[]=[],updates:any[]=[],newLinks:any[]=[];const counts:Record<string,number>={};
    for(const r of reports){
      const c=bySource.get(r.aiWorkroomCutId);assert.ok(c&&c.code===r.cutCode,`Cut identity mismatch: ${r.cutCode}`);
      let application="applied";const issues=[...r.issues];
      if(r.generationExcluded)application="excluded";
      else if(issues.length)application="needs_review";
      else if(c.prompt_hash!==r.currentPromptSha256){application="source_changed";issues.push("검토 자료 이후 기본 원문이 바뀌었습니다. 최신 프롬프트를 유지했습니다.");}
      else if(c.has_work){application="working_preserved";issues.push("별도로 저장한 작업 프롬프트를 유지했습니다.");}
      else if(r.assets.some((a:any)=>!byPath.has(a.path)||byPath.get(a.path)!.name!==a.name)){application="asset_changed";issues.push("자료와 현재 파일명·경로가 다른 에셋이 있습니다.");}
      counts[application]=(counts[application]||0)+1;
      reviews.push({cut_id:c.id,source_revision:r.sourceRevision,verified_revision:r.verifiedAgainstRevision||r.sourceRevision,report_checksum:reportChecksum,base_prompt_hash:r.currentPromptSha256,status:r.status,application,issues,proposal:application==="applied"?"":r.proposal,asset_plan:r.assets});
      if(application!=="applied")continue;
      updates.push({id:c.id,version:c.version,work_prompt:r.proposal});
      const selected=new Map<string,any>(r.assets.map((a:any)=>[a.path,a]));const old=links.filter(l=>l.cut_id===c.id);const seen=new Set<string>();let extraOrder=old.length;
      for(const l of old){const a=selected.get(l.path);seen.add(l.path);newLinks.push({cut_id:c.id,asset_id:l.asset_id,selected:!!a,note:a?.scope||l.note,sort_order:newLinks.filter(x=>x.cut_id===c.id).length});}
      for(const [path,a]of selected)if(!seen.has(path))newLinks.push({cut_id:c.id,asset_id:byPath.get(path)!.id,selected:true,note:a.scope||a.role||"",sort_order:extraOrder++});
    }
    console.log(JSON.stringify({reports:reviews.length,counts,apply:apply==="--apply"}));
    if(apply!=="--apply")return;
    const changed=updates.length?await tx`update cutdesk.cuts c set work_prompt=p.work_prompt,version=c.version+1,updated_by='Chief 분석 반영',updated_at=now() from jsonb_to_recordset(${tx.json(updates)}) as p(id uuid,version integer,work_prompt text) where c.id=p.id and c.version=p.version returning c.id,c.version`:[];
    assert.equal(changed.length,updates.length);
    const ids=changed.map(c=>c.id);
    if(ids.length){await tx`delete from cutdesk.cut_assets where cut_id in ${tx(ids)}`;for(let i=0;i<newLinks.length;i+=200)await tx`insert into cutdesk.cut_assets ${tx(newLinks.slice(i,i+200))}`;}
    if(ids.length) await tx`insert into cutdesk.versions(cut_id,version,actor,action,snapshot)
      select c.id,c.version,'Chief 분석 반영','Chief 참조 정리안 → 작업 프롬프트',
      jsonb_build_object('id',c.id,'code',c.code,'title',c.title,'scene',c.scene,'status',c.status,'duration',c.duration::float,'story',c.story,'dialogue',c.dialogue,'prompt',c.prompt,'work_prompt',c.work_prompt,'prompt_draft',c.prompt_draft,'notes',c.notes,'version',c.version,'assets',coalesce((select jsonb_agg(jsonb_build_object('id',a.asset_id,'selected',a.selected,'note',a.note) order by a.sort_order) from cutdesk.cut_assets a where a.cut_id=c.id),'[]'::jsonb))
      from cutdesk.cuts c where c.id in ${tx(ids)}`;
    console.log(`Saved ${ids.length} working prompts and version snapshots.`);
    for(let i=0;i<reviews.length;i+=10){
      await tx`insert into cutdesk.chief_reviews(cut_id,source_revision,verified_revision,report_checksum,base_prompt_hash,status,application,issues,proposal,asset_plan)
        select p.cut_id,p.source_revision,p.verified_revision,p.report_checksum,p.base_prompt_hash,p.status,p.application,p.issues,case when p.application='applied' then c.work_prompt else p.proposal end,p.asset_plan
        from jsonb_to_recordset(${tx.json(reviews.slice(i,i+10))}) as p(cut_id uuid,source_revision integer,verified_revision integer,report_checksum text,base_prompt_hash text,status text,application text,issues jsonb,proposal text,asset_plan jsonb) join cutdesk.cuts c on c.id=p.cut_id`;
      if((i+10)%50===0||i+10>=reviews.length)console.log(`Stored Chief reviews ${Math.min(i+10,reviews.length)}/${reviews.length}.`);
    }
    console.log("Imported Chief review; base prompts, existing working edits and excluded cuts preserved.");
  });
}finally{await sql.end();}
