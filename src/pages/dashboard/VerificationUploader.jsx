// src/pages/dashboard/VerificationUploader.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI } from '../../utils/api';

export default function VerificationUploader() {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageHash, setImageHash] = useState(null);

  // Generate simple hash for demo (in production, use proper hashing)
  const generateImageHash = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        let hash = 0;
        for (let i = 0; i < bytes.length; i++) {
          hash = ((hash << 5) - hash) + bytes[i];
          hash = hash & hash;
        }
        resolve(Math.abs(hash).toString(16));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      // Generate hash
      const hash = await generateImageHash(file);
      setImageHash(hash);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      alert('Please select an image to verify.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      if (!currentUser) {
        alert('Please log in to use this feature.');
        return;
      }

      // Call API
      const response = await watermarkAPI.verify(selectedFile);
      setResult({
        success: response.authenticity_status === 'Authentic',
        message: `Verification completed: ${response.authenticity_status}`,
        authenticity_score: response.confidence_score,
        authenticity_status: response.authenticity_status,
        report_id: response.report_id,
        upload_id: response.upload_id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Verification Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Authentic':
        return { bg: 'rgba(0, 255, 0, 0.1)', border: 'rgba(0, 255, 0, 0.4)', text: '#00ff00', icon: '✅' };
      case 'Tampered':
        return { bg: 'rgba(255, 165, 0, 0.1)', border: 'rgba(255, 165, 0, 0.4)', text: '#ffa500', icon: '⚠️' };
      case 'Deepfake Suspected':
        return { bg: 'rgba(255, 0, 0, 0.1)', border: 'rgba(255, 0, 0, 0.4)', text: '#ff0000', icon: '❌' };
      default:
        return { bg: 'rgba(128, 128, 128, 0.1)', border: 'rgba(128, 128, 128, 0.4)', text: '#808080', icon: '❓' };
    }
  };

  const getProgressColor = (score) => {
    if (score >= 80) return '#00ff00';
    if (score >= 50) return '#ffa500';
    return '#ff0000';
  };

  const downloadReport = (format = 'json') => {
    if (!result) return;

    const report = {
      image_hash: imageHash,
      upload_id: result.upload_id,
      user_id: currentUser?.user_id || 'N/A',
      user_email: currentUser?.email || 'N/A',
      date_time: result.timestamp || new Date().toISOString(),
      watermark_type: 'Unknown', // Would come from API in production
      authenticity_status: result.authenticity_status,
      authenticity_score: result.authenticity_score,
      confidence_score: result.authenticity_score,
      suspected_attack_type: result.authenticity_status === 'Authentic' ? 'None' : 
                            result.authenticity_status === 'Tampered' ? 'Manipulation detected' : 
                            'Deepfake suspected',
      report_id: result.report_id,
      verification_date: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification_report_${result.report_id || Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // PDF would require a library like jsPDF
      alert('PDF export coming soon! For now, use JSON export.');
    }
  };

  const statusColors = result ? getStatusColor(result.authenticity_status) : null;
  const progressColor = result ? getProgressColor(result.authenticity_score) : '#808080';

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Verify Image Authenticity</h2>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>1. Upload Image</h3>
          <p>Upload a suspected image to check its authenticity.</p>
          <input
            style={styles.input}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                borderRadius: '16px',
                marginBottom: '1rem',
                border: '1px solid rgba(245, 230, 211, 0.16)',
              }}
            />
          )}
          <button
            style={styles.button}
            onClick={handleVerify}
            disabled={isProcessing || !selectedFile}
          >
            {isProcessing ? 'Verifying...' : 'Run Verification'}
          </button>
        </div>

        <div style={styles.card}>
          <h3>2. Verification Result</h3>
          <div
            style={{
              minHeight: '300px',
              background: 'rgba(10, 2, 2, 0.6)',
              borderRadius: '16px',
              border: '1px solid rgba(245, 230, 211, 0.12)',
              padding: '1.25rem',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.35)',
            }}
          >
            {isProcessing && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '3px solid rgba(245, 230, 211, 0.2)',
                  borderTop: '3px solid var(--accent-gold)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }} />
                <p style={{ color: 'var(--muted-cream)', marginTop: '1rem' }}>Analyzing image, please wait...</p>
              </div>
            )}

            {result && (
              <div>
                {/* Traffic Light Card */}
                <div style={{
                  background: statusColors.bg,
                  border: `3px solid ${statusColors.border}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    {statusColors.icon}
                  </div>
                  <h3 style={{
                    color: statusColors.text,
                    margin: '0.5rem 0',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}>
                    {result.authenticity_status}
                  </h3>
                  <p style={{ color: 'var(--muted-cream)', marginTop: '0.5rem' }}>
                    {result.authenticity_status === 'Authentic' && 'This image appears to be authentic and untampered.'}
                    {result.authenticity_status === 'Tampered' && 'Warning: This image shows signs of manipulation.'}
                    {result.authenticity_status === 'Deepfake Suspected' && 'Critical: This image may be a deepfake or AI-generated content.'}
                  </p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--cream)', fontWeight: 'bold' }}>Confidence Score</span>
                    <span style={{ color: statusColors.text, fontWeight: 'bold' }}>
                      {result.authenticity_score}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: 'rgba(245, 230, 211, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(245, 230, 211, 0.2)',
                  }}>
                    <div style={{
                      width: `${result.authenticity_score}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${progressColor}, ${progressColor}dd)`,
                      borderRadius: '12px',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '0.5rem',
                    }}>
                      {result.authenticity_score < 15 && (
                        <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {result.authenticity_score}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div style={{
                  background: 'rgba(245, 230, 211, 0.05)',
                  border: '1px solid rgba(245, 230, 211, 0.1)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--cream)' }}>Report ID:</strong>{' '}
                    <span style={{ color: 'var(--muted-cream)' }}>{result.report_id || 'N/A'}</span>
                  </div>
                  {imageHash && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--cream)' }}>Image Hash:</strong>{' '}
                      <span style={{ color: 'var(--muted-cream)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {imageHash.substring(0, 16)}...
                      </span>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--cream)' }}>Verified:</strong>{' '}
                    <span style={{ color: 'var(--muted-cream)' }}>
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => downloadReport('json')}
                    style={{
                      ...styles.button,
                      background: 'rgba(245, 230, 211, 0.2)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(245, 230, 211, 0.3)',
                      flex: '1',
                      minWidth: '150px',
                    }}
                  >
                    📄 Download Report (JSON)
                  </button>
                  <button
                    onClick={() => downloadReport('pdf')}
                    style={{
                      ...styles.button,
                      background: 'rgba(245, 230, 211, 0.2)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(245, 230, 211, 0.3)',
                      flex: '1',
                      minWidth: '150px',
                    }}
                  >
                    📑 Export PDF (Coming Soon)
                  </button>
                  <button
                    onClick={async () => {
                      const reason = prompt('Why do you think this report is incorrect?');
                      if (reason) {
                        try {
                          await watermarkAPI.flagReport(result.report_id, reason);
                          alert('Report flagged successfully! Admin will review it.');
                        } catch (error) {
                          alert('Failed to flag report: ' + error.message);
                        }
                      }
                    }}
                    style={{
                      ...styles.button,
                      background: 'rgba(255, 165, 0, 0.2)',
                      color: '#ffa500',
                      border: '1px solid rgba(255, 165, 0, 0.3)',
                    }}
                  >
                    🚩 Flag as Incorrect
                  </button>
                </div>
              </div>
            )}

            {!isProcessing && !result && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-cream)' }}>
                <p>Upload an image and click "Run Verification" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
