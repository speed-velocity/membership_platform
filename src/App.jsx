import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Payment from './pages/Payment';
import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import ContentPlayer from './pages/ContentPlayer';
import MovieRequests from './pages/MovieRequests';
import Watchlist from './pages/Watchlist';
import FavoriteGenre from './pages/FavoriteGenre';
import AvatarSetup from './pages/AvatarSetup';
import WeeklyPicks from './pages/WeeklyPicks';
import About from './pages/About';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContent from './pages/admin/AdminContent';
import AdminRequests from './pages/admin/AdminRequests';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogins from './pages/admin/AdminLogins';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminActivity from './pages/admin/AdminActivity';

function ProtectedRoute({ children, adminOnly, requireGenre = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader" /></div>;
  if (!user) return <Navigate to={adminOnly ? "/admin/login" : "/login"} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (requireGenre && user.role !== 'admin' && !user.favoriteGenre) {
    return <Navigate to="/onboarding/genre" replace />;
  }
  return children;
}

export default function App() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = null;
    const handleMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--parallax-x', x.toFixed(3));
        root.style.setProperty('--parallax-y', y.toFixed(3));
      });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/onboarding/genre" element={<ProtectedRoute requireGenre={false}><FavoriteGenre /></ProtectedRoute>} />
      <Route path="/onboarding/avatar" element={<ProtectedRoute requireGenre={false}><AvatarSetup /></ProtectedRoute>} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="content" element={<ProtectedRoute><Content /></ProtectedRoute>} />
        <Route path="content/:id" element={<ProtectedRoute><ContentPlayer /></ProtectedRoute>} />
        <Route path="weekly-picks" element={<ProtectedRoute><WeeklyPicks /></ProtectedRoute>} />
        <Route path="watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="requests" element={<ProtectedRoute><MovieRequests /></ProtectedRoute>} />
        <Route path="about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="admin/subscriptions" element={<ProtectedRoute adminOnly><AdminSubscriptions /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/content" element={<ProtectedRoute adminOnly><AdminContent /></ProtectedRoute>} />
        <Route path="admin/requests" element={<ProtectedRoute adminOnly><AdminRequests /></ProtectedRoute>} />
        <Route path="admin/logins" element={<ProtectedRoute adminOnly><AdminLogins /></ProtectedRoute>} />
        <Route path="admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
        <Route path="admin/activity" element={<ProtectedRoute adminOnly><AdminActivity /></ProtectedRoute>} />
        <Route path="admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
