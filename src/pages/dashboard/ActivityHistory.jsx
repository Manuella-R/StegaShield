// src/pages/dashboard/ActivityHistory.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI } from '../../utils/api';

export default function ActivityHistory() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Fetch uploads and reports
        const uploadsResponse = await watermarkAPI.getUploads();
        const reportsResponse = await watermarkAPI.getReports();
        
        setHistory(uploadsResponse.uploads || []);
        setReports(reportsResponse.reports || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

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
                              onClick={async () => {
                                const reason = prompt('Why do you think this report is incorrect?');
                                if (reason) {
                                  try {
                                    await watermarkAPI.flagReport(item.report.report_id, reason);
                                    alert('Report flagged successfully! Admin will review it.');
                                    // Refresh data
                                    const reportsResponse = await watermarkAPI.getReports();
                                    setReports(reportsResponse.reports || []);
                                  } catch (error) {
                                    alert('Failed to flag report: ' + error.message);
                                  }
                                }
                              }}
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
    </div>
  );
}