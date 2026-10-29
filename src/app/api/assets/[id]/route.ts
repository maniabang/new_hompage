import { actor, sameOrigin } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { z } from "zod";
const meta = z.object({
  name: z.string().min(1).max(300),
  path: z.string().min(1).max(2000),
  role: z.string().max(100),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const name = await actor();
  if (!name) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { id } = await params;
  const parsed = z
    .object({ before: meta, next: meta })
    .safeParse(await request.json());
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return Response.json(
      { error: "파일명과 경로를 확인해주세요." },
      { status: 400 },
    );
  const { before, next } = parsed.data;
  try {
    const [asset] =
      await db()`update cutdesk.assets set name=${next.name},path=${next.path},role=${next.role},source=jsonb_set(source,'{metadataHistory}',coalesce(source->'metadataHistory','[]'::jsonb)||${db().json([{ before, after: next, actor: name, at: new Date().toISOString() }])}) where id=${id} and name=${before.name} and path=${before.path} and role=${before.role} returning id,name,path,role`;
    return Response.json(
      asset ?? {
        error:
          "다른 작업자가 에셋 정보를 변경했습니다. 최신 내용을 다시 불러와주세요.",
      },
      { status: asset ? 200 : 409 },
    );
  } catch {
    return Response.json(
      { error: "이미 등록된 경로이거나 저장하지 못했습니다." },
      { status: 409 },
    );
  }
}
