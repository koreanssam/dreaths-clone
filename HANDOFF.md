# DREATHS Clone — Handoff & Architecture Documentation

## 1. 프로젝트 개요 및 현재 상태
`DREATHS_REVERSE_ENGINEERING_AND_SPECS.md`의 모든 요구사항(Phase 1 ~ Phase 4)이 엔드투엔드로 구현 및 검증 완료되었습니다.
- **GitHub 저장소**: `https://github.com/koreanssam/dreaths-clone`
- **빌드 & 테스트 상태**: `vitest` 유닛 테스트 10/10 통과, `next build` 프로덕션 빌드 통과.

---

## 2. 모듈별 구현 매핑 (Spec vs Implementation)

| 스펙 섹션 | 구현 파일 경로 | 핵심 구현 내용 |
| :--- | :--- | :--- |
| **3.1 트렌드 & 인사이트** | `src/services/trends.ts`<br>`src/app/api/v1/trends/insights/route.ts`<br>`src/app/api/v1/trends/hobbyspace/route.ts` | 네이버 데이터랩 쇼핑인사이트 10종 카테고리, 구글 트렌드 RSS(`geo=KR`) 실시간 파싱, 하비스페이스 RSS(`[AI 브리핑]`, `[쇼핑/핫딜 추천]`) 및 인기글 파서, SQLite `trend_cache` 1시간 TTL 캐싱 |
| **3.2 쿠팡 파트너스 엔진** | `src/services/coupang.ts`<br>`src/app/api/v1/coupang/search/route.ts`<br>`src/app/api/v1/coupang/deeplink/route.ts` | `CoupangAffiliateClient` — UTC `yyMMdd'T'HHmmss'Z'` 포맷 및 `CEA algorithm=HmacSHA256` 서명 생성, 상품 검색 및 `https://link.coupang.com/a/...` 숏링크 발급 |
| **3.3 AI 2단 타래 직조** | `src/services/gemini.ts`<br>`src/app/api/v1/editor/weave/route.ts` | `@google/genai` 연동 및 페르소나 폴백 직조기, **Thread 1**(500자 제한 & 외부 링크 제거 가드레일) + **Thread 2**(쿠팡 숏링크 & 공정위 필수 심의 문구 자동 삽입 가드레일) |
| **3.4 페르소나 스토리지** | `src/db/index.ts`<br>`src/app/api/v1/personas/route.ts`<br>`src/app/dashboard/personas/page.tsx` | 기본 프리셋 4종(`Hey Mongle`, `팩폭 코치`, `맛도리 다이어터`, `뉴스 배달부`) 자동 시드 및 커스텀 페르소나 CRUD (Few-shot 예시, 금지어 포함) |
| **3.5 Threads Graph API** | `src/services/threads.ts`<br>`src/app/api/v1/threads/publish/route.ts`<br>`src/app/api/v1/threads/schedule/route.ts` | Meta Graph API `v1.0` Container 생성 → Publish → `reply_to_id` 타래 체이닝 연쇄 발행 및 예약 발행 |
| **4. 데이터베이스 ERD** | `src/db/index.ts` | `users`, `accounts`, `personas`, `posts`, `trend_cache`, `benchmarks` 테이블 자동 생성 및 영속화 (`better-sqlite3` WAL 모드) |
| **Phase 4 프론트엔드 UI** | `src/components/AppShell.tsx`<br>`src/app/dashboard/insights/page.tsx`<br>`src/app/write/page.tsx`<br>`src/app/dashboard/personas/page.tsx`<br>`src/app/benchmark/page.tsx` | 다크/라이트 테마(`color-scheme`, `light-dark()`, FOUC 방지), 네이티브 `<dialog closedby="any">` API 키 설정 모달, 키워드 원클릭 에디터 연동 |

---

## 3. 단계별 진행 체크리스트 (Roadmap)
- [x] **Step 0**: Git 저장소 초기화, GitHub 원격 저장소(`gh repo create`) 생성 및 초기 명세/Handoff 문서 커밋
- [x] **Step 1**: 프로젝트 스캐폴딩, 의존성 설치 및 SQLite ERD 스키마/시드(기본 페르소나 4종 포함) 구축 (`src/types/index.ts`, `src/db/index.ts`)
- [x] **Step 2**: Phase 1 — 쿠팡 파트너스 HMAC-SHA256 엔진(`src/services/coupang.ts`) 및 트렌드 수집 엔진(`src/services/trends.ts`) + REST API 구현 및 유닛 테스트(`src/__tests__/phase1.test.ts`) 완료
- [x] **Step 3**: Phase 2 — Gemini AI 2단 타래 직조 엔진(`src/services/gemini.ts`) & 공정위 심의 문구 가드레일 + 페르소나 CRUD API(`/api/v1/personas`, `/api/v1/editor/weave`) 및 테스트(`src/__tests__/phase2.test.ts`) 완료
- [x] **Step 4**: Phase 3 — Meta Threads Graph API 연쇄 발행(`src/services/threads.ts`) 및 예약 발행/계정/벤치마크 API(`/api/v1/threads/publish`, `/api/v1/threads/schedule`, `/api/v1/accounts`, `/api/v1/benchmarks`) 및 테스트(`src/__tests__/phase3.test.ts`) 완료
- [x] **Step 5**: Phase 4 — 프론트엔드 대시보드(`/dashboard/insights`), 스마트 에디터(`/write`), 페르소나 관리(`/dashboard/personas`), 벤치마킹/발행내역(`/benchmark`), API 연동 설정 모달 및 다크/라이트 모드 UI 구현
- [x] **Step 6**: 엔드투엔드(E2E) 프로덕션 빌드 검증, 유닛 테스트 검증 및 최종 Handoff 문서 업데이트

---

## 4. 재개 및 운영 가이드 (How to Resume & Operate)
1. **커밋 히스토리 확인**:
   ```bash
   git log --oneline
   ```
2. **개발 서버 기동**:
   ```bash
   npm install
   npm run dev
   ```
3. **실제 외부 API 키 주입 방법 (2가지 모두 지원)**:
   - 방법 A: 웹 UI 좌측 하단 `외부 플랫폼 연동 상태 > 키 설정` 버튼 클릭 → 모달 창에서 쿠팡 파트너스, Gemini, Meta Threads, 네이버 데이터랩 키 저장 (SQLite `accounts` 테이블에 즉시 반영)
   - 방법 B: `.env.local` 파일에 `.env.example` 항목 설정
4. **테스트 및 빌드 검증**:
   ```bash
   npm test
   npm run build
   ```
