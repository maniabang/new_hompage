import postgres from "postgres";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const source = JSON.parse(await readFile(process.argv[2], "utf8"));
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 1,
});
try {
  const cuts = await sql`select * from cutdesk.cuts where deleted_at is null`;
  const links =
    await sql`select ca.cut_id,ca.selected,a.path from cutdesk.cut_assets ca join cutdesk.assets a on a.id=ca.asset_id`;
  const bySource = new Map(cuts.map((c) => [c.source_id, c]));
  let checked = 0;
  for (const e of source.episodes)
    for (const c of e.clips) {
      const saved = bySource.get(c.id);
      assert.ok(saved, `Missing ${c.code}`);
      for (const [key, value] of Object.entries({
        code: c.code,
        title: c.title || "",
        story: c.story || "",
        dialogue: c.dialogue || "",
        prompt: c.prompt || "",
        work_prompt: c.aiWork?.prompt || "",
        prompt_draft: c.aiWork?.promptDraft || "",
      }))
        assert.equal(saved[key], value, `${c.code}: ${key}`);
      const refs = [
        ...(c.references || []),
        ...(e.revisions || [])
          .filter((r: { id: string }) => (c.revisionIds || []).includes(r.id))
          .flatMap((r: { references: [] }) => r.references || []),
      ];
      const expected = Array.isArray(c.aiWork?.promptAssetPaths)
        ? c.aiWork.promptAssetPaths
        : refs
            .map(
              (r: { path: string; localPath: string }) => r.path || r.localPath,
            )
            .filter(
              (p: string) =>
                p && !(c.aiWork?.excludedAssetPaths || []).includes(p),
            );
      const actual = links
        .filter((l) => l.cut_id === saved.id && l.selected)
        .map((l) => l.path);
      assert.deepEqual(
        [...new Set(actual)].sort(),
        [...new Set(expected)].sort(),
        `${c.code}: selected asset paths`,
      );
      checked++;
    }
  assert.equal(cuts.length, checked);
  const [stats] =
    await sql`select (select count(*)::int from cutdesk.episodes) episodes,(select count(*)::int from cutdesk.assets) assets,(select count(*)::int from cutdesk.cut_assets) links,(select count(*)::int from cutdesk.versions) versions,(select count(*)::int from cutdesk.assets where preview_key is not null) previews`;
  console.log(
    `PASS: ${checked} cuts match source r${source.revision} exactly across all prompt fields and asset selections.`,
    JSON.stringify(stats),
  );
} finally {
  await sql.end();
}
