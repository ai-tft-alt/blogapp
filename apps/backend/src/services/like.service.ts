import type { LikeStatus } from '@blogapp/shared';
import { prisma } from '../lib/prisma.js';
import { getPost } from './post.service.js';

async function likeStatus(postId: number, userId: number): Promise<LikeStatus> {
  const [likeCount, mine] = await Promise.all([
    prisma.like.count({ where: { postId } }),
    prisma.like.findUnique({ where: { userId_postId: { userId, postId } } }),
  ]);
  return { likeCount, likedByMe: mine !== null };
}

export async function likePost(postId: number, userId: number): Promise<LikeStatus> {
  await getPost(postId, userId);
  await prisma.like.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });
  return likeStatus(postId, userId);
}

export async function unlikePost(postId: number, userId: number): Promise<LikeStatus> {
  await getPost(postId, userId);
  await prisma.like.deleteMany({ where: { postId, userId } });
  return likeStatus(postId, userId);
}
