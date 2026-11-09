# BLOGAPP 생성 스펙 (Claude Code 실습용)

> 이 문서는 **Claude Code가 읽고 실습용 프로젝트를 처음부터 만들기 위한 명세서**입니다.
> 수강생은 빈 폴더에 이 파일 하나만 넣고, Claude Code에게 "이 스펙대로 만들어줘"라고 요청합니다.
> Claude는 이 문서의 **모든 규칙을 지키고**, 마지막의 **완료 기준(DoD)** 을 모두 통과해야 작업을 끝낼 수 있습니다.

---

## 0. Claude에게 주는 작업 규칙

1. **Plan Mode로 먼저 계획**을 세우고, 사용자가 승인한 뒤 구현한다.
2. 구현은 아래 순서로 단계별 진행하고, 단계마다 해당 검증 명령을 실행해 통과를 확인한 뒤 다음 단계로 간다.
   `루트/공통 설정 → packages/shared → apps/backend(+DB, 시드, 테스트) → apps/frontend → scripts → 최종 검증 → git 커밋`
3. 이 문서에 **없는 기능은 만들지 않는다.** 특히 6장 "만들지 말 것" 목록은 절대 구현하지 않는다(이후 강의 실습 과제다).
4. 6장 "의도적 결함"은 **반드시 그대로 심어 두고 고치지 않는다.**
5. 질문은 꼭 필요한 것만 한다. 이 문서에 답이 있으면 묻지 않는다.
6. 운영체제는 Windows(PowerShell)·macOS·WSL 모두에서 동작해야 한다. npm 스크립트에 `VAR=값 명령` 형태의 환경변수 문법, `rm -rf` 같은 셸 전용 문법을 쓰지 않는다. 여러 단계가 필요한 작업(마이그레이션+시드 등)은 **Node 스크립트**(`apps/backend/scripts/db.mjs` 등)로 작성하고, `pre*`/`post*` 스크립트 훅은 사용해도 된다.
7. **`CLAUDE.md`, `.claude/`, `.mcp.json`, `agent_docs/`, git hook(husky 등)은 만들지 않는다.** 강의에서 수강생이 직접 만든다.

---

## 1. 프로젝트 개요

- 이름: **BLOGAPP** — 사용자가 글을 쓰고, 이미지를 올리고, 댓글을 다는 블로그 서비스
- 구조: **pnpm 모노레포** (backend / frontend / shared types)
- 목적: Claude Code 강의(Plan Mode, CLAUDE.md, Hook, Skill, MCP, Sub-Agent, Agent Team, Worktree, 하네스 엔지니어링) 실습 대상 코드베이스

## 2. 기술 스택 (버전 고정 규칙 포함)

| 영역 | 선택 | 비고 |
|---|---|---|
| 런타임 | Node.js 20.19 이상 (20/22/24 LTS) | `package.json`의 `engines`에 명시 |
| 패키지 매니저 | pnpm 9 이상 (workspace) | `packageManager` 필드 명시 |
| 언어 | **TypeScript 5.x** (strict, 6 이상 금지) | 루트 `tsconfig.base.json`을 각 패키지가 extends |
| Backend | **Express 4.x**, **zod 3.x**, jsonwebtoken, bcryptjs, multer, cors, **dotenv 16.x** | 개발 실행은 `tsx watch` |
| DB | **Prisma 6.x** + **SQLite** | Docker·별도 DB 설치 불필요. Prisma 7 사용 금지 |
| Frontend | **React 19**, **Vite 6.x**, **@vitejs/plugin-react 4.x**, **react-router 7** | 스타일은 순수 CSS(라이브러리 없이) |
| 테스트 | **Vitest 3.x** (+ supertest: backend) | |
| 린트/포맷 | **ESLint 9.x**(flat config) + **typescript-eslint 8.x** + `@eslint/js` + `globals` + Prettier | 루트에서 일괄 실행 |
| 동시 실행 | concurrently | `pnpm dev` 하나로 backend+frontend 실행 |

- **주요 버전은 위 표대로 고정한다.** "최신"을 설치하면 TypeScript 7·ESLint 10·Vite 8 등 서로 맞지 않는 버전이 섞여 lint·build가 깨진다.
- 위 표와 그 타입 패키지(`@types/*`) 외의 라이브러리는 추가하지 않는다.
- **pnpm 10 대비:** 루트 `package.json`에 `"pnpm": { "onlyBuiltDependencies": ["@prisma/client", "@prisma/engines", "prisma", "esbuild"] }`를 넣고, backend에 `"postinstall": "prisma generate"`를 둔다. (없으면 Prisma Client가 생성되지 않음)
- **shared 공유 방식:** `packages/shared`는 빌드하지 않고 TS 소스를 그대로 export(`"types"`/`"exports"` → `./src/index.ts`)하며, 다른 패키지는 `import type`으로만 사용한다.

## 3. 폴더 구조

```
blogapp/
├── apps/
│   ├── backend/
│   │   ├── prisma/ (schema.prisma, seed.ts, migrations/<초기 1개>)
│   │   ├── scripts/db.mjs   (db:setup / db:reset 구현)
│   │   ├── src/
│   │   │   ├── routes/      (auth.ts, posts.ts, comments.ts, uploads.ts)
│   │   │   ├── services/    (비즈니스 로직)
│   │   │   ├── middleware/  (auth.ts, error.ts)
│   │   │   ├── lib/         (prisma.ts, jwt.ts, config.ts)
│   │   │   ├── app.ts       (express 앱 조립, 테스트에서 import)
│   │   │   └── index.ts     (서버 실행 진입점)
│   │   ├── tests/           (auth.test.ts, posts.test.ts, comments.test.ts)
│   │   ├── uploads/         (.gitkeep만 커밋, 업로드 파일은 gitignore)
│   │   └── .env.example
│   └── frontend/
│       └── src/
│           ├── api/         (client.ts — fetch 래퍼, 토큰 자동 첨부)
│           ├── auth/        (AuthContext.tsx)
│           ├── components/  (Header, PostCard, CommentList, CommentForm, ImageUploader)
│           ├── pages/       (HomePage, PostDetailPage, LoginPage, RegisterPage, EditorPage, MyPostsPage)
│           ├── App.tsx, main.tsx, styles.css
├── packages/
│   └── shared/src/index.ts  (User, Post, Comment, ApiResponse 등 공용 타입)
├── scripts/
│   └── generate-logs.mjs    (대용량 로그 생성기, 7장 참고)
├── docs/                    (README 외 문서 없음. 빈 폴더 + .gitkeep)
├── .gitattributes (* text=auto eol=lf), .gitignore, .prettierrc, .prettierignore, eslint.config.js
├── package.json, pnpm-workspace.yaml, tsconfig.base.json
└── README.md
```

## 4. 데이터 모델 (Prisma, SQLite)

```prisma
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  name         String
  passwordHash String
  createdAt    DateTime  @default(now())
  posts        Post[]
  comments     Comment[]
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String
  imageUrl  String?
  status    String    @default("DRAFT")   // "DRAFT" | "PUBLISHED" (SQLite라 문자열)
  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  postId    Int
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

**마이그레이션:** 초기 마이그레이션 1개를 만들어 커밋하고, `db:setup`은 `prisma migrate deploy`를 쓴다.
**`prisma migrate reset`은 쓰지 않는다**(Claude Code 같은 AI 에이전트 안에서 실행하면 Prisma가 차단함). 초기화는 SQLite 파일 삭제 → `migrate deploy` → 시드 순서로 구현한다(테스트용 DB도 같은 방식).

**시드 데이터** (`pnpm db:setup` 시 자동 투입, 여러 번 실행해도 id·작성일까지 같은 결과):

| 계정 | 이메일 | 비밀번호 |
|---|---|---|
| Alice | alice@blogapp.com | password123 |
| Bob | bob@blogapp.com | password123 |

- 게시물 12개(Alice 7, Bob 5). 그중 2개는 DRAFT. 제목·본문은 한국어, 개발·여행·요리 등 주제를 섞는다.
- 댓글 20개 이상을 여러 게시물에 분산.
- 시드 게시물의 `imageUrl`은 모두 null.

## 5. Backend API

- 기본 주소: `http://localhost:3000`, 모든 API 접두사: **`/api/v1`**
- 응답 형식: 성공 `{ "data": ... }`, 실패 `{ "error": { "code": "STRING", "message": "..." } }`
- 인증: `Authorization: Bearer <JWT>` (유효기간 7일). 입력 검증은 zod.
- 업로드 파일은 `apps/backend/uploads/`에 저장하고 `/uploads` 경로로 정적 제공한다.

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/v1/health` | - | `{ data: { status: "ok" } }` |
| POST | `/api/v1/auth/register` | - | email, name, password(8자 이상) → `{ token, user }` |
| POST | `/api/v1/auth/login` | - | email, password → `{ token, user }` |
| GET | `/api/v1/auth/me` | 필요 | 내 정보 |
| GET | `/api/v1/posts?page=1&limit=10` | - | PUBLISHED 글 목록(최신순, 작성자 이름·댓글 수 포함, 페이지 정보 포함) |
| GET | `/api/v1/posts/mine` | 필요 | 내 글 목록(DRAFT 포함) |
| GET | `/api/v1/posts/:id` | - | 글 상세(PUBLISHED만. 작성자 본인은 DRAFT도 조회 가능, 타인의 DRAFT는 404) |
| POST | `/api/v1/posts` | 필요 | title, content, imageUrl?, status? 생성 |
| PUT | `/api/v1/posts/:id` | 작성자 | 수정 |
| DELETE | `/api/v1/posts/:id` | 작성자 | 삭제 |
| GET | `/api/v1/posts/:id/comments` | - | 댓글 목록(오래된 순, 작성자 이름 포함) |
| POST | `/api/v1/posts/:id/comments` | 필요 | 댓글 작성 |
| DELETE | `/api/v1/comments/:id` | 작성자 | 댓글 삭제 |
| POST | `/api/v1/uploads/image` | 필요 | multipart 필드명 `image`, 이미지(jpeg/png/gif/webp) 5MB 이하 → `{ url }` |

**테스트**(Vitest + supertest, 테스트 전용 SQLite 파일 사용, 실제 dev.db를 건드리지 않음):
- 회원가입·로그인 성공/실패, 인증 없는 글 작성 401, 글 CRUD와 작성자 권한(403), 댓글 작성·조회.
- 최소 12개 이상의 테스트가 통과해야 한다.

## 6. 실습용 설계 (중요)

### 6-1. 만들지 말 것 — 이후 강의 실습 과제

| 기능 | 실습 강의 |
|---|---|
| 좋아요(Like) 기능 | 05 계획 모드 vs 실행 모드 |
| 검색(Search) 기능 | 18 에이전트 팀 |
| `apps/mcp-server` (커스텀 MCP) | 17 커스텀 MCP |
| 이미지 클릭 시 확대 보기(Lightbox) | 08 Memory 실습 소재 |
| CLAUDE.md, .claude/, .mcp.json, agent_docs/, git hook | 04·10·11·13·21 강의 |

### 6-2. 의도적 결함 — 반드시 심고, 고치지 말 것

**BUG-1 : 게시 후 이미지가 깨지는 버그** (13 MCP 실습에서 GitHub 이슈로 등록하고 Playwright로 재현·수정)

- `POST /api/v1/uploads/image`는 업로드 결과 URL을 **앞에 `/`가 없는 상대 경로** `uploads/<파일명>` 형태로 반환한다.
- 글쓰기 화면의 미리보기는 서버 URL이 아니라 `URL.createObjectURL(file)`로 보여 준다 → **미리보기는 정상**.
- 글 상세 페이지(`/posts/:id`)는 `<img src={post.imageUrl}>`로 그대로 출력한다 → 브라우저가 `/posts/uploads/...`로 해석해 **이미지가 표시되지 않음**.
- 코드에 이 버그를 암시하는 주석(TODO, BUG 등)을 남기지 않는다. 테스트도 이 동작을 검사하지 않는다.

### 6-3. 실습을 돕는 장치

- 프런트엔드의 버튼·입력창에는 명확한 접근성 이름(label, aria-label)을 붙인다(Playwright 접근성 트리 실습용).
- 로그인하지 않은 사용자가 글쓰기·댓글을 시도하면 `/login`으로 보낸다.
- `pnpm lint`가 통과하는 상태로 끝낸다(Hook 실습에서 일부러 규칙 위반 코드를 넣어 볼 예정).

## 7. 대용량 로그 생성기 (09 대량 데이터 처리 실습용)

`scripts/generate-logs.mjs` — 실행하면 `logs/app.log`를 만든다(`logs/`는 gitignore).

- 기본 200,000줄(인자로 줄 수 지정 가능), 형식: `2026-03-14T09:12:33.123Z LEVEL [모듈] 메시지 key=value...`
- LEVEL 비율: INFO 약 85%, WARN 약 10%, ERROR 약 5%. 모듈: auth, posts, comments, uploads, db
- **분석할 거리를 심는다**: 특정 1시간 구간에 `uploads` 모듈 ERROR가 급증(`ENOENT`, `File too large` 등), 같은 사용자 id의 로그인 실패 반복.
- 난수 시드를 고정해 누가 실행해도 같은 파일이 나온다.

## 8. 루트 스크립트 (package.json)

| 명령 | 동작 |
|---|---|
| `pnpm dev` | backend(3000) + frontend(5173) 동시 실행 |
| `pnpm build` | 전체 빌드(타입 검사 포함) |
| `pnpm test` | 전체 테스트 |
| `pnpm lint` / `pnpm format` | ESLint 검사 / Prettier 정리 |
| `pnpm typecheck` | 전체 `tsc --noEmit` |
| `pnpm db:setup` | Prisma 마이그레이션 + 시드 (최초 1회, 재실행 가능) |
| `pnpm db:reset` | DB 초기화 후 시드 재투입 |
| `pnpm logs:generate` | `scripts/generate-logs.mjs` 실행 |

- 프런트엔드 Vite 개발 서버는 `/api`, `/uploads`를 `http://localhost:3000`으로 프록시한다.
- 환경변수 파일은 `apps/backend/.env` 하나만 쓴다(예시는 `apps/backend/.env.example`). 루트에는 `.env` 파일을 두지 않는다.
- **`.env`가 없어도 `pnpm db:setup`·`pnpm dev`·`pnpm test`가 모두 동작해야 한다(Prisma CLI 포함).** 기본값(`DATABASE_URL="file:./dev.db"` 등)을 코드·`db.mjs`에서 채우고 경고 한 줄만 출력한다.

## 9. README.md

한국어로, 다음만 간결하게: 프로젝트 소개 3줄, 사전 준비(Node 20+, `corepack enable`), 설치·실행 순서(`pnpm install` → `pnpm db:setup` → `pnpm dev`), 테스트 계정, 주요 명령 표. **실습 과제·의도적 결함은 README에 쓰지 않는다.**

## 10. 마무리

1. `git init` 후 `.gitignore`(node_modules, dist, .env, *.db, *.db-journal, uploads/*(단 .gitkeep 제외), logs/, coverage) 확인
2. 아래 DoD를 모두 실행해 결과를 표로 보고한다.
3. 기본 브랜치 `main`에 커밋 `chore: BLOGAPP 실습 베이스라인`, 태그 `v0-baseline`을 만든다.

## 11. 완료 기준 (DoD) — 전부 통과해야 완료

| # | 확인 항목 | 방법 |
|---|---|---|
| 1 | 의존성 설치 | `pnpm install` 오류 없음 |
| 2 | DB 준비 | `pnpm db:setup` 후 시드 사용자 2명, 글 12개 |
| 3 | 품질 검사 | `pnpm lint`, `pnpm typecheck`, `pnpm build` 모두 통과 |
| 4 | 테스트 | `pnpm test` 12개 이상 통과 |
| 5 | API | 서버 실행 후 `GET /api/v1/health` 200, alice 로그인으로 토큰 발급 |
| 6 | 화면 | `http://localhost:5173`에서 글 목록 → 상세 → 로그인 → 글쓰기 → 댓글 흐름 동작 |
| 7 | BUG-1 재현 | 이미지 첨부 글쓰기: 미리보기는 보이고, 게시 후 상세 페이지 이미지는 깨짐 |
| 8 | 로그 생성 | `pnpm logs:generate` 후 `logs/app.log` 200,000줄 |
| 9 | 미구현 확인 | 좋아요·검색·mcp-server·Lightbox·CLAUDE.md가 없음 |
| 10 | git | `main` 브랜치, 커밋 1개 이상, 태그 `v0-baseline` |

DoD 보고 후, 개발 서버 등 실행 중인 프로세스는 모두 종료한다. Windows에서는 `pnpm dev`를 멈춰도 하위 node 프로세스가 남을 수 있으므로, 포트 3000·5173을 점유한 프로세스가 없는지까지 확인한다(PowerShell: `Get-NetTCPConnection -LocalPort 3000,5173`).
