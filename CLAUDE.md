# CLAUDE.md — DREATHS Clone 작업 지침

## 프로젝트 개요
Next.js 15 (App Router, TypeScript, `better-sqlite3`) 기반의 **Threads 바이럴 & 쿠팡 파트너스 자동화 플랫폼**입니다.

## 주의사항 (Build & Architecture Rules)
1. 클라이언트 컴포넌트(`"use client"`, 예: `src/app/write/page.tsx`, `src/components/AppShell.tsx`)에서는 절대 `@/db`나 `@/services/*` (내부에서 `better-sqlite3`를 import하는 서버 전용 모듈)를 직접 import하지 마세요. 공유 상수/타입은 반드시 `src/types/index.ts`에 정의하고 import해야 `next build` 시 `fs` 번들링 에러가 발생하지 않습니다.
2. 작업 완료 후 반드시 `npm test` 및 `npm run build`를 실행해 에러가 없는지 검증하고, `HANDOFF.md` 업데이트 후 `git commit` & `git push origin main`까지 수행하세요.
