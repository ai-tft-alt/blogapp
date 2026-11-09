import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers.js';

describe('auth', () => {
  it('GET /health 는 ok를 반환한다', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('회원가입에 성공하면 토큰과 사용자를 반환한다', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'new-user@test.com', name: '새 사용자', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: 'new-user@test.com', name: '새 사용자' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('중복 이메일 회원가입은 409', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'alice@blogapp.com', name: 'Alice2', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('8자 미만 비밀번호는 400', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'short@test.com', name: 'Short', password: '1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('시드 계정으로 로그인에 성공한다', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@blogapp.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.name).toBe('Alice');
  });

  it('잘못된 비밀번호 로그인은 401', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@blogapp.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /auth/me 는 토큰이 있으면 내 정보를, 없으면 401을 반환한다', async () => {
    const { token, email } = await registerUser('Me');
    const ok = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.email).toBe(email);

    const fail = await api().get('/api/v1/auth/me');
    expect(fail.status).toBe(401);
  });
});
