import { actor } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { gzipSync } from "node:zlib";
export async function GET() {
  if (!(await actor())) return new Response(null, { status: 401 });
  const data = await db().begin(async (tx) => {
    await tx`set transaction isolation level repeatable read read only`;
    const [project] =
      await tx`select * from cutdesk.projects order by created_at limit 1`;
    if (!project) return null;
    const episodes =
      await tx`select * from cutdesk.episodes where project_id=${project.id} order by code`;
    const cuts =
      await tx`select c.* from cutdesk.cuts c join cutdesk.episodes e on e.id=c.episode_id where e.project_id=${project.id} order by c.code`;
    const assets =
      await tx`select * from cutdesk.assets where project_id=${project.id}`;
    const links =
      await tx`select ca.* from cutdesk.cut_assets ca join cutdesk.cuts c on c.id=ca.cut_id join cutdesk.episodes e on e.id=c.episode_id where e.project_id=${project.id}`;
    const versions =
      await tx`select v.* from cutdesk.versions v join cutdesk.cuts c on c.id=v.cut_id join cutdesk.episodes e on e.id=c.episode_id where e.project_id=${project.id} order by v.id`;
    return {
      format: "cutdesk-v1",
      exportedAt: new Date().toISOString(),
      project,
      episodes,
      cuts,
      assets,
      links,
      versions,
    };
  });
  return new Response(new Uint8Array(gzipSync(JSON.stringify(data))), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="cutdesk-${new Date().toISOString().slice(0, 10)}.json.gz"`,
    },
  });
}
