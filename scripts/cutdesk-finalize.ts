import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const text = await readFile(process.argv[2], "utf8");
const board = JSON.parse(text);
if(board.revision!==442)throw new Error('This reviewed delta is pinned to revision 442.');
const hash = createHash("sha256").update(text).digest("hex");
const archiveKey = `archives/${hash}.json.gz`;
const response = await fetch(
  `${process.env.SUPABASE_URL}/storage/v1/object/cutdesk/${archiveKey}`,
  {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/gzip",
      "x-upsert": "false",
    },
    body: new Uint8Array(gzipSync(text)),
  },
);
if (!response.ok && response.status !== 409) {
  const d = await response.json();
  if (!String(d.message ?? d.error).includes("already exists"))
    throw new Error("Archive failed");
}
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 1,
});
try {
  await sql.begin(async (tx) => {
    const [project] =
      await tx`select * from cutdesk.projects order by created_at limit 1`;
    if (!project) throw new Error("Initial import not ready");
    await tx`insert into cutdesk.imports(checksum,source_revision,snapshot) values(${hash},${board.revision},${tx.json({ archiveKey, revision: board.revision })}) on conflict(checksum) do nothing`;
    for (const e of board.episodes)
      for (const c of e.clips) {
        const work = c.aiWork?.prompt || "";
        const changed = c.code === "EP12_S02_C005";
        if (!work && !changed) continue;
        const [cut] =
          await tx`select id from cutdesk.cuts where source_id=${c.id} and version=1`;
        if (!cut) continue;
        await tx`update cutdesk.cuts set work_prompt=${work} where id=${cut.id}`;
        if (changed) {
          await tx`update cutdesk.cuts set prompt=${c.prompt || ""},prompt_draft=${c.aiWork?.promptDraft || ""},story=${c.story || ""},dialogue=${c.dialogue || ""},source=${tx.json({ archiveKey, sourceClipId: c.id, sourceRevision: board.revision })} where id=${cut.id}`;
          await tx`delete from cutdesk.cut_assets where cut_id=${cut.id}`;
          const refs = c.references || [];
          for (let i = 0; i < refs.length; i++) {
            const r = refs[i],
              path = r.path || r.localPath;
            if (!path) continue;
            const ext = path.split(".").pop()?.toLowerCase();
            const [a] =
              await tx`insert into cutdesk.assets(project_id,name,path,role,kind,checksum,source) values(${project.id},${path.split("/").pop()},${path},${r.role || ""},${["mp4", "mov", "webm"].includes(ext) ? "video" : ["wav", "m4a", "mp3"].includes(ext) ? "audio" : "image"},${r.sha256 || null},${tx.json(r)}) on conflict(project_id,path) do update set path=excluded.path returning id`;
            await tx`insert into cutdesk.cut_assets(cut_id,asset_id,selected,note,sort_order) values(${cut.id},${a.id},${!(c.aiWork?.excludedAssetPaths || []).includes(path)},${r.note || ""},${i}) on conflict do nothing`;
          }
        }
        const [updated] =
          await tx`select id,code,title,scene,status,duration,story,dialogue,prompt,work_prompt,prompt_draft,notes,version from cutdesk.cuts where id=${cut.id}`;
        const links =
          await tx`select asset_id id,selected,note from cutdesk.cut_assets where cut_id=${cut.id} order by sort_order`;
        await tx`update cutdesk.versions set snapshot=${tx.json({ ...updated, assets: links })} where cut_id=${cut.id} and version=1`;
      }
    await tx`update cutdesk.projects set source_revision=${board.revision},source_metadata=source_metadata||${tx.json({ archiveKey })} where id=${project.id}`;
  });
  console.log(
    `Preserved all working prompts and the reviewed r${board.revision} delta.`,
  );
} finally {
  await sql.end();
}
