import React, { useEffect, useState } from 'react';
import './About.css';

const API = '/api';

export default function About() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/users/about`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setContent(d.content || ''))
      .finally(() => setLoading(false));
  }, []);

  const fallback = [
    'Movie Mayhem is a curated membership hub for movie lovers who want faster discovery, smarter weekly picks, and a place to request what they actually want to watch.',
    'Choose a genre, get tailored recommendations, and keep a personal wishlist of titles. Admins review requests and keep the library fresh so your next watch is always close.',
    'Built for simplicity, speed, and a cinematic feel. New picks drop regularly based on what members love most.',
  ];

  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="about-page animate-fade-in">
      <h1 className="page-title">About Movie Mayhem</h1>
      <div className="glass-card about-card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          (paragraphs.length ? paragraphs : fallback).map((text, idx) => (
            <p key={`about-${idx}`}>{text}</p>
          ))
        )}
      </div>
    </div>
  );
}
