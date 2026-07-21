export const site = {
  name: "이광훈",
  role: "프론트엔드 개발자",
  brand: "이광훈",
  headline: "실시간 제품의 속도와 구조를 설계합니다",
  description:
    "트레이딩 터미널과 시장 인텔리전스에서 WebSocket·차트·캐시를 한 흐름으로 맞추고, Next.js로 읽히고 유지되는 UI를 만듭니다.",
  githubUrl: "https://github.com/maniabang",
  email: "madmanno@naver.com",
  ogImage: "/opengraph-image",
} as const;

export const interviews = [
  {
    q: "프론트엔드를 지향하는 이유는?",
    a: "실시간 데이터가 흐르는 화면에서 사용자가 판단할 수 있게 만드는 일이 가장 재미있습니다. 트레이딩 터미널·시장 대시보드처럼 WebSocket 시세와 시계열 차트가 겹치는 화면에서도 정보가 읽히도록 구조를 설계하고, Next.js · TypeScript 기반으로 체감 속도와 유지보수성을 함께 챙기는 프론트엔드에 집중합니다.",
  },
  {
    q: "일에서 가장 중요하게 생각하는 것은?",
    a: "에이엠매니지먼트에서 멀티거래소 트레이딩 터미널과 시장 인텔리전스 플랫폼을 담당했습니다. WebSocket 실시간 스트림·BFF 보안 레이어·Lightweight Charts 시계열 시각화를 한 제품 안에서 맞추고, SSR/ISR · TanStack Query · Supabase로 데이터 갱신 주기와 UI 반응을 분리해 운영 가능한 대시보드 UX를 만드는 것을 우선했습니다.",
  },
  {
    q: "강점은 무엇인가요?",
    a: "실시간·대용량 데이터 화면의 병목을 빠르게 찾아 고치는 것이 강점입니다. WS 틱 업데이트로 생기는 리렌더 이슈, 차트·테이블 정합성, API 캐시 무효화 흐름을 재현해 원인을 격리하고 핫픽스 → 릴리스까지 짧은 사이클로 마무리합니다.",
  },
] as const;

export const skillGroups = [
  {
    title: "프론트엔드",
    items: [
      {
        name: "Next.js 16",
        desc: "App Router · SSR/ISR · next/dynamic 분할 로딩으로 트레이딩·시장 대시보드 초기 로딩을 최적화했습니다.",
      },
      {
        name: "React 19",
        desc: "Hook 기반 설계와 memo 패턴으로 WS 틱 업데이트 시 불필요한 리렌더를 줄였습니다.",
      },
      {
        name: "TypeScript",
        desc: "도메인 타입·API 응답·포맷팅 유틸로 시세·포지션·테이블 데이터 정합성을 높였습니다.",
      },
      {
        name: "WebSocket",
        desc: "시세·오더북 스트림 수신·재연결·헬스체크를 구현하고 Public/Private 흐름을 BFF와 분리했습니다.",
      },
      {
        name: "BFF 패턴",
        desc: "CSRF·API 키 보호·Rate Limiting이 있는 서버 레이어로 민감 주문·계정 API를 프록시합니다.",
      },
    ],
  },
  {
    title: "빌드·배포",
    items: [
      { name: "Vite", desc: "ESM 기반 빠른 개발 서버로 생산성을 높였습니다." },
      { name: "Turbopack", desc: "Next.js 개발 환경에서 빌드/번들 피드백 속도를 점검했습니다." },
      { name: "GitHub Actions", desc: "커밋/배포 흐름을 자동화하고 빌드 오류를 빠르게 재현·수정했습니다." },
      { name: "Vercel", desc: "Git 연동 자동 배포로 개발 워크플로우를 최적화했습니다." },
      { name: "AWS", desc: "프로덕션 빌드를 EC2에 배포하며 운영 환경을 경험했습니다." },
    ],
  },
  {
    title: "스타일링",
    items: [
      {
        name: "Tailwind CSS 4",
        desc: "시장 인텔리전스 대시보드에서 Radix UI와 함께 데이터 카드·어드민 UI를 구성했습니다.",
      },
      {
        name: "SCSS Modules",
        desc: "트레이딩 터미널에서 화면별 스타일을 캡슐화해 유지보수성을 확보했습니다.",
      },
      {
        name: "Radix UI",
        desc: "접근성 있는 프리미티브로 대시보드·어드민 인터랙션을 구성했습니다.",
      },
    ],
  },
  {
    title: "데이터·상태",
    items: [
      {
        name: "TanStack Query v5",
        desc: "서버 상태 캐싱·무효화·mutation으로 실시간·집계 데이터 UX를 안정화했습니다.",
      },
      {
        name: "Zustand",
        desc: "사이드바·필터·테이블 등 UI 상태를 WS/Query 서버 상태와 분리했습니다.",
      },
      {
        name: "Lightweight Charts",
        desc: "캔들·스파크라인·매크로 시계열을 가볍고 빠르게 렌더링합니다.",
      },
      {
        name: "Supabase",
        desc: "구독자·피드 DB와 SSR/Admin API를 분리해 뉴스레터 파이프라인을 구축했습니다.",
      },
    ],
  },
] as const;

export type Project = {
  title: string;
  summary: string;
  stack: string[];
  achievements: string[];
  link?: { label: string; href: string };
  note?: string;
};

export type Experience = {
  company: string;
  role: string;
  period: string;
  /** 타임라인에서 한눈에 보이는 한 줄 포커스 */
  focus: string;
  projects: Project[];
};

export const careerSpan = {
  from: "2021",
  to: "2026",
  label: "커리어 타임라인",
} as const;

export const experiences: Experience[] = [
  {
    company: "에이엠매니지먼트",
    role: "프론트엔드 개발",
    period: "2025.12 ~ 2026.07",
    focus: "실시간 트레이딩 · 시장 인텔리전스",
    projects: [
      {
        title: "가상자산 시장 인텔리전스 대시보드 & 뉴스레터",
        summary:
          "실시간 코인 시세·매크로 지표·ETF 플로우·RSS 뉴스 큐레이션을 하나의 대시보드로 통합하고, Spark 공개 랜딩·뉴스레터 구독·발송·유료 결제까지 이어지는 운영 흐름을 구현했습니다.",
        stack: [
          "Next.js 16",
          "React 19",
          "TypeScript",
          "TanStack Query v5",
          "Supabase",
          "PayPal Webhooks",
          "Tailwind CSS 4",
          "Lightweight Charts",
          "Anthropic AI",
          "Resend",
        ],
        achievements: [
          "Spark 공개 랜딩(spark.amxplore.com) — 구독 유입·온보딩 CTA 구성",
          "Pulse 대시보드 — 실시간 시세·스파크라인, AI 시장 요약, 섹터별 뉴스 피드 통합",
          "Macro · ETF — FRED 지표·ETF AUM·기업 BTC 보유량 시각화",
          "PayPal 구독·취소 웹훅으로 Supabase 구독 상태 동기화",
          "unstable_cache + ISR로 영역별 갱신 주기 분리",
        ],
        link: {
          label: "Spark 공개 페이지",
          href: "https://spark.amxplore.com/",
        },
      },
      {
        title: "멀티거래소 가상자산 트레이딩 터미널",
        summary:
          "REST·TanStack Query로 대시보드·전략·자산 데이터를 캐싱하고, WebSocket 시세/오더북과 BFF 보안 레이어를 결합한 프로덕션 트레이딩 웹 앱을 담당했습니다.",
        stack: [
          "Next.js 16",
          "React 19",
          "TypeScript",
          "WebSocket",
          "BFF",
          "TanStack Query v5",
          "Zustand",
          "SCSS Modules",
          "Chart.js",
          "Lightweight Charts",
        ],
        achievements: [
          "next/dynamic lazy-load로 LCP·TTI 단축",
          "WS 틱 리렌더 병목을 memo · Map 룩업 · useMemo로 해소",
          "Public/Private 데이터 흐름을 BFF로 분리해 키/세션 보호",
        ],
      },
      {
        title: "고객 자산 운용 포털 Navigator",
        summary:
          "로그인·회원가입부터 오버뷰(AUM·지갑), 전략 성과 대시보드, 거래 내역, PDF 리포트, 문의까지 고객 자산 조회·리포팅 접점을 하나의 웹앱으로 구성했습니다.",
        stack: [
          "Next.js 16",
          "React 19",
          "TypeScript",
          "TanStack Query v5",
          "Zustand",
          "Chart.js",
          "Lightweight Charts",
          "react-pdf",
        ],
        achievements: [
          "axios client_api + TanStack Query로 집계·히스토리 API 캐싱",
          "datepicker·필터·테이블 UI 상태를 서버 데이터와 분리",
          "Chart.js / Lightweight Charts · react-pdf로 성과·리포트 UX 구성",
        ],
      },
    ],
  },
  {
    company: "㈜인텔리코드",
    role: "Data Service팀 / 사원",
    period: "2023.10 ~ 2025.12",
    focus: "레거시 모던화 · 실시간 선거 시스템",
    projects: [
      {
        title: "대기업 전자제품 제조사 웹 포털 — Legacy 모던 마이그레이션",
        summary:
          "Vue.js 2 + Bootstrap 4 → Next.js 15 + TypeScript + Tailwind로 전환하는 레거시 모던화에 참여했습니다.",
        stack: ["Next.js 15", "TypeScript", "Tailwind CSS", "React Query", "Zustand", "Chart.js"],
        achievements: [
          "프레임워크·타입·상태 관리 현대화 (Vuex → Zustand + React Query)",
          "Lighthouse 78 → 98 (+20점) 성능 개선",
          "RBAC·실시간 데이터 시각화 대시보드 구축",
        ],
        note: "퇴사 시점 기준 마이그레이션 약 50% 진행",
      },
      {
        title: "필리핀 선거관리위원회 · CCS Web Portal",
        summary:
          "필리핀 전역 디지털 전자투표 SPA와 실시간 선거 결과 공개 포털 UI/UX를 개발·배포했습니다.",
        stack: ["React (Vite)", "Redux", "React Query", "MUI v5", "Vue 2", "Chart.js"],
        achievements: [
          "Redux Toolkit + React Query 하이브리드 상태 관리",
          "5단계 지역 계층 구조 모니터링 최적화",
          "전국 선거 공식 시스템 개발 참여",
        ],
        link: {
          label: "선거 결과 포털",
          href: "https://2025electionresults.comelec.gov.ph/dashboard",
        },
      },
      {
        title: "MEDIA WORKSTATION",
        summary:
          "선거 데이터 운영용 미디어 워크스테이션을 프론트엔드 단독으로 설계·구현했습니다.",
        stack: [
          "React (Vite)",
          "TypeScript",
          "MUI v5",
          "Redux Toolkit",
          "React Query",
          "react-virtuoso",
          "Sentry",
        ],
        achievements: [
          "가상 스크롤로 대용량 로그/목록 성능 최적화",
          "Router 가드·에러 바운더리·Sentry로 장애 대응 체계 구축",
        ],
      },
      {
        title: "L사 커뮤니티 플랫폼 (라이프집)",
        summary: "일상 기록과 콘텐츠 공유를 위한 SNS형 웹 플랫폼을 구축·유지보수했습니다.",
        stack: ["React", "TypeScript", "TinyMCE", "Zustand", "Dropzone", "AWS S3"],
        achievements: [
          "TinyMCE 커스터마이징·이미지 자동 압축 훅",
          "AWS S3 업로드·리사이즈 최적화",
        ],
        link: { label: "lifezip.kr", href: "https://lifezip.kr" },
      },
      {
        title: "대기업 하드웨어 성능 시각화",
        summary: "AG Grid 기반으로 하드웨어 설계·성능 데이터를 효율적으로 조회·관리하는 UI를 제공했습니다.",
        stack: ["React", "AG Grid", "TypeScript"],
        achievements: [
          "대용량 테이블 필터·정렬 UX 구성",
          "복잡한 측정 데이터를 읽기 쉬운 관리 화면으로 정리",
        ],
      },
    ],
  },
  {
    company: "㈜제이앤퍼스트",
    role: "개발부 / 대리",
    period: "2021.11 ~ 2023.09",
    focus: "글로벌 CMS · Line 협력사 eCommerce",
    projects: [
      {
        title: "Line 협력사 eCommerce · CMS",
        summary:
          "글로벌 Line 협력사에서 Monary CMS, WDM 백오피스, Wallet Campaign CMS 등 금융·이벤트 관리 시스템을 개발했습니다.",
        stack: ["React", "Next.js", "react-hook-form", "Yup", "Lottie"],
        achievements: [
          "동적 배열 폼·중첩 객체 유효성 검사 최적화",
          "My Dashboard Next.js 리팩토링으로 초기 로딩 단축",
        ],
      },
    ],
  },
];

export const sideProjects = [
  {
    title: "MatchMate Cursor App",
    status: "개발 중",
    summary:
      "소개팅 기반 매칭 플랫폼. Next.js PWA로 Supabase 인증과 실시간 기능을 포함한 실사용 수준 서비스를 구현 중입니다.",
    stack: ["Next.js", "TypeScript", "Supabase", "React Query", "Zustand", "PWA", "Vercel"],
    href: "https://github.com/maniabang/matchmate-cursor-app",
    images: [
      "/images/matchmate_1.png",
      "/images/matchmate_2.png",
      "/images/matchmate_3.png",
      "/images/matchmate_4.png",
    ],
  },
  {
    title: "Travel Record Flutter App",
    status: "사이드",
    summary:
      "출입국 증명서 OCR로 국가/날짜를 추출하고, 여행 기록 저장과 항공권 최저가 검색까지 이어지는 Flutter 앱입니다.",
    stack: ["Flutter", "google_ml_kit", "Riverpod", "Hive", "Dio", "OCR"],
    href: "https://github.com/maniabang/flutter",
    images: [
      "/images/travel_1.PNG",
      "/images/travel_2.PNG",
      "/images/travel_3.PNG",
      "/images/travel_4.PNG",
    ],
  },
] as const;
