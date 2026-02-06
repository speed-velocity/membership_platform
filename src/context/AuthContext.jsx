import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u) => {
    if (!u) return u;
    return {
      ...u,
      favoriteGenre: u.favoriteGenre ?? u.favorite_genre ?? null,
    };
  };

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { error: text };
    }
    if (!res.ok) {
      throw new Error(data?.error || 'Request failed');
    }
    return data;
  };

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(normalizeUser(data.user));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await fetchJson(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    setUser(normalizeUser(data.user));
    return data;
  };

  const register = async (email, password, fullName) => {
    const data = await fetchJson(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, fullName }),
    });
    setUser(normalizeUser(data.user));
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await fetchJson(`${API}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    setUser(normalizeUser(data.user));
    return data;
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const setUserFavoriteGenre = async (genre) => {
    const data = await fetchJson(`${API}/users/favorite-genre`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ genre }),
    });
    setUser((prev) => (prev ? { ...prev, favoriteGenre: data.favoriteGenre } : prev));
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, adminLogin, logout, setUserFavoriteGenre }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
