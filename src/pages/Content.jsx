import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Content.css';

const API = '/api';

export default function Content() {
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/content/categories`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/content${filter ? `?category=${encodeURIComponent(filter)}` : ''}`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([catRes, contRes]) => {
      setCategories(catRes.categories || []);
      setContent(contRes.content || []);
    }).finally(() => setLoading(false));
  }, [filter]);

  const toggleFavorite = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !item.isFavorite;
    setContent((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isFavorite: next } : c))
    );
    try {
      if (next) {
        await fetch(`${API}/users/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ contentId: item.id }),
        });
      } else {
        await fetch(`${API}/users/watchlist/${item.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }
    } catch {
      setContent((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isFavorite: !next } : c))
      );
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="content-page animate-fade-in">
      <h1 className="page-title">Premium Content</h1>
      {categories.length > 0 && (
        <div className="category-filters">
          <button
            className={`filter-btn ${!filter ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-btn ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="content-grid">
        {content.map((item) => (
          <Link to={`/content/${item.id}`} key={item.id} className="content-card glass-card">
            <div className="content-thumb">
              {item.thumbnail_path ? (
                <img src={`/${item.thumbnail_path}`} alt={item.title} />
              ) : (
                <div className="placeholder-thumb">
                  <span>◆</span>
                </div>
              )}
              <button
                type="button"
                className={`fav-btn ${item.isFavorite ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(e, item)}
                aria-label="Toggle favorite"
              >
                {item.isFavorite ? '★' : '☆'}
              </button>
              {!item.canAccess && (
                <div className="content-lock">
                  <span>🔒</span>
                  <span>Subscription required</span>
                </div>
              )}
            </div>
            <div className="content-info">
              <h3>{item.title}</h3>
              <p className="content-category">{item.category}</p>
              {item.canAccess && (
                <span className="quality-badges">
                  {item.video_1080_path && <span className="badge">1080p</span>}
                  {item.video_4k_path && <span className="badge">4K</span>}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      {content.length === 0 && (
        <p className="no-content">No content available yet.</p>
      )}
    </div>
  );
}
