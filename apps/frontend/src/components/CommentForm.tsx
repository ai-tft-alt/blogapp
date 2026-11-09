import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

interface Props {
  onSubmit: (content: string) => Promise<void>;
}

export function CommentForm({ onSubmit }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 등록하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} aria-label="댓글 작성">
      <label htmlFor="comment-content">댓글</label>
      <textarea
        id="comment-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => {
          if (!user) navigate('/login', { state: { from: location.pathname } });
        }}
        placeholder={user ? '댓글을 입력하세요' : '로그인 후 댓글을 작성할 수 있습니다'}
        rows={3}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={submitting} aria-label="댓글 등록">
        {submitting ? '등록 중…' : '댓글 등록'}
      </button>
    </form>
  );
}
