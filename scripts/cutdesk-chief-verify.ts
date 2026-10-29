import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import postgres from "postgres";
const before=JSON.parse(await readFile(process.argv[2],"utf8"));
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const sql=postgres(process.env.DATABASE_URL!,{ssl:"require",prepare:false,max:1,connect_timeout:15});
try{
 const result=await sql.begin(async tx=>{
  await tx`set transaction isolation level repeatable read read only`;
  const cuts=await tx`select id,code,title,scene,status,duration,version,encode(sha256(convert_to(prompt,'UTF8')),'hex') base_hash,encode(sha256(convert_to(work_prompt,'UTF8')),'hex') work_hash,encode(sha256(convert_to(story,'UTF8')),'hex') story_hash,encode(sha256(convert_to(dialogue,'UTF8')),'hex') dialogue_hash,encode(sha256(convert_to(prompt_draft,'UTF8')),'hex') draft_hash,encode(sha256(convert_to(notes,'UTF8')),'hex') notes_hash from cutdesk.cuts`;
  const reviews=await tx`select cut_id,application,encode(sha256(convert_to(proposal,'UTF8')),'hex') proposal_hash,jsonb_path_query_array(asset_plan,'$[*].path') paths from cutdesk.chief_reviews`;
  const links=await tx<{cut_id:string;asset_id:string;selected:boolean;note:string;path:string}[]>`select ca.cut_id,ca.asset_id,ca.selected,ca.note,a.path from cutdesk.cut_assets ca join cutdesk.assets a on a.id=ca.asset_id`;
  const byId=new Map(reviews.map(r=>[r.cut_id,r]));let changed=0;
  assert.equal(cuts.length,before.cuts.length);assert.equal(reviews.length,251);
  for(const old of before.cuts){const c=cuts.find(c=>c.id===old.id)!;assert.ok(c);assert.equal(c.base_hash,sha(old.prompt));for(const k of ["title","scene","status"] as const)assert.equal(c[k],old[k]);assert.equal(Number(c.duration),Number(old.duration));for(const [name,column] of [["story","story_hash"],["dialogue","dialogue_hash"],["prompt_draft","draft_hash"],["notes","notes_hash"]])assert.equal(c[column],sha(old[name]));
   const review=byId.get(c.id);
   if(review?.application==="applied"){changed++;assert.equal(c.work_hash,review.proposal_hash);assert.equal(c.version,old.version+1);assert.equal(old.work_prompt,"");assert.deepEqual(links.filter(l=>l.cut_id===c.id&&l.selected).map(l=>l.path).sort(),[...review.paths].sort());}
   else{assert.equal(c.work_hash,sha(old.work_prompt));assert.equal(c.version,old.version);const fields=(items:{asset_id:string;selected:boolean;note:string}[])=>items.map(({asset_id,selected,note})=>({asset_id,selected,note})).sort((a,b)=>a.asset_id.localeCompare(b.asset_id));assert.deepEqual(fields(links.filter(l=>l.cut_id===c.id)),fields(before.links.filter((l:{cut_id:string})=>l.cut_id===c.id)));}
  }
  assert.equal(changed,139);
  const [history]=await tx`select count(*)::int total,count(*) filter(where id in ${tx(before.versions.map((v:{id:number})=>v.id))})::int preserved from cutdesk.versions`;
  assert.equal(history.preserved,before.versions.length);assert.equal(history.total,before.versions.length+changed);
  const [assets]=await tx`select count(*)::int count from cutdesk.assets`;assert.equal(assets.count,before.assets.length);
  return{ok:true,originalBasePromptsPreserved:cuts.length,workingDraftsUpdated:changed,latestOrExistingWorkPreserved:cuts.length-changed,chiefReviews:reviews.length,assets:assets.count,versions:history.total,applications:Object.fromEntries([...new Set(reviews.map(r=>r.application))].map(k=>[k,reviews.filter(r=>r.application===k).length]))};
 });
 console.log(JSON.stringify(result));if(process.env.QA_REPORT_PATH)await writeFile(process.env.QA_REPORT_PATH,JSON.stringify(result,null,2),{mode:0o600});
}finally{await sql.end();}
