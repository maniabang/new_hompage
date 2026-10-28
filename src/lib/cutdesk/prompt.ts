import type { Asset, Cut } from "./types";

const start = "[선택 참조 — 파일명 기준]";
const end = "[참조 목록 끝]";
const key = (value: string) => value.normalize("NFC").toLowerCase();
export function promptIssues(text: string, assets: Asset[]) {
  const selected = assets.filter(a => a.selected);
  const names = new Map<string, number>();
  for (const a of selected) names.set(key(a.name), (names.get(key(a.name)) || 0) + 1);
  const issues = new Set<string>();
  for (const a of selected) {
    if (names.get(key(a.name))! > 1) issues.add(`같은 파일명: ${a.name} — 경로를 확인해주세요.`);
    if (a.name.includes("}")) issues.add(`파일명에 } 문자가 있습니다: ${a.name}`);
  }
  for (const match of text.matchAll(/@\{([^}]+)\}|@(Image|Audio|Video)\d+\b/gi)) {
    if (!match[1]) issues.add(`기존 번호 태그 ${match[0]}의 실제 파일을 확인해주세요.`);
    else if (names.get(key(match[1])) !== 1) issues.add(`선택한 에셋과 연결되지 않은 태그: ${match[0]}`);
  }
  if (selected.some(a => a.kind === "video") && selected.some(a => a.kind === "audio" && /현주|hyeonju|^na_/i.test(a.name))) {
    issues.add("영상 참조와 현주 별도 음성이 함께 선택돼 있습니다. 현주 음성 선택을 확인해주세요.");
  }
  return [...issues];
}
export function syncAssetPrompt(text: string, assets: Asset[]) {
  let body = text.replace(/^\[선택 참조 — 파일명 기준\]\n[\s\S]*?\n\[참조 목록 끝\]\n*/u, "");
  // This exact leading section belongs to the supplied Chief report, not to the screenplay.
  body = body.replace(/^\[현재 컷 참조 — 파일명 태그와 아래 경로 매핑을 함께 사용\]\n[\s\S]*?\n\n/u, "");
  const selected = assets.filter(a => a.selected);
  if (!selected.length) return body;
  const lines = selected.map(a => `@{${a.name}} — ${a.role || a.kind}${a.note ? `: ${a.note.replace(/\s*\n\s*/g," ")}` : ""}`);
  return `${start}\n${lines.join("\n")}\n${end}\n\n${body}`;
}
export function mcpHandoff(cut: Cut, text: string) {
  const issues = promptIssues(text, cut.assets);
  const review = cut.chief_review;
  const notes = [...(review?.issues || []), ...issues];
  if (review?.application === "excluded") notes.unshift("생성 제외 컷입니다. 자료 검토만 진행하고 견적·생성하지 마세요.");
  const selected = cut.assets.filter(a => a.selected);
  return [
    `청해 아쿠아리움 ${cut.code}의 Seedance 2.5 요청을 준비해주세요.`,
    `컷 번호: ${cut.code}\n장면: ${cut.title}\n카드 기록 길이: ${cut.duration}초\n화면비: 9:16\n생성 길이는 아래 프롬프트의 SHOT 범위·지원 조건과 대조해주세요. 카드의 편집 길이를 임의로 생성 길이에 대입하지 마세요.`,
    "먼저 더텐트에서 정확한 컷 번호를 조회해 서비스 컷 ID를 확인해주세요. 작업실 ID나 파일 목록 순서를 서비스 ID·@Image 번호로 사용하지 마세요.",
    "선택한 파일만 원본 경로·해시로 대조해 업로드하고, 실제 첨부 이름을 아래 파일명 태그에 연결해주세요. 같은 이름의 다른 파일이나 다른 상태 시트로 대체하지 마세요.",
    review ? `Chief 검토 자료: r${review.verified_revision} 기준 / ${review.status}` : "Chief 검토 자료: 이 컷의 보고서 없음. 현재 프롬프트와 선택 참조 기준으로 확인해주세요.",
    notes.length ? `[먼저 확인할 사항]\n${[...new Set(notes)].map(x=>`- ${x}`).join("\n")}\n미해결 항목을 임의 추정해 생성하지 마세요.` : "참조 태그를 실제 업로드 결과와 다시 대조해주세요.",
    `[선택 에셋 ${selected.length}개]\n${selected.map((a,i)=>`${i+1}. ${a.kind} | @{${a.name}}\n   원본 경로: Aqua_Edit/${a.path.replace(/^Aqua_Edit\//,"")}\n   등록 SHA-256: ${a.checksum || "미확인 — 실제 파일 대조 필요"}\n   역할: ${a.role || "참조"}${a.note ? `\n   사용 범위: ${a.note}` : ""}`).join("\n")}`,
    `[Seedance 프롬프트 전문]\n${text}`,
    ...(review?.application === "needs_review" ? [
      `[Chief 검토용 후보 참조 — 현재 선택과 대조하고 자동 첨부하지 마세요]\n${(review.assets || []).map(a=>`${a.name}\n경로: Aqua_Edit/${a.path}\n자료 기준 SHA-256: ${a.localSha256 || "미확인"}\n사용 범위: ${a.scope || a.role}`).join("\n\n")}`,
      `[Chief 참조 정리 제안 — 확인 사항을 해결하기 위한 비교 자료이며 현재 저장본을 자동 대체하지 않습니다]\n${review.proposal}`,
    ] : []),
    "최신 서비스 컷 편집이 위 내용과 다르면 덮어쓰지 말고 차이를 확인해주세요. 현재 Seedance의 입력 조건과 선택 파일을 검증한 뒤 견적을 보여주세요. 견적 승인 후 생성하고 작업 ID로 상태를 확인해주세요. 이 요청문에는 생성 승인이나 자동 재시도 지시가 포함되지 않습니다.",
  ].join("\n\n");
}
