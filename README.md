# BLOGAPP

사용자가 글을 쓰고, 이미지를 올리고, 댓글을 다는 블로그 서비스입니다.
pnpm 모노레포로 backend(Express + Prisma/SQLite), frontend(React + Vite), shared(공용 타입)로 구성됩니다.
Docker나 별도 DB 설치 없이 바로 실행할 수 있습니다.

## 사전 준비

- Node.js 20.19 이상 (20 / 22 / 24 LTS)
- pnpm: `corepack enable` 실행 (package.json의 `packageManager` 버전이 자동으로 사용됩니다)

## 설치 및 실행

```bash
pnpm install
pnpm db:setup
pnpm dev
```

- 프런트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3000/api/v1
- 환경변수는 `apps/backend/.env` 하나만 사용합니다(`apps/backend/.env.example` 참고). 없으면 기본값으로 동작합니다.

## 테스트 계정

| 이름  | 이메일            | 비밀번호    |
| ----- | ----------------- | ----------- |
| Alice | alice@blogapp.com | password123 |
| Bob   | bob@blogapp.com   | password123 |

## 주요 명령

| 명령                 | 설명                                       |
| -------------------- | ------------------------------------------ |
| `pnpm dev`           | backend(3000) + frontend(5173) 동시 실행   |
| `pnpm build`         | 전체 빌드(타입 검사 포함)                  |
| `pnpm test`          | 전체 테스트                                |
| `pnpm lint`          | ESLint 검사                                |
| `pnpm format`        | Prettier 정리                              |
| `pnpm typecheck`     | 전체 타입 검사(`tsc --noEmit`)             |
| `pnpm db:setup`      | DB 마이그레이션 + 시드 (재실행 가능)       |
| `pnpm db:reset`      | DB 초기화 후 시드 재투입                   |
| `pnpm logs:generate` | `logs/app.log` 대용량 로그 생성(200,000줄) |
