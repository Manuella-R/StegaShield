// src/pages/dashboard/VerificationUploader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI } from '../../utils/api';

const PROFILE_OPTIONS = {
  robust: {
    name: 'Robust',
    description: 'Best when the watermark needs to survive reposts and compression.',
  },
  semi_fragile: {
    name: 'Semi-Fragile',
    description: 'Flags subtle edits and provides forensic bit accuracy metrics.',
  },
  hybrid: {
    name: 'Hybrid',
    description: 'Runs semi-fragile + robust verifiers for double assurance.',
  },
};

const PLATFORM_PROFILES = {
  standard: {
    label: 'Standard (original file)',
    description: 'Use this when the suspect image came directly from a trusted source.',
    scoreBuffer: 0,
  },
  whatsapp: {
    label: 'WhatsApp / Messenger',
    description: 'Accounts for heavy compression + resizing from chat apps.',
    scoreBuffer: 22.5,
  },
  instagram: {
    label: 'Instagram / TikTok',
    description: 'High-resizing social feeds.',
    scoreBuffer: 10,
  },
  email: {
    label: 'Email / Cloud preview',
    description: 'Light recompression from previews.',
    scoreBuffer: 6,
  },
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const FLAG_CATEGORIES = [
  { value: 'inaccurate', label: 'Inaccurate report - please analyze the report again' },
  { value: 'false_positive', label: 'False positive detection' },
  { value: 'technical_issue', label: 'Technical issue with verification' },
  { value: 'other', label: 'Other' },
];

export default function VerificationUploader() {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageHash, setImageHash] = useState(null);
  const [metadataFile, setMetadataFile] = useState(null);
  const [selectedMode, setSelectedMode] = useState('hybrid');
  const [selectedPlatform, setSelectedPlatform] = useState('standard');
  const [toast, setToast] = useState(null);
  const [flagModal, setFlagModal] = useState({ open: false, reportId: null });
  const [flagCategory, setFlagCategory] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [userRating, setUserRating] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, variant = 'info', duration = 4000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, variant });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);


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

  const handleMetadataFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setMetadataFile(null);
      return;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const isJsonExtension = fileName.endsWith('.json');
    
    // Check MIME type
    const isJsonMime = file.type === 'application/json' || file.type === 'text/json';

    if (!isJsonExtension && !isJsonMime) {
      showToast('Invalid file type. Please upload a JSON file (.json).', 'error');
      e.target.value = ''; // Clear the input
      setMetadataFile(null);
      return;
    }

    // Try to parse as JSON to validate it's actually valid JSON
    try {
      const text = await file.text();
      JSON.parse(text);
      // If parsing succeeds, it's valid JSON
      setMetadataFile(file);
    } catch (parseError) {
      showToast('Invalid JSON file. The file does not contain valid JSON data. Please upload the correct metadata JSON file.', 'error');
      e.target.value = ''; // Clear the input
      setMetadataFile(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) {
      showToast('Please select an image to verify.', 'error');
      return;
    }

    if (!metadataFile) {
      showToast('Please attach the metadata JSON generated during embedding.', 'error');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      if (!currentUser) {
        showToast('Please log in to use this feature.', 'error');
        return;
      }

      // Call API
      const response = await watermarkAPI.verify(selectedFile, metadataFile, { mode: selectedMode });
      setResult({
        ...response,
        authenticity_score: response.confidence_score,
        timestamp: new Date().toISOString(),
      });
      
      // Fetch rating data if report exists
      if (response.report_id) {
        try {
          const reportData = await watermarkAPI.getReport(response.report_id);
          setUserRating(reportData.userRating);
          setRatingStats(reportData.ratingStats);
          if (reportData.userRating) {
            setRating(reportData.userRating.rating);
            setRatingFeedback(reportData.userRating.feedback || '');
          }
        } catch (e) {
          console.error('Failed to fetch rating data:', e);
        }
      }
      
      // Fetch user's average rating
      try {
        const avgRating = await watermarkAPI.getAverageRating();
        setAverageRating(avgRating);
      } catch (e) {
        console.error('Failed to fetch average rating:', e);
      }
      
      showToast('Verification completed.', 'success');
    } catch (error) {
      console.error('Verification Error:', error);
      const message = error.message || 'Verification failed';
      const lowerMessage = message.toLowerCase();
      
      // Check for metadata/model mismatch errors
      if (lowerMessage.includes('metadata file and model do not match') || 
          lowerMessage.includes('different watermark profile') ||
          lowerMessage.includes('profile') && lowerMessage.includes('match')) {
        showToast(
          message.includes('Metadata file and model do not match') 
            ? message 
            : 'Metadata file and model do not match. The metadata file is for a different watermark profile than the one you selected. Please use the correct metadata file that matches your selected profile (robust, semi-fragile, or hybrid).',
          'error',
          8000
        );
      } else if (/metadata/i.test(message) && (lowerMessage.includes('missing') || lowerMessage.includes('invalid') || lowerMessage.includes('incorrect'))) {
        showToast(
          'Incorrect metadata JSON file. Please upload the metadata JSON that was downloaded after embedding.',
          'error',
          6000
        );
      } else {
        showToast(message, 'error', 6000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreBand = (score = 0) => {
    if (score >= 95) {
      return {
        label: 'Authentic · Pristine',
        description: '100% authentic. No detectable processing.',
        bg: 'rgba(0, 255, 153, 0.12)',
        border: 'rgba(0, 255, 153, 0.55)',
        text: '#00ff99',
        icon: '🛡️',
        progressColor: '#00ff99',
      };
    }
    if (score >= 80) {
      return {
        label: 'Authentic · Light Processing',
        description: 'Minimal computation/editing detected (re-encode, resize, compression).',
        bg: 'rgba(136, 255, 102, 0.12)',
        border: 'rgba(136, 255, 102, 0.45)',
        text: '#8cff66',
        icon: '✅',
        progressColor: '#8cff66',
      };
    }
    if (score >= 45) {
      return {
        label: 'Tampered',
        description: 'Watermark recovered with anomalies. Investigate edits or overlays.',
        bg: 'rgba(255, 165, 0, 0.12)',
        border: 'rgba(255, 165, 0, 0.45)',
        text: '#ffa500',
        icon: '⚠️',
        progressColor: '#ffa500',
      };
    }
    return {
      label: 'Heavily Altered',
      description: 'Watermark severely damaged (platform crushes, AI edits, deepfake).',
      bg: 'rgba(255, 0, 0, 0.12)',
      border: 'rgba(255, 0, 0, 0.45)',
      text: '#ff4d4f',
      icon: '❌',
      progressColor: '#ff4d4f',
    };
  };

  const reasonPlaceholder = (summary) => {
    if (!summary) return '---';
    if (summary.status === 'Authentic') return 'No tampering detected.';
    if (summary.status === 'Tampered') return 'Model detected watermark inconsistencies. Review heatmap.';
    return 'Watermark severely damaged (possible platform crush or deepfake).';
  };

  const downloadReport = (format = 'json') => {
    if (!result) return;

    const report = {
      image_hash: imageHash,
      upload_id: result.upload_id,
      user_id: currentUser?.user_id || 'N/A',
      user_email: currentUser?.email || 'N/A',
      date_time: result.timestamp || new Date().toISOString(),
      watermark_profile: result.mode,
      authenticity_status: result.authenticity_status,
      authenticity_score: adjustedScore ?? result.authenticity_score,
      confidence_score: result.authenticity_score,
      platform_profile: platformProfile.label,
      suspected_attack_type: result.authenticity_status === 'Authentic' ? 'None' : 
                            result.authenticity_status === 'Tampered' ? 'Manipulation detected' : 
                            'Deepfake suspected',
      report_id: result.report_id,
      verification_date: new Date().toISOString(),
      insights: result.insights,
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
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      const lineHeight = 8;
      let cursor = 20;

      doc.setFontSize(16);
      doc.text('StegaShield Verification Report', 14, cursor);
      cursor += 12;

      doc.setFontSize(11);
      const addLine = (label, value) => {
        doc.text(`${label}: ${value}`, 14, cursor);
        cursor += lineHeight;
      };

      addLine('Report ID', report.report_id || 'N/A');
      addLine('Timestamp', new Date(report.date_time).toLocaleString());
      addLine('User Email', report.user_email || 'N/A');
      addLine('Image Hash', report.image_hash || 'N/A');
      cursor += 4;
      addLine('Watermark Profile', report.watermark_profile);
      addLine('Platform Profile', report.platform_profile);
      addLine('Verdict', `${report.authenticity_status} (${adjustedScore ?? result.authenticity_score}%)`);
      addLine('Raw Confidence', `${result.authenticity_score}%`);
      cursor += 4;

      if (summary) {
        doc.setFontSize(12);
        doc.text('Model Insights', 14, cursor);
        cursor += lineHeight;
        doc.setFontSize(11);
        addLine('Hybrid Verdict', summary.status);
        if (typeof derivedSemiAccuracy === 'number') {
          addLine('Semi-Fragile Bit Accuracy', `${(derivedSemiAccuracy * 100).toFixed(2)}%`);
        }
        if (summary.metrics?.type === 'robust' || summary.metrics?.type === 'hybrid') {
          const robustMetrics =
            summary.metrics.type === 'robust'
              ? summary.metrics
              : summary.metrics.robust;
          if (robustMetrics) {
            addLine('Robust Fragile Hash', robustMetrics.fragileHashValid === false ? 'Mismatch' : 'Match');
            addLine('Robust Completeness', robustMetrics.completeness != null ? `${Math.round(robustMetrics.completeness * 100)}%` : 'N/A');
          }
        }
      }

      doc.setFontSize(10);
      doc.text('Reason / Notes:', 14, cursor);
      cursor += lineHeight;
      doc.text(reasonPlaceholder(report.insights?.summary), 14, cursor, { maxWidth: 180 });

      doc.save(`verification_report_${result.report_id || Date.now()}.pdf`);
    }
  };

  const platformProfile = PLATFORM_PROFILES[selectedPlatform] || PLATFORM_PROFILES.standard;
  const adjustedScore = result ? clampScore(result.authenticity_score + platformProfile.scoreBuffer) : null;
  const scoreBand = adjustedScore != null ? getScoreBand(adjustedScore) : null;
  const progressColor = scoreBand ? scoreBand.progressColor : '#808080';
  const summary = result?.insights?.summary;
  const summaryMetrics = summary?.metrics;
  const payload = result?.insights?.model_payload;
  const derivedSemiAccuracy = (() => {
    if (summaryMetrics?.type === 'semi_fragile') {
      return summaryMetrics.bitAccuracy;
    }
    if (summaryMetrics?.type === 'hybrid') {
      return summaryMetrics.semiFragile?.bitAccuracy;
    }
    return payload?.semi_fragile_report?.bit_accuracy;
  })();
  const robustVerdict =
    summaryMetrics?.type === 'robust'
      ? summary?.verdict
      : summaryMetrics?.type === 'hybrid'
        ? payload?.robust_report?.verdict
        : payload?.robust_report?.verdict;

  // Extract ownership information from robust watermark
  const extractOwnershipInfo = () => {
    if (summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid') {
      let robustReport = null;
      
      if (summaryMetrics?.type === 'robust') {
        robustReport = payload?.robust_report || summary?.raw;
      } else if (summaryMetrics?.type === 'hybrid') {
        robustReport = payload?.robust_report || summary?.raw?.robust;
      }
      
      // Try to extract decoded message from various possible locations
      let decodedMessage = robustReport?.decoded_message;
      
      // If not found, try checking the raw payload structure
      if (!decodedMessage && payload?.robust_report) {
        decodedMessage = payload.robust_report.decoded_message;
      }
      
      // Also check summary raw data
      if (!decodedMessage && summary?.raw) {
        if (summaryMetrics?.type === 'robust') {
          decodedMessage = summary.raw.decoded_message;
        } else if (summaryMetrics?.type === 'hybrid' && summary.raw?.robust) {
          decodedMessage = summary.raw.robust.decoded_message;
        }
      }
      
      if (decodedMessage) {
        try {
          // Handle case where message might have a suffix (like user_key_hash)
          let messageToParse = decodedMessage;
          if (typeof decodedMessage === 'string' && decodedMessage.includes('|')) {
            // Split by | and take the first part (the JSON)
            messageToParse = decodedMessage.split('|')[0];
          }
          
          const decoded = JSON.parse(messageToParse);
          return {
            userId: decoded.user_id,
            userEmail: decoded.user_email,
            userName: decoded.user_name || decoded.user_metadata?.name || decoded.user_email || `User ${decoded.user_id}`,
            issuedAt: decoded.issued_at,
            hasOwnership: true,
          };
        } catch (e) {
          console.warn('Failed to parse decoded message:', e, 'Message:', decodedMessage);
          // If parsing fails, try to extract from string format
          if (typeof decodedMessage === 'string' && decodedMessage.includes('user_id')) {
            const userIdMatch = decodedMessage.match(/user_id["\s:]+(\d+)/);
            const userNameMatch = decodedMessage.match(/user_name["\s:]+"([^"]+)"/);
            const userEmailMatch = decodedMessage.match(/user_email["\s:]+"([^"]+)"/);
            const nameMatch = decodedMessage.match(/"name"["\s:]+"([^"]+)"/);
            
            if (userIdMatch || userNameMatch || userEmailMatch || nameMatch) {
              return {
                userId: userIdMatch ? userIdMatch[1] : null,
                userEmail: userEmailMatch ? userEmailMatch[1] : null,
                userName: userNameMatch ? userNameMatch[1] : (nameMatch ? nameMatch[1] : (userEmailMatch ? userEmailMatch[1] : (userIdMatch ? `User ${userIdMatch[1]}` : 'Verified Owner'))),
                issuedAt: null,
                hasOwnership: true,
              };
            }
          }
        }
      }
      
      // If decode was successful but we couldn't extract the message, check if we can infer ownership
      if (robustReport?.decode_success && (summaryMetrics?.parsedBytes > 0 || robustReport?.extraction_stats?.extracted_bytes > 0)) {
        // Ownership detected but couldn't parse - this shouldn't happen with new watermarks
        // but keep as fallback for older watermarks
        return {
          userId: null,
          userEmail: null,
          userName: 'Verified Owner',
          issuedAt: null,
          hasOwnership: true,
        };
      }
    }
    return { hasOwnership: false };
  };

  const ownershipInfo = extractOwnershipInfo();
  
  // Debug: Log the payload structure to help troubleshoot
  if (ownershipInfo.hasOwnership && ownershipInfo.userName === 'Verified Owner') {
    console.log('Ownership extraction debug:', {
      summaryMetricsType: summaryMetrics?.type,
      payloadRobustReport: payload?.robust_report ? Object.keys(payload.robust_report) : null,
      summaryRaw: summary?.raw ? Object.keys(summary.raw) : null,
      decodedMessage: payload?.robust_report?.decoded_message || summary?.raw?.decoded_message || summary?.raw?.robust?.decoded_message,
    });
  }

  const renderMetricsPanel = () => {
    if (!summaryMetrics) return null;

    const metricBlockStyle = {
      background: 'rgba(245, 230, 211, 0.04)',
      border: '1px solid rgba(245, 230, 211, 0.15)',
      borderRadius: '10px',
      padding: '0.75rem',
      marginTop: '0.75rem',
    };

    const renderList = (items) => (
      <ul style={{ margin: '0.35rem 0 0 1rem', color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
        {items.map(item => (
          <li key={item.label}>
            <strong style={{ color: 'var(--cream)' }}>{item.label}:</strong> {item.value}
          </li>
        ))}
      </ul>
    );

    if (summaryMetrics.type === 'robust') {
      const extractionStats = summaryMetrics.extractionStats || {};
      return (
        <div style={metricBlockStyle}>
          <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--accent-gold)' }}>Robust Metrics</h4>
          {renderList([
            { label: 'Fragile Hash', value: summaryMetrics.fragileHashValid === false ? 'Mismatch' : 'Match' },
            { label: 'Header Parse', value: summaryMetrics.headerParseSuccess ? 'Success' : 'Error' },
            { label: 'Decoded Bytes', value: summaryMetrics.parsedBytes ?? 'N/A' },
            { label: 'Extracted Bytes', value: extractionStats.extracted_bytes ?? 'N/A' },
            { label: 'Completeness', value: summaryMetrics.completeness != null ? `${Math.round(summaryMetrics.completeness * 100)}%` : 'N/A' },
          ])}
        </div>
      );
    }

    if (summaryMetrics.type === 'semi_fragile') {
      return (
        <div style={metricBlockStyle}>
          <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--accent-gold)' }}>Semi-Fragile Metrics</h4>
          {renderList([
            { label: 'Bit Accuracy', value: summaryMetrics.bitAccuracy != null ? `${(summaryMetrics.bitAccuracy * 100).toFixed(2)}%` : 'N/A' },
            { label: 'Decoded Message', value: summaryMetrics.decodedMessage || 'N/A' },
          ])}
        </div>
      );
    }

    if (summaryMetrics.type === 'hybrid') {
      return (
        <div style={{ ...metricBlockStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>Semi-Fragile Layer</h4>
            {renderList([
              {
                label: 'Bit Accuracy',
                value:
                  summaryMetrics.semiFragile?.bitAccuracy != null
                    ? `${(summaryMetrics.semiFragile.bitAccuracy * 100).toFixed(2)}%`
                    : 'N/A',
              },
            ])}
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>Robust Layer</h4>
            {renderList([
              {
                label: 'Fragile Hash',
                value:
                  summaryMetrics.robust?.fragileHashValid === false ? 'Mismatch' : 'Match',
              },
              {
                label: 'Completeness',
                value:
                  summaryMetrics.robust?.completeness != null
                    ? `${Math.round(summaryMetrics.robust.completeness * 100)}%`
                    : 'N/A',
              },
            ])}
          </div>
        </div>
      );
    }

    return null;
  };

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
          <label style={{ ...styles.label, marginTop: '1rem' }}>Metadata JSON</label>
          <input
            style={styles.input}
            type="file"
            accept="application/json"
            onChange={handleMetadataFileChange}
          />
          {metadataFile && (
            <p style={{ color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
              Attached: {metadataFile.name}
            </p>
          )}
          <label style={{ ...styles.label, marginTop: '1rem' }}>Profile Mode</label>
          <select
            style={styles.select}
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
          >
            {Object.entries(PROFILE_OPTIONS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name}
              </option>
            ))}
          </select>
          <p style={{ color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
            {PROFILE_OPTIONS[selectedMode]?.description}
          </p>
          <label style={{ ...styles.label, marginTop: '1rem' }}>Platform Profile</label>
          <select
            style={styles.select}
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
          >
            {Object.entries(PLATFORM_PROFILES).map(([key, profile]) => (
              <option key={key} value={key}>
                {profile.label}
              </option>
            ))}
          </select>
          <p style={{ color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
            {platformProfile.description}
          </p>
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
                {/* Ownership Card (for Robust/Hybrid) */}
                {ownershipInfo.hasOwnership && (summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid') && (
                  <div style={{
                    background: 'rgba(76, 175, 80, 0.15)',
                    border: '2px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
                    <h3 style={{
                      color: '#4CAF50',
                      margin: '0.15rem 0',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                    }}>
                      Ownership Verified
                    </h3>
                    <p style={{ color: 'var(--cream)', marginTop: '0.5rem', fontSize: '1rem' }}>
                      This is <strong>{ownershipInfo.userName}</strong>'s work with their watermark embedded.
                    </p>
                    {ownershipInfo.userEmail && (
                      <p style={{ color: 'var(--muted-cream)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                        {ownershipInfo.userEmail}
                      </p>
                    )}
                    {ownershipInfo.issuedAt && (
                      <p style={{ color: 'var(--muted-cream)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                        Watermark issued: {new Date(ownershipInfo.issuedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Tampering Status Card */}
                <div style={{
                  background: scoreBand.bg,
                  border: `3px solid ${scoreBand.border}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    {scoreBand.icon}
                  </div>
                  <h3 style={{
                    color: scoreBand.text,
                    margin: '0.15rem 0',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                  }}>
                    {summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid' 
                      ? 'Tampering Status' 
                      : scoreBand.label}
                  </h3>
                  <p style={{ color: 'var(--muted-cream)', marginTop: '0.35rem' }}>
                    {summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid'
                      ? (summary.status === 'Authentic' 
                          ? 'No tampering detected. The image appears to be in its original state.' 
                          : summary.status === 'Tampered'
                          ? 'Tampering detected. The image has been modified from its original state.'
                          : 'Severe damage detected. Possible deepfake or heavy manipulation.')
                      : scoreBand.description}
                  </p>
                  {summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid' ? (
                    <p style={{ color: 'var(--muted-cream)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Status: <strong style={{ color: scoreBand.text }}>{result.authenticity_status}</strong> ({adjustedScore ?? result.authenticity_score}%)
                    </p>
                  ) : (
                    <p style={{ color: 'var(--muted-cream)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                      Backend verdict: <strong>{result.authenticity_status}</strong>
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--cream)', fontWeight: 'bold' }}>Adjusted Score</span>
                    <span style={{ color: scoreBand.text, fontWeight: 'bold' }}>
                      {adjustedScore ?? result.authenticity_score}%
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
                      width: `${adjustedScore ?? result.authenticity_score}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${progressColor}, ${progressColor}dd)`,
                      borderRadius: '12px',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '0.5rem',
                    }}>
                      {(adjustedScore ?? result.authenticity_score) < 15 && (
                        <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {adjustedScore ?? result.authenticity_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                    Raw score: {result.authenticity_score}%
                  </p>
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

                {/* Detailed Explanation */}
                {result.explanation && (
                  <div style={{
                    background: 'rgba(245, 230, 211, 0.08)',
                    border: '2px solid rgba(245, 230, 211, 0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: 'var(--accent-gold)',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                    }}>
                      Analysis Explanation
                    </h4>
                    {result.detailedExplanation && Array.isArray(result.detailedExplanation) ? (
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '1.25rem',
                        color: 'var(--cream)',
                        fontSize: '0.95rem',
                        lineHeight: 1.8,
                      }}>
                        {result.detailedExplanation.map((point, idx) => (
                          <li key={idx} style={{ marginBottom: '0.5rem' }}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--cream)',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                      }}>
                        {result.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Rating Section */}
                {result.report_id && (
                  <div style={{
                    background: 'rgba(245, 230, 211, 0.05)',
                    border: '1px solid rgba(245, 230, 211, 0.2)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                  }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      color: 'var(--accent-gold)',
                      fontSize: '1.1rem',
                    }}>
                      Rate This Report
                    </h4>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={async () => {
                              if (!result.report_id) return;
                              setRating(star);
                              try {
                                await watermarkAPI.rateReport(result.report_id, star, ratingFeedback);
                                const reportData = await watermarkAPI.getReport(result.report_id);
                                setUserRating(reportData.userRating);
                                setRatingStats(reportData.ratingStats);
                                showToast('Rating submitted successfully!', 'success');
                              } catch (error) {
                                showToast('Failed to submit rating', 'error');
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: '2px solid rgba(245, 230, 211, 0.3)',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '1.5rem',
                              color: star <= (userRating?.rating || rating) ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.3)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!userRating) {
                                e.target.style.color = 'var(--accent-gold)';
                                e.target.style.borderColor = 'var(--accent-gold)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!userRating) {
                                e.target.style.color = star <= rating ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.3)';
                                e.target.style.borderColor = 'rgba(245, 230, 211, 0.3)';
                              }
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {ratingStats && ratingStats.totalRatings > 0 && (
                        <p style={{ 
                          margin: 0, 
                          color: 'var(--muted-cream)',
                          fontSize: '0.9rem',
                        }}>
                          Average: <strong style={{ color: 'var(--cream)' }}>{ratingStats.averageRating?.toFixed(1)}</strong> / 5.0 
                          ({ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'rating' : 'ratings'})
                        </p>
                      )}
                    </div>
                    <textarea
                      placeholder="Optional feedback about this report..."
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(245, 230, 211, 0.2)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        marginBottom: '0.75rem',
                      }}
                    />
                    {userRating && (
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--muted-cream)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                      }}>
                        You rated this report {userRating.rating} star{userRating.rating !== 1 ? 's' : ''}
                        {userRating.feedback && `: "${userRating.feedback}"`}
                      </p>
                    )}
                  </div>
                )}

                {/* User Average Rating Display */}
                {averageRating && averageRating.totalRatings > 0 && (
                  <div style={{
                    background: 'rgba(245, 230, 211, 0.05)',
                    border: '1px solid rgba(245, 230, 211, 0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ 
                      margin: 0, 
                      color: 'var(--muted-cream)',
                      fontSize: '0.9rem',
                    }}>
                      Your Average Rating: <strong style={{ color: 'var(--accent-gold)' }}>
                        {averageRating.averageRating?.toFixed(1)}
                      </strong> / 5.0 
                      ({averageRating.totalRatings} {averageRating.totalRatings === 1 ? 'report' : 'reports'})
                    </p>
                  </div>
                )}

                {summary && (
                  <div style={{
                    background: 'rgba(245, 230, 211, 0.05)',
                    border: '1px solid rgba(245, 230, 211, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: 'var(--muted-cream)',
                    fontSize: '0.9rem',
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--cream)' }}>Model Insights</h4>
                    <p><strong>Profile:</strong> {result.mode}</p>
                    
                    {/* Ownership Section for Robust/Hybrid */}
                    {(summaryMetrics?.type === 'robust' || summaryMetrics?.type === 'hybrid') && ownershipInfo.hasOwnership && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        padding: '0.75rem', 
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                      }}>
                        <p style={{ margin: '0 0 0.25rem 0', color: '#4CAF50', fontWeight: 600 }}>
                          ✓ Ownership Verified
                        </p>
                        <p style={{ margin: '0', fontSize: '0.85rem' }}>
                          <strong>Owner:</strong> {ownershipInfo.userName}
                          {ownershipInfo.userEmail && ` (${ownershipInfo.userEmail})`}
                        </p>
                        {ownershipInfo.issuedAt && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                            <strong>Issued:</strong> {new Date(ownershipInfo.issuedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tampering Section */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <p><strong>Tampering Status:</strong> {summary.status} ({summary.score}%)</p>
                      {summary.status === 'Authentic' && (
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#4CAF50' }}>
                          No tampering detected. Image integrity confirmed.
                        </p>
                      )}
                      {summary.status === 'Tampered' && (
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#ffa500' }}>
                          Modifications detected. Review details below.
                        </p>
                      )}
                      {summary.status === 'Deepfake Suspected' && (
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#ff4d4f' }}>
                          Severe damage or manipulation suspected.
                        </p>
                      )}
                    </div>

                    {typeof derivedSemiAccuracy === 'number' && (
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Semi-fragile Bit Accuracy:</strong> {(derivedSemiAccuracy * 100).toFixed(1)}%
                      </p>
                    )}
                    {robustVerdict && (
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Robust Verdict:</strong> {robustVerdict.replace(/_/g, ' ')}
                      </p>
                    )}
                    {renderMetricsPanel()}
                  </div>
                )}

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
                    📑 Export PDF
                  </button>
                  <button
                    onClick={() => {
                      setFlagModal({ open: true, reportId: result.report_id });
                      setFlagCategory('');
                      setFlagReason('');
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
                Additional Details * (minimum 5 characters)
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
                onClick={() => {
                  setFlagModal({ open: false, reportId: null });
                  setFlagCategory('');
                  setFlagReason('');
                }}
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
                onClick={async () => {
                  if (!flagCategory) {
                    showToast('Please select a flag category.', 'error');
                    return;
                  }
                  if (!flagReason || flagReason.trim().length < 5) {
                    showToast('Please provide additional details (minimum 5 characters).', 'error');
                    return;
                  }
                  try {
                    await watermarkAPI.flagReport(flagModal.reportId, flagReason, flagCategory);
                    showToast('Report flagged successfully! Admin will review it.', 'success');
                    setFlagModal({ open: false, reportId: null });
                    setFlagCategory('');
                    setFlagReason('');
                  } catch (error) {
                    showToast('Failed to flag report: ' + error.message, 'error');
                  }
                }}
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

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {toast && typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background:
                toast.variant === 'success'
                  ? 'rgba(0, 128, 0, 0.95)'
                  : toast.variant === 'error'
                  ? 'rgba(139, 0, 0, 0.95)'
                  : 'rgba(32, 32, 32, 0.95)',
              color: '#fff',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              zIndex: 9999,
              minWidth: '280px',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              {toast.variant === 'success'
                ? 'Success'
                : toast.variant === 'error'
                ? 'Heads up'
                : 'Notice'}
            </strong>
            <span>{toast.message}</span>
          </div>,
          document.body
        )}
    </div>
  );
}
