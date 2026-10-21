# DREATHS Clone — 외부 플랫폼 가입 및 API 키 발급 완벽 가이드

이 문서는 DREATHS 클론 서비스를 **100% 실전(LIVE) 모드**로 운영하기 위해 가입해야 하는 외부 사이트 목록, 가입/발급 절차, 주의사항, 그리고 서비스에 입력하는 방법을 순서대로 정리한 가이드입니다.

---

## 한눈에 보기 (우선순위 요약표)

> **💡 팁**: 처음부터 6개를 다 발급받을 필요는 없습니다. **1순위(AI 모델 중 택1)**만 먼저 넣어도 실제 AI 원고 직조가 바로 작동합니다.

| 우선순위 | 플랫폼 | 용도 | 발급 난이도 | 비용 / 조건 |DREATHS 입력 항목 |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **1순위 (택1)** | **Google AI Studio (Gemini)** | 2단 타래 원고 AI 직조 | ★☆☆☆☆ (1분) | 무료 티어 제공 | `GEMINI_API_KEY` |
| **1순위 (택1)** | **Upstage Console (Solar)** | 한국어 특화 Solar Pro 4 직조 | ★☆☆☆☆ (3분) | 신규 가입 무료 크레딧 제공 | `UPSTAGE_API_KEY` |
| **1순위 (택1)** | **OpenAI Platform (GPT)** | GPT-6-Luna 원고 직조 | ★★☆☆☆ (5분) | 카드 등록 및 소액 충전($5~) | `OPENAI_API_KEY` |
| **완료 (가입 불필요)** | **네이버 데이터랩 쇼핑인사이트** | 쇼핑인사이트 10대 카테고리 트렌드 | ☆☆☆☆☆ (0분) | API 키·제휴신청 없이 데이터랩 웹 랭킹 직접 수집 (비공식) | 입력 불필요 (자동 LIVE) |
| **3순위** | **쿠팡 파트너스** | 실상품 검색 & 수익형 딥링크 발급 | ★★★☆☆ | 쿠팡 파트너스 가입 (Open API는 실적 조건 있음) | `Access Key`, `Secret Key` |
| **4순위** | **Meta for Developers (Threads)** | 스레드 계정 원클릭 본문+댓글 연쇄 게시 | ★★★★☆ | 인스타그램/스레드 계정 필요 (무료) | `Threads User ID`, `Access Token` |

---

## 1. AI 원고 직조 모델 (3곳 중 최소 1곳만 발급받아도 됨)

### 1-1. Google Gemini API 키 발급 (가장 빠르고 무료)
1. **접속 사이트**: [Google AI Studio (https://aistudio.google.com/apikey)](https://aistudio.google.com/apikey)
2. **가입/로그인**: 본인의 구글(Gmail) 계정으로 로그인합니다.
3. **발급 방법**:
   - 우측 상단 또는 중앙의 **`[Create API key]`** 버튼 클릭
   - 프로젝트 선택(또는 새 프로젝트 생성) 후 생성된 `AIzaSy...` 로 시작하는 키 복사
4. **DREATHS 입력 위치**:
   - `/write` 페이지 3단계에서 **`Google Gemini 2.5 Flash`** 카드 선택 → 하단 입력창에 붙여넣고 **`[키 저장]`** 클릭

---

### 1-2. Upstage Solar Pro 4 API 키 발급 (한국어 카피라이팅 특화)
1. **접속 사이트**: [Upstage Console (https://console.upstage.ai/)](https://console.upstage.ai/)
2. **가입/로그인**: 구글 계정 또는 이메일로 회원가입 및 로그인합니다.
3. **발급 방법**:
   - 좌측 메뉴에서 **`[API Keys]`** 클릭
   - **`[Create new key]`** 버튼을 눌러 키 이름을 입력하고 `up_...` 으로 시작하는 API Key 복사
4. **DREATHS 입력 위치**:
   - `/write` 페이지 3단계에서 **`Upstage Solar Pro 4`** 카드 선택 → 하단 입력창에 붙여넣고 **`[키 저장]`** 클릭

---

### 1-3. OpenAI (GPT-6-Luna) API 키 발급
1. **접속 사이트**: [OpenAI Platform (https://platform.openai.com/api-keys)](https://platform.openai.com/api-keys)
2. **가입/로그인**: OpenAI 계정 로그인 (주의: ChatGPT Plus 구독과는 별개이며 API 크레딧 충전이 필요합니다).
3. **결제 수단 등록 (최초 1회)**:
   - 좌측 메뉴 **`Settings` > `Billing`** 에서 해외결제 카드 등록 후 최소 금액($5) 충전
4. **발급 방법**:
   - **`Dashboard` > `API keys`** 메뉴에서 **`[+ Create new secret key]`** 클릭
   - `sk-proj-...` 로 시작하는 시크릿 키 복사
5. **DREATHS 입력 위치**:
   - `/write` 페이지 3단계에서 **`OpenAI GPT-6-Luna`** 카드 선택 → 하단 입력창에 붙여넣고 **`[키 저장]`** 클릭

---

## 2. 네이버 데이터랩 쇼핑인사이트 — 가입·API 키 불필요

> **결론: 네이버 개발자 센터 등록도, 제휴 신청도 하지 않습니다.**
> - 앱이 쓰는 데이터는 "카테고리별 인기 검색어 TOP 20"입니다. 공식 오픈 API(`/v1/datalab/shopping/categories`)는 카테고리 **전체 클릭 추이 비율만** 주고 키워드 순위는 주지 않으므로, 키를 받아도 이 화면을 채울 수 없습니다.
> - 그래서 `src/services/trends.ts`는 데이터랩 쇼핑인사이트 웹페이지가 쓰는 `https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver`를 직접 호출합니다. (2026-10-21 확인: 10개 카테고리 모두 20위까지 응답)
> - 비공식 엔드포인트라 네이버가 바꾸거나 막으면 끊길 수 있습니다. 연속 호출 시(약 7회) 빈 응답이 오는 차단이 확인되어, 카테고리마다 1시간 캐시하고 실패 결과는 캐시하지 않습니다.
> - 실패하면 가짜 목록을 보여주지 않고, 대시보드에 빨간 안내 상자로 원인을 띄웁니다.
>   - `endpoint_changed`: "순위 주소(또는 응답 형식)가 바뀌었습니다" → Claude에게 화면의 안내 문구를 그대로 주고 새 주소를 찾게 하면 됩니다.
>   - `blocked`: 짧은 시간에 많이 호출해 네이버가 잠시 막은 것 → 몇 분 뒤 새로고침.
>   - `network`: 인터넷 연결 문제.

---

## 3. 쿠팡 파트너스 가입 및 Open API 키 발급 (제휴마케팅 수익화)

1. **접속 사이트**: [쿠팡 파트너스 (https://partners.coupang.com/)](https://partners.coupang.com/)
2. **회원가입 절차**:
   - 기존 쿠팡 쇼핑 아이디로 로그인 후 파트너스 가입 진행
   - **사업자 유형 선택**: 개인 / 개인사업자 / 법인 중 선택
   - **웹사이트 목록 등록**: 본인의 **Threads 프로필 주소(`https://www.threads.net/@내아이디`)**를 반드시 등록하세요!
   - **모바일 앱 목록 / 스크린샷**: 가입 후 첫 판매가 발생하면 최종 승인 심사를 위해 본인 스레드 프로필 화면 캡처본을 등록해야 합니다.
3. **Open API 키(`Access Key` / `Secret Key`) 발급 방법**:
   - 상단 메뉴 **`[추가기능]` > `[파트너스 API]`** 이동
   - `Access Key`와 `Secret Key`를 생성하여 복사
   - ⚠️ **중요 참고사항 (쿠팡 정책)**: 쿠팡 파트너스는 **누적 판매 금액 15만 원 달성 후 최종 승인**이 완료된 계정에 한해 Open API 키 발급 버튼을 활성화해 줍니다.
   - **최종 승인 전(15만 원 달성 전) 활용 팁**:
     - API 키가 없어도 쿠팡 파트너스 웹사이트에서 상품을 검색해 단축 URL(`https://link.coupang.com/a/...`)을 복사한 뒤, DREATHS의 `/write` 페이지 2단계 **`발급된 쿠팡 파트너스 트래킹 숏링크(shortenUrl)` 입력칸에 직접 붙여넣기**만 하면 AI 원고 직조와 스레드 발행이 100% 동일하게 작동합니다!
4. **DREATHS 입력 위치 (API 키 보유 시)**:
   - 좌측 사이드바 하단 **`[키 설정]`** 클릭 → **`쿠팡 파트너스 (HMAC-SHA256)`** 카드에 `Access Key`, `Secret Key` 입력 후 저장

---

## 4. Meta Threads 공식 Graph API 발급 (원클릭 자동 게시용)

> 스레드 앱에 직접 복사·붙여넣기 하지 않고, 웹에서 버튼 한 번으로 **1번 본문 게시 + 1번 댓글 타래 자동 달기**까지 자동화하려면 Meta 개발자 앱 토큰이 필요합니다.

1. **사전 준비물**:
   - 본인의 **Threads 계정** (인스타그램 계정과 연동됨)
2. **접속 사이트**: [Meta for Developers (https://developers.facebook.com/apps/)](https://developers.facebook.com/apps/)
3. **앱 생성 절차**:
   - 페이스북/메타 계정으로 로그인 후 우측 상단 **`[내 앱]` > `[앱 만들기]`** 클릭
   - **앱 사용 사례 선택**: **`Threads API 액세스 (Access the Threads API)`** 체크 후 다음 클릭
   - **앱 이름**: `DREATHS Publisher` (자유 입력) 입력 후 앱 생성 완료 (비즈니스 포트폴리오는 선택 안 해도 무방)
4. **권한 및 테스터 등록**:
   - 좌측 메뉴 **`[사용 사례(Use cases)]` > `[Threads API 액세스 맞춤 설정]`** 클릭
   - 권한 목록에서 아래 항목들의 **`[추가]`** 버튼 클릭:
     - `threads_basic` (기본 활성화됨)
     - `threads_content_publish` (**필수: 글/댓글 발행 권한**)
     - `threads_manage_replies` (선택: 댓글 타래 관리 권한)
   - 좌측 메뉴 **`[앱 역할(App Roles)]` > `[역할]`** 이동 → **`[사람 추가]`** 클릭 → **`Threads 테스터(Threads Tester)`** 선택 후 본인의 Threads(인스타그램) 아이디 입력 및 초대
5. **스레드 앱에서 테스터 초대 수락**:
   - 스마트폰이나 웹으로 **Threads(`threads.net`)** 접속
   - **`설정(Settings)` > `계정(Account)` > `웹사이트 권한(Website permissions)` > `초대(Invitations)`** 탭에서 방금 보낸 앱 초대를 **`[수락(Accept)]`** 클릭!
6. **Access Token 및 User ID 발급**:
   - 다시 Meta for Developers 콘솔의 **`[사용 사례]` > `[Threads API 액세스 맞춤 설정]` > `[설정]`** (또는 API 탐색기)으로 이동
   - 등록된 본인 계정 옆의 **`[액세스 토큰 생성(Generate Access Token)]`** 클릭 후 스레드 로그인 승인
   - 화면에 생성된 **`Access Token`** 과 본인의 숫자형 **`Threads User ID`** 복사
7. **DREATHS 입력 위치**:
   - 좌측 사이드바 하단 **`[키 설정]`** 클릭 → **`Meta Threads Graph API v1.0`** 카드에 `Threads User ID`와 `Threads Access Token` 입력 후 저장

---

## 5. 발급받은 키를 DREATHS에 적용하는 2가지 방법

### 방법 A: 웹 화면에서 바로 저장 (가장 간편 · 권장)
- 서버 재시작 없이 즉시 SQLite 데이터베이스(`dreaths.db`의 `accounts` 테이블)에 암호화/영구 저장됩니다.
1. `http://localhost:3000` 접속
2. 좌측 하단 **`외부 플랫폼 연동 상태 > [키 설정]`** 클릭 (또는 `/write` 페이지 3단계 인라인 입력창 사용)
3. 각 키 입력 후 **`[저장]`** 버튼 클릭 → 배지가 `AUTO`에서 초록색 **`LIVE`**로 바뀌면 완료!

### 방법 B: `.env.local` 파일로 관리
프로젝트 폴더(`/Users/iseong-won/Desktop/dreaths-clone/.env.local`)에 파일을 만들고 아래 형식으로 적어두면 서버 시작 시 자동으로 읽어옵니다:

```env
# AI 직조 모델 키 (사용할 모델만 입력)
UPSTAGE_API_KEY=up_xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxx


# 쿠팡 파트너스 Open API
COUPANG_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
COUPANG_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Meta Threads Graph API
THREADS_USER_ID=25410928100000000
THREADS_ACCESS_TOKEN=THQVJxxxxxxxxxxxxxxxxxxxxxxxx
```
