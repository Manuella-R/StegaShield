// src/pages/dashboard/AdminFlaggedReports.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { adminAPI } from '../../utils/api';

const FLAG_CATEGORIES = [
  { value: 'inaccurate', label: 'Inaccurate Report' },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'other', label: 'Other' },
];

export default function AdminFlaggedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewModal, setViewModal] = useState({ open: false, report: null });
  const [unflagModal, setUnflagModal] = useState({ open: false, reportId: null, report: null });

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get flagged reports from admin API with category filter
      const category = categoryFilter !== 'all' ? categoryFilter : null;
      const response = await adminAPI.getFlaggedReports(category);
      let filteredReports = response.reports || [];

      if (statusFilter !== 'all') {
        filteredReports = filteredReports.filter(report => 
          report.authenticity_status.toLowerCase() === statusFilter.toLowerCase()
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

  const handleUnflag = async () => {
    if (!unflagModal.reportId) return;
    
    try {
      await adminAPI.unflagReport(unflagModal.reportId);
      setUnflagModal({ open: false, reportId: null, report: null });
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

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: 'var(--cream)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Filter by Status:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                background: statusFilter === 'all' ? 'var(--accent-gold)' : 'transparent',
                color: statusFilter === 'all' ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter('tampered')}
              style={{
                padding: '0.5rem 1rem',
                background: statusFilter === 'tampered' ? 'var(--accent-gold)' : 'transparent',
                color: statusFilter === 'tampered' ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Tampered
            </button>
            <button
              onClick={() => setStatusFilter('deepfake suspected')}
              style={{
                padding: '0.5rem 1rem',
                background: statusFilter === 'deepfake suspected' ? 'var(--accent-gold)' : 'transparent',
                color: statusFilter === 'deepfake suspected' ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Deepfake Suspected
            </button>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--cream)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Filter by Flag Category:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoryFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                background: categoryFilter === 'all' ? 'var(--accent-gold)' : 'transparent',
                color: categoryFilter === 'all' ? 'var(--dark-red)' : 'var(--cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              All Categories
            </button>
            {FLAG_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: categoryFilter === cat.value ? 'var(--accent-gold)' : 'transparent',
                  color: categoryFilter === cat.value ? 'var(--dark-red)' : 'var(--cream)',
                  border: '1px solid rgba(245, 230, 211, 0.2)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
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
              <th style={thStyle}>Category</th>
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
                <td style={tdStyle}>
                  {report.flag_category ? (
                    FLAG_CATEGORIES.find(c => c.value === report.flag_category)?.label || report.flag_category
                  ) : 'N/A'}
                </td>
                <td style={tdStyle}>{report.flagged_reason || 'No reason provided'}</td>
                <td style={tdStyle}>{report.flagged_at ? new Date(report.flagged_at).toLocaleString() : 'N/A'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setViewModal({ open: true, report })}
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setUnflagModal({ open: true, reportId: report.report_id, report })}
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

      {/* View Report Details Modal */}
      {viewModal.open && viewModal.report && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 230, 211, 0.3)',
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-gold)', fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              Report Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Report ID:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>{viewModal.report.report_id}</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>User:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>{viewModal.report.user_name || viewModal.report.user_email || 'N/A'}</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>File Name:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>{viewModal.report.file_name || 'N/A'}</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Authenticity Status:</strong>
                <span style={{ color: getStatusColor(viewModal.report.authenticity_status) }}>
                  {viewModal.report.authenticity_status}
                </span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Confidence Score:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>{(viewModal.report.confidence_score * 100).toFixed(1)}%</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Flag Category:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>
                  {viewModal.report.flag_category ? (
                    FLAG_CATEGORIES.find(c => c.value === viewModal.report.flag_category)?.label || viewModal.report.flag_category
                  ) : 'N/A'}
                </span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Flagged By:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>{viewModal.report.flagged_by_name || 'Unknown'}</span>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Flagged Reason:</strong>
                <p style={{ color: 'var(--muted-cream)', margin: 0, padding: '0.75rem', background: 'rgba(245, 230, 211, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 230, 211, 0.1)' }}>
                  {viewModal.report.flagged_reason || 'No reason provided'}
                </p>
              </div>
              
              <div>
                <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Flagged At:</strong>
                <span style={{ color: 'var(--muted-cream)' }}>
                  {viewModal.report.flagged_at ? new Date(viewModal.report.flagged_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              
              {viewModal.report.created_at && (
                <div>
                  <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: '0.25rem' }}>Report Created:</strong>
                  <span style={{ color: 'var(--muted-cream)' }}>
                    {new Date(viewModal.report.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setViewModal({ open: false, report: null })}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unflag Confirmation Modal */}
      {unflagModal.open && unflagModal.report && (
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
            maxWidth: '500px',
            width: '90%',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 230, 211, 0.3)',
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-gold)', fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 600 }}>
              Unflag Report
            </h3>
            <p style={{ color: 'var(--cream)', marginBottom: '1.5rem' }}>
              Are you sure you want to unflag Report #{unflagModal.reportId}?
            </p>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              This will mark the report as resolved and remove it from the flagged reports list.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUnflagModal({ open: false, reportId: null, report: null })}
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
                onClick={handleUnflag}
                style={{
                  padding: '0.875rem 2rem',
                  background: '#00c800',
                  color: '#0a0202',
                  border: '2px solid #00c800',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0, 200, 0, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 200, 0, 0.5)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 200, 0, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Confirm Unflag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
