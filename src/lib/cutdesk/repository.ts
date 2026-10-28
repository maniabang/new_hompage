import "server-only";
import { db } from "./db";
import { previews } from "./storage";
import type { Cut, Asset } from "./types";
export async function cutDetail(id: string): Promise<Cut | null> {
  const sql = db();
  const [cut] =
    await sql`select c.*, e.code episode_code from cutdesk.cuts c join cutdesk.episodes e on e.id=c.episode_id where c.id=${id}`;
  if (!cut) return null;
  const [review] = await sql`select source_revision,verified_revision,status,application,issues,proposal,asset_plan assets from cutdesk.chief_reviews where cut_id=${id}`;
  const assets =
    await sql`select a.id,a.name,a.path,a.kind,a.role,a.checksum,a.object_key,a.preview_key,ca.selected,ca.note from cutdesk.cut_assets ca join cutdesk.assets a on a.id=ca.asset_id where ca.cut_id=${id} order by ca.sort_order,a.name`;
  const signed = await previews(
    assets.map((a) => a.object_key || a.preview_key).filter(Boolean),
  ).catch(() => new Map<string, string>());
  const results = assets.map((a) => ({
    ...a,
    checksum: /^previews\/([a-f0-9]{64})\.webp$/.exec(a.preview_key || "")?.[1] || a.checksum,
    preview: signed.get(a.object_key || a.preview_key) || null,
  }));
  // Original source is archived privately; only editable fields reach the page.
  const { source: _source, ...publicCut } = cut;
  void _source;
  return {
    ...publicCut,
    chief_review: review ?? null,
    duration: Number(cut.duration),
    assets: results as Asset[],
  } as Cut;
}
