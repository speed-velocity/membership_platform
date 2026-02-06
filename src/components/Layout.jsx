import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <nav className="navbar">
        <NavLink to="/dashboard" className="logo">
          <span className="logo-icon">◆</span>
          <span>Movie Mayhem</span>
        </NavLink>
        <div className="nav-links">
          {user?.role === 'user' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === 'user' && <NavLink to="/payment">Subscribe</NavLink>}
          {user?.role === 'user' && <NavLink to="/watchlist">Watchlist</NavLink>}
          {user?.role === 'user' && <NavLink to="/requests">Requests</NavLink>}
          {user?.role === 'admin' && (
            <NavLink to="/admin">Admin</NavLink>
          )}
        </div>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <div className="nav-actions">
            <button className="btn-glow btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            {user?.role === 'user' && (
              <button className="btn-link-danger" onClick={handleDeleteAccount}>
                Delete account
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
