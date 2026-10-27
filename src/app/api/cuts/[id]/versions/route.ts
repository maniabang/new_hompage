import { actor } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
import { z } from "zod";
import type { Version, Asset } from "@/lib/cutdesk/types";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await actor())) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 400 });
  const rows =
    await db()`select id,version,actor,action,snapshot,created_at from cutdesk.versions where cut_id=${id} order by id desc limit 100`;
  const typed = rows as unknown as Version[];
  const ids = [
    ...new Set(
      typed.flatMap((row) => row.snapshot.assets?.map((a) => a.id) || []),
    ),
  ];
  const assets = ids.length
    ? await db()`select id,name,path,kind,role,checksum,object_key from cutdesk.assets where id in ${db()(ids)}`
    : [];
  const byId = new Map(assets.map((a) => [a.id, a]));
  return Response.json(
    typed.map((row) => ({
      ...row,
      snapshot: {
        ...row.snapshot,
        ...(row.snapshot.assets
          ? {
              assets: row.snapshot.assets.map(
                (a) => ({ ...byId.get(a.id), ...a, preview: null }) as Asset,
              ),
            }
          : {}),
      },
    })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
