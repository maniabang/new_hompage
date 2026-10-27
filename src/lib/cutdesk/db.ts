import "server-only";
import postgres from "postgres";
let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("저장소 연결 설정을 확인해주세요.");
  return (connection ??= postgres(process.env.DATABASE_URL, {
    ssl: "require",
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
  }));
}
