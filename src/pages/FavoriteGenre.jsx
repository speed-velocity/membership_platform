import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const GENRES = [
  { id: 'romance', label: 'Romance', icon: 'R', blurb: 'Love stories & warm moments' },
  { id: 'action', label: 'Action', icon: 'A', blurb: 'Blasts, chases & intensity' },
  { id: 'thriller', label: 'Thriller', icon: 'T', blurb: 'Tension & edge-of-seat' },
  { id: 'comedy', label: 'Comedy', icon: 'C', blurb: 'Light, fun & clever' },
  { id: 'horror', label: 'Horror', icon: 'H', blurb: 'Dark, eerie & spooky' },
];

const PARTICLES = [
  { x: 12, y: 18, scale: 1.1, delay: '0s' },
  { x: 28, y: 32, scale: 0.8, delay: '0.6s' },
  { x: 42, y: 20, scale: 1.3, delay: '1.2s' },
  { x: 58, y: 38, scale: 0.9, delay: '0.4s' },
  { x: 72, y: 22, scale: 1.1, delay: '0.9s' },
  { x: 86, y: 36, scale: 0.8, delay: '1.4s' },
  { x: 18, y: 72, scale: 0.9, delay: '0.3s' },
  { x: 34, y: 62, scale: 1.2, delay: '1.1s' },
  { x: 52, y: 74, scale: 0.85, delay: '0.5s' },
  { x: 68, y: 66, scale: 1.05, delay: '1.3s' },
  { x: 82, y: 78, scale: 0.95, delay: '0.7s' },
  { x: 94, y: 64, scale: 1.1, delay: '1.6s' },
];

export default function FavoriteGenre() {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, setUserFavoriteGenre } = useAuth();

  const sortedGenres = useMemo(() => GENRES, []);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await setUserFavoriteGenre(selected);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message || 'Failed to save genre');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (user.favoriteGenre) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const selectedId = sortedGenres.find((g) => g.label === selected)?.id || '';

  return (
    <div className="genre-page">
      <div className={`genre-scene ${selectedId ? `genre-${selectedId}` : 'genre-default'}`}>
        <div className="scene-haze" />
        <div className="scene-particles">
          {PARTICLES.map((p, idx) => (
            <span
              key={idx}
              className="scene-particle"
              style={{ '--x': p.x, '--y': p.y, '--s': p.scale, '--d': p.delay }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <div className="genre-panel glass-card animate-fade-in">
        <div className="brand-mark">Movie Mayhem</div>
        <h1 className="auth-title">Pick Your Genre</h1>
        <p className="auth-subtitle">Tell us one favorite genre to personalize weekly picks.</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="genre-grid">
          {sortedGenres.map((genre) => (
            <button
              type="button"
              key={genre.id}
              className={`genre-card ${selected === genre.label ? 'active' : ''}`}
              onClick={() => setSelected(genre.label)}
            >
              <span className="genre-icon">{genre.icon}</span>
              <span className="genre-label">{genre.label}</span>
              <span className="genre-blurb">{genre.blurb}</span>
            </button>
          ))}
        </div>
        <button
          className="btn-glow btn-primary"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
