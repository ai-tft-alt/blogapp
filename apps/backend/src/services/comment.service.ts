import type { Comment } from '@blogapp/shared';
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/http-error.js';
import { getPost } from './post.service.js';
import { toComment } from './mappers.js';

const commentInclude = { author: { select: { name: true } } } as const;

export async function listComments(postId: number, viewerId?: number): Promise<Comment[]> {
  await getPost(postId, viewerId);
  const rows = await prisma.comment.findMany({
    where: { postId },
    include: commentInclude,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(toComment);
}

export async function createComment(
  postId: number,
  userId: number,
  content: string,
): Promise<Comment> {
  await getPost(postId, userId);
  const row = await prisma.comment.create({
    data: { postId, authorId: userId, content },
    include: commentInclude,
  });
  return toComment(row);
}

export async function deleteComment(id: number, userId: number): Promise<void> {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw notFound('댓글을 찾을 수 없습니다.');
  if (comment.authorId !== userId) throw forbidden('작성자만 삭제할 수 있습니다.');
  await prisma.comment.delete({ where: { id } });
}
