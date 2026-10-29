import { actor, sameOrigin } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { z } from "zod";
export async function GET(request: Request) {
  if (!(await actor()))
    return Response.json({ error: "먼저 접속해주세요." }, { status: 401 });
  const sql = db();
  const url = new URL(request.url);
  const episode = url.searchParams.get("episode");
  const trash = url.searchParams.get("trash") === "1";
  const [project] =
    await sql`select id,title,source_revision from cutdesk.projects order by created_at limit 1`;
  if (!project) return Response.json({ project: null, episodes: [], cuts: [] });
  const episodes =
    await sql`select e.id,e.code,e.title,count(c.id)::int count,count(c.id) filter(where c.status='확정')::int reviewed from cutdesk.episodes e left join cutdesk.cuts c on c.episode_id=e.id and c.deleted_at is null where e.project_id=${project.id} group by e.id order by e.code`;
  const cuts = episode || trash
    ? await sql`select c.id,c.code,c.title,c.scene,c.status,c.duration,c.version,c.updated_at,c.updated_by,c.deleted_at,e.code episode_code,(select count(*)::int from cutdesk.cut_assets ca where ca.cut_id=c.id and ca.selected) asset_count from cutdesk.cuts c join cutdesk.episodes e on e.id=c.episode_id where e.project_id=${project.id} and (${!episode} or e.code=${episode || ""}) and (${trash} and c.deleted_at is not null or not ${trash} and c.deleted_at is null) order by case when ${trash} then c.deleted_at end desc,c.code`
    : [];
  return Response.json(
    { project, episodes, cuts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  const name = await actor();
  if (!name) return new Response(null, { status: 401 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const parsed = z
    .object({
      episode: z.string().regex(/^EP\d{2}$/),
      code: z.string().regex(/^EP\d{2}_S\d{2}_C\d{3}(?:_?[A-Z]+)?$/),
      title: z.string().min(1).max(200),
    })
    .safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      { error: "컷 코드는 EP01_S01_C001 형식으로 입력해주세요." },
      { status: 400 },
    );
  try {
    const p = parsed.data;
    if (!p.code.startsWith(p.episode + "_"))
      return Response.json(
        { error: "회차와 컷 번호가 다릅니다." },
        { status: 400 },
      );
    const [e] =
      await db()`select id from cutdesk.episodes where code=${p.episode} limit 1`;
    if (!e) return new Response(null, { status: 404 });
    const cut = await db().begin(async (tx) => {
      const [created] =
        await tx`insert into cutdesk.cuts(episode_id,code,title,scene,updated_by) values(${e.id},${p.code},${p.title},${p.code.split("_")[1]},${name}) returning id,code,title,scene,status,duration,story,dialogue,prompt,work_prompt,prompt_draft,notes,version`;
      await tx`insert into cutdesk.versions(cut_id,version,actor,action,snapshot) values(${created.id},1,${name},'생성',${tx.json({ ...created, assets: [] })})`;
      return { id: created.id };
    });
    return Response.json(cut);
  } catch {
    return Response.json(
      { error: "같은 컷 번호가 이미 있거나 저장하지 못했습니다." },
      { status: 409 },
    );
  }
}
