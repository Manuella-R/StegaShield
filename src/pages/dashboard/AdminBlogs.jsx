// src/pages/dashboard/AdminBlogs.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../AuthContext';

export default function AdminBlogs() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'technology',
    author: currentUser?.name || '',
    image_emoji: '📝',
    status: 'draft',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const categories = ['all', 'deepfakes', 'watermarking', 'ai', 'journalism', 'technology'];

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (currentUser?.name) {
      setFormData(prev => ({ ...prev, author: currentUser.name }));
    }
  }, [currentUser]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? null : statusFilter;
      const category = categoryFilter === 'all' ? null : categoryFilter;
      const response = await adminAPI.getBlogs(status, category);
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      setMessage('Failed to load blog posts');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingPost) {
        // Update existing
        await adminAPI.updateBlog(editingPost.post_id, formData);
        setMessage('Blog post updated successfully!');
      } else {
        // Create new
        await adminAPI.createBlog(formData);
        setMessage('Blog post created successfully!');
      }
      setShowMessage(true);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: 'technology',
        author: currentUser?.name || '',
        image_emoji: '📝',
        status: 'draft',
      });
      setShowForm(false);
      setEditingPost(null);
      fetchBlogs();
    } catch (error) {
      setMessage(error.message || 'Failed to save blog post');
      setShowMessage(true);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      category: post.category,
      author: post.author,
      image_emoji: post.image_emoji || '📝',
      status: post.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await adminAPI.deleteBlog(postId);
      setMessage('Blog post deleted successfully');
      setShowMessage(true);
      fetchBlogs();
    } catch (error) {
      setMessage(error.message || 'Failed to delete blog post');
      setShowMessage(true);
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  };

  const thStyle = {
    borderBottom: '2px solid rgba(245, 230, 211, 0.2)',
    padding: '0.75rem',
    textAlign: 'left',
    background: 'rgba(245, 230, 211, 0.1)',
    color: 'var(--cream)',
  };

  const tdStyle = {
    borderBottom: '1px solid rgba(245, 230, 211, 0.1)',
    padding: '0.75rem',
    color: 'var(--muted-cream)',
  };

  if (loading) {
    return <div style={styles.container}>Loading blog posts...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={styles.h2}>Blog Posts Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingPost(null);
              setFormData({
                title: '',
                excerpt: '',
                content: '',
                category: 'technology',
                author: currentUser?.name || '',
                image_emoji: '📝',
                status: 'draft',
              });
            }
          }}
          style={styles.button}
        >
          {showForm ? 'Cancel' : '+ Create Blog Post'}
        </button>
      </div>

      {showMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'rgba(245, 230, 211, 0.1)',
          border: '1px solid rgba(245, 230, 211, 0.3)',
          borderRadius: '8px',
          color: 'var(--accent-gold)',
        }}>
          {message}
          <button onClick={() => setShowMessage(false)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '0.5rem', color: 'var(--cream)' }}>Status:</label>
          {['all', 'draft', 'published', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                background: statusFilter === status ? 'var(--accent-gold)' : 'transparent',
                color: statusFilter === status ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {status}
            </button>
          ))}
        </div>
        <div>
          <label style={{ marginRight: '0.5rem', color: 'var(--cream)' }}>Category:</label>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                background: categoryFilter === category ? 'var(--accent-gold)' : 'transparent',
                color: categoryFilter === category ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3>{editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Title *</label>
            <input
              style={styles.input}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Blog post title"
              required
            />

            <label style={styles.label}>Excerpt</label>
            <textarea
              style={styles.input}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short excerpt/preview text"
              rows="2"
            />

            <label style={styles.label}>Content *</label>
            <textarea
              style={styles.input}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full blog post content"
              rows="10"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={styles.label}>Category *</label>
                <select
                  style={styles.select}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Author *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={styles.label}>Image Emoji</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.image_emoji}
                  onChange={(e) => setFormData({ ...formData, image_emoji: e.target.value })}
                  placeholder="📝"
                  maxLength={2}
                />
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={styles.button}>
                {editingPost ? 'Update Blog Post' : 'Create Blog Post'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  setFormData({
                    title: '',
                    excerpt: '',
                    content: '',
                    category: 'technology',
                    author: currentUser?.name || '',
                    image_emoji: '📝',
                    status: 'draft',
                  });
                }}
                style={{ ...styles.button, background: 'rgba(245, 230, 211, 0.1)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.card}>
        <h3>All Blog Posts</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Author</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Views</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '2rem' }}>
                  No blog posts found
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.post_id}>
                  <td style={tdStyle}>{post.post_id}</td>
                  <td style={tdStyle}>{post.title}</td>
                  <td style={tdStyle}>
                    <span style={{ textTransform: 'capitalize' }}>{post.category}</span>
                  </td>
                  <td style={tdStyle}>{post.author}</td>
                  <td style={tdStyle}>{post.date || new Date(post.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>{post.views || 0}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: post.status === 'published' ? 'rgba(0, 255, 0, 0.2)' : post.status === 'draft' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                      color: post.status === 'published' ? '#00ff00' : post.status === 'draft' ? '#ffa500' : '#808080',
                    }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => handleEdit(post)}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 0, 0, 0.2)', color: '#ff6666' }}
                        onClick={() => handleDelete(post.post_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

