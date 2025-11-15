// src/pages/dashboard/AdminFlaggedReports.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';

export default function AdminFlaggedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get flagged reports from admin API
      const response = await adminAPI.getFlaggedReports();
      let filteredReports = response.reports || [];

      if (filter !== 'all') {
        filteredReports = filteredReports.filter(report => 
          report.authenticity_status.toLowerCase() === filter.toLowerCase()
        );
      }

      // Sort by flagged date (most recent first)
      filteredReports.sort((a, b) => new Date(b.flagged_at) - new Date(a.flagged_at));

      setReports(filteredReports);
    } catch (error) {
      console.error('Failed to fetch flagged reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnflag = async (reportId) => {
    if (!window.confirm('Are you sure you want to unflag this report?')) {
      return;
    }
    
    try {
      await adminAPI.unflagReport(reportId);
      alert('Report unflagged successfully');
      fetchReports();
    } catch (error) {
      alert('Failed to unflag report: ' + error.message);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading reports...</div>;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Authentic':
        return 'green';
      case 'Tampered':
        return 'orange';
      case 'Deepfake Suspected':
        return 'red';
      default:
        return 'var(--muted-cream)';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Flagged Reports</h2>

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
          onClick={() => setFilter('tampered')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'tampered' ? 'var(--accent-gold)' : 'transparent',
            color: filter === 'tampered' ? 'var(--dark-red)' : 'var(--cream)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Tampered
        </button>
        <button
          onClick={() => setFilter('deepfake suspected')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'deepfake suspected' ? 'var(--accent-gold)' : 'transparent',
            color: filter === 'deepfake suspected' ? 'var(--dark-red)' : 'var(--cream)',
            border: '1px solid rgba(245, 230, 211, 0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Deepfake Suspected
        </button>
      </div>

      <div style={styles.card}>
        <p>Reports flagged for review due to tampering or deepfake detection.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Report ID</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>File Name</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Confidence Score</th>
              <th style={thStyle}>Flagged Reason</th>
              <th style={thStyle}>Flagged At</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.report_id}>
                <td style={tdStyle}>{report.report_id}</td>
                <td style={tdStyle}>{report.user_name || report.user_email || 'N/A'}</td>
                <td style={tdStyle}>{report.file_name || 'N/A'}</td>
                <td style={{ ...tdStyle, color: getStatusColor(report.authenticity_status) }}>
                  {report.authenticity_status}
                </td>
                <td style={tdStyle}>{(report.confidence_score * 100).toFixed(1)}%</td>
                <td style={tdStyle}>{report.flagged_reason || 'No reason provided'}</td>
                <td style={tdStyle}>{report.flagged_at ? new Date(report.flagged_at).toLocaleString() : 'N/A'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        alert(`Report Details:\nStatus: ${report.authenticity_status}\nConfidence: ${(report.confidence_score * 100).toFixed(1)}%\nFlagged by: ${report.flagged_by_name || 'Unknown'}\nReason: ${report.flagged_reason || 'No reason'}`);
                      }}
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleUnflag(report.report_id)}
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(0, 200, 0, 0.2)', color: '#00c800' }}
                    >
                      Unflag
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && (
          <p style={{ marginTop: '1rem', color: 'var(--muted-cream)' }}>No flagged reports found.</p>
        )}
      </div>
    </div>
  );
}
