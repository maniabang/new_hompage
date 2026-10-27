/* eslint-disable @typescript-eslint/no-explicit-any -- compare the complete legacy source without dropping unmapped fields */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import postgres from "postgres";

// Usage: node --env-file=.env.cutdesk.local scripts/cutdesk-sync-reviewed.ts BASE NEXT [--apply]
// An explicit apply is required. Divergent web edits, new cuts or unknown assets stop the sync.
const [baseFile, nextFile, flag] = process.argv.slice(2);
assert.ok(baseFile && nextFile, "Pass the previous source and verified latest Drive JSON.");
const base = JSON.parse(await readFile(baseFile, "utf8"));
const raw = await readFile(nextFile, "utf8");
const next = JSON.parse(raw);
assert.ok(next.revision > base.revision, "Expected a newer source revision.");
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const checksum = sha(raw);
const archiveKey = `archives/${checksum}.json.gz`;
const scalar = (c: any) => ({
  code: c.code, title: c.title || "", scene: c.scene || "", status: c.status || "검토",
  duration: Number(c.duration) || 0, story: c.story || "", dialogue: c.dialogue || "",
  prompt: c.prompt || "", work_prompt: c.aiWork?.prompt || "",
  prompt_draft: c.aiWork?.promptDraft || "", notes: c.aiWork?.notes || "",
});
function entries(board: any) {
  const map = new Map<string, { fields: ReturnType<typeof scalar>; links: {path:string;selected:boolean;note:string}[] }>();
  for (const e of board.episodes) for (const c of e.clips) {
    const references = [...(c.references || []), ...(e.revisions || [])
      .filter((r: any) => (c.revisionIds || []).includes(r.id)).flatMap((r: any) => r.references || [])];
    const refs = new Map<string, any>();
    for (const r of references) { const path = r.path || r.localPath; if (path && !refs.has(path)) refs.set(path, r); }
    const explicit = Array.isArray(c.aiWork?.promptAssetPaths) ? new Set(c.aiWork.promptAssetPaths) : null;
    const links = [...refs].map(([path, r]) => {
      const sharedNote = board.assetNotes?.[path.toLowerCase()];
      return { path, selected: explicit ? explicit.has(path) : !(c.aiWork?.excludedAssetPaths || []).includes(path),
        note: sharedNote !== undefined ? String(typeof sharedNote === "object" && sharedNote !== null && "text" in sharedNote ? sharedNote.text : sharedNote) : c.aiWork?.assetNotes?.[path] ?? r.note ?? "" };
    });
    assert.ok(!map.has(c.id), "Duplicate source clip ID.");
    map.set(c.id, { fields: scalar(c), links });
  }
  return map;
}
const previous = entries(base), incoming = entries(next);
assert.deepEqual([...incoming.keys()].sort(), [...previous.keys()].sort(), "Cut membership changed; review separately.");
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", prepare: false, max: 1, connect_timeout: 15 });
try {
  // Dry run and apply both perform the same conflict checks inside a consistent transaction.
  await sql.begin(async (tx) => {
    await tx`set transaction isolation level repeatable read`;
    const [project] = await tx`select * from cutdesk.projects order by created_at limit 1 for update`;
    assert.ok(project, "Workspace missing.");
    if (project.source_revision === next.revision && project.source_metadata.archiveKey === archiveKey) {
      console.log(`Already synchronized to r${next.revision}.`); return;
    }
    assert.equal(project.source_revision, base.revision, "Source baseline moved; compare again.");
    const cuts = await tx`select c.* from cutdesk.cuts c join cutdesk.episodes e on e.id=c.episode_id where e.project_id=${project.id} for update of c`;
    const assets = await tx`select id,path from cutdesk.assets where project_id=${project.id}`;
    const assetByPath = new Map(assets.map(a => [a.path, a.id]));
    const links = await tx`select ca.*,a.path from cutdesk.cut_assets ca join cutdesk.assets a on a.id=ca.asset_id where a.project_id=${project.id} order by ca.cut_id,ca.sort_order`;
    assert.equal(cuts.length, previous.size, "Web cut membership changed; review separately.");
    const changed: { cut: any; value: ReturnType<typeof scalar>; links: {path:string;selected:boolean;note:string}[]; fields:string[]; linksChanged:boolean }[] = [];
    const canonicalLinks = (items: any[]) => items.map(({path,selected,note}) => ({path,selected,note})).sort((a,b) => a.path.localeCompare(b.path));
    for (const cut of cuts) {
      assert.equal(cut.deleted_at, null, `${cut.code}: web deletion needs review.`);
      const old = previous.get(cut.source_id), fresh = incoming.get(cut.source_id);
      assert.ok(old && fresh, `${cut.code}: source identity mismatch.`);
      const current = Object.fromEntries(Object.keys(old.fields).map(k => [k, k === "duration" ? Number(cut[k]) : cut[k]]));
      assert.deepEqual(current, old.fields, `${cut.code}: unsynchronized web fields; do not overwrite.`);
      const currentLinks = links.filter(l => l.cut_id === cut.id);
      assert.deepEqual(canonicalLinks(currentLinks), canonicalLinks(old.links), `${cut.code}: web asset changes need review.`);
      for (const link of fresh.links) assert.ok(assetByPath.has(link.path), `${cut.code}: unregistered asset needs review.`);
      const fields = Object.keys(fresh.fields).filter(k => fresh.fields[k as keyof typeof fresh.fields] !== old.fields[k as keyof typeof old.fields]);
      const linksChanged = JSON.stringify(canonicalLinks(fresh.links)) !== JSON.stringify(canonicalLinks(old.links));
      if (fields.length || linksChanged) changed.push({ cut, value: fresh.fields, links: fresh.links, fields, linksChanged });
    }
    console.log(JSON.stringify({ from: base.revision, to: next.revision, totalCuts: cuts.length, changes: changed.map(c => ({code:c.cut.code,fields:c.fields,linksChanged:c.linksChanged})), apply: flag === "--apply" }));
    if (flag !== "--apply") return;
    const response = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/cutdesk/${archiveKey}`, {
      method: "POST", headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": "application/gzip", "x-upsert": "false" },
      body: new Uint8Array(gzipSync(raw)),
    });
    if (!response.ok && response.status !== 409) {
      const body = await response.json();
      assert.ok(String(body.message ?? body.error).includes("already exists"), "Private source archive failed.");
    }
    for (const item of changed) {
      const [updated] = await tx`update cutdesk.cuts set ${tx(item.value)},source=${tx.json({archiveKey,sourceClipId:item.cut.source_id,sourceRevision:next.revision})},version=version+1,updated_by='Drive 동기화',updated_at=now() where id=${item.cut.id} and version=${item.cut.version} returning id,code,title,scene,status,duration,story,dialogue,prompt,work_prompt,prompt_draft,notes,version`;
      assert.ok(updated, "Concurrent save detected; retry comparison.");
      if (item.linksChanged) {
        await tx`delete from cutdesk.cut_assets where cut_id=${item.cut.id}`;
        const values = item.links.map((l,i) => ({cut_id:item.cut.id,asset_id:assetByPath.get(l.path),selected:l.selected,note:l.note,sort_order:i}));
        if (values.length) await tx`insert into cutdesk.cut_assets ${tx(values)}`;
      }
      const snapshotLinks = await tx`select asset_id id,selected,note from cutdesk.cut_assets where cut_id=${item.cut.id} order by sort_order`;
      await tx`insert into cutdesk.versions(cut_id,version,actor,action,snapshot) values(${item.cut.id},${updated.version},'Drive 동기화',${`Drive r${next.revision} 동기화`},${tx.json({...updated,assets:snapshotLinks})})`;
    }
    await tx`insert into cutdesk.imports(checksum,source_revision,snapshot) values(${checksum},${next.revision},${tx.json({archiveKey,revision:next.revision,baseRevision:base.revision,driveFileId:"1er35M_h5QYVVXunzP63k8NSYZIbFGPvd",changedCuts:changed.map(c=>c.cut.code)})}) on conflict(checksum) do nothing`;
    await tx`update cutdesk.projects set source_revision=${next.revision},source_metadata=source_metadata||${tx.json({archiveKey,lastSyncAt:new Date().toISOString(),driveFileId:"1er35M_h5QYVVXunzP63k8NSYZIbFGPvd",sourceChecksum:checksum})} where id=${project.id}`;
    console.log(`Synchronized ${changed.length} cuts; original versions and unlinked assets retained.`);
  });
} finally { await sql.end(); }
