import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { actor, cookieName, same, sameOrigin, token } from "@/lib/cutdesk/auth";
import { db } from "@/lib/cutdesk/db";
export async function GET() {
  return Response.json(
    { name: await actor() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  try {
    const { name, password } = await request.json();
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 40 ||
      typeof password !== "string" ||
      password.length > 200
    )
      return Response.json(
        { error: "이름과 접속 코드를 확인해주세요." },
        { status: 400 },
      );
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const key = createHash("sha256")
      .update(
        `${ip}:${process.env.SESSION_SECRET}:${Math.floor(Date.now() / 900000)}`,
      )
      .digest("hex");
    const [attempt] =
      await db()`insert into cutdesk.login_attempts(key,expires_at) values(${key},now()+interval '15 minutes') on conflict(key) do update set attempts=cutdesk.login_attempts.attempts+1 returning attempts`;
    if (attempt.attempts > 15)
      return Response.json(
        { error: "잠시 후 다시 접속해주세요." },
        { status: 429 },
      );
    const actorName = name.trim().normalize("NFC");
    const accessCode = actorName === "이광훈"
      ? process.env.WORKSPACE_OWNER_ACCESS_CODE
      : process.env.WORKSPACE_ACCESS_CODE;
    if (!accessCode || !same(password, accessCode))
      return Response.json(
        { error: "접속 코드가 일치하지 않습니다." },
        { status: 401 },
      );
    (await cookies()).set(cookieName, token(actorName), {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 86400,
    });
    return Response.json({ name: actorName });
  } catch {
    return Response.json(
      { error: "작업실 연결을 확인해주세요." },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  (await cookies()).delete(cookieName);
  return Response.json({ ok: true });
}
