import type {
  ApiFailure,
  AuthResult,
  Comment,
  LikeStatus,
  LoginInput,
  PaginatedPosts,
  Post,
  PostInput,
  RegisterInput,
  UploadResult,
  User,
} from '@blogapp/shared';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'blogapp.token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiFailure | null)?.error;
    throw new ApiError(res.status, error?.code ?? 'UNKNOWN', error?.message ?? res.statusText);
  }
  return (body as { data: T }).data;
}

export const api = {
  register: (input: RegisterInput) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: LoginInput) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<User>('/auth/me'),

  listPosts: (page = 1, limit = 10) =>
    request<PaginatedPosts>(`/posts?page=${page}&limit=${limit}`),
  myPosts: () => request<Post[]>('/posts/mine'),
  getPost: (id: number) => request<Post>(`/posts/${id}`),
  createPost: (input: PostInput) =>
    request<Post>('/posts', { method: 'POST', body: JSON.stringify(input) }),
  updatePost: (id: number, input: Partial<PostInput>) =>
    request<Post>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deletePost: (id: number) => request<void>(`/posts/${id}`, { method: 'DELETE' }),
  likePost: (id: number) => request<LikeStatus>(`/posts/${id}/like`, { method: 'PUT' }),
  unlikePost: (id: number) => request<LikeStatus>(`/posts/${id}/like`, { method: 'DELETE' }),

  listComments: (postId: number) => request<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId: number, content: string) =>
    request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteComment: (id: number) => request<void>(`/comments/${id}`, { method: 'DELETE' }),

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<UploadResult>('/uploads/image', { method: 'POST', body: form });
  },
};
