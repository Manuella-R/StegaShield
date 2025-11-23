// src/pages/dashboard/AdminSecurityLogs.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getLogs(1000);
      let filteredLogs = response.logs || [];

      if (filter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(filter.toLowerCase()));
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading logs...</div>;
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
    fontSize: '0.9rem',
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Security & Activity Logs</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'all' ? 'var(--accent-gold)' : 'transparent',
            color: filter === 'all' ? 'var(--dark-red)' : 'var(--cream)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilter('login')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'login' ? 'var(--accent-gold)' : 'transparent',
            color: filter === 'login' ? 'var(--dark-red)' : 'var(--cream)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setFilter('admin')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'admin' ? 'var(--accent-gold)' : 'transparent',
            color: filter === 'admin' ? 'var(--dark-red)' : 'var(--cream)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Admin Actions
        </button>
      </div>

      <div style={styles.card}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>User ID</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>IP Address</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.log_id}>
                <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={tdStyle}>{log.user_id || 'N/A'}</td>
                <td style={tdStyle}>{log.action}</td>
                <td style={tdStyle}>{log.ip_address || 'N/A'}</td>
                <td style={tdStyle}>
                  {log.details ? (
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--accent-gold)' }}>View Details</summary>
                      <pre style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted-cream)' }}>
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p style={{ marginTop: '1rem', color: 'var(--muted-cream)' }}>No logs found.</p>
        )}
      </div>
    </div>
  );
}
