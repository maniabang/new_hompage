# 이광훈 포트폴리오 (Next.js)

`maniabang.github.io` 정적 포트폴리오를 **Next.js App Router** 기반으로 마이그레이션하는 저장소입니다.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Bun (패키지 매니저)
- Tailwind CSS 4
- GSAP + ScrollTrigger
- Liquid glass UI tokens
- Vercel 배포 예정 (커스텀 도메인은 이후 연결)

## Develop

```bash
bun install
bun run dev
```

```bash
bun run build
bun run lint
```

## Structure

- `src/data/portfolio.ts` — 콘텐츠 소스
- `src/components/` — Hero / Interview / Skills / Work / Projects / Contact
- `public/images/` — 프로필·프로젝트 이미지

## Deploy

1. Vercel에 이 리포지토리 연결
2. Preview URL로 검증
3. 안정화 후 커스텀 도메인 DNS 연결
