import type { PaginatedPosts, Post, PostInput } from '@blogapp/shared';
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/http-error.js';
import { postInclude, toPost } from './mappers.js';

export async function listPublished(
  page: number,
  limit: number,
  viewerId?: number,
): Promise<PaginatedPosts> {
  const where = { status: 'PUBLISHED' };
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude(viewerId),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
  return {
    items: rows.map(toPost),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function listMine(userId: number): Promise<Post[]> {
  const rows = await prisma.post.findMany({
    where: { authorId: userId },
    include: postInclude(userId),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map(toPost);
}

export async function getPost(id: number, viewerId?: number): Promise<Post> {
  const row = await prisma.post.findUnique({ where: { id }, include: postInclude(viewerId) });
  if (!row) throw notFound('게시물을 찾을 수 없습니다.');
  if (row.status !== 'PUBLISHED' && row.authorId !== viewerId) {
    throw notFound('게시물을 찾을 수 없습니다.');
  }
  return toPost(row);
}

export async function createPost(userId: number, input: PostInput): Promise<Post> {
  const row = await prisma.post.create({
    data: {
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl ?? null,
      status: input.status ?? 'DRAFT',
      authorId: userId,
    },
    include: postInclude(userId),
  });
  return toPost(row);
}

async function assertOwner(id: number, userId: number) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw notFound('게시물을 찾을 수 없습니다.');
  if (post.authorId !== userId) throw forbidden('작성자만 수정·삭제할 수 있습니다.');
}

export async function updatePost(
  id: number,
  userId: number,
  input: Partial<PostInput>,
): Promise<Post> {
  await assertOwner(id, userId);
  const row = await prisma.post.update({
    where: { id },
    data: {
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl,
      status: input.status,
    },
    include: postInclude(userId),
  });
  return toPost(row);
}

export async function deletePost(id: number, userId: number): Promise<void> {
  await assertOwner(id, userId);
  await prisma.post.delete({ where: { id } });
}
