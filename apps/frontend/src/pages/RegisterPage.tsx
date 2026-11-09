import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register({ email, name, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="register-title">
      <h1 id="register-title">회원가입</h1>
      <form className="card form" onSubmit={handleSubmit} aria-label="회원가입">
        <label htmlFor="register-email">이메일</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="register-name">이름</label>
        <input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required />
        <label htmlFor="register-password">비밀번호 (8자 이상)</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={submitting} aria-label="회원가입하기">
          {submitting ? '가입 중…' : '회원가입'}
        </button>
        <p className="hint">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </section>
  );
}
