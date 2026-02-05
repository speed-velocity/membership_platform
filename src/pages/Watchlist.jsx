import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Content.css';

const API = '/api';

export default function Watchlist() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/users/watchlist`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setContent(d.content || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="content-page animate-fade-in">
      <h1 className="page-title">Your Watchlist</h1>
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
            </div>
            <div className="content-info">
              <h3>{item.title}</h3>
              <p className="content-category">{item.category}</p>
            </div>
          </Link>
        ))}
      </div>
      {content.length === 0 && (
        <p className="no-content">No favorites yet. Add some from Content.</p>
      )}
    </div>
  );
}
