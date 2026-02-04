import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const API = '/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/direct-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="poster-wall" aria-hidden="true">
        <div className="poster-col">
          <div className="poster-card tall" />
          <div className="poster-card" />
          <div className="poster-card short" />
          <div className="poster-card" />
          <div className="poster-card tall" />
        </div>
        <div className="poster-col">
          <div className="poster-card" />
          <div className="poster-card short" />
          <div className="poster-card tall" />
          <div className="poster-card" />
          <div className="poster-card" />
        </div>
        <div className="poster-col">
          <div className="poster-card short" />
          <div className="poster-card tall" />
          <div className="poster-card" />
          <div className="poster-card" />
          <div className="poster-card tall" />
        </div>
        <div className="poster-col">
          <div className="poster-card" />
          <div className="poster-card tall" />
          <div className="poster-card short" />
          <div className="poster-card" />
          <div className="poster-card" />
        </div>
        <div className="poster-col">
          <div className="poster-card tall" />
          <div className="poster-card" />
          <div className="poster-card short" />
          <div className="poster-card" />
          <div className="poster-card tall" />
        </div>
      </div>
      <div className="auth-card glass-card animate-fade-in">
        <div className="brand-mark">Movie Mayhem</div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your email and set a new password.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {sent && <div className="auth-success">Password updated. You can sign in now.</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" className="btn-glow btn-primary" disabled={loading}>
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
