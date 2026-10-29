import { writeFile } from "node:fs/promises";
const response = await fetch("http://127.0.0.1:8791/api/board");
if (!response.ok) throw new Error("Local board unavailable");
const text = await response.text();
const data = JSON.parse(text);
if (!data.revision || !Array.isArray(data.episodes))
  throw new Error("Invalid board");
const path = `/Users/khlee/Documents/ChatGPT/khlee/backups/shooting-board-r${data.revision}.json`;
await writeFile(path, text, { mode: 0o600 });
console.log(path);
