# DREATHS Clone — Threads 바이럴 & 쿠팡 파트너스 자동화 플랫폼

`DREATHS_REVERSE_ENGINEERING_AND_SPECS.md` 명세를 기반으로 구축된 **실시간 트렌드 포착 · 쿠팡 파트너스 딥링크 매핑 · 페르소나 기반 2단 타래 직조 · Meta Threads Graph API 연쇄 발행** 통합 마케팅 플랫폼입니다.

## 주요 기능

1. **실시간 트렌드 & 인사이트 대시보드 (`/dashboard/insights`)**
   - **네이버 데이터랩 쇼핑인사이트**: 10대 카테고리(`패션의류`, `화장품/미용`, `디지털/가전`, `가구/인테리어`, `출산/육아`, `식품`, `스포츠/레저`, `생활/건강`, `여가/생활편의`, `도서`) 인기 검색어 TOP 20 (API 키 없이 데이터랩 웹 랭킹 직접 수집, 실패 시 원인 안내) 및 1시간 TTL 캐싱.
   - **구글 트렌드 실시간 급상승 (`KR`)**: `https://trends.google.co.kr/trending/rss?geo=KR` RSS 실시간 파싱 (`title`, `ht:approx_traffic`, `ht:news_item`).
   - **하비스페이스 커뮤니티 (`bbs.hobbyspace.org`)**: RSS 피드(`[AI 브리핑]`, `[쇼핑/핫딜 추천]`) 및 인기글/랭킹 크롤러 연동.
   - 모든 키워드에서 원클릭으로 스마트 에디터(`/write?keyword=...`)로 즉시 연결.

2. **쿠팡 파트너스 연동 엔진 (`CoupangAffiliateClient`)**
   - `CEA algorithm=HmacSHA256, access-key=..., signed-date=yyMMdd'T'HHmmss'Z', signature=...` 규격 암호화 서명 생성기.
   - 키워드 상품 검색 (`POST /api/v1/coupang/search`) 및 트래킹 단축 딥링크 발급 (`POST /api/v1/coupang/deeplink`).

3. **스마트 에디터 & Gemini 2-Stage 타래 직조 (`/write`)**
   - **Thread 1 (본문 후킹 & 경험담)**: 500자 이내, 도달률 페널티 방지를 위한 외부 URL 자동 제거 가드레일.
   - **Thread 2 (첫 댓글 타래)**: 쿠팡 파트너스 숏링크 + 공정거래위원회 추천보증심사 지침 표준 문구(*"이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."*) 강제 포함 가드레일.

4. **페르소나 스토리지 (`/dashboard/personas`)**
   - DREATHS 기본 내장 페르소나 4종 (`Hey Mongle 스타일`, `치트키 팩폭 코치`, `성시경/홍진경 맛도리 다이어터`, `정보 큐레이터/뉴스 배달부`) 기본 시드 제공.
   - 사용자 정의 페르소나(말투, 지침, Few-shot 예시 문장, 금지어 목록) 생성 및 삭제 CRUD.

5. **Meta Threads 공식 Graph API (`v1.0`) 연쇄 발행 & 벤치마킹 보관함 (`/benchmark`)**
   - 비동기 Container 생성(`/{user-id}/threads`) → 발행(`/{user-id}/threads_publish`) → `reply_to_id` 체이닝으로 첫 댓글 타래 자동 연쇄 발행(`POST /api/v1/threads/publish`) 및 예약 발행(`POST /api/v1/threads/schedule`).

## 빠른 실행

```bash
npm install
npm test
npm run dev
```
브라우저에서 `http://localhost:3000` 접속 (자동으로 `/dashboard/insights`로 이동).
