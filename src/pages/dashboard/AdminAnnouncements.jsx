// src/pages/dashboard/AdminAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../AuthContext';

export default function AdminAnnouncements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [statusFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? null : statusFilter;
      const response = await adminAPI.getAnnouncements(status);
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setMessage('Failed to load announcements');
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingAnnouncement) {
        // Update existing
        await adminAPI.updateAnnouncement(editingAnnouncement.announcement_id, formData);
        setMessage('Announcement updated successfully!');
      } else {
        // Create new
        await adminAPI.createAnnouncement(formData);
        setMessage('Announcement created successfully!');
      }
      setShowMessage(true);
      setFormData({ title: '', content: '', status: 'draft' });
      setShowForm(false);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      setMessage(error.message || 'Failed to save announcement');
      setShowMessage(true);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      status: announcement.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await adminAPI.deleteAnnouncement(announcementId);
      setMessage('Announcement deleted successfully');
      setShowMessage(true);
      fetchAnnouncements();
    } catch (error) {
      setMessage(error.message || 'Failed to delete announcement');
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
    return <div style={styles.container}>Loading announcements...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={styles.h2}>Announcements Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingAnnouncement(null);
              setFormData({ title: '', content: '', status: 'draft' });
            }
          }}
          style={styles.button}
        >
          {showForm ? 'Cancel' : '+ Create Announcement'}
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

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'draft', 'published', 'archived'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === status ? 'var(--accent-gold)' : 'transparent',
              color: statusFilter === status ? 'var(--dark-red)' : 'var(--cream)',
              border: '1px solid rgba(245, 230, 211, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {status} ({announcements.filter(a => status === 'all' || a.status === status).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3>Create New Announcement</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Title</label>
            <input
              style={styles.input}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Announcement title"
              required
            />

            <label style={styles.label}>Content</label>
            <textarea
              style={styles.input}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Announcement content"
              rows="5"
              required
            />

            <label style={styles.label}>Status</label>
            <select
              style={styles.select}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={styles.button}>
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', status: 'draft' });
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
        <h3>All Announcements</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Content</th>
              <th style={thStyle}>Created By</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map(announcement => (
              <tr key={announcement.announcement_id}>
                <td style={tdStyle}>{announcement.announcement_id}</td>
                <td style={tdStyle}>{announcement.title}</td>
                <td style={tdStyle}>{announcement.content.substring(0, 50)}...</td>
                <td style={tdStyle}>{announcement.created_by_name || 'Admin'}</td>
                <td style={tdStyle}>{new Date(announcement.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: announcement.status === 'published' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                    color: announcement.status === 'published' ? '#00ff00' : '#ffa500',
                  }}>
                    {announcement.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      onClick={() => handleEdit(announcement)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 0, 0, 0.2)', color: '#ff6b6b' }}
                      onClick={() => handleDelete(announcement.announcement_id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
