import React, { useEffect, useState } from 'react';
import './Admin.css';

const API = '/api';

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/activity`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <h1 className="page-title">User Activity</h1>
      <p className="admin-subtitle">Recent logins and requests</p>

      <div className="table-wrap glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Email</th>
              <th>Meta</th>
              <th>Detail</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((row, idx) => (
              <tr key={`${row.type}-${idx}`}>
                <td>{row.type}</td>
                <td className="truncate">{row.email}</td>
                <td className="truncate">{row.meta || '-'}</td>
                <td className="truncate">{row.detail || '-'}</td>
                <td>{formatTime(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activity.length === 0 && (
        <p className="admin-desc">No activity yet.</p>
      )}
    </div>
  );
}
