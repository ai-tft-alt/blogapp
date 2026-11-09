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
  _count: { comments: number; likes: number };
  likes: { userId: number }[];
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
    likeCount: row._count.likes,
    likedByMe: row.likes.length > 0,
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

// viewerId가 없으면 존재하지 않는 id(-1)로 걸러 likes가 항상 빈 배열이 된다.
export function postInclude(viewerId?: number) {
  return {
    author: { select: { name: true } },
    _count: { select: { comments: true, likes: true } },
    likes: { where: { userId: viewerId ?? -1 }, select: { userId: true } },
  } as const;
}
