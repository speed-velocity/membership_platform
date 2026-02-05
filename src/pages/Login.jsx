import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import PosterWall from '../components/PosterWall';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStage, setOtpStage] = useState('request');
  const [mode, setMode] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, requestOtp, verifyOtp, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'password') {
        const data = await login(email, password);
        if (data?.user?.role === 'admin') {
          setError('Use the admin login at /admin/login');
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      } else if (otpStage === 'request') {
        await requestOtp(email);
        setOtpStage('verify');
      } else {
        await verifyOtp(email, otp);
        navigate('/dashboard');
      }
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
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Movie Mayhem experience</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode === 'password' ? (
            <PasswordInput
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          ) : (
            <>
              {otpStage === 'verify' && (
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              )}
            </>
          )}
          <button type="submit" className="btn-glow btn-primary" disabled={loading}>
            {loading
              ? 'Signing in...'
              : mode === 'password'
                ? 'Sign In'
                : otpStage === 'request'
                  ? 'Send Code'
                  : 'Verify Code'}
          </button>
        </form>
        <div className="auth-switch">
          <button
            type="button"
            className="btn-glow btn-secondary"
            onClick={() => {
              setMode((m) => (m === 'password' ? 'otp' : 'password'));
              setOtpStage('request');
              setOtp('');
              setError('');
            }}
          >
            {mode === 'password' ? 'Use Email OTP' : 'Use Password'}
          </button>
        </div>
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
          {' · '}
          <Link to="/admin/login">Admin login</Link>
        </p>
        <p className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
