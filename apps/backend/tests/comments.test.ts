import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers.js';

describe('comments', () => {
  it('댓글 목록은 오래된 순이며 작성자 이름을 포함한다', async () => {
    const res = await api().get('/api/v1/posts/1/comments');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const dates = res.body.data.map((c: { createdAt: string }) => c.createdAt);
    expect([...dates].sort()).toEqual(dates);
    expect(res.body.data[0].authorName).toEqual(expect.any(String));
  });

  it('로그인 사용자는 댓글을 작성하고 조회할 수 있다', async () => {
    const { token } = await registerUser('Commenter');
    const created = await api()
      .post('/api/v1/posts/2/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '좋은 글이네요' });
    expect(created.status).toBe(201);
    expect(created.body.data.authorName).toBe('Commenter');

    const list = await api().get('/api/v1/posts/2/comments');
    expect(list.body.data.at(-1).content).toBe('좋은 글이네요');
  });

  it('인증 없이 댓글을 작성하면 401', async () => {
    const res = await api().post('/api/v1/posts/2/comments').send({ content: '익명' });
    expect(res.status).toBe(401);
  });

  it('댓글 삭제는 작성자만 가능하다', async () => {
    const { token: owner } = await registerUser('Owner');
    const { token: other } = await registerUser('Stranger');
    const created = await api()
      .post('/api/v1/posts/3/comments')
      .set('Authorization', `Bearer ${owner}`)
      .send({ content: '지울 댓글' });
    const id = created.body.data.id;

    const denied = await api()
      .delete(`/api/v1/comments/${id}`)
      .set('Authorization', `Bearer ${other}`);
    expect(denied.status).toBe(403);

    const ok = await api().delete(`/api/v1/comments/${id}`).set('Authorization', `Bearer ${owner}`);
    expect(ok.status).toBe(204);
  });
});
