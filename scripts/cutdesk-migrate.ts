import postgres from "postgres";
import { readFile } from "node:fs/promises";
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 1,
});
try {
  await sql.unsafe(
    await readFile(new URL("../supabase/cutdesk.sql", import.meta.url), "utf8"),
  );
  console.log("Private cutdesk schema ready.");
} finally {
  await sql.end();
}
