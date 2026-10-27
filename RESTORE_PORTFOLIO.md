# 개인 홈페이지 복구

작업실 전환 전 기준 커밋: `b5b9ec1`

GitHub 보존 태그 및 브랜치: `archive/portfolio-before-cut-desk-20261027`

로컬 전체 이력 덤프: `/Users/khlee/Documents/ChatGPT/khlee/backups/portfolio-20261027.bundle`

복구 시 해당 태그의 소스를 별도 작업 디렉터리에 체크아웃하고, 기존 Vercel 프로젝트 `maniabangs-projects/new-hompage`에 프로덕션 배포합니다. Supabase 작업실 데이터는 별도 프로젝트 `shbyxtjzdxscsllerdjr`의 비공개 `cutdesk` 스키마와 비공개 `cutdesk` 버킷에 있으므로 홈페이지를 복구해도 삭제할 필요가 없습니다.

전환 커밋 이후 다른 변경이 있으면 전체 Git 이력을 강제로 되돌리지 말고, 보존 태그 소스를 별도로 배포하세요. 작업실 코드는 Git에 남겨두고, 작업 데이터는 인증 후 전체 백업으로 내보낼 수 있습니다.

## 작업실 운영

- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `WORKSPACE_ACCESS_CODE`는 서버 환경변수입니다. 브라우저 번들·Git·공유 JSON에 넣지 않습니다.
- 공동 접속 코드와 작업자 이름을 사용합니다. 이름은 본인 입력값이며 개인별 검증된 계정이 아닙니다. 코드 보유자는 이 작업실 전체를 열고 편집할 수 있습니다.
- 컷 저장은 버전 비교와 트랜잭션으로 처리하며, 이전 버전과 에셋 선택을 보존합니다. 삭제는 휴지통으로 이동하고 복원할 수 있습니다.
- 브라우저 초안은 해당 기기에 남습니다. 서버에 저장된 작업은 다른 기기에서도 확인할 수 있습니다.
- 초기 이관 원본 JSON은 압축하여 비공개 Storage에 보관합니다. 원본 스냅샷은 수정하지 않습니다.
- 로컬 촬영 영상의 업로드·AI 생성·The Tent 운영 DB 동기화는 실행하지 않습니다. 본 도구는 편집·검토용입니다.
- 초기 에셋 미리보기는 원본 상대경로의 파일에서 생성한 웹용 사본이며 실제 생성에 제출할 원본 파일과 구분합니다.
