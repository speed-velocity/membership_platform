import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/requests`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/admin/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Movie Requests</h1>
      </div>
      <div className="glass-card admin-section">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Title</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{r.title}</td>
                  <td>{r.message || '-'}</td>
                  <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn-glow btn-secondary btn-sm" onClick={() => updateStatus(r.id, 'approved')}>Approve</button>
                      <button className="btn-glow btn-secondary btn-sm" onClick={() => updateStatus(r.id, 'rejected')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests.length === 0 && <p className="no-requests">No requests.</p>}
      </div>
    </div>
  );
}
