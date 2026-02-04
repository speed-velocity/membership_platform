import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminLogins() {
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/logins`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLogins(d.logins || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Login History</h1>
      </div>
      <div className="glass-card admin-section">
        <h2>Recent Logins</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>IP</th>
                <th>Device</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((l) => (
                <tr key={l.id}>
                  <td>{l.email}</td>
                  <td>{l.full_name || '-'}</td>
                  <td>{l.role}</td>
                  <td>{l.ip || '-'}</td>
                  <td className="truncate">{l.user_agent || '-'}</td>
                  <td>{l.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logins.length === 0 && <p className="no-requests">No logins yet.</p>}
      </div>
    </div>
  );
}
