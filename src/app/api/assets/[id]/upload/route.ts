import { actor, sameOrigin } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { storage, StorageError } from "@/lib/cutdesk/storage";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await actor())) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 400 });
  const [asset] = await db()`select id from cutdesk.assets where id=${id}`;
  if (!asset) return new Response(null, { status: 404 });
  const p = z
    .object({
      name: z.string().max(300),
      mime: z.enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "audio/wav",
        "audio/mpeg",
        "audio/mp4",
        "video/mp4",
        "video/quicktime",
        "video/webm",
      ]),
      bytes: z
        .number()
        .int()
        .positive()
        .max(50 * 1024 * 1024),
    })
    .safeParse(await request.json());
  if (!p.success)
    return Response.json(
      { error: "지원하는 이미지·음성·영상 50MB 이하 파일을 선택해주세요." },
      { status: 400 },
    );
  const key = `${id}/${randomUUID()}.${
    p.data.name
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "") || "bin"
  }`;
  try {
    const response = await storage(`object/upload/sign/cutdesk/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await response.json();
    if (typeof data.url !== "string") throw new Error("Upload not ready");
    return Response.json({
      key,
      url: `${process.env.SUPABASE_URL}/storage/v1${data.url}`,
    });
  } catch {
    return Response.json({ error: "업로드를 준비하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await actor())) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { id } = await params;
  const p = z
    .object({ key: z.string().max(300) })
    .safeParse(await request.json());
  if (
    !z.uuid().safeParse(id).success ||
    !p.success ||
    !p.data.key.startsWith(id + "/") ||
    p.data.key.includes("..")
  )
    return new Response(null, { status: 400 });
  const [asset] = await db()`select id from cutdesk.assets where id=${id}`;
  if (!asset) return Response.json({ error: "에셋을 찾지 못했습니다." }, { status: 404 });
  try {
    const response = await storage(`object/info/cutdesk/${p.data.key}`, { method: "GET" });
    const data = await response.json();
    const info = z.object({ mime: z.string().min(1), bytes: z.coerce.number().int().positive().max(50 * 1024 * 1024) }).parse({
      mime: data.content_type ?? data.metadata?.mimetype,
      bytes: data.size ?? data.metadata?.size,
    });
    await db()`update cutdesk.assets set object_key=${p.data.key},preview_key=null,mime=${info.mime},bytes=${info.bytes} where id=${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    const missing = error instanceof StorageError && [400, 404].includes(error.status);
    return Response.json({ error: missing ? "업로드된 파일이 없습니다. 파일을 다시 올려주세요." : "파일을 확인하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: missing ? 404 : 503 });
  }
}
