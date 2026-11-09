import { z } from 'zod';

export const idParam = z.coerce.number().int().positive();

export const registerSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  name: z.string().trim().min(1, '이름을 입력하세요.').max(50),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

const statusSchema = z.enum(['DRAFT', 'PUBLISHED']);

export const createPostSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요.').max(200),
  content: z.string().trim().min(1, '본문을 입력하세요.'),
  imageUrl: z.string().max(500).nullable().optional(),
  status: statusSchema.optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, '댓글 내용을 입력하세요.').max(1000),
});
