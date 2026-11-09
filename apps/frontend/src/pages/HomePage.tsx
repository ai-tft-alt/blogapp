import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { PaginatedPosts } from '@blogapp/shared';
import { api } from '../api/client';
import { PostCard } from '../components/PostCard';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [result, setResult] = useState<PaginatedPosts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listPosts(page)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [page]);

  if (error) return <p className="error">{error}</p>;
  if (!result) return <p>불러오는 중…</p>;

  const { items, pagination } = result;
  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">최신 글</h1>
      {items.length === 0 ? (
        <p className="empty">아직 게시된 글이 없습니다.</p>
      ) : (
        <div className="post-list">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <nav className="pagination" aria-label="페이지 이동">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pagination.page <= 1}
          onClick={() => setSearchParams({ page: String(pagination.page - 1) })}
          aria-label="이전 페이지"
        >
          이전
        </button>
        <span>
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setSearchParams({ page: String(pagination.page + 1) })}
          aria-label="다음 페이지"
        >
          다음
        </button>
      </nav>
    </section>
  );
}
