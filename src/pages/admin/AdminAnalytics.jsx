import React, { useEffect, useState } from 'react';
import './Admin.css';

const API = '/api';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/analytics`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <h1 className="page-title">Analytics</h1>
      <p className="admin-subtitle">Platform health at a glance</p>

      <div className="admin-grid">
        <div className="admin-card glass-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats?.totalUsers ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Active Subscriptions</h3>
          <p className="stat-value">{stats?.activeSubs ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Total Requests</h3>
          <p className="stat-value">{stats?.totalRequests ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Requests Pending</h3>
          <p className="stat-value">{stats?.pendingRequests ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Requests Approved</h3>
          <p className="stat-value">{stats?.approvedRequests ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Requests Denied</h3>
          <p className="stat-value">{stats?.deniedRequests ?? 0}</p>
        </div>
        <div className="admin-card glass-card">
          <h3>Logins (7 days)</h3>
          <p className="stat-value">{stats?.logins7d ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
