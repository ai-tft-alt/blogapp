# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

BLOGAPP — 글·이미지·댓글 블로그. pnpm 모노레포: `apps/backend`(Express 4 + Prisma 6/SQLite), `apps/frontend`(React 19 + Vite 6 + react-router 7, 순수 CSS), `packages/shared`(공용 타입). Docker·외부 DB 불필요. 원래 명세는 [BLOGAPP_SPEC.md](BLOGAPP_SPEC.md).

## 명령

```bash
pnpm install && pnpm db:setup && pnpm dev   # backend :3000, frontend :5173
pnpm lint | pnpm typecheck | pnpm build | pnpm test
pnpm db:reset                               # SQLite 파일 삭제 → migrate deploy → 시드
pnpm logs:generate [줄수]                    # logs/app.log (기본 200,000줄, 고정 시드)
```

- 테스트는 backend에만 있음(Vitest + supertest). 단일 파일/케이스:
  `pnpm --filter @blogapp/backend test tests/posts.test.ts` / `... test -t "테스트 이름"`
- `build`는 backend·shared에서는 `tsc --noEmit`(타입 검사만), frontend는 타입 검사 + `vite build`.
- 테스트 계정: `alice@blogapp.com` / `bob@blogapp.com`, 비밀번호 `password123`.

## 버전·환경 제약

- 버전 고정: TypeScript 5.x, Prisma 6.x, Express 4.x, zod 3.x, Vite 6.x, ESLint 9(flat config), Vitest 3.x. 메이저 업그레이드나 "최신" 설치 금지(TS 7·ESLint 10·Vite 8 등이 섞이면 lint·build 깨짐). 새 라이브러리 추가도 지양.
- Windows(PowerShell)·macOS·WSL 모두에서 동작해야 함. npm 스크립트에 `VAR=값 cmd`, `rm -rf` 같은 셸 전용 문법 금지 → 여러 단계 작업은 Node 스크립트(예: [apps/backend/scripts/db.mjs](apps/backend/scripts/db.mjs))로.
- **`prisma migrate reset` 사용 금지**(AI 에이전트 안에서 Prisma가 차단). 초기화는 `pnpm db:reset`. 스키마 변경 시 새 마이그레이션을 `apps/backend/prisma/migrations/`에 추가하고 `db:setup`은 `migrate deploy`를 사용.
- 환경변수는 `apps/backend/.env` 하나뿐(루트 `.env` 없음). 파일이 없어도 [config.ts](apps/backend/src/lib/config.ts)와 `db.mjs`가 기본값(`DATABASE_URL=file:./dev.db` 등)을 채움. SQLite 경로는 `prisma/` 기준 상대 경로.
- pnpm 10: 루트 `pnpm.onlyBuiltDependencies`와 backend `postinstall: prisma generate`가 있어야 Prisma Client가 생성됨.
- Windows에서 `pnpm dev`를 멈춰도 node 하위 프로세스가 남을 수 있음 → `Get-NetTCPConnection -LocalPort 3000,5173`로 확인.

## 아키텍처

**공용 타입:** `packages/shared`는 빌드 없이 TS 소스(`src/index.ts`)를 직접 export. 다른 패키지는 `import type`으로만 사용. API 응답 DTO(`Post`, `Comment`, `User`, `PaginatedPosts`, `ApiFailure` 등)는 여기서 정의하고 backend·frontend가 공유하므로, API 형태를 바꾸면 이 파일부터 수정.

**Backend 요청 흐름:** [app.ts](apps/backend/src/app.ts)의 `createApp()`이 앱을 조립(테스트가 이 `app`을 import, 실행 진입점은 `index.ts`). 모든 API는 `/api/v1` 아래, 업로드 파일은 `apps/backend/uploads/`에 저장되어 `/uploads`로 정적 제공.
- `routes/*` — zod 스키마([schemas.ts](apps/backend/src/routes/schemas.ts))로 `parse` 후 서비스 호출, `asyncHandler`로 감싸 에러를 전달. 응답은 항상 `{ data: ... }`.
- `services/*` — Prisma 호출과 비즈니스 규칙. 권한 위반·미존재는 `lib/http-error.ts`의 `notFound()/forbidden()/unauthorized()`를 throw. DB row → DTO 변환은 [mappers.ts](apps/backend/src/services/mappers.ts)(`postInclude(viewerId)`로 작성자 이름·댓글 수·좋아요 수·`likedByMe`를 한 쿼리에 포함, 날짜는 ISO 문자열).
- [middleware/error.ts](apps/backend/src/middleware/error.ts)가 `HttpError`·`ZodError`(400 `VALIDATION_ERROR`)·Multer 에러를 `{ error: { code, message } }`로 일괄 변환. 라우트에서 직접 에러 응답을 만들지 말 것.
- 인증: `requireAuth`/`optionalAuth`가 JWT(7일)를 검증해 `res.locals.userId`에 저장. 핸들러에서는 `currentUserId(res)`(필수) / `viewerId(res)`(선택)로 읽음.
- 규칙: 공개 목록은 PUBLISHED만, DRAFT는 작성자 본인만 조회(타인은 404), 수정·삭제는 작성자만(403). `status`는 SQLite라 문자열 `"DRAFT" | "PUBLISHED"`.

**테스트:** [vitest.config.ts](apps/backend/vitest.config.ts)가 `DATABASE_URL=file:./test.db`로 고정하고, [global-setup.ts](apps/backend/tests/global-setup.ts)가 `db.mjs reset`으로 테스트 DB를 새로 만듦(dev.db는 건드리지 않음). 파일 병렬 실행 꺼짐. 시드 데이터에 의존하므로 [helpers.ts](apps/backend/tests/helpers.ts)의 `registerUser()`(고유 이메일)·`loginAlice()`를 사용. 시드([seed.ts](apps/backend/prisma/seed.ts))는 결정적(id·작성일 고정): 사용자 2명, 글 12개(DRAFT 2), 댓글 20개 이상.

**Frontend:** 모든 서버 호출은 [api/client.ts](apps/frontend/src/api/client.ts)의 `api` 객체를 통해서만. 상대 경로 `/api/v1`로 요청하고 Vite dev 서버가 `/api`·`/uploads`를 `localhost:3000`으로 프록시. 토큰은 localStorage(`blogapp.token`)에 저장되어 자동 첨부, 실패 응답은 `ApiError(status, code, message)`로 throw. 로그인 상태는 `auth/AuthContext.tsx`, 보호 라우트는 `App.tsx`의 `RequireAuth`(비로그인 시 `/login`으로 이동).
- 버튼·입력창에는 접근성 이름(label / aria-label)을 붙인다 — Playwright 접근성 트리 기반 테스트에서 사용.
