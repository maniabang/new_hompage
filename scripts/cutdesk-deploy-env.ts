import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const values = Object.fromEntries(
  (await readFile(new URL("../.env.cutdesk.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
for (const key of [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "WORKSPACE_ACCESS_CODE",
  "WORKSPACE_OWNER_ACCESS_CODE",
]) {
  if (!values[key]) throw new Error(`Missing ${key}`);
  const r = spawnSync(
    "/Users/khlee/.npm/_npx/0ba70bd8308c98e3/node_modules/.bin/vercel",
    [
      "env",
      "add",
      key,
      "production",
      "--sensitive",
      "--force",
      "--yes",
      "--scope",
      "maniabangs-projects",
    ],
    { input: values[key], encoding: "utf8" },
  );
  if (r.status !== 0)
    throw new Error(`Environment configuration failed: ${key}`);
  console.log(`Configured ${key} as a production secret.`);
}
