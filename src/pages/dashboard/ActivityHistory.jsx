// src/pages/dashboard/ActivityHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI } from '../../utils/api';

const FLAG_CATEGORIES = [
  { value: 'inaccurate', label: 'Inaccurate report - please analyze the report again' },
  { value: 'false_positive', label: 'False positive detection' },
  { value: 'technical_issue', label: 'Technical issue with verification' },
  { value: 'other', label: 'Other' },
];

export default function ActivityHistory() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [flagHistory, setFlagHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagModal, setFlagModal] = useState({ open: false, reportId: null });
  const [flagCategory, setFlagCategory] = useState('');
  const [flagReason, setFlagReason] = useState('');

  const loadActivity = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentUser) {
        setHistory([]);
        setReports([]);
        setFlagHistory([]);
        setLoading(false);
        return;
      }

      const [uploadsResponse, reportsResponse, flagHistoryResponse] = await Promise.all([
        watermarkAPI.getUploads(),
        watermarkAPI.getReports(),
        watermarkAPI.getFlagHistory(),
      ]);

      setHistory(uploadsResponse.uploads || []);
      setReports(reportsResponse.reports || []);
      setFlagHistory(flagHistoryResponse.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const openFlagModal = (reportId) => {
    setFlagModal({ open: true, reportId });
    setFlagCategory('');
    setFlagReason('');
  };

  const closeFlagModal = () => {
    setFlagModal({ open: false, reportId: null });
    setFlagCategory('');
    setFlagReason('');
  };

  const handleFlagReport = async () => {
    if (!flagCategory) {
      alert('Please select a flag category.');
      return;
    }
    if (!flagReason || flagReason.trim().length < 5) {
      alert('Please provide a reason (minimum 5 characters).');
      return;
    }
    try {
      await watermarkAPI.flagReport(flagModal.reportId, flagReason, flagCategory);
      alert('Report flagged successfully! Admin will review it.');
      closeFlagModal();
      await loadActivity();
    } catch (error) {
      alert('Failed to flag report: ' + error.message);
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  };
  
  const thStyle = {
    borderBottom: '2px solid #ddd',
    padding: '0.75rem',
    textAlign: 'left',
    background: '#f9f9f9',
  };

  const tdStyle = {
    borderBottom: '1px solid #eee',
    padding: '0.75rem',
  };

  // Combine uploads and reports for display
  const combinedHistory = history.map(upload => {
    const report = reports.find(r => r.upload_id === upload.upload_id);
    return {
      ...upload,
      report,
    };
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Activity History</h2>
      <div style={styles.card}>
        <p>Your watermarking and verification logs.</p>
        {loading ? (
          <p>Loading history...</p>
        ) : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>File Name</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Result</th>
                </tr>
              </thead>
              <tbody>
                {combinedHistory.map(item => (
                  <tr key={item.upload_id}>
                    <td style={tdStyle}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={tdStyle}>{item.operation_type === 'embed' ? 'Watermark' : 'Verify'}</td>
                    <td style={tdStyle}>{item.file_name}</td>
                    <td style={{ ...tdStyle, color: item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'orange' }}>
                      {item.status}
                    </td>
                    <td style={tdStyle}>
                      {item.report && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            color: item.report.authenticity_status === 'Authentic' ? 'green' : 
                                   item.report.authenticity_status === 'Tampered' ? 'orange' : 'red'
                          }}>
                            {item.report.authenticity_status} ({(item.report.confidence_score * 100).toFixed(0)}%)
                          </span>
                          {item.report.is_flagged ? (
                            <span style={{ color: '#ffa500', fontSize: '0.9rem' }}>🚩 Flagged</span>
                          ) : (
                          <button
                              onClick={() => openFlagModal(item.report.report_id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                background: 'rgba(255, 165, 0, 0.2)',
                                color: '#ffa500',
                                border: '1px solid rgba(255, 165, 0, 0.3)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              🚩 Flag
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {combinedHistory.length === 0 && (
              <p style={{ marginTop: '1rem', color: 'var(--muted-cream)' }}>No activity history yet.</p>
            )}
          </>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '1.25rem' }}>
        <h3>Flagged Report History</h3>
        <p style={{ color: 'var(--muted-cream)' }}>
          Track every report you flagged and see whether it’s still under review or resolved by the team.
        </p>
        {loading ? (
          <p>Loading flagged history...</p>
        ) : flagHistory.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--muted-cream)' }}>You haven’t flagged any reports yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Flagged On</th>
                <th style={thStyle}>Report</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {flagHistory.map((entry) => {
                const getStatusInfo = (status) => {
                  switch (status) {
                    case 'pending':
                      return { label: 'Pending', color: '#ffa500', bg: 'rgba(255, 165, 0, 0.15)' };
                    case 'in_review':
                      return { label: 'In Review', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)' };
                    case 'resolved':
                      return { label: 'Resolved', color: '#00aa88', bg: 'rgba(0, 170, 136, 0.15)' };
                    case 'dismissed':
                      return { label: 'Dismissed', color: '#ff4d4f', bg: 'rgba(255, 77, 79, 0.15)' };
                    case 'open':
                      return { label: 'Open', color: '#ffa500', bg: 'rgba(255, 165, 0, 0.15)' };
                    default:
                      return { label: status || 'Unknown', color: '#999', bg: 'rgba(153, 153, 153, 0.15)' };
                  }
                };
                const statusInfo = getStatusInfo(entry.status);
                return (
                  <tr key={entry.history_id}>
                    <td style={tdStyle}>{new Date(entry.created_at).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>Report #{entry.report_id}</span>
                        <span style={{ color: entry.authenticity_status === 'Authentic' ? 'green' : entry.authenticity_status === 'Tampered' ? '#ffa500' : '#ff4d4f', fontSize: '0.9rem' }}>
                          {entry.authenticity_status} ({Math.round((entry.confidence_score ?? 0) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {entry.flag_category ? (
                        FLAG_CATEGORIES.find(c => c.value === entry.flag_category)?.label || entry.flag_category
                      ) : 'N/A'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span>{entry.reason || 'No reason supplied'}</span>
                        {entry.current_flag_reason && entry.current_flag_reason !== entry.reason && (
                          <small style={{ color: 'var(--muted-cream)' }}>Current note: {entry.current_flag_reason}</small>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}>
                        {statusInfo.label}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.5rem' }}>
                        {entry.resolution_notes && (
                          <small style={{ color: 'var(--muted-cream)' }}>
                            Notes: {entry.resolution_notes}
                          </small>
                        )}
                        {entry.resolved_at && (
                          <small style={{ color: 'var(--muted-cream)' }}>
                            {entry.resolved_by_name
                              ? `By ${entry.resolved_by_name} • `
                              : ''}
                            {new Date(entry.resolved_at).toLocaleString()}
                          </small>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Flag Report Modal */}
      {flagModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#0a0202',
            padding: '2.5rem',
            borderRadius: '12px',
            maxWidth: '550px',
            width: '90%',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 230, 211, 0.3)',
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-gold)', fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>Flag Report</h3>
            <p style={{ color: 'var(--cream)', marginBottom: '2rem', fontSize: '1rem' }}>
              Please select a category and provide a reason for flagging this report.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--cream)', marginBottom: '0.75rem', fontWeight: 600, fontSize: '1.05rem' }}>
                Category *
              </label>
              <select
                value={flagCategory}
                onChange={(e) => setFlagCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#1a0a0a',
                  border: '2px solid rgba(245, 230, 211, 0.4)',
                  borderRadius: '6px',
                  color: flagCategory ? 'var(--cream)' : 'var(--muted-cream)',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                <option value="" style={{ background: '#1a0a0a', color: 'var(--muted-cream)' }}>Select a category...</option>
                {FLAG_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} style={{ background: 'white', color: '#000' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: 'var(--cream)', marginBottom: '0.75rem', fontWeight: 600, fontSize: '1.05rem' }}>
                Reason * (minimum 5 characters)
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Please describe why you think this report is incorrect..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#1a0a0a',
                  border: '2px solid rgba(245, 230, 211, 0.4)',
                  borderRadius: '6px',
                  color: 'var(--cream)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={closeFlagModal}
                style={{
                  padding: '0.875rem 2rem',
                  background: '#1a0a0a',
                  color: 'var(--cream)',
                  border: '2px solid rgba(245, 230, 211, 0.5)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#2a1a1a';
                  e.target.style.borderColor = 'rgba(245, 230, 211, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1a0a0a';
                  e.target.style.borderColor = 'rgba(245, 230, 211, 0.5)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagReport}
                style={{
                  padding: '0.875rem 2rem',
                  background: 'var(--accent-gold)',
                  color: 'var(--dark-red)',
                  border: '2px solid var(--accent-gold)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(245, 230, 211, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 16px rgba(245, 230, 211, 0.5)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(245, 230, 211, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Flag Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}