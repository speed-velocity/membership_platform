import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PosterWall from '../components/PosterWall';
import './Auth.css';

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Fantasy',
  'Animation',
  'Documentary',
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

  return (
    <div className="auth-page">
      <PosterWall />
      <div className="auth-card glass-card animate-fade-in">
        <div className="brand-mark">Movie Mayhem</div>
        <h1 className="auth-title">Pick Your Genre</h1>
        <p className="auth-subtitle">Tell us one favorite genre to personalize weekly picks.</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="genre-grid">
          {sortedGenres.map((genre) => (
            <button
              type="button"
              key={genre}
              className={`genre-chip ${selected === genre ? 'active' : ''}`}
              onClick={() => setSelected(genre)}
            >
              {genre}
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
