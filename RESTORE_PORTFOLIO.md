# 홈페이지와 컷 작업실 복구 기록

## 환경변수로 전환

현재 코드는 두 화면을 함께 보관하고 비공개 서버 환경변수 `SITE_MODE`로 운영 화면을 선택합니다.

| 값 | 운영 화면 |
| --- | --- |
| `portfolio` | 개인 포트폴리오 |
| `cutdesk` | 접속 코드로 보호된 컷 작업실 |
| 미설정 또는 다른 값 | 개인 포트폴리오 |

Vercel 프로젝트 `maniabangs-projects/new-hompage`의 Production 환경변수에서 `SITE_MODE`를 변경하고 새로 배포합니다. 현재 운영값은 `portfolio`입니다. 소스 복원이나 데이터 이관은 필요하지 않습니다. 이미 생성된 배포는 환경변수 변경만으로 바뀌지 않으므로 재배포가 필요합니다. Preview와 Development의 기본값도 `portfolio`입니다.

포트폴리오 모드에서는 `/cutdesk`, 작업실 `/api/*`, 작업실 브랜드 이미지 경로를 404로 닫습니다. 작업실 모드에서는 `/`가 작업실을 표시하고 기존 접속 코드 인증을 유지합니다. 두 모드의 레이아웃과 CSS는 별도 경로 그룹으로 분리합니다. 작업실 모드에서는 개인 포트폴리오의 공유 미리보기와 아이콘 경로도 닫아, 이전의 작업실 썸네일 비활성화 요청을 유지합니다. 링크나 쿼리 파라미터로 모드를 변경할 수 없습니다.

로컬 실행 시에는 `SITE_MODE=portfolio bun run dev` 또는 기존 작업실 서버 설정과 함께 `SITE_MODE=cutdesk`를 사용합니다. 작업실 인증과 저장소 환경변수는 그대로 유지하며, `NEXT_PUBLIC_` 이름으로 노출하지 않습니다.

## 이전 버전 보관

2026-10-29 사용자의 요청으로 `kwanghoon.dev`를 기존 개인 포트폴리오로 복구했습니다.

- 포트폴리오 기준: `b5b9ec1`, 태그 `archive/portfolio-before-cut-desk-20261027`
- 복구 직전 컷 작업실: `55125f5`, 태그 및 브랜치 `archive/cutdesk-before-portfolio-restore-20261029`
- 컷 작업실 Git 전체 백업: `/Users/khlee/Documents/ChatGPT/khlee/backups/cutdesk-before-portfolio-restore-20261029.bundle`
- 컷 작업실 데이터 백업: `/Users/khlee/Documents/ChatGPT/khlee/backups/cutdesk-before-portfolio-restore-20261029.json.gz`
- 데이터 백업 내용: 393컷, 에셋 429개, 수정 이력 534개, Chief 검토 251개

2026-10-29 최초 복구 때 포트폴리오 소스와 이미지를 기존 보존 태그 그대로 복구했고 컷 작업실 API를 배포에서 제외했습니다. 이후 환경변수 전환을 추가하면서 두 소스를 다시 함께 보관하고 포트폴리오 모드에서 작업실 접근을 차단하도록 변경했습니다. 비공개 Supabase의 `cutdesk` 스키마 및 버킷과 기존 서버 환경변수는 보존합니다. 데이터 삭제나 마이그레이션은 실행하지 않습니다.

일상적인 화면 전환은 위 환경변수 방식을 사용합니다. 보존 태그와 Git 번들은 비상 복구용입니다. 이를 사용할 때는 별도 작업 디렉터리에서 최신 변경을 먼저 비교하고 공유 Git 이력을 강제로 되돌리지 않습니다. 비공개 환경변수와 데이터 백업은 Git에 추가하지 않습니다.
