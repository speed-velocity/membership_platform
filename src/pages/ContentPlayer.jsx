import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ContentPlayer.css';

const API = '/api';

export default function ContentPlayer() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [quality, setQuality] = useState('1080p');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/content/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setItem)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !item) return <div className="loading-screen"><div className="loader" /></div>;

  const videoUrl = quality === '4k' && item.video_4k_path
    ? `/${item.video_4k_path}`
    : item.video_1080_path
      ? `/${item.video_1080_path}`
      : null;

  return (
    <div className="content-player animate-fade-in">
      <Link to="/content" className="back-link">← Back to Content</Link>
      <h1 className="page-title">{item.title}</h1>
      {item.canAccess ? (
        <>
          <div className="player-controls">
            <div className="quality-selector">
              {item.video_1080_path && (
                <button
                  className={`quality-btn ${quality === '1080p' ? 'active' : ''}`}
                  onClick={() => setQuality('1080p')}
                >
                  1080p
                </button>
              )}
              {item.video_4k_path && (
                <button
                  className={`quality-btn ${quality === '4k' ? 'active' : ''}`}
                  onClick={() => setQuality('4k')}
                >
                  4K
                </button>
              )}
            </div>
          </div>
          {videoUrl ? (
            <div className="video-container glass-card">
              <video
                key={videoUrl}
                controls
                autoPlay
                className="video-player"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="no-video glass-card">
              <p>No video file available for this content yet.</p>
            </div>
          )}
          {item.description && (
            <div className="content-description glass-card">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card no-access">
          <h2>Subscription Required</h2>
          <p>You need an active subscription to access premium content.</p>
          <Link to="/dashboard" className="btn-glow btn-primary">View Dashboard</Link>
        </div>
      )}
    </div>
  );
}
