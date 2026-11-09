import { describe, expect, it } from 'vitest';
import { api, loginAlice, registerUser } from './helpers.js';

describe('posts', () => {
  it('목록은 PUBLISHED 글만 최신순으로, 페이지 정보와 함께 반환한다', async () => {
    const res = await api().get('/api/v1/posts?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(5);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5, total: 10 });
    for (const post of res.body.data.items) {
      expect(post.status).toBe('PUBLISHED');
      expect(post.authorName).toEqual(expect.any(String));
      expect(post.commentCount).toEqual(expect.any(Number));
      expect(post.likeCount).toEqual(expect.any(Number));
    }
    const dates = res.body.data.items.map((p: { createdAt: string }) => p.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('인증 없이 글을 작성하면 401', async () => {
    const res = await api().post('/api/v1/posts').send({ title: '제목', content: '본문' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('글 작성·조회·수정·삭제(CRUD)', async () => {
    const { token } = await registerUser('Writer');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await api()
      .post('/api/v1/posts')
      .set(auth)
      .send({ title: '첫 글', content: '안녕하세요', status: 'PUBLISHED' });
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    const read = await api().get(`/api/v1/posts/${id}`);
    expect(read.status).toBe(200);
    expect(read.body.data.title).toBe('첫 글');

    const updated = await api().put(`/api/v1/posts/${id}`).set(auth).send({ title: '수정된 글' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('수정된 글');

    const removed = await api().delete(`/api/v1/posts/${id}`).set(auth);
    expect(removed.status).toBe(204);

    const gone = await api().get(`/api/v1/posts/${id}`);
    expect(gone.status).toBe(404);
  });

  it('작성자가 아니면 수정·삭제는 403', async () => {
    const { token: otherToken } = await registerUser('Other');
    const auth = { Authorization: `Bearer ${otherToken}` };

    const updated = await api().put('/api/v1/posts/1').set(auth).send({ title: '남의 글 수정' });
    expect(updated.status).toBe(403);
    expect(updated.body.error.code).toBe('FORBIDDEN');

    const removed = await api().delete('/api/v1/posts/1').set(auth);
    expect(removed.status).toBe(403);

    const post = await api().get('/api/v1/posts/1');
    expect(post.body.data.title).not.toBe('남의 글 수정');
  });

  it('DRAFT는 작성자 본인만 조회할 수 있다', async () => {
    const { token } = await registerUser('Drafter');
    const created = await api()
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '초안', content: '비공개 초안' });
    expect(created.body.data.status).toBe('DRAFT');
    const id = created.body.data.id;

    const anonymous = await api().get(`/api/v1/posts/${id}`);
    expect(anonymous.status).toBe(404);

    const owner = await api().get(`/api/v1/posts/${id}`).set('Authorization', `Bearer ${token}`);
    expect(owner.status).toBe(200);
  });

  it('GET /posts/mine 은 DRAFT를 포함한 내 글을 반환한다', async () => {
    const aliceToken = await loginAlice();
    const res = await api().get('/api/v1/posts/mine').set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);
    expect(res.body.data.some((p: { status: string }) => p.status === 'DRAFT')).toBe(true);
  });
});
