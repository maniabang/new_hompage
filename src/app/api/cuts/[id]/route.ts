import { z } from "zod";
import { actor, sameOrigin } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { cutDetail } from "@/lib/cutdesk/repository";
const input = z.object({
  version: z.number().int().positive(),
  code: z.string().regex(/^EP\d{2}_S\d{2}_C\d{3}(?:_?[A-Z]+)?$/),
  title: z.string().min(1).max(2000),
  scene: z.string().max(100),
  status: z.enum([
    "초안",
    "검토",
    "촬영 준비",
    "작업 중",
    "확정",
    "보류",
    "제외",
  ]),
  duration: z.number().min(0).max(3600),
  story: z.string().max(50000),
  dialogue: z.string().max(30000),
  prompt: z.string().max(100000),
  work_prompt: z.string().max(100000),
  prompt_draft: z.string().max(100000),
  notes: z.string().max(30000),
  assets: z
    .array(
      z.object({
        id: z.uuid(),
        selected: z.boolean(),
        note: z.string().max(5000),
      }),
    )
    .max(200),
});
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await actor())) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 400 });
  const cut = await cutDetail(id);
  return Response.json(cut ?? { error: "컷을 찾지 못했습니다." }, {
    status: cut ? 200 : 404,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const name = await actor();
  if (!name) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 400 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      { error: "입력 형식과 글자 수를 확인해주세요." },
      { status: 400 },
    );
  const p = parsed.data;
  try {
    await db().begin(async (tx) => {
      const [old] =
        await tx`select c.*,e.code episode_code,e.project_id from cutdesk.cuts c join cutdesk.episodes e on e.id=c.episode_id where c.id=${id} for update of c`;
      if (!old || old.deleted_at) throw new Error("missing");
      if (old.version !== p.version) throw new Error("conflict");
      if (!p.code.startsWith(old.episode_code + "_")) throw new Error("code");
      const ids = p.assets.map((a) => a.id);
      if (new Set(ids).size !== ids.length) throw new Error("code");
      if (ids.length) {
        const valid =
          await tx`select id from cutdesk.assets where project_id=${old.project_id} and id in ${tx(ids)}`;
        if (valid.length !== ids.length) throw new Error("code");
      }
      const [updated] =
        await tx`update cutdesk.cuts set code=${p.code},title=${p.title},scene=${p.scene},status=${p.status},duration=${p.duration},story=${p.story},dialogue=${p.dialogue},prompt=${p.prompt},work_prompt=${p.work_prompt},prompt_draft=${p.prompt_draft},notes=${p.notes},version=version+1,updated_by=${name},updated_at=now() where id=${id} returning id,code,title,scene,status,duration,story,dialogue,prompt,work_prompt,prompt_draft,notes,version`;
      await tx`delete from cutdesk.cut_assets where cut_id=${id}`;
      for (let i = 0; i < p.assets.length; i++) {
        const a = p.assets[i];
        await tx`insert into cutdesk.cut_assets(cut_id,asset_id,selected,note,sort_order) values(${id},${a.id},${a.selected},${a.note},${i})`;
      }
      await tx`insert into cutdesk.versions(cut_id,version,actor,action,snapshot) values(${id},${updated.version},${name},'수정',${tx.json({ ...updated, assets: p.assets })})`;
    });
    return Response.json(await cutDetail(id));
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return Response.json(
      {
        error:
          message === "conflict"
            ? "다른 작업자가 먼저 저장했습니다. 내 초안을 내려받은 뒤 최신 버전을 불러와 비교해주세요."
            : message === "code"
              ? "컷 번호와 에셋 연결을 확인해주세요."
              : "저장하지 못했습니다. 같은 컷 번호가 있는지 확인해주세요.",
      },
      { status: 409 },
    );
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const name = await actor();
  if (!name) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const { id } = await params;
  const p = z
    .object({ version: z.number().int(), restore: z.boolean() })
    .safeParse(await request.json());
  if (!z.uuid().safeParse(id).success || !p.success)
    return new Response(null, { status: 400 });
  const result = await db().begin(async (tx) => {
    const [c] =
      await tx`update cutdesk.cuts set deleted_at=${p.data.restore ? null : new Date()},version=version+1,updated_by=${name},updated_at=now() where id=${id} and version=${p.data.version} returning id,code,title,scene,status,duration,story,dialogue,prompt,work_prompt,prompt_draft,notes,version`;
    if (!c) return null;
    await tx`insert into cutdesk.versions(cut_id,version,actor,action,snapshot) values(${id},${c.version},${name},${p.data.restore ? "복원" : "휴지통"},${tx.json(c)})`;
    return c;
  });
  return Response.json(
    result ?? { error: "다른 변경이 있습니다. 새로고침해주세요." },
    { status: result ? 200 : 409 },
  );
}
