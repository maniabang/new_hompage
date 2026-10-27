import { actor, sameOrigin } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { previews } from "@/lib/cutdesk/storage";
import { z } from "zod";
export async function GET(request: Request) {
  if (!(await actor())) return new Response(null, { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 100) || "";
  const rows =
    await db()`select id,name,path,kind,role,checksum,object_key,preview_key from cutdesk.assets where name ilike ${"%" + q + "%"} or path ilike ${"%" + q + "%"} order by name limit 100`;
  const signed = await previews(
    rows.map((a) => a.object_key || a.preview_key).filter(Boolean),
  ).catch(() => new Map<string, string>());
  return Response.json(
    rows.map((a) => ({
      ...a,
      selected: true,
      note: "",
      preview: signed.get(a.object_key || a.preview_key) || null,
    })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!(await actor())) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const p = z
    .object({
      name: z.string().min(1).max(300),
      path: z.string().min(1).max(2000),
      role: z.string().max(100),
      kind: z.enum(["image", "video", "audio"]),
    })
    .safeParse(await request.json());
  if (!p.success)
    return Response.json(
      { error: "파일명과 경로를 확인해주세요." },
      { status: 400 },
    );
  const [project] =
    await db()`select id from cutdesk.projects order by created_at limit 1`;
  if (!project) return new Response(null, { status: 404 });
  try {
    const [a] =
      await db()`insert into cutdesk.assets(project_id,name,path,role,kind) values(${project.id},${p.data.name},${p.data.path},${p.data.role},${p.data.kind}) returning *`;
    return Response.json({ ...a, selected: true, note: "", preview: null });
  } catch {
    return Response.json(
      { error: "이미 등록된 경로입니다. 보관함에서 검색해주세요." },
      { status: 409 },
    );
  }
}
