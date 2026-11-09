---
name: commit-pr
description: 변경 사항을 커밋·푸시하고 GitHub Pull Request를 만드는 전체 절차(브랜치 확인 → 테스트·빌드 검증 → 커밋 → 푸시 → PR 설명 작성 → Issue 연결). 사용자가 "커밋해줘", "푸시해줘", "커밋하고 올려줘", "PR 만들어줘", "PR 올려줘", "리뷰 요청 올려줘", "작업 마무리해서 올려줘", commit/push/pull request 등을 말하면 반드시 이 스킬을 사용할 것. 커밋만 요청받아도 테스트·빌드 검증과 브랜치 확인 단계는 그대로 적용한다.
---

# Commit & PR 워크플로

이 스킬의 목적은 **깨진 코드가 main에 직접 들어가거나, 검증 안 된 커밋이 원격에 올라가는 일을 막는 것**이다. 그래서 순서가 중요하다: 브랜치 확인 → 검증 → 커밋 → 푸시 → PR. 앞 단계가 실패하면 뒤 단계로 넘어가지 않는다.

사용자가 요청한 범위까지만 진행한다.
- "커밋해줘" → 1~4단계
- "푸시해줘" / "커밋하고 올려줘" → 1~5단계
- "PR 만들어줘" → 1~6단계 (이미 커밋·푸시된 상태면 해당 단계는 확인만 하고 넘어감)

## 1. 현재 상태 파악

```bash
git status --short
git branch --show-current
git log --oneline -5
git fetch origin
```

- 기본 브랜치 이름은 `main`이라고 가정하지 말고 확인한다: `git symbolic-ref refs/remotes/origin/HEAD` (실패하면 `main` → `master` 순으로 존재 여부 확인).
- 커밋할 변경도 없고 푸시 안 된 커밋도 없으면, 그 사실을 알리고 멈춘다.
- detached HEAD 상태면 진행하지 말고 사용자에게 상황을 설명한다.

## 2. 브랜치 결정

### 기본 브랜치(main)에 있는 경우
main에 직접 커밋하지 않는다. 묻지 말고 바로 feature 브랜치를 만든다 — 사용자가 이미 이 규칙을 정해두었기 때문이다.

```bash
git switch -c <type>/<짧은-설명>
```
- 이름은 변경 내용에서 정한다: `feat/post-likes`, `fix/comment-pagination`, `docs/readme-setup`, `refactor/...`, `test/...`, `chore/...`
- 영문 소문자 + 하이픈. 만든 브랜치 이름을 사용자에게 알린다.
- 작업 트리의 미커밋 변경은 새 브랜치로 그대로 따라온다.

### 이미 feature 브랜치에 있는 경우
AskUserQuestion으로 물어본다. 질문에 현재 브랜치 이름과 그 브랜치에 이미 있는 커밋 수(`git log --oneline origin/main..HEAD`)를 넣어서, 사용자가 대화창을 보지 않고도 판단할 수 있게 한다.

- **현재 브랜치에서 계속** — 같은 작업의 연장일 때
- **main에서 새 브랜치 생성** — 성격이 다른 작업일 때

새 브랜치를 고르면:
```bash
git stash push -u -m "commit-pr: carry changes"
git switch -c <새-브랜치> origin/main
git stash pop
```
- 기존 브랜치의 **커밋**은 새 브랜치로 옮겨지지 않는다(미커밋 변경만 옮겨짐). 이 점을 사용자에게 알린다.
- `stash pop`에서 충돌이 나면 멈추고 충돌 파일을 보고한다. 임의로 해결하지 않는다.

## 3. 테스트·빌드 검증 (커밋 전 필수)

커밋 전에 반드시 테스트와 빌드를 돌린다. 실패한 코드를 커밋하면 리뷰어와 CI가 그 비용을 떠안기 때문이다.

명령은 프로젝트에서 찾는다: `CLAUDE.md` → 루트 `package.json`의 scripts → `Makefile` 등. 이 저장소(pnpm 모노레포)라면:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- 각 명령의 성공/실패와 핵심 수치(통과 테스트 수 등)를 기록해 둔다 — PR 설명에 들어간다.
- **하나라도 실패하면 커밋하지 않는다.** 실패한 명령과 에러 요약을 보여주고, 고칠지 사용자에게 묻는다. 고친 뒤에는 검증을 처음부터 다시 돌린다.
- 사용자가 명시적으로 "테스트 건너뛰고 커밋해"라고 해도, 건너뛴다는 사실을 PR 설명의 테스트 항목에 그대로 적는다.
- 테스트가 없는 패키지는 "테스트 없음"으로 기록하면 된다 — 실패가 아니다.

## 4. 커밋

1. `git diff`와 `git status`로 무엇이 들어가는지 확인한다.
2. 파일을 **이름으로** 스테이징한다(`git add -A` / `git add .` 지양). 다음은 넣지 않는다: `.env`, 비밀키·토큰, `*.db`, `logs/`, 업로드 파일, 빌드 산출물, 작업과 무관한 파일. 애매한 파일(예: 이번 작업과 상관없어 보이는 새 파일)은 사용자에게 포함 여부를 묻는다.
3. 변경이 성격이 다른 여러 덩어리라면 커밋을 나누는 것을 제안한다.
4. 메시지는 Conventional Commits 형식, 이 저장소 기존 커밋과 같은 언어(한국어)로:

```
feat: 게시글 좋아요 기능 추가

- Like 모델 및 마이그레이션 추가
- POST/DELETE /api/v1/posts/:id/like 엔드포인트
- PostCard·상세 페이지에 LikeButton 표시

Co-Authored-By: ...   ← 시스템이 지정한 attribution 줄이 있으면 그대로 붙인다
```

- 여러 줄 메시지는 heredoc으로 전달한다.
- `--no-verify`, `--amend`(사용자 요청 없이), 서명 우회는 쓰지 않는다. pre-commit 훅이 실패하면 원인을 고치고 **새** 커밋을 만든다.

## 5. 푸시

```bash
git push -u origin <현재-브랜치>
```
- 기본 브랜치로는 절대 푸시하지 않는다. force push도 사용자가 명시적으로 요청하지 않으면 하지 않는다.
- 푸시가 거부되면(원격이 앞서 있음) `git pull --rebase`를 제안하고, 충돌 시 멈춰서 보고한다.

## 6. Pull Request 생성

### 6-1. 이미 PR이 있는지 확인
같은 브랜치의 열린 PR이 있으면 새로 만들지 않는다 — 푸시만으로 갱신되므로 기존 PR 링크를 알려주고 끝낸다(설명 갱신이 필요하면 제안).

### 6-2. 연결할 Issue 묻기
AskUserQuestion으로 "이 PR에 연결할 GitHub Issue가 있나요?"를 묻는다.
- 가능하면 먼저 열린 이슈를 조회해서(최근/관련 있어 보이는 것 최대 3개) 선택지로 보여주고, 마지막 선택지는 "연결할 이슈 없음". 다른 번호는 사용자가 "Other"로 입력할 수 있다.
- 조회가 안 되면 "이슈 번호 입력(Other)" / "없음"으로 묻는다.
- 이슈가 이 PR로 해결되면 `Closes #번호`, 관련만 있으면 `Related to #번호`. 어느 쪽인지 애매하면 함께 물어본다.

### 6-3. PR 설명 작성
저장소에 PR 템플릿(`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`)이 있으면 그 구조를 따른다. 없으면 아래 형식을 쓴다. 내용은 `git log origin/main..HEAD`와 `git diff origin/main...HEAD`에서 뽑는다 — 마지막 커밋만이 아니라 브랜치 전체 변경을 반영해야 한다.

```markdown
## 요약
<무엇을 왜 바꿨는지 1~3문장>

## 변경 사항
- <영역별 주요 변경 (backend / frontend / shared / DB 등)>

## 테스트
- [x] pnpm lint — 통과
- [x] pnpm typecheck — 통과
- [x] pnpm test — 통과 (N개)
- [x] pnpm build — 통과
<수동 확인 방법이 있으면 추가>

## 참고 사항
<마이그레이션 필요, 환경변수 추가, 리뷰어가 볼 포인트 등 — 없으면 생략>

## 관련 이슈
Closes #번호   ← 없으면 섹션 생략

<시스템이 지정한 PR attribution 줄이 있으면 마지막에>
```

PR 제목은 대표 커밋 메시지 첫 줄과 같은 형식(`feat: ...`), 70자 이내.

### 6-4. PR 만들기
- `gh` CLI가 있으면: `gh pr create --base <기본브랜치> --head <브랜치> --title "..." --body-file <임시파일>`
- 없으면 GitHub MCP의 `create_pull_request` 도구를 사용한다(owner/repo는 `git remote get-url origin`에서 추출).
- 둘 다 안 되면 PR 본문을 출력하고, 브라우저에서 열 URL(`https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`)을 안내한다.

## 7. 마무리 보고

짧게 정리한다:
- 브랜치 이름 (새로 만들었는지 여부)
- 검증 결과 (명령별 통과/실패)
- 커밋 해시와 메시지 첫 줄
- 푸시 여부
- PR 링크와 연결된 이슈
