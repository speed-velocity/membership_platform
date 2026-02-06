import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './WeeklyPicks.css';

const API = '/api';

export default function WeeklyPicks() {
  const [recommendations, setRecommendations] = useState([]);
  const [recGenre, setRecGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [recStatus, setRecStatus] = useState({});

  const normalizeTitle = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

  useEffect(() => {
    fetch(`${API}/users/recommendations`, { credentials: 'include' })
      .then((r) => r.json())
      .then((rec) => {
        const blocked = new Set(['rananaidu', 'ranaraidu']);
        const filtered = (rec?.content || []).filter(
          (item) => !blocked.has(normalizeTitle(item.title))
        );
        setRecommendations(filtered);
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
    <div className="weekly-page animate-fade-in">
      <h1 className="page-title">Weekly Picks {recGenre ? `- ${recGenre}` : ''}</h1>
      {recommendations.length > 0 ? (
        <div className="weekly-columns">
          <div className="weekly-section">
            <h2 className="weekly-heading">Movies</h2>
            <div className="weekly-grid">
              {recommendations.filter((r) => r.kind === 'Movie').map((item) => (
                <div key={item.id} className="weekly-card">
                  <div className="weekly-thumb">
                    {item.thumbnail_path ? (
                      <img src={`/${item.thumbnail_path}`} alt={item.title} />
                    ) : (
                      <div className="weekly-placeholder">{item.kind || 'Poster'}</div>
                    )}
                  </div>
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
          </div>

          <div className="weekly-section">
            <h2 className="weekly-heading">Series</h2>
            <div className="weekly-grid">
              {recommendations.filter((r) => r.kind === 'Series').map((item) => (
                <div key={item.id} className="weekly-card">
                  <div className="weekly-thumb">
                    {item.thumbnail_path ? (
                      <img src={`/${item.thumbnail_path}`} alt={item.title} />
                    ) : (
                      <div className="weekly-placeholder">{item.kind || 'Poster'}</div>
                    )}
                  </div>
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
          </div>
        </div>
      ) : (
        <div className="glass-card weekly-empty">
          <p className="no-sub-desc">
            {recGenre
              ? 'No new picks yet. We will update this weekly.'
              : 'Choose a favorite genre to unlock weekly recommendations.'}
          </p>
          {!recGenre && <Link className="btn-glow btn-secondary btn-sm" to="/onboarding/genre">Choose Genre</Link>}
        </div>
      )}
    </div>
  );
}
