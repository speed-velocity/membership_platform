import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

function daysRemaining(expiryDate) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/subscriptions`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setSubscriptions(d.subscriptions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Active Subscriptions</h1>
        <p className="admin-subtitle">All members with active membership</p>
      </div>
      <div className="glass-card admin-section">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td><span className="plan-badge">{s.plan}</span></td>
                  <td>{s.start_date}</td>
                  <td>{s.expiry_date}</td>
                  <td>
                    <span className={daysRemaining(s.expiry_date) <= 7 ? 'days-warning' : 'days-ok'}>
                      {daysRemaining(s.expiry_date)} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subscriptions.length === 0 && (
          <p className="no-requests">No active subscriptions.</p>
        )}
      </div>
    </div>
  );
}
