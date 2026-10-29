import postgres from "postgres";
import { readFile } from "node:fs/promises";
const board = JSON.parse(await readFile(process.argv[2], "utf8"));
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 1,
});
try {
  await sql.begin(async (tx) => {
    // Only untouched initial-import rows. Never overwrite a collaborator's edits.
    for (const e of board.episodes)
      for (const c of e.clips) {
        if (!Array.isArray(c.aiWork?.promptAssetPaths)) continue;
        const [cut] =
          await tx`select id from cutdesk.cuts where source_id=${c.id} and version=1`;
        if (!cut) continue;
        const paths = c.aiWork.promptAssetPaths as string[];
        await tx`update cutdesk.cut_assets ca set selected=false where cut_id=${cut.id}`;
        if (paths.length)
          await tx`update cutdesk.cut_assets ca set selected=true from cutdesk.assets a where ca.asset_id=a.id and ca.cut_id=${cut.id} and a.path in ${tx(paths)}`;
        const links =
          await tx`select asset_id id,selected,note from cutdesk.cut_assets where cut_id=${cut.id} order by sort_order`;
        await tx`update cutdesk.versions set snapshot=jsonb_set(snapshot,'{assets}',${tx.json(links)}) where cut_id=${cut.id} and version=1`;
      }
    const notes=Object.entries(board.assetNotes||{}).map(([path,value])=>({path:path.toLocaleLowerCase(),text:typeof value==='object'&&value!==null&&'text' in value?String(value.text):String(value)}));
    if(notes.length)await tx`update cutdesk.cut_assets ca set note=n.text from cutdesk.assets a,cutdesk.cuts c,jsonb_to_recordset(${tx.json(notes)}) as n(path text,text text) where ca.asset_id=a.id and ca.cut_id=c.id and c.version=1 and lower(a.path)=n.path`;
    await tx`update cutdesk.assets set name=regexp_replace(path,'^.*/','') where exists(select 1 from cutdesk.cut_assets ca join cutdesk.cuts c on c.id=ca.cut_id where ca.asset_id=cutdesk.assets.id and c.version=1)`;
    await tx`update cutdesk.versions v set snapshot=jsonb_set(v.snapshot,'{assets}',coalesce((select jsonb_agg(jsonb_build_object('id',ca.asset_id,'selected',ca.selected,'note',ca.note) order by ca.sort_order) from cutdesk.cut_assets ca where ca.cut_id=v.cut_id),'[]'::jsonb)) from cutdesk.cuts c where v.cut_id=c.id and c.version=1 and v.version=1`;
  });
  console.log(
    "Verified explicit selections and exact filenames on initial-import rows.",
  );
} finally {
  await sql.end();
}
