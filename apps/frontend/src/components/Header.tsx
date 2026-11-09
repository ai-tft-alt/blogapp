import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="BLOGAPP 홈">
          BLOGAPP
        </Link>
        <nav aria-label="주요 메뉴" className="nav">
          <NavLink to="/editor">글쓰기</NavLink>
          {user ? (
            <>
              <NavLink to="/my-posts">내 글</NavLink>
              <span className="user-name" aria-label="로그인 사용자">
                {user.name}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleLogout}
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">로그인</NavLink>
              <NavLink to="/register">회원가입</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
