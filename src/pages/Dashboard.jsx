import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const API = '/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recGenre, setRecGenre] = useState('');
  const [recStatus, setRecStatus] = useState({});

  useEffect(() => {
    Promise.all([
      fetch(`${API}/users/dashboard`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/users/recommendations`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([dash, rec]) => {
        setData(dash);
        setRecommendations(rec?.content || []);
        setRecGenre(rec?.genre || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const requestRecommendation = async (item) => {
    setRecStatus((s) => ({ ...s, [item.id]: { ...(s[item.id] || {}), requesting: true, error: '' } }));
    try {
      const res = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: item.title, message: 'Requested from Weekly Picks' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setRecStatus((s) => ({ ...s, [item.id]: { ...(s[item.id] || {}), requested: true, requesting: false } }));
    } catch (e) {
      setRecStatus((s) => ({ ...s, [item.id]: { ...(s[item.id] || {}), requesting: false, error: e.message } }));
    }
  };

  const toggleLike = async (item) => {
    const next = !item.liked;
    setRecommendations((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, liked: next } : r))
    );
    try {
      if (next) {
        await fetch(`${API}/users/recommendations/${item.id}/like`, {
          method: 'POST',
          credentials: 'include',
        });
      } else {
        await fetch(`${API}/users/recommendations/${item.id}/like`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
    } catch (e) {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, liked: !next } : r))
      );
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="dashboard animate-fade-in">
      <h1 className="page-title">Your Dashboard</h1>
      <div className="dashboard-grid">
        <div className="glass-card dashboard-card">
          <h2>Profile</h2>
          <div className="stat-row">
            <span className="stat-label">Name</span>
            <span className="stat-value">{data?.fullName || '-'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Telegram</span>
            <span className="stat-value">{data?.telegramUsername || '-'}</span>
          </div>
        </div>

        <div className="glass-card dashboard-card subscription-card">
          <h2>Subscription</h2>
          {data?.hasSubscription ? (
            <>
              <div className="stat-row">
                <span className="stat-label">Plan</span>
                <span className="stat-value neon-text">{data.plan}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Start Date</span>
                <span>{data.startDate}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Expiry Date</span>
                <span>{data.expiryDate}</span>
              </div>
              <div className="stat-row remaining">
                <span className="stat-label">Remaining Days</span>
                <span className="stat-value remaining-days">{data.remainingDays}</span>
              </div>
            </>
          ) : (
            <>
              <p className="no-sub">No active subscription</p>
              <p className="no-sub-desc">Subscribe to access premium content.</p>
              <Link to="/payment" className="btn-glow btn-primary mt">Subscribe Now</Link>
            </>
          )}
        </div>

        <div className="glass-card dashboard-card">
          <h2>Request Status</h2>
          <div className="stat-row">
            <span className="stat-label">Approved</span>
            <span className="stat-value">{data?.approvedRequests ?? 0}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Denied</span>
            <span className="stat-value">{data?.deniedRequests ?? 0}</span>
          </div>
        </div>

        <div className="glass-card dashboard-card quick-actions">
          <h2>Quick Actions</h2>
          <Link to="/content" className="action-link">
            <span className="action-icon">â–¶</span>
            <span>Browse Content</span>
          </Link>
          <Link to="/watchlist" className="action-link">
            <span className="action-icon">â˜…</span>
            <span>Your Watchlist</span>
          </Link>
          <Link to="/requests" className="action-link">
            <span className="action-icon">âœ‰</span>
            <span>Movie Requests</span>
          </Link>
        </div>

        <div className="glass-card dashboard-card">
          <h2>Weekly Picks {recGenre ? `· ${recGenre}` : ''}</h2>
          {recommendations.length > 0 ? (
            <div className="weekly-grid">
              {recommendations.map((item) => (
                <div key={item.id} className="weekly-card">
                  <Link to={`/content/${item.id}`} className="weekly-thumb">
                    {item.thumbnail_path ? (
                      <img src={`/${item.thumbnail_path}`} alt={item.title} />
                    ) : (
                      <div className="weekly-placeholder">Movie</div>
                    )}
                  </Link>
                  <div className="weekly-meta">
                    <span className="weekly-title">{item.title}</span>
                    <div className="weekly-actions">
                      <button
                        className="btn-glow btn-secondary btn-xs"
                        onClick={() => requestRecommendation(item)}
                        disabled={recStatus[item.id]?.requesting}
                      >
                        {recStatus[item.id]?.requested ? 'Requested' : 'Request'}
                      </button>
                      <button
                        className={`btn-like ${item.liked ? 'active' : ''}`}
                        onClick={() => toggleLike(item)}
                      >
                        {item.liked ? 'Liked' : 'Like'}
                      </button>
                    </div>
                    {recStatus[item.id]?.error && (
                      <span className="weekly-error">{recStatus[item.id].error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-sub-desc">
              {recGenre
                ? 'No new picks yet. We will update this weekly.'
                : 'Choose a favorite genre to unlock weekly recommendations.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
