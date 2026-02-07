import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminDashboard() {
  const [likesByUser, setLikesByUser] = useState([]);
  const [userGenres, setUserGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/weekly-likes`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/admin/user-genres`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([likesRes, genresRes]) => {
        setLikesByUser(likesRes.users || []);
        setUserGenres(genresRes.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

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
            <span className="card-arrow">â†’</span>
          </Link>
        ))}
      </div>

      <div className="glass-card admin-section" style={{ marginTop: '2rem' }}>
        <h2>Weekly Picks Likes</h2>
        {loading ? (
          <div className="admin-desc">Loading liked picks...</div>
        ) : likesByUser.length === 0 ? (
          <div className="admin-desc">No likes yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Genre</th>
                  <th>Likes</th>
                  <th>Titles</th>
                </tr>
              </thead>
              <tbody>
                {likesByUser.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name || u.email}</td>
                    <td>{u.favorite_genre || '-'}</td>
                    <td>{u.like_count ?? 0}</td>
                    <td className="truncate">
                      {(u.liked_titles || []).length ? u.liked_titles.join(', ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card admin-section">
        <h2>User Genres</h2>
        {loading ? (
          <div className="admin-desc">Loading user genres...</div>
        ) : userGenres.length === 0 ? (
          <div className="admin-desc">No users yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Genre</th>
                </tr>
              </thead>
              <tbody>
                {userGenres.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name || '-'}</td>
                    <td>{u.email}</td>
                    <td>{u.favorite_genre || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
