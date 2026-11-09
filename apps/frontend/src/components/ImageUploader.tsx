import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { api } from '../api/client';

interface Props {
  onUploaded: (url: string | null) => void;
}

export function ImageUploader({ onUploaded }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지를 업로드하지 못했습니다.');
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploaded(null);
  };

  return (
    <div className="image-uploader">
      <label htmlFor="post-image">대표 이미지</label>
      <input
        id="post-image"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleChange}
        aria-label="이미지 파일 선택"
      />
      {uploading && <p className="hint">업로드 중…</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {previewUrl && (
        <div className="preview">
          <img src={previewUrl} alt="이미지 미리보기" />
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={handleRemove}
            aria-label="이미지 제거"
          >
            이미지 제거
          </button>
        </div>
      )}
    </div>
  );
}
