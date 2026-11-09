import bcrypt from 'bcryptjs';
import type { AuthResult, LoginInput, RegisterInput, User } from '@blogapp/shared';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { HttpError, unauthorized } from '../lib/http-error.js';
import { toUser } from './mappers.js';

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', '이미 가입된 이메일입니다.');
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });
  return { token: signToken(user.id), user: toUser(user) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  return { token: signToken(user.id), user: toUser(user) };
}

export async function getMe(userId: number): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized('사용자를 찾을 수 없습니다.');
  return toUser(user);
}
