import React, { useEffect, useState } from 'react';
import './Content.css';

const API = '/api';

export default function Watchlist() {
  const [titles, setTitles] = useState(Array(5).fill(''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/users/wishlist`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const incoming = Array.isArray(d.titles) ? d.titles : [];
        const filled = Array.from({ length: 5 }, (_, idx) => incoming[idx] || '');
        setTitles(filled);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (index, value) => {
    setTitles((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/users/wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ titles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save wishlist');
      const incoming = Array.isArray(data.titles) ? data.titles : titles;
      const filled = Array.from({ length: 5 }, (_, idx) => incoming[idx] || '');
      setTitles(filled);
      setMessage('Wishlist saved.');
    } catch (e) {
      setMessage(e.message || 'Failed to save wishlist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="content-page animate-fade-in">
      <h1 className="page-title">Your Wishlist</h1>
      <div className="glass-card wishlist-panel">
        <p className="wishlist-note">Add up to 5 movies or series you want to watch next.</p>
        <div className="wishlist-grid">
          {titles.map((title, idx) => (
            <div key={`wish-${idx}`} className="wishlist-item">
              <span className="wishlist-index">{idx + 1}</span>
              <input
                type="text"
                value={title}
                placeholder={`Wishlist title ${idx + 1}`}
                onChange={(e) => handleChange(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="wishlist-actions">
          <button className="btn-glow btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Wishlist'}
          </button>
          {message && <span className="wishlist-message">{message}</span>}
        </div>
      </div>
    </div>
  );
}
