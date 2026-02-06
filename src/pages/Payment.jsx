import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Payment.css';

const API = '/api';

const PLANS = [
  { id: 'Basic', price: 10, desc: '1080p streaming' },
];

const DURATIONS = [1, 3, 6, 12];

export default function Payment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [plan, setPlan] = useState('Basic');
  const [months, setMonths] = useState(1);
  const [qrTapped, setQrTapped] = useState(false);
  const [fullName, setFullName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (user?.role === 'admin') navigate('/dashboard');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'user') return;
    fetch(`${API}/users/dashboard`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setDashboard)
      .finally(() => setDashLoading(false));
  }, [user]);

  const selectedPlan = PLANS.find((p) => p.id === plan);
  const total = selectedPlan ? (selectedPlan.price * months).toFixed(2) : '0';
  const canSubmit = qrTapped && fullName.trim() && telegram.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/payment/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan,
          months,
          fullName,
          telegramUsername: telegram,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="loading-screen"><div className="loader" /></div>;

  if (dashLoading) return <div className="loading-screen"><div className="loader" /></div>;

  if (dashboard?.hasSubscription) {
    const start = new Date(dashboard.startDate);
    const expiry = new Date(dashboard.expiryDate);
    const totalDays = Math.max(1, Math.ceil((expiry - start) / (1000 * 60 * 60 * 24)));
    const remaining = Math.max(0, Number(dashboard.remainingDays || 0));
    const progress = Math.min(1, remaining / totalDays);
    return (
      <div className="payment-page animate-fade-in">
        <h1 className="page-title">Manage Subscription</h1>
        <p className="payment-subtitle">You are currently subscribed. Thank you!</p>
        <div className="subscription-status glass-card">
          <div className="status-ring" style={{ '--progress': progress }}>
            <div className="status-inner">
              <span className="status-days">{remaining}</span>
              <span className="status-label">days left</span>
            </div>
          </div>
          <div className="status-details">
            <h3>{dashboard.plan}</h3>
            <p>Start: {dashboard.startDate}</p>
            <p>Expiry: {dashboard.expiryDate}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-page">
        <div className="payment-success glass-card">
          <span className="success-icon">✓</span>
          <h2>Payment Successful!</h2>
          <p>Your subscription is now active. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page animate-fade-in">
      <h1 className="page-title">Subscribe</h1>
      <p className="payment-subtitle">Choose your plan and complete payment</p>
      <div className="payment-layout">
        <div className="payment-plans glass-card">
          <h3>Select Plan</h3>
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`plan-option ${plan === p.id ? 'active' : ''}`}
              onClick={() => setPlan(p.id)}
            >
              <span className="plan-name">{p.id}</span>
              <span className="plan-price">₹{p.price}/mo</span>
              <span className="plan-desc">{p.desc}</span>
            </button>
          ))}
          <div className="duration-select">
            <label>Duration</label>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {DURATIONS.map((m) => (
                <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="total-row">
            <span>Total</span>
            <span className="total-amount">₹{total}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="payment-form glass-card">
          <h3>Scan the QR to make the payment</h3>
          <p className="payment-note">Simulated payment — no real charges</p>
          <button
            type="button"
            className={`qr-button ${qrTapped ? 'tapped' : ''}`}
            onClick={() => setQrTapped(true)}
            aria-label="Tap the QR code to continue"
          >
            <img
              src="/qr.png"
              alt="UPI QR code for payment"
              className="qr-image"
            />
            <span className="qr-caption">
              {qrTapped ? 'Thanks! Please enter your details below.' : 'Tap the QR code to continue'}
            </span>
          </button>
          {qrTapped && (
            <>
              <input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                placeholder="Telegram username (e.g. @yourname)"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                required
              />
            </>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-glow btn-primary" disabled={submitting || !canSubmit}>
            {submitting ? 'Processing...' : `Pay ₹${total}`}
          </button>
        </form>
      </div>
    </div>
  );
}
