import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { writeFile } from "node:fs/promises";

const portfolio = process.env.PORTFOLIO_TEST_URL || "http://localhost:3007";
const cutdesk = process.env.CUTDESK_TEST_URL;
const checks: string[] = [];
const { siteMode } = await import(new URL("../src/lib/site-mode.ts", import.meta.url).href);
const originalMode = process.env.SITE_MODE;
try {
  for (const input of [undefined, "", "portfolio", "typo", "CUTDESK", "cutdesk"]) {
    if (input === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = input;
    assert.equal(siteMode(), input === "cutdesk" ? "cutdesk" : "portfolio");
  }
} finally {
  if (originalMode === undefined) delete process.env.SITE_MODE;
  else process.env.SITE_MODE = originalMode;
}
checks.push("미설정·오타는 포트폴리오로 기본 처리");
const fetchAt = (base: string, path: string, init: RequestInit = {}) => fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(45000) });
const secret = process.env.SESSION_SECRET;
const value = Buffer.from(JSON.stringify({ name: "이광훈", exp: Date.now() + 300000 })).toString("base64url");
const cookie = secret ? `cutdesk_session=${value}.${createHmac("sha256", secret).update(value).digest("base64url")}` : "cutdesk_session=invalid";
async function styles(base: string, html: string) {
  const paths = [...html.matchAll(/<link[^>]+href="([^"]+)"[^>]*>/g)].filter(m => m[0].includes('rel="stylesheet"')).map(m => m[1].replaceAll("&amp;", "&"));
  assert.ok(paths.length);
  return (await Promise.all(paths.map(async p => { const r = await fetchAt(base, p); assert.equal(r.status, 200); return r.text(); }))).join("\n");
}
const home = await fetchAt(portfolio, "/");
assert.equal(home.status, 200);
const html = await home.text();
assert.match(html, /<title>이광훈/);
for (const id of ["work", "skills", "projects", "contact"]) assert.ok(html.includes(`id="${id}"`));
const portfolioCss = await styles(portfolio, html);
assert.ok(portfolioCss.includes("--bg-deep"));
assert.ok(!portfolioCss.includes(".backup-menu"), "Cut Desk CSS leaked into portfolio");
checks.push("포트폴리오 화면·섹션·스타일 분리");
const sessionHeaders: HeadersInit[] = [{}, { Cookie: cookie }];
for (const path of ["/cutdesk", "/brand/thetent-icon.png", "/api/session", "/api/workspace", "/api/assets", "/api/export", "/api/source", "/api/cuts/00000000-0000-0000-0000-000000000000/versions"]) {
  for (const headers of sessionHeaders) assert.equal((await fetchAt(portfolio, path, { headers })).status, 404, path);
}
for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal((await fetchAt(portfolio, "/api/workspace", { method, headers: { Cookie: cookie, Origin: portfolio, "Content-Type": "application/json" }, body: "{}" })).status, 404);
assert.match(await (await fetchAt(portfolio, "/?SITE_MODE=cutdesk")).text(), /<title>이광훈/);
checks.push("포트폴리오에서 기존 세션·직접 URL·변경 요청·쿼리 전환 차단");
for (const path of ["/icon", "/apple-icon", "/opengraph-image", "/twitter-image", "/favicon.svg"]) assert.equal((await fetchAt(portfolio, path)).status, 200, path);
checks.push("포트폴리오 아이콘·공유 이미지 정상 응답");
if (cutdesk) {
  assert.ok(secret, "Cut Desk verification requires private server settings");
  const r = await fetchAt(cutdesk, "/");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control") || "", /no-store/);
  assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
  const cutHtml = await r.text();
  assert.match(cutHtml, /<title>컷 작업실/);
  assert.ok(!/property="og:image"|name="twitter:image"|rel="(?:icon|apple-touch-icon)"/.test(cutHtml));
  const css = await styles(cutdesk, cutHtml);
  assert.ok(css.includes(".backup-menu"));
  assert.ok(!/--bg-deep\s*:/.test(css), "Portfolio theme declarations leaked into Cut Desk");
  checks.push("동일 빌드에서 작업실 모드·별도 스타일·썸네일 비활성·비공개 캐시");
  for (const path of ["/api/workspace", "/api/assets", "/api/export", "/api/source"]) assert.equal((await fetchAt(cutdesk, path)).status, 401, path);
  assert.equal((await fetchAt(cutdesk, "/brand/thetent-icon.png")).status, 200);
  for (const path of ["/icon", "/apple-icon", "/opengraph-image", "/twitter-image", "/favicon.svg"]) assert.equal((await fetchAt(cutdesk, path)).status, 404, path);
  const authed = await fetchAt(cutdesk, "/", { headers: { Cookie: cookie } });
  assert.equal(authed.status, 200);
  assert.ok((await authed.text()).includes("이광훈"));
  const session = await fetchAt(cutdesk, "/api/session", { headers: { Cookie: cookie } });
  assert.deepEqual(await session.json(), { name: "이광훈" });
  checks.push("작업실 인증 유지·공개 포트폴리오 이미지 차단");
  const workspace = await fetchAt(cutdesk, "/api/workspace?episode=EP01", { headers: { Cookie: cookie } });
  assert.equal(workspace.status, 200);
  const data = await workspace.json();
  assert.ok(data.cuts.length > 0 && data.episodes.length > 0);
  const detail = await fetchAt(cutdesk, `/api/cuts/${data.cuts[0].id}`, { headers: { Cookie: cookie } });
  assert.equal(detail.status, 200);
  const cut = await detail.json();
  assert.equal(cut.code, data.cuts[0].code);
  assert.ok(cut.assets.length > 0 && cut.prompt);
  assert.ok(cut.chief_review);
  const versions = await fetchAt(cutdesk, `/api/cuts/${cut.id}/versions`, { headers: { Cookie: cookie } });
  assert.equal(versions.status, 200);
  assert.ok((await versions.json()).length > 0);
  checks.push("저장된 컷·에셋·Chief 검토·수정 이력 읽기");
}
const report = { ok: true, portfolio, cutdesk, checks, checkedAt: new Date().toISOString() };
if (process.env.QA_REPORT_PATH) await writeFile(process.env.QA_REPORT_PATH, JSON.stringify(report, null, 2), { mode: 0o600 });
console.log(JSON.stringify(report));
