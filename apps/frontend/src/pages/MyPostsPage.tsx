import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Post } from '@blogapp/shared';
import { api } from '../api/client';
import { formatDate } from '../components/PostCard';

export function MyPostsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .myPosts()
      .then(setPosts)
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleDelete = async (post: Post) => {
    if (!window.confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    await api.deletePost(post.id);
    setPosts((prev) => prev?.filter((p) => p.id !== post.id) ?? null);
  };

  if (error) return <p className="error">{error}</p>;
  if (!posts) return <p>불러오는 중…</p>;

  return (
    <section aria-labelledby="my-posts-title">
      <h1 id="my-posts-title">내 글</h1>
      {posts.length === 0 ? (
        <p className="empty">작성한 글이 없습니다.</p>
      ) : (
        <ul className="my-posts" aria-label="내 글 목록">
          {posts.map((post) => (
            <li key={post.id} className="card my-post">
              <div>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
                <div className="meta">
                  <span className={post.status === 'DRAFT' ? 'badge' : 'badge badge-published'}>
                    {post.status === 'DRAFT' ? '임시저장' : '게시됨'}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span>댓글 {post.commentCount}</span>
                </div>
              </div>
              <div className="actions">
                <Link
                  to={`/editor/${post.id}`}
                  className="btn btn-ghost btn-small"
                  aria-label={`수정: ${post.title}`}
                >
                  수정
                </Link>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(post)}
                  aria-label={`삭제: ${post.title}`}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
