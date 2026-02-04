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
          {user?.role === 'user' && <NavLink to="/requests">Requests</NavLink>}
          {user?.role === 'admin' && (
            <NavLink to="/admin">Admin</NavLink>
          )}
        </div>
        <div className="nav-user">
          <span className="user-email">{user?.email}</span>
          <button className="btn-glow btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
