import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Comment, Post } from '@blogapp/shared';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CommentForm } from '../components/CommentForm';
import { CommentList } from '../components/CommentList';
import { LikeButton } from '../components/LikeButton';
import { formatDate } from '../components/PostCard';

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(() => {
    api
      .listComments(postId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [postId]);

  useEffect(() => {
    api
      .getPost(postId)
      .then((data) => {
        setPost(data);
        loadComments();
      })
      .catch((err: Error) => setError(err.message));
  }, [postId, loadComments]);

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p>불러오는 중…</p>;

  const isAuthor = user?.id === post.authorId;

  const handleDelete = async () => {
    if (!window.confirm('이 글을 삭제할까요?')) return;
    await api.deletePost(post.id);
    navigate('/my-posts');
  };

  const handleCreateComment = async (content: string) => {
    await api.createComment(post.id, content);
    loadComments();
  };

  const handleDeleteComment = async (commentId: number) => {
    await api.deleteComment(commentId);
    loadComments();
  };

  return (
    <article className="post-detail">
      <h1>{post.title}</h1>
      <div className="meta">
        <span>{post.authorName}</span>
        <span>{formatDate(post.createdAt)}</span>
        {post.status === 'DRAFT' && <span className="badge">임시저장</span>}
      </div>
      {post.imageUrl && <img className="post-image" src={post.imageUrl} alt={post.title} />}
      <div className="post-content">{post.content}</div>
      <LikeButton
        postId={post.id}
        likeCount={post.likeCount}
        likedByMe={post.likedByMe}
        onChange={(status) => setPost({ ...post, ...status })}
      />
      {isAuthor && (
        <div className="actions">
          <Link to={`/editor/${post.id}`} className="btn btn-ghost" aria-label="글 수정">
            수정
          </Link>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            aria-label="글 삭제"
          >
            삭제
          </button>
        </div>
      )}
      <section className="comments" aria-labelledby="comments-title">
        <h2 id="comments-title">댓글 {comments.length}</h2>
        <CommentList comments={comments} currentUserId={user?.id} onDelete={handleDeleteComment} />
        <CommentForm onSubmit={handleCreateComment} />
      </section>
    </article>
  );
}
