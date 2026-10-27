import "server-only";
export async function storage(path: string, init: RequestInit = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.SUPABASE_URL)
    throw new Error("파일 저장소 설정을 확인해주세요.");
  const response = await fetch(
    `${process.env.SUPABASE_URL}/storage/v1/${path}`,
    {
      ...init,
      headers: {
        apikey: key,
        ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
        ...init.headers,
      },
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error("파일을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
  return response;
}
export async function preview(key?: string | null) {
  if (!key) return null;
  const response = await storage(`object/sign/cutdesk/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  const data = await response.json();
  return `${process.env.SUPABASE_URL}/storage/v1${data.signedURL}`;
}
export async function previews(keys: string[]) {
  const paths = [...new Set(keys.filter(Boolean))];
  if (!paths.length) return new Map<string, string>();
  const response = await storage("object/sign/cutdesk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600, paths }),
  });
  const rows = (await response.json()) as {
    path: string;
    signedURL?: string;
  }[];
  return new Map(
    rows
      .filter((r) => r.signedURL)
      .map((r) => [
        r.path,
        `${process.env.SUPABASE_URL}/storage/v1${r.signedURL}`,
      ]),
  );
}
