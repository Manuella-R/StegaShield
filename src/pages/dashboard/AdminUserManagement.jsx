// src/pages/dashboard/AdminUserManagement.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    role: 'user',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const delayDebounce = setTimeout(() => {
        searchUsers(searchTerm);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      fetchUsers();
    }
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (term) => {
    setLoading(true);
    try {
      const response = await adminAPI.searchUsers(term);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone!`)) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      setMessage(`User "${userName}" deleted successfully`);
      setShowMessage(true);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || 'Failed to delete user');
      setShowMessage(true);
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) {
      return;
    }
    
    try {
      await adminAPI.updateUser(userId, { role: 'admin' });
      setMessage('User promoted to admin successfully');
      setShowMessage(true);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || 'Failed to promote user');
      setShowMessage(true);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await adminAPI.updateUser(editingUser.user_id, formData);
      setMessage('User updated successfully!');
      setShowMessage(true);
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || 'Failed to update user');
      setShowMessage(true);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading users...</div>;
  }

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

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>User Management</h2>

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

      {/* Search Bar */}
      <div style={styles.card}>
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...styles.input,
            width: '100%',
            marginBottom: '1rem',
          }}
        />
      </div>

      {showForm && editingUser && (
        <div style={styles.card}>
          <h3>Edit User: {editingUser.name}</h3>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Role</label>
            <select
              style={styles.select}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="moderator">Moderator</option>
            </select>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={styles.button}>
                Update User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
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
        <p>View and manage user roles, access levels, and account status.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td style={tdStyle}>{user.user_id}</td>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: user.role === 'admin' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(245, 230, 211, 0.2)',
                    color: user.role === 'admin' ? '#ffa500' : 'var(--cream)',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={tdStyle}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Edit
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handlePromoteToAdmin(user.user_id)}
                        style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 165, 0, 0.2)', color: '#ffa500' }}
                      >
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.user_id, user.name)}
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 0, 0, 0.2)', color: '#ff6b6b' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ marginTop: '1rem', color: 'var(--muted-cream)' }}>No users found.</p>
        )}
      </div>
    </div>
  );
}
