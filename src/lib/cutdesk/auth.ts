import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
export const cookieName = "cutdesk_session";
function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET || "unconfigured")
    .update(value)
    .digest("base64url");
}
export function token(name: string) {
  if (!process.env.SESSION_SECRET) throw new Error("인증 설정이 필요합니다.");
  const value = Buffer.from(
    JSON.stringify({ name, exp: Date.now() + 7 * 86400000 }),
  ).toString("base64url");
  return `${value}.${sign(value)}`;
}
export function same(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}
export async function actor() {
  const raw = (await cookies()).get(cookieName)?.value;
  if (!raw || !process.env.SESSION_SECRET) return null;
  const [value, sig] = raw.split(".");
  if (!value || !sig || !same(sig, sign(value))) return null;
  try {
    const data = JSON.parse(Buffer.from(value, "base64url").toString());
    return typeof data.name === "string" && data.exp > Date.now()
      ? (data.name as string)
      : null;
  } catch {
    return null;
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}
