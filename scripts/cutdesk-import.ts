/* eslint-disable @typescript-eslint/no-explicit-any -- lossless import of external legacy JSON */
import postgres from "postgres";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 1,
});
const file = process.argv[2];
if (!file) throw new Error("Pass a saved shooting-board.json path.");
const text = await readFile(file, "utf8");
const board = JSON.parse(text);
const hash = createHash("sha256").update(text).digest("hex");
const archiveKey = `archives/${hash}.json.gz`;
const archive = await fetch(
  `${process.env.SUPABASE_URL}/storage/v1/object/cutdesk/${archiveKey}`,
  {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/gzip",
      "x-upsert": "false",
    },
    body: gzipSync(text),
  },
);
if (!archive.ok && archive.status !== 409) {
  const data = await archive.json();
  if (!String(data.message ?? data.error).includes("already exists"))
    throw new Error("Source archive upload failed");
}
console.log("Lossless source archive stored.");
if (
  !Array.isArray(board.episodes) ||
  !board.episodes.every((e: Record<string, unknown>) => Array.isArray(e.clips))
)
  throw new Error("Invalid board");
try {
  await sql.begin(async (tx) => {
    if (
      (await tx`select id from cutdesk.imports where checksum=${hash}`).length
    )
      throw new Error("Already imported");
    const { episodes } = board;
    const metadata = { schemaVersion: board.schemaVersion, archiveKey };
    let [project] =
      await tx`select id from cutdesk.projects order by created_at limit 1`;
    if (!project)
      [project] =
        await tx`insert into cutdesk.projects(title,source_revision,source_metadata) values(${board.title || "제작 작업실"},${board.revision ?? 0},${tx.json(metadata)}) returning id`;
    await tx`insert into cutdesk.imports(checksum,source_revision,snapshot) values(${hash},${board.revision ?? 0},${tx.json({ archiveKey, revision: board.revision })})`;
    const refsByPath = new Map();
    for (const e of episodes)
      for (const c of e.clips) {
        for (const r of [
          ...(c.references || []),
          ...(e.revisions || [])
            .filter((r: { id: string }) => (c.revisionIds || []).includes(r.id))
            .flatMap((r: { references: unknown[] }) => r.references || []),
        ]) {
          const path = r.path || r.localPath;
          if (path && !refsByPath.has(path)) refsByPath.set(path, r);
        }
      }
    const assetRows = [...refsByPath].map(([path, r]) => {
      const ext = path.split(".").pop()?.toLowerCase();
      return {
        project_id: project.id,
        name: r.name || path.split("/").pop(),
        path,
        kind: ["mp4", "mov", "webm"].includes(ext)
          ? "video"
          : ["wav", "mp3", "m4a"].includes(ext)
            ? "audio"
            : "image",
        role: r.role || "",
        checksum: r.sha256 || null,
        source: tx.json(r),
      };
    });
    for (let i = 0; i < assetRows.length; i += 100)
      await tx`insert into cutdesk.assets ${tx(assetRows.slice(i, i + 100))} on conflict(project_id,path) do nothing`;
    const assetIds = new Map(
      (
        await tx`select id,path from cutdesk.assets where project_id=${project.id}`
      ).map((a) => [a.path, a.id]),
    );
    let count = 0;
    for (const e of episodes) {
      const { clips } = e;
      const epSource = { archiveKey, sourceEpisodeId: e.id };
      const [ep] =
        await tx`insert into cutdesk.episodes(project_id,code,title,source) values(${project.id},${e.id},${e.title || e.id},${tx.json(epSource)}) on conflict(project_id,code) do update set title=excluded.title returning id`;
      const rows = clips.map((c: Record<string, any>) => ({
        episode_id: ep.id,
        source_id: c.id,
        code: c.code,
        title: c.title || "",
        scene: c.scene || "",
        status: c.status || "검토",
        duration: Number(c.duration) || 0,
        story: c.story || "",
        dialogue: c.dialogue || "",
        prompt: c.prompt || "",
        prompt_draft: c.aiWork?.promptDraft || "",
        notes: c.aiWork?.notes || "",
        source: tx.json({
          archiveKey,
          sourceClipId: c.id,
          sourceRevision: board.revision,
        }),
      }));
      if (!rows.length) continue;
      const created =
        await tx`insert into cutdesk.cuts ${tx(rows)} on conflict(episode_id,code) do nothing returning id,source_id,code,title,scene,status,duration,story,dialogue,prompt,prompt_draft,notes,version`;
      const links = [];
      const versions = [];
      for (const cut of created) {
        const c = clips.find((c: { id: string }) => c.id === cut.source_id);
        const refs = [...(c.references || [])];
        for (const r of e.revisions || [])
          if ((c.revisionIds || []).includes(r.id))
            refs.push(...(r.references || []));
        const excluded = new Set(c.aiWork?.excludedAssetPaths || []);
        const paths = new Set();
        const linked = [];
        for (const r of refs) {
          const path = r.path || r.localPath;
          if (!path || paths.has(path)) continue;
          paths.add(path);
          const entry = {
            id: assetIds.get(path),
            selected: !excluded.has(path),
            note: c.aiWork?.assetNotes?.[path] ?? r.note ?? "",
          };
          linked.push(entry);
          links.push({
            cut_id: cut.id,
            asset_id: entry.id,
            selected: entry.selected,
            note: entry.note,
            sort_order: linked.length - 1,
          });
        }
        versions.push({
          cut_id: cut.id,
          version: 1,
          actor: "초기 이관",
          action: "원본 이관",
          snapshot: tx.json({ ...cut, assets: linked }),
        });
      }
      if (links.length) await tx`insert into cutdesk.cut_assets ${tx(links)}`;
      if (versions.length)
        await tx`insert into cutdesk.versions ${tx(versions)}`;
      count += created.length;
    }
    console.log(
      `Imported revision ${board.revision}: ${count} cuts, ${assetRows.length} assets. Source JSON preserved.`,
    );
  });
} finally {
  await sql.end();
}
