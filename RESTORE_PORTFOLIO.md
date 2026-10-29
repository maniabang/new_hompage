# 홈페이지와 컷 작업실 복구 기록

2026-10-29 사용자의 요청으로 `kwanghoon.dev`를 기존 개인 포트폴리오로 복구했습니다.

- 포트폴리오 기준: `b5b9ec1`, 태그 `archive/portfolio-before-cut-desk-20261027`
- 복구 직전 컷 작업실: `55125f5`, 태그 및 브랜치 `archive/cutdesk-before-portfolio-restore-20261029`
- 컷 작업실 Git 전체 백업: `/Users/khlee/Documents/ChatGPT/khlee/backups/cutdesk-before-portfolio-restore-20261029.bundle`
- 컷 작업실 데이터 백업: `/Users/khlee/Documents/ChatGPT/khlee/backups/cutdesk-before-portfolio-restore-20261029.json.gz`
- 데이터 백업 내용: 393컷, 에셋 429개, 수정 이력 534개, Chief 검토 251개

포트폴리오 소스와 이미지는 기존 보존 태그 그대로 복구했습니다. 컷 작업실 API는 포트폴리오 배포에 포함하지 않습니다. 비공개 Supabase의 `cutdesk` 스키마 및 버킷과 기존 서버 환경변수는 보존합니다. 데이터 삭제나 마이그레이션은 실행하지 않습니다.

컷 작업실을 다시 열 때는 보존 태그를 별도 작업 디렉터리에 체크아웃하고, 저장된 비공개 서버 설정을 사용하여 기존 Vercel 프로젝트 `maniabangs-projects/new-hompage`에 배포합니다. 최신 변경이 있으면 먼저 비교하고, 공유 Git 이력을 강제로 되돌리지 않습니다. 비공개 환경변수와 데이터 백업은 Git에 추가하지 않습니다.
