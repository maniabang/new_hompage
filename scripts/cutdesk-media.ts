import postgres from "postgres";
import sharp from "sharp";
import { readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createHash } from "node:crypto";
const root = await realpath(process.argv[2]);
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 3,
});
const assets =
  await sql`select id,path,preview_key from cutdesk.assets where kind='image' and preview_key is null`;
let next = 0,
  done = 0,
  missing = 0;
const cache = new Map<string, string>();
try {
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < assets.length) {
        const a = assets[next++];
        try {
          const file = await realpath(resolve(root, a.path));
          if (!file.startsWith(root + sep)) throw new Error("Out of root");
          const bytes = await readFile(file);
          const sha = createHash("sha256").update(bytes).digest("hex");
          let key = cache.get(sha);
          if (!key) {
            key = `previews/${sha}.webp`;
            const image = await sharp(bytes)
              .rotate()
              .resize({
                width: 800,
                height: 800,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 78 })
              .toBuffer();
            const response = await fetch(
              `${process.env.SUPABASE_URL}/storage/v1/object/cutdesk/${key}`,
              {
                method: "POST",
                headers: {
                  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                  "Content-Type": "image/webp",
                  "x-upsert": "false",
                },
                body: new Uint8Array(image),
              },
            );
            if (!response.ok && response.status !== 409) {
              const data = await response.json();
              if (
                !String(data.message ?? data.error).includes("already exists")
              )
                throw new Error("Upload failed");
            }
            cache.set(sha, key);
          }
          await sql`update cutdesk.assets set preview_key=${key},source=source||${sql.json({ previewSourceSha256: sha })} where id=${a.id}`;
          done++;
        } catch {
          missing++;
        }
        if ((done + missing) % 50 === 0)
          console.log(
            `Previews: ${done} ready, ${missing} unavailable / ${assets.length}`,
          );
      }
    }),
  );
  console.log(
    `Preview import complete: ${done} ready, ${missing} unavailable.`,
  );
} finally {
  await sql.end();
}
