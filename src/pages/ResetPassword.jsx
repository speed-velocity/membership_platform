import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import PosterWall from '../components/PosterWall';
import './Auth.css';

const API = '/api';

export default function ResetPassword() {
  const [search] = useSearchParams();
  const token = search.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <PosterWall />
      <div className="auth-card glass-card animate-fade-in">
        <div className="brand-mark">Movie Mayhem</div>
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {done && <div className="auth-success">Password updated. Redirecting…</div>}
          <PasswordInput
            placeholder="New password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" className="btn-glow btn-primary" disabled={loading || !token}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
