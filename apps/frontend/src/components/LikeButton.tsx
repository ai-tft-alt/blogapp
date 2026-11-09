import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { LikeStatus } from '@blogapp/shared';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Props {
  postId: number;
  likeCount: number;
  likedByMe: boolean;
  onChange: (status: LikeStatus) => void;
}

export function LikeButton({ postId, likeCount, likedByMe, onChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setPending(true);
    setError(null);
    try {
      const status = likedByMe ? await api.unlikePost(postId) : await api.likePost(postId);
      onChange(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : '좋아요를 처리하지 못했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="like">
      <button
        type="button"
        className="btn btn-ghost like-button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={likedByMe}
        aria-label={likedByMe ? '좋아요 취소' : '좋아요'}
      >
        <span aria-hidden="true">{likedByMe ? '♥' : '♡'}</span> {likeCount}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
