import React, { useState, useEffect } from 'react';
import './MovieRequests.css';

const API = '/api';

function CountdownTimer({ targetDate }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!remaining) return null;
  return <span className="countdown">Next request in: {remaining}</span>;
}

export default function MovieRequests() {
  const [requests, setRequests] = useState([]);
  const [limitStatus, setLimitStatus] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch(`${API}/requests/limit-status`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/requests/my`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([limitRes, reqRes]) => {
      setLimitStatus(limitRes);
      setRequests(reqRes.requests || []);
    }).finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
        if (data.nextAvailableAt) setLimitStatus((s) => ({ ...s, nextAvailableAt: data.nextAvailableAt }));
        return;
      }
      setTitle('');
      setMessage('');
      fetchData();
    } catch (err) {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingList) return <div className="loading-screen"><div className="loader" /></div>;

  const canRequest = limitStatus?.canRequest ?? true;

  return (
    <div className="movie-requests animate-fade-in">
      <h1 className="page-title">Movie Requests</h1>
      <div className="requests-layout">
        <div className="glass-card request-form-card">
          <h2>Submit a Request</h2>
          <p className="limit-info">
            You can submit up to {limitStatus?.limit ?? 2} requests per 12 hours.
            Used: {limitStatus?.count ?? 0} / {limitStatus?.limit ?? 2}
          </p>
          {!canRequest && limitStatus?.nextAvailableAt && (
            <div className="limit-reached">
              <CountdownTimer targetDate={limitStatus.nextAvailableAt} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="request-form">
            {error && <div className="auth-error">{error}</div>}
            <input
              type="text"
              placeholder="Movie title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!canRequest}
            />
            <textarea
              placeholder="Additional message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={!canRequest}
            />
            <button
              type="submit"
              className="btn-glow btn-primary"
              disabled={!canRequest || loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
        <div className="glass-card requests-list-card">
          <h2>Your Requests</h2>
          <div className="requests-list">
            {requests.map((r) => (
              <div key={r.id} className="request-item">
                <div className="request-header">
                  <strong>{r.title}</strong>
                  <span className={`status-badge status-${r.status}`}>{r.status}</span>
                </div>
                {r.message && <p className="request-msg">{r.message}</p>}
                <span className="request-date">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {requests.length === 0 && (
            <p className="no-requests">No requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
