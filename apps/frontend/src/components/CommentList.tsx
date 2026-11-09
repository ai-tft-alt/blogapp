import type { Comment } from '@blogapp/shared';
import { formatDate } from './PostCard';

interface Props {
  comments: Comment[];
  currentUserId?: number;
  onDelete: (id: number) => void;
}

export function CommentList({ comments, currentUserId, onDelete }: Props) {
  if (comments.length === 0) {
    return <p className="empty">아직 댓글이 없습니다.</p>;
  }
  return (
    <ul className="comment-list" aria-label="댓글 목록">
      {comments.map((comment) => (
        <li key={comment.id} className="comment">
          <div className="meta">
            <strong>{comment.authorName}</strong>
            <span>{formatDate(comment.createdAt)}</span>
          </div>
          <p>{comment.content}</p>
          {comment.authorId === currentUserId && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => onDelete(comment.id)}
              aria-label={`댓글 삭제: ${comment.content}`}
            >
              삭제
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
