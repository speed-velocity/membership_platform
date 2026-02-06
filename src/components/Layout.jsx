import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate(user?.role === 'admin' ? '/admin/login' : '/login');
  };

  const handleDeleteAccount = async () => {
    if (!user || user.role !== 'user') return;
    const ok = window.confirm(
      'Request account deletion? Admin will decide whether to remove or keep your data.'
    );
    if (!ok) return;
    try {
      await fetch('/api/users/request-delete', { method: 'POST', credentials: 'include' });
      await logout();
      navigate('/login');
      alert('Deletion request sent to admin.');
    } catch (e) {
      alert('Failed to request deletion.');
    }
  };

  return (
    <div className="layout">
      <div
        className={`side-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`side-panel ${menuOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <span className="side-title">Movie Mayhem</span>
          <button className="side-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="side-panel-body">
          {user?.role === 'user' && (
            <button
              className="btn-glow btn-secondary btn-sm"
              onClick={() => {
                setMenuOpen(false);
                navigate('/payment');
              }}
            >
              Manage Subscription
            </button>
          )}
          <button
            className="btn-glow btn-secondary btn-sm"
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
          >
            Logout
          </button>
          {user?.role === 'user' && (
            <button className="btn-link-danger" onClick={handleDeleteAccount}>
              Delete account
            </button>
          )}
        </div>
      </aside>

      <nav className="navbar">
        <button
          className="menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <NavLink to="/dashboard" className="logo">
          <span className="logo-icon">◆</span>
          <span>Movie Mayhem</span>
        </NavLink>
        <div className="nav-links">
          {user?.role === 'user' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === 'user' && <NavLink to="/watchlist">Watchlist</NavLink>}
          {user?.role === 'user' && <NavLink to="/requests">Requests</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </div>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
