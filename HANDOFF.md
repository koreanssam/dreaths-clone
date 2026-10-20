# DREATHS Clone — Handoff & Progress Document

## 1. 프로젝트 목적 및 개요
`DREATHS_REVERSE_ENGINEERING_AND_SPECS.md` 명세에 따라 **소셜 미디어(Threads) 바이럴 콘텐츠 생성과 제휴마케팅(쿠팡 파트너스) 자동화**를 결합한 통합 마케팅 플랫폼을 구축합니다.

## 2. 아키텍처 및 기술 스택 결정
- **프레임워크**: Next.js (App Router, TypeScript) — 프론트엔드 UI(`/dashboard/insights`, `/write`, `/dashboard/personas`, `/benchmark`)와 백엔드 REST API(`/api/v1/...`)를 단일 통합 아키텍처로 제공.
- **데이터베이스 & 캐시**: `better-sqlite3` 기반 영속 스토리지 (ERD의 `users`, `accounts`, `personas`, `posts`, `trend_cache` 테이블 완벽 구현 및 1시간 TTL 캐싱 지원).
- **외부 연동 모듈 (`src/services/`)**:
  - `trendService`: 네이버 데이터랩 쇼핑인사이트 API, 구글 트렌드 실시간 RSS (`https://trends.google.co.kr/trending/rss?geo=KR`), 하비스페이스 RSS (`https://bbs.hobbyspace.org/rss.xml`) 및 인기글 파서 (`fast-xml-parser`, `cheerio` 활용).
  - `coupangService`: 쿠팡 파트너스 Open API HMAC-SHA256 서명 생성기 (`CEA algorithm=HmacSHA256`), 상품 검색(`/products/search`), 딥링크 발급(`/deeplink`).
  - `promptEngine`: Google Gemini (`@google/genai`) 연동, 페르소나 스타일 주입, Threads 알고리즘 최적화 2-Stage 타래 분할 생성 (본문 후킹 + 1번 댓글 링크 & 공정위 필수 문구 강제 가드레일).
  - `threadsService`: Meta Threads Graph API (`v1.0`) 2단계 Container 생성 -> 발행 -> `reply_to_id` 체이닝 타래 연쇄 발행 및 예약 발행 스케줄러.

## 3. 단계별 진행 상황 (Roadmap & Checklist)
- [x] **Step 0**: Git 저장소 초기화, GitHub 원격 저장소(`gh repo create`) 생성 및 초기 명세/Handoff 문서 커밋
- [x] **Step 1**: 프로젝트 스캐폴딩, 의존성 설치 및 SQLite ERD 스키마/시드(기본 페르소나 4종 포함) 구축 (`src/types/index.ts`, `src/db/index.ts`)
- [ ] **Step 2**: Phase 1 — 쿠팡 파트너스 HMAC-SHA256 엔진 및 트렌드 수집 엔진(네이버/구글 트렌드 RSS/하비스페이스 RSS & 크롤러) + REST API 구현 및 테스트
- [ ] **Step 3**: Phase 2 — Gemini AI 2단 타래 직조 엔진(`PromptEngine`) & 공정위 심의 문구 가드레일 + 페르소나 CRUD API 구현
- [ ] **Step 4**: Phase 3 — Meta Threads Graph API 연쇄 발행(`ThreadsService`) 및 예약 발행 API 구현
- [ ] **Step 5**: Phase 4 — 프론트엔드 대시보드(`/dashboard/insights`), 스마트 에디터(`/write`), 페르소나 관리(`/dashboard/personas`), 벤치마킹/발행내역(`/benchmark`), API 연동 설정 모달 및 다크/라이트 모드 UI 구현
- [ ] **Step 6**: 엔드투엔드(E2E) 검증, 유닛 테스트 작성 및 최종 Handoff 문서 업데이트

## 4. 재개 가이드 (How to Resume)
1. 최신 커밋 로그 확인: `git log --oneline -n 10`
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`
4. 테스트 실행: `npm test`
