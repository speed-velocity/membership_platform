import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function AvatarSetup() {
  const { user, setUserAvatar } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (!user.favoriteGenre) {
      navigate('/onboarding/genre');
      return;
    }
    if (user.avatarUrl) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      await setUserAvatar(file);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message || 'Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card animate-fade-in">
        <div className="brand-mark">Movie Mayhem</div>
        <h1 className="auth-title">Add a Profile Photo</h1>
        <p className="auth-subtitle">Optional - add a quick profile picture for your account.</p>
        {error && <div className="auth-error">{error}</div>}

        <div className="avatar-preview">
          {preview ? (
            <img src={preview} alt="Avatar preview" />
          ) : (
            <div className="avatar-placeholder">Upload a photo</div>
          )}
        </div>

        <label className="file-input">
          Choose Photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          className="btn-glow btn-primary"
          disabled={!file || loading}
          onClick={handleUpload}
        >
          {loading ? 'Uploading...' : 'Save & Continue'}
        </button>
        <button className="btn-link" onClick={() => navigate('/dashboard')}>
          Skip for now
        </button>
        <p className="auth-note">Max file size: 2MB.</p>
      </div>
    </div>
  );
}
