import React from 'react';
import './About.css';

export default function About() {
  return (
    <div className="about-page animate-fade-in">
      <h1 className="page-title">About Movie Mayhem</h1>
      <div className="glass-card about-card">
        <p>
          Movie Mayhem is a curated membership hub for movie lovers who want faster discovery,
          smarter weekly picks, and a place to request what they actually want to watch.
        </p>
        <p>
          Choose a genre, get tailored recommendations, and keep a personal wishlist of titles.
          Admins review requests and keep the library fresh so your next watch is always close.
        </p>
        <p>
          Built for simplicity, speed, and a cinematic feel. New picks drop regularly based on
          what members love most.
        </p>
      </div>
    </div>
  );
}
