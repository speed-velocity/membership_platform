import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const API = '/api';

export default function AdminContent() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(null);

  const fetchContent = () => {
    fetch(`${API}/admin/content`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setContent(d.content || []));
  };

  useEffect(() => {
    fetchContent();
    fetch(`${API}/content/categories`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  }, []);

  const createContent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, category: category || 'Uncategorized' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTitle('');
      setDescription('');
      setCategory('');
      setShowForm(false);
      fetchContent();
    } catch (e) {
      alert(e.message);
    }
  };

  const uploadFiles = async (contentId, files) => {
    setUploading(contentId);
    const fd = new FormData();
    if (files.thumbnail) fd.append('thumbnail', files.thumbnail);
    if (files.video1080) fd.append('video1080', files.video1080);
    if (files.video4k) fd.append('video4k', files.video4k);
    try {
      const res = await fetch(`${API}/admin/content/${contentId}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      fetchContent();
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(null);
    }
  };

  const deleteContent = async (id) => {
    if (!confirm('Delete this content?')) return;
    await fetch(`${API}/admin/content/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchContent();
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-header">
        <Link to="/admin" className="back-link">← Admin</Link>
        <h1 className="page-title">Manage Content</h1>
      </div>
      <button className="btn-glow btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginBottom: '1rem' }}>
        {showForm ? 'Cancel' : 'Add Content'}
      </button>
      {showForm && (
        <form onSubmit={createContent} className="glass-card form-card">
          <h3>New Content</h3>
          <div className="form-row">
            <label>Title</label>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="form-row">
            <label>Category</label>
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} list="cats" />
            <datalist id="cats">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <button type="submit" className="btn-glow btn-primary">Create</button>
        </form>
      )}
      <div className="content-grid">
        {content.map((item) => (
          <div key={item.id} className="glass-card content-card" style={{ padding: '1rem' }}>
            <div className="content-thumb" style={{ marginBottom: '0.5rem' }}>
              {item.thumbnail_path ? (
                <img src={`/${item.thumbnail_path}`} alt={item.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <div className="placeholder-thumb" style={{ aspectRatio: '16/9', borderRadius: '8px' }}><span>◆</span></div>
              )}
            </div>
            <h3>{item.title}</h3>
            <p className="content-category">{item.category}</p>
            <div className="upload-form">
              <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFiles(item.id, { thumbnail: e.target.files[0] })} />
              <input type="file" accept="video/*" onChange={(e) => e.target.files[0] && uploadFiles(item.id, { video1080: e.target.files[0] })} placeholder="1080p" />
              <input type="file" accept="video/*" onChange={(e) => e.target.files[0] && uploadFiles(item.id, { video4k: e.target.files[0] })} placeholder="4K" />
            </div>
            {uploading === item.id && <span>Uploading...</span>}
            <button className="btn-glow btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => deleteContent(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
