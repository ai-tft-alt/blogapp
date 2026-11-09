# 좋아요(Like) 기능 구현 계획

## Context

블로그 글에 좋아요 기능을 추가한다.

- 로그인한 사용자만 좋아요를 누르거나 취소할 수 있다.
- 비로그인 사용자도 좋아요 수는 볼 수 있다.
- 비로그인 사용자가 좋아요 버튼을 누르면 `/login`으로 이동하고, 로그인하면 원래 글로 돌아온다.

현재 코드에는 좋아요 관련 코드가 전혀 없다. 기존 패턴(댓글 기능, 응답 형식 `{ data }`, `HttpError`, zod, `optionalAuth`/`requireAuth`)을 그대로 따른다.

## 설계 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 데이터 | `Like` 테이블, 복합 PK `(userId, postId)` | 한 사용자가 한 글에 좋아요 1개만 하도록 DB가 보장한다 |
| API | `PUT /posts/:id/like`(좋아요), `DELETE /posts/:id/like`(취소) | 같은 요청을 다시 보내도 결과가 같다(멱등). 토글 방식(POST)은 더블클릭할 때 상태가 꼬인다 |
| 응답 | `{ data: { likeCount, likedByMe } }` | 프런트가 응답만 보고 화면을 갱신할 수 있다 |
| `Post` DTO | `likeCount: number`, `likedByMe: boolean` 추가 | 목록 카드에는 좋아요 수, 상세 화면에는 버튼 상태를 표시하는 데 쓴다 |
| 접근 규칙 | 좋아요 전에 `getPost(id, userId)`로 확인 | 댓글과 같은 방식이다. 남의 DRAFT나 없는 글은 404 |
| 자기 글 좋아요 | 허용 | 요구사항에 제한이 없다 |
| 버튼 위치 | 상세 페이지에만 버튼을 둔다. 목록 카드에는 "좋아요 N"만 표시한다 | 범위를 작게 유지한다 |

## 변경 사항

### 1. DB — `apps/backend/prisma/`
- `schema.prisma`: `Like` 모델을 추가한다. `userId`, `postId`, `createdAt`, `@@id([userId, postId])`, `post` 관계는 `onDelete: Cascade`, `user` 관계도 `onDelete: Cascade`. `User.likes Like[]`, `Post.likes Like[]` 역관계를 추가한다.
- 새 마이그레이션 `migrations/20261109000000_add_likes/migration.sql`: 기존 init 마이그레이션 형식에 맞춰 `CREATE TABLE "Like"` SQL을 직접 작성한다(복합 PK, FK 2개). **`prisma migrate reset`과 `migrate dev`는 쓰지 않는다**(CLAUDE.md 제약). 적용은 `pnpm db:reset`으로 한다.
- `seed.ts`: 맨 앞의 `deleteMany` 트랜잭션에 `prisma.like.deleteMany()`를 추가하고, PUBLISHED 글 몇 개에 결정적인 좋아요 데이터(`likePlan: [postId, userId][]`)를 넣는다. 로그 문구에 좋아요 개수를 추가한다.

### 2. 공용 타입 — `packages/shared/src/index.ts`
- `Post`에 `likeCount: number; likedByMe: boolean;`를 추가한다.
- `LikeStatus { likeCount: number; likedByMe: boolean }`를 추가한다.

### 3. Backend
- `services/mappers.ts`: `postInclude`를 함수 `postInclude(viewerId?: number)`로 바꾼다.
  - `_count: { select: { comments: true, likes: true } }`
  - `likes: { where: { userId: viewerId ?? -1 }, select: { userId: true } }` — 보는 사람의 좋아요 여부를 쿼리 한 번으로 함께 가져온다.
  - `PostRow`와 `toPost`에 `likeCount = _count.likes`, `likedByMe = likes.length > 0`을 반영한다.
- `services/post.service.ts`: `listPublished(page, limit, viewerId?)`, `listMine`, `getPost`, `createPost`, `updatePost`에서 `postInclude(viewerId)`를 사용한다.
- 새 파일 `services/like.service.ts`:
  - `likePost(postId, userId)`: `getPost(postId, userId)`로 접근을 확인한 뒤 `prisma.like.upsert`를 실행하고 `LikeStatus`를 반환한다.
  - `unlikePost(postId, userId)`: `getPost`로 확인한 뒤 `prisma.like.deleteMany({ where: { postId, userId } })`를 실행하고(없어도 오류 없음) `LikeStatus`를 반환한다.
  - 내부 헬퍼 `likeStatus(postId, userId)`: `count`와 본인 좋아요 존재 여부를 조회한다.
- `routes/posts.ts`:
  - `GET /`에 `optionalAuth`를 추가하고 `viewerId(res)`를 전달한다.
  - `PUT /:id/like`, `DELETE /:id/like`를 추가한다. 둘 다 `requireAuth` → `idParam.parse` → like.service를 호출하고 `res.json({ data })`로 응답한다.
  - 기존 `asyncHandler`, `currentUserId`, `idParam`을 그대로 쓴다.

### 4. Frontend
- `api/client.ts`: `likePost(id)`(PUT), `unlikePost(id)`(DELETE)를 추가한다. 반환 타입은 `LikeStatus`.
- 새 파일 `components/LikeButton.tsx`:
  - props: `postId`, `likeCount`, `likedByMe`, `onChange(status)`.
  - 비로그인 상태에서 누르면 `navigate('/login', { state: { from: location.pathname } })`로 보낸다. `CommentForm.tsx`와 같은 패턴이고, `LoginPage`가 `state.from`으로 원래 글로 돌려보낸다.
  - 로그인 상태에서는 `likedByMe`에 따라 `unlikePost` 또는 `likePost`를 호출하고, 응답으로 상태를 갱신한다. 요청 중에는 `disabled` 처리한다.
  - 접근성: `aria-pressed={likedByMe}`, `aria-label`은 "좋아요" 또는 "좋아요 취소". 표시 문구는 `♥ N` 또는 `♡ N`.
  - 비로그인 사용자에게도 버튼과 숫자를 그대로 보여 준다(누르면 로그인 페이지로 이동).
- `pages/PostDetailPage.tsx`: 본문 아래(작성자 액션 위)에 `<LikeButton>`을 놓는다. `onChange`에서 `setPost({ ...post, ...status })`로 갱신한다.
- `components/PostCard.tsx`: `.meta`에 `<span>좋아요 {post.likeCount}</span>`를 추가한다.
- `styles.css`: `.like-button`, `.like-button[aria-pressed='true']` 스타일을 조금 추가한다.

### 5. 테스트 — 새 파일 `apps/backend/tests/likes.test.ts`
기존 `helpers.ts`의 `api()`, `registerUser()`를 사용한다.
1. 비로그인 `GET /posts/1` → `likeCount`가 숫자이고 `likedByMe === false`.
2. 비로그인 `PUT /posts/1/like` → 401 `UNAUTHORIZED`.
3. 로그인 사용자가 `PUT` → `likeCount`가 1 증가하고 `likedByMe: true`. 같은 요청을 다시 보내도 수가 그대로다(멱등).
4. 로그인 상태로 `GET /posts/1` → `likedByMe: true`. 목록 `GET /posts`의 해당 글에도 반영된다.
5. `DELETE` → `likeCount`가 원래대로 돌아가고 `likedByMe: false`. 다시 보내도 오류가 나지 않는다.
6. 남의 DRAFT(`/posts/6/like`)나 없는 글 → 404.

기존 `posts.test.ts` 목록 테스트에 `likeCount`가 숫자인지 확인하는 줄을 추가한다.

## 수정할 파일 요약
- `apps/backend/prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20261109000000_add_likes/migration.sql`(새 파일)
- `packages/shared/src/index.ts`
- `apps/backend/src/services/{mappers,post.service,like.service(새 파일)}.ts`, `src/routes/posts.ts`
- `apps/frontend/src/{api/client.ts, components/LikeButton.tsx(새 파일), components/PostCard.tsx, pages/PostDetailPage.tsx, styles.css}`
- `apps/backend/tests/likes.test.ts`(새 파일), `tests/posts.test.ts`

## 검증
1. `pnpm db:reset`: 새 마이그레이션이 적용되고 시드 로그에 좋아요 개수가 나온다.
2. `pnpm lint`, `pnpm typecheck`, `pnpm build`가 모두 통과한다.
3. `pnpm test`: 기존 테스트와 `likes.test.ts`가 모두 통과한다. 좋아요 테스트만 돌릴 때는 `pnpm --filter @blogapp/backend test tests/likes.test.ts`.
4. 수동 확인(`pnpm dev`, Playwright MCP로도 가능):
   - 비로그인으로 홈 화면을 열면 카드에 "좋아요 N"이 보인다. 상세 화면에서 버튼을 누르면 `/login`으로 이동하고, alice로 로그인하면 원래 글로 돌아온다.
   - 버튼을 누르면 숫자가 1 오르고 상태가 ♥로 바뀐다. 새로고침해도 유지되고, 다시 누르면 취소된다.
5. 끝나면 포트 3000과 5173에 남은 프로세스가 없는지 확인한다(`Get-NetTCPConnection -LocalPort 3000,5173`).
