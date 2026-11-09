import type { Comment, Post, PostStatus, User } from '@blogapp/shared';

interface UserRow {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

interface PostRow {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  status: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string };
  _count: { comments: number };
}

interface CommentRow {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  createdAt: Date;
  author: { name: string };
}

export function toUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt.toISOString() };
}

export function toPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    imageUrl: row.imageUrl,
    status: row.status as PostStatus,
    authorId: row.authorId,
    authorName: row.author.name,
    commentCount: row._count.comments,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    content: row.content,
    postId: row.postId,
    authorId: row.authorId,
    authorName: row.author.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export const postInclude = {
  author: { select: { name: true } },
  _count: { select: { comments: true } },
} as const;
