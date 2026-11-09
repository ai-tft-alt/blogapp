import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BASE_TIME = Date.UTC(2026, 0, 5, 9, 0, 0);
const HOUR = 60 * 60 * 1000;
const at = (hoursFromBase: number) => new Date(BASE_TIME + hoursFromBase * HOUR);

const users = [
  { id: 1, email: 'alice@blogapp.com', name: 'Alice' },
  { id: 2, email: 'bob@blogapp.com', name: 'Bob' },
];

const posts: { authorId: number; status: 'DRAFT' | 'PUBLISHED'; title: string; content: string }[] =
  [
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: 'pnpm 모노레포로 프로젝트 시작하기',
      content:
        '프런트엔드와 백엔드를 한 저장소에서 관리하면 타입을 공유하기 쉽습니다. pnpm workspace 설정부터 차근차근 정리해 봤어요.',
    },
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: '제주도 3박 4일 여행 기록',
      content:
        '첫날은 동쪽 해안도로를 따라 달렸고, 둘째 날은 한라산 영실 코스를 올랐습니다. 날씨가 맑아서 백록담까지 선명하게 보였어요.',
    },
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: '10분 완성 김치볶음밥 레시피',
      content:
        '잘 익은 김치와 찬밥만 있으면 됩니다. 버터 한 조각과 달걀 프라이를 올리면 맛이 훨씬 풍부해져요.',
    },
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: 'TypeScript strict 모드를 켜야 하는 이유',
      content:
        'strict 모드는 처음엔 귀찮지만 null 관련 버그를 컴파일 단계에서 잡아 줍니다. 실제로 겪었던 사례를 소개합니다.',
    },
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: '교토 단풍 여행 준비물 체크리스트',
      content:
        '11월 교토는 아침저녁으로 쌀쌀합니다. 얇은 겉옷, 편한 운동화, 교통카드는 꼭 챙기세요.',
    },
    {
      authorId: 1,
      status: 'DRAFT',
      title: '집에서 만드는 수제 그래놀라 (작성 중)',
      content: '오트밀, 견과류, 꿀을 섞어 오븐에 굽는 방법을 정리하는 중입니다.',
    },
    {
      authorId: 1,
      status: 'PUBLISHED',
      title: 'React 19에서 달라진 점 정리',
      content:
        'Actions, useOptimistic, ref를 prop으로 넘기는 방식 등 React 19의 주요 변경 사항을 예제와 함께 살펴봅니다.',
    },
    {
      authorId: 2,
      status: 'PUBLISHED',
      title: 'Express에서 에러 처리 미들웨어 설계하기',
      content:
        '비동기 핸들러의 에러를 한곳에서 처리하면 응답 형식을 일관되게 유지할 수 있습니다. 실무에서 쓰는 패턴을 공유합니다.',
    },
    {
      authorId: 2,
      status: 'PUBLISHED',
      title: '부산 돼지국밥 맛집 투어',
      content:
        '서면, 남포동, 해운대의 국밥집을 하루에 세 군데 다녀왔습니다. 집마다 육수 스타일이 달라서 비교하는 재미가 있었어요.',
    },
    {
      authorId: 2,
      status: 'PUBLISHED',
      title: '주말 캠핑 요리: 무쇠 팬 스테이크',
      content:
        '캠핑장에서 무쇠 팬을 충분히 달군 뒤 스테이크를 구우면 겉은 바삭하고 속은 촉촉하게 익힐 수 있습니다.',
    },
    {
      authorId: 2,
      status: 'PUBLISHED',
      title: 'Prisma로 SQLite 시작하기',
      content:
        '별도 DB 서버 없이 파일 하나로 개발 환경을 꾸릴 수 있습니다. 스키마 작성부터 마이그레이션까지 따라 해 보세요.',
    },
    {
      authorId: 2,
      status: 'DRAFT',
      title: '강릉 바다 여행 사진 정리 (초안)',
      content: '안목해변 카페거리와 경포호 산책길 사진을 고르는 중입니다.',
    },
  ];

const commentTexts = [
  '좋은 글 감사합니다!',
  '저도 비슷한 경험이 있어요.',
  '다음 편도 기대할게요.',
  '정리가 깔끔해서 이해가 잘 됩니다.',
  '사진도 같이 올려 주시면 좋겠어요.',
  '덕분에 많이 배웠습니다.',
  '이 방법 바로 따라 해 볼게요.',
  '궁금했던 내용이었는데 도움이 됐어요.',
];

// [postId, authorId] — DRAFT(6, 12)에는 댓글을 달지 않는다.
const commentPlan: [number, number][] = [
  [1, 2],
  [1, 1],
  [1, 2],
  [2, 2],
  [2, 1],
  [3, 2],
  [3, 2],
  [3, 1],
  [4, 2],
  [4, 1],
  [5, 2],
  [7, 2],
  [7, 1],
  [7, 2],
  [8, 1],
  [8, 2],
  [8, 1],
  [9, 1],
  [9, 1],
  [10, 1],
  [10, 2],
  [11, 1],
  [11, 2],
  [11, 1],
];

// [postId, userId] — PUBLISHED 글에만 좋아요를 단다.
const likePlan: [number, number][] = [
  [1, 2],
  [2, 2],
  [3, 1],
  [3, 2],
  [7, 2],
  [8, 1],
  [8, 2],
  [11, 1],
];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.$transaction([
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  for (const user of users) {
    await prisma.user.create({ data: { ...user, passwordHash, createdAt: at(0) } });
  }

  for (const [index, post] of posts.entries()) {
    const createdAt = at(24 * (index + 1));
    await prisma.post.create({
      data: { id: index + 1, ...post, imageUrl: null, createdAt, updatedAt: createdAt },
    });
  }

  for (const [index, [postId, authorId]] of commentPlan.entries()) {
    await prisma.comment.create({
      data: {
        id: index + 1,
        postId,
        authorId,
        content: commentTexts[index % commentTexts.length],
        createdAt: at(24 * postId + index + 1),
      },
    });
  }

  for (const [index, [postId, userId]] of likePlan.entries()) {
    await prisma.like.create({
      data: { postId, userId, createdAt: at(24 * postId + 12 + index) },
    });
  }

  console.log(
    `[seed] 사용자 ${users.length}명, 게시물 ${posts.length}개, 댓글 ${commentPlan.length}개, 좋아요 ${likePlan.length}개 투입 완료`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
