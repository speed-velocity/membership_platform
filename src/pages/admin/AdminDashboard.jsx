import React from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

export default function AdminDashboard() {
  const links = [
    { to: '/admin/analytics', label: 'Analytics', desc: 'Key platform metrics' },
    { to: '/admin/activity', label: 'User Activity', desc: 'Logins and request events' },
    { to: '/admin/subscriptions', label: 'Active Subscriptions', desc: 'View all active members' },
    { to: '/admin/users', label: 'Manage Users', desc: 'View users and manage subscriptions' },
    { to: '/admin/requests', label: 'Movie Requests', desc: 'Monitor and manage requests' },
    { to: '/admin/logins', label: 'Login History', desc: 'See recent sign-ins' },
    { to: '/admin/settings', label: 'Settings', desc: 'Request limits and config' },
  ];

  return (
    <div className="admin-page animate-fade-in">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="admin-subtitle">Secure management panel</p>
      <div className="admin-grid">
        {links.map((link) => (
          <Link to={link.to} key={link.to} className="admin-card glass-card">
            <h3>{link.label}</h3>
            <p>{link.desc}</p>
            <span className="card-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
