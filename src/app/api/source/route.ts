import { actor } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { storage } from "@/lib/cutdesk/storage";
export async function GET() {
  if (!(await actor())) return new Response(null, { status: 401 });
  const [project] =
    await db()`select source_metadata,source_revision from cutdesk.projects order by created_at limit 1`;
  const key = project?.source_metadata?.archiveKey;
  if (!key) return new Response(null, { status: 404 });
  const response = await storage(`object/authenticated/cutdesk/${key}`);
  return new Response(response.body, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="source-r${project.source_revision}.json.gz"`,
      "Cache-Control": "no-store",
    },
  });
}
