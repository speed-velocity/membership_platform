import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [plan, setPlan] = useState('Basic');
  const [months, setMonths] = useState(1);
  const [expiryDates, setExpiryDates] = useState({});
  const [message, setMessage] = useState('');
  const [deletions, setDeletions] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/users`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/admin/deletions`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([usersRes, deletionsRes]) => {
        setUsers(usersRes.users || []);
        setDeletions(deletionsRes.requests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const addSubscription = async () => {
    if (!selectedUser) return;
    setMessage('');
    try {
      const res = await fetch(`${API}/admin/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: selectedUser.id, plan, months: parseInt(months, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage('Subscription added!');
      setSelectedUser(null);
      fetch(`${API}/admin/users`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => setUsers(d.users || []));
    } catch (e) {
      setMessage(e.message || 'Failed');
    }
  };

  const updateExpiry = async (userId) => {
    const expiryDate = expiryDates[userId];
    if (!expiryDate) return;
    try {
      await fetch(`${API}/admin/subscriptions/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expiryDate }),
      });
      setMessage('Updated!');
      fetch(`${API}/admin/users`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => setUsers(d.users || []));
    } catch (e) {
      setMessage(e.message || 'Failed');
    }
  };

  const refreshDeletions = async () => {
    const res = await fetch(`${API}/admin/deletions`, { credentials: 'include' });
    const data = await res.json();
    setDeletions(data.requests || []);
  };

  const handleDeletionAction = async (id, action) => {
    try {
      await fetch(`${API}/admin/deletions/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      setMessage(`Deletion request ${action === 'keep' ? 'kept' : 'removed'}.`);
      refreshDeletions();
    } catch (e) {
      setMessage('Failed to update deletion request.');
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Manage Users</h1>
        <a
          className="btn-glow btn-secondary btn-sm"
          href="/api/admin/exports/users.csv"
          style={{ marginLeft: 'auto' }}
        >
          Download CSV
        </a>
      </div>
      {message && <div className="admin-message">{message}</div>}
      <div className="glass-card admin-section">
        <h2>Users</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Last Login</th>
                <th>Requests</th>
                <th>Plan</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.last_login || '-'}</td>
                  <td>{u.request_count ?? 0}</td>
                  <td>{u.subscription?.plan || '-'}</td>
                  <td>{u.subscription?.start_date || '-'}</td>
                  <td>{u.subscription?.expiry_date || '-'}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn-glow btn-secondary btn-sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        Add/Edit Sub
                      </button>
                      {u.subscription && (
                        <>
                          <input
                            type="date"
                            value={expiryDates[u.id] ?? u.subscription?.expiry_date ?? ''}
                            onChange={(e) => setExpiryDates((s) => ({ ...s, [u.id]: e.target.value }))}
                            style={{ width: '140px' }}
                          />
                          <button
                            className="btn-glow btn-secondary btn-sm"
                            onClick={() => updateExpiry(u.id)}
                          >
                            Set Expiry
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card admin-section">
        <h2>Deletion Requests</h2>
        {deletions.length === 0 ? (
          <p className="admin-desc">No pending deletion requests.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Requested At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deletions.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{r.created_at || '-'}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="btn-glow btn-secondary btn-sm"
                          onClick={() => handleDeletionAction(r.id, 'keep')}
                        >
                          Keep Data
                        </button>
                        <button
                          className="btn-glow btn-secondary btn-sm"
                          onClick={() => handleDeletionAction(r.id, 'remove')}
                        >
                          Remove Data
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedUser && (
        <div className="glass-card modal-overlay" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h3>Add subscription for {selectedUser.email}</h3>
          <div className="form-row">
            <label>Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option>Basic</option>
            </select>
          </div>
          <div className="form-row">
            <label>Months</label>
            <input type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <div className="admin-actions" style={{ marginTop: '1rem' }}>
            <button className="btn-glow btn-primary" onClick={addSubscription}>Add</button>
            <button className="btn-glow btn-secondary" onClick={() => setSelectedUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
