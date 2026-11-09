import { Link } from 'react-router';
import type { Post } from '@blogapp/shared';

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card post-card">
      <h2 className="post-card-title">
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <p className="post-card-excerpt">
        {post.content.length > 120 ? `${post.content.slice(0, 120)}…` : post.content}
      </p>
      <div className="meta">
        <span>{post.authorName}</span>
        <span>{formatDate(post.createdAt)}</span>
        <span>댓글 {post.commentCount}</span>
        <span>좋아요 {post.likeCount}</span>
      </div>
    </article>
  );
}
