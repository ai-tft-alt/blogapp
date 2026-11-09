export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  status: PostStatus;
  authorId: number;
  authorName: string;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LikeStatus {
  likeCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedPosts {
  items: Post[];
  pagination: Pagination;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface UploadResult {
  url: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiFailure {
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PostInput {
  title: string;
  content: string;
  imageUrl?: string | null;
  status?: PostStatus;
}

export interface CommentInput {
  content: string;
}
