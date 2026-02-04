import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminSettings() {
  const [limit, setLimit] = useState(2);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/admin/settings`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLimit(parseInt(d.settings?.request_limit_per_12h || '2', 10)));
  }, []);

  const saveLimit = async () => {
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 1 || num > 10) {
      alert('Limit must be between 1 and 10');
      return;
    }
    try {
      await fetch(`${API}/admin/settings/request-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: num }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Failed to save');
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Settings</h1>
      </div>
      <div className="glass-card admin-section">
        <h2>Request Limits</h2>
        <p className="admin-desc">Maximum movie requests per user per rolling 12-hour window.</p>
        <div className="form-row">
          <label>Requests per 12 hours</label>
          <input
            type="number"
            min="1"
            max="10"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            style={{ width: '80px' }}
          />
          <button className="btn-glow btn-primary" onClick={saveLimit}>Save</button>
        </div>
        {saved && <span className="saved-msg">Saved!</span>}
      </div>
    </div>
  );
}
