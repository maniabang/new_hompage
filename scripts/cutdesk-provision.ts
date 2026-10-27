import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const path = new URL("../.env.cutdesk.local", import.meta.url);
let config = await readFile(path, "utf8");
if (!config.includes("SESSION_SECRET="))
  config += `\nSESSION_SECRET=${randomBytes(48).toString("base64url")}\nWORKSPACE_ACCESS_CODE=${randomBytes(12).toString("base64url")}\n`;
await writeFile(path, config, { mode: 0o600 });
await mkdir("/Users/khlee/Documents/ChatGPT/khlee/backups", {
  recursive: true,
});
const code = config.match(/^WORKSPACE_ACCESS_CODE=(.+)$/m)?.[1];
await writeFile(
  "/Users/khlee/Documents/ChatGPT/khlee/backups/작업실-접속안내.txt",
  `컷 작업실: https://kwanghoon.dev\n이름: 작업자가 본인 이름 입력\n공동 접속 코드: ${code}\n\n코드는 작업자에게만 전달해주세요.\n홈페이지 복구 기준: archive/portfolio-before-cut-desk-20261027\n`,
  { mode: 0o600 },
);
console.log("Provisioned server secrets and private access guide.");
