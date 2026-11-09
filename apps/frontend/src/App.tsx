import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { EditorPage } from './pages/EditorPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyPostsPage } from './pages/MyPostsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { RegisterPage } from './pages/RegisterPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p>불러오는 중…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/my-posts"
            element={
              <RequireAuth>
                <MyPostsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
        </Routes>
      </main>
    </>
  );
}
