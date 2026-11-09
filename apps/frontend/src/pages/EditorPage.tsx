import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { PostStatus } from '@blogapp/shared';
import { api } from '../api/client';
import { ImageUploader } from '../components/ImageUploader';

export function EditorPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PostStatus>('PUBLISHED');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingId === null) return;
    api
      .getPost(editingId)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setImageUrl(post.imageUrl);
        setStatus(post.status);
      })
      .catch((err: Error) => setError(err.message));
  }, [editingId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const input = { title, content, imageUrl, status };
      const post =
        editingId === null ? await api.createPost(input) : await api.updatePost(editingId, input);
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="editor-title">
      <h1 id="editor-title">{editingId === null ? '새 글 쓰기' : '글 수정'}</h1>
      <form className="card form" onSubmit={handleSubmit} aria-label="글 작성">
        <label htmlFor="post-title">제목</label>
        <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label htmlFor="post-content">본문</label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          required
        />
        <ImageUploader onUploaded={setImageUrl} />
        {imageUrl && <p className="hint">첨부된 이미지: {imageUrl}</p>}
        <label htmlFor="post-status">공개 상태</label>
        <select
          id="post-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PostStatus)}
        >
          <option value="PUBLISHED">게시</option>
          <option value="DRAFT">임시저장</option>
        </select>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={submitting} aria-label="글 저장">
          {submitting ? '저장 중…' : editingId === null ? '게시하기' : '수정하기'}
        </button>
      </form>
    </section>
  );
}
