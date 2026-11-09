import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers.js';

describe('likes', () => {
  it('비로그인 사용자도 좋아요 수를 볼 수 있다', async () => {
    const res = await api().get('/api/v1/posts/1');
    expect(res.status).toBe(200);
    expect(res.body.data.likeCount).toEqual(expect.any(Number));
    expect(res.body.data.likedByMe).toBe(false);
  });

  it('인증 없이 좋아요하면 401', async () => {
    const liked = await api().put('/api/v1/posts/1/like');
    expect(liked.status).toBe(401);
    expect(liked.body.error.code).toBe('UNAUTHORIZED');

    const unliked = await api().delete('/api/v1/posts/1/like');
    expect(unliked.status).toBe(401);
  });

  it('좋아요는 한 번만 반영되고, 상세·목록에 likedByMe로 표시된다', async () => {
    const { token } = await registerUser('Liker');
    const auth = { Authorization: `Bearer ${token}` };
    const before = (await api().get('/api/v1/posts/1')).body.data.likeCount as number;

    const first = await api().put('/api/v1/posts/1/like').set(auth);
    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({ likeCount: before + 1, likedByMe: true });

    const again = await api().put('/api/v1/posts/1/like').set(auth);
    expect(again.body.data).toEqual({ likeCount: before + 1, likedByMe: true });

    const detail = await api().get('/api/v1/posts/1').set(auth);
    expect(detail.body.data.likedByMe).toBe(true);

    const list = await api().get('/api/v1/posts?page=1&limit=50').set(auth);
    const inList = list.body.data.items.find((p: { id: number }) => p.id === 1);
    expect(inList).toMatchObject({ likeCount: before + 1, likedByMe: true });

    const anonymous = await api().get('/api/v1/posts/1');
    expect(anonymous.body.data.likedByMe).toBe(false);
  });

  it('좋아요 취소는 수를 되돌리고, 다시 취소해도 오류가 없다', async () => {
    const { token } = await registerUser('Unliker');
    const auth = { Authorization: `Bearer ${token}` };
    const before = (await api().get('/api/v1/posts/2')).body.data.likeCount as number;

    await api().put('/api/v1/posts/2/like').set(auth);
    const removed = await api().delete('/api/v1/posts/2/like').set(auth);
    expect(removed.status).toBe(200);
    expect(removed.body.data).toEqual({ likeCount: before, likedByMe: false });

    const again = await api().delete('/api/v1/posts/2/like').set(auth);
    expect(again.status).toBe(200);
    expect(again.body.data).toEqual({ likeCount: before, likedByMe: false });
  });

  it('남의 DRAFT나 없는 글에는 좋아요할 수 없다(404)', async () => {
    const { token } = await registerUser('Curious');
    const auth = { Authorization: `Bearer ${token}` };

    const draft = await api().put('/api/v1/posts/6/like').set(auth);
    expect(draft.status).toBe(404);

    const missing = await api().put('/api/v1/posts/99999/like').set(auth);
    expect(missing.status).toBe(404);
  });
});
