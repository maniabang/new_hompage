import assert from "node:assert/strict";
import postgres from "postgres";
const base = process.env.TEST_BASE_URL || "http://localhost:3007";
let cookie = "";
let createdId = "";
async function request(path: string, init: RequestInit = {}) {
  return fetch(base + path, {
    ...init,
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      Cookie: cookie,
      ...init.headers,
    },
  });
}
try {
  assert.equal(
    (await request("/api/workspace")).status,
    401,
    "Anonymous data access rejected",
  );
  assert.equal(
    (await request("/api/export")).status,
    401,
    "Anonymous export rejected",
  );
  const auth = await request("/api/session", {
    method: "POST",
    body: JSON.stringify({
      name: "QA 검증",
      password: process.env.WORKSPACE_ACCESS_CODE,
    }),
  });
  assert.equal(auth.status, 200);
  cookie = auth.headers.get("set-cookie")!.split(";")[0];
  const ws = await (await request("/api/workspace?episode=EP01")).json();
  assert.equal(ws.episodes.length, 30);
  assert.ok(ws.cuts.length > 0);
  const created = await request("/api/workspace", {
    method: "POST",
    body: JSON.stringify({
      episode: "EP30",
      code: "EP30_S99_C999_QA",
      title: "Temporary persistence check",
    }),
  });
  assert.equal(created.status, 200);
  createdId = (await created.json()).id;
  const cut = await (await request("/api/cuts/" + createdId)).json();
  const draft = {
    ...cut,
    status: "작업 중",
    prompt: "Exact text 보존\n@{검증.png}",
    notes: "Persistence check",
  };
  const saved = await request("/api/cuts/" + createdId, {
    method: "PUT",
    body: JSON.stringify(draft),
  });
  assert.equal(saved.status, 200);
  const updated = await saved.json();
  assert.equal(updated.version, 2);
  assert.equal(
    (
      await request("/api/cuts/" + createdId, {
        method: "PUT",
        body: JSON.stringify(draft),
      })
    ).status,
    409,
    "Stale writes rejected",
  );
  const read = await (await request("/api/cuts/" + createdId)).json();
  assert.equal(read.prompt, draft.prompt, "Saved text survives a fresh read");
  const history = await (
    await request("/api/cuts/" + createdId + "/versions")
  ).json();
  assert.equal(history[0].version, 2);
  const deleted = await request("/api/cuts/" + createdId, {
    method: "PATCH",
    body: JSON.stringify({ version: 2, restore: false }),
  });
  assert.equal(deleted.status, 200);
  const trash = await (
    await request("/api/workspace?episode=EP30&trash=1")
  ).json();
  assert.ok(trash.cuts.some((c: { id: string }) => c.id === createdId));
  const restored = await request("/api/cuts/" + createdId, {
    method: "PATCH",
    body: JSON.stringify({ version: 3, restore: true }),
  });
  assert.equal(restored.status, 200);
  const final = await (await request("/api/cuts/" + createdId)).json();
  assert.equal(final.prompt, draft.prompt);
  assert.equal(final.deleted_at, null);
  console.log(
    "PASS: auth, creation, exact persistence, stale-write protection, history, trash and restore.",
  );
} finally {
  if (createdId) {
    const sql = postgres(process.env.DATABASE_URL!, {
      ssl: "require",
      prepare: false,
      max: 1,
    });
    try {
      await sql.begin(async (tx) => {
        const [c] =
          await tx`select id from cutdesk.cuts where id=${createdId} and source_id is null and title='Temporary persistence check'`;
        if (c) {
          await tx`delete from cutdesk.versions where cut_id=${createdId}`;
          await tx`delete from cutdesk.cuts where id=${createdId}`;
        }
      });
    } finally {
      await sql.end();
    }
  }
}
