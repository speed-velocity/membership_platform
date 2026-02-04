import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/PasswordInput';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, adminLogin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'admin') navigate('/admin/subscriptions');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/admin/subscriptions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card glass-card animate-fade-in">
        <div className="admin-login-header">
          <span className="admin-lock-icon">🔐</span>
          <h1>Admin Access</h1>
          <p>Administrator login only</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-glow btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Sign In as Admin'}
          </button>
        </form>
        <p className="admin-login-footer">
          <Link to="/login">← Member login</Link>
        </p>
      </div>
    </div>
  );
}
