// src/pages/dashboard/AdminModels.jsx
import React, { useState } from 'react';
import { styles } from '../../styles/dashboardStyles';

export default function AdminModels() {
  const [models, setModels] = useState([
    {
      id: 1,
      name: 'Watermark Embedding Model v1.0',
      type: 'embedding',
      status: 'active',
      accuracy: 98.2,
      lastUpdated: '2025-01-15',
      description: 'LSB-based watermarking for basic embedding. Fast and efficient for standard use cases.',
      version: '1.0.0',
    },
    {
      id: 2,
      name: 'DWT Watermark Embedding Model v2.3',
      type: 'embedding',
      status: 'active',
      accuracy: 96.8,
      lastUpdated: '2025-01-12',
      description: 'Discrete Wavelet Transform-based embedding. Highly resistant to compression and transformations.',
      version: '2.3.1',
    },
    {
      id: 3,
      name: 'Deepfake Detection Model v2.1',
      type: 'detection',
      status: 'active',
      accuracy: 97.5,
      lastUpdated: '2025-01-10',
      description: 'CNN-based deepfake detection model. Analyzes facial inconsistencies, lighting patterns, and temporal artifacts.',
      version: '2.1.4',
    },
    {
      id: 4,
      name: 'Tamper Detection Model v1.5',
      type: 'detection',
      status: 'active',
      accuracy: 94.3,
      lastUpdated: '2025-01-08',
      description: 'Pixel-level analysis for detecting modifications, edits, and unauthorized alterations in images.',
      version: '1.5.2',
    },
    {
      id: 5,
      name: 'SVD Watermark Embedding Model v3.0',
      type: 'embedding',
      status: 'active',
      accuracy: 99.1,
      lastUpdated: '2025-01-05',
      description: 'Singular Value Decomposition-based embedding. Enterprise-grade robustness with exceptional quality preservation.',
      version: '3.0.0',
    },
  ]);

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
      <h2 style={styles.h2}>Model & Dataset Management</h2>

      <div style={styles.card}>
        <h3>AI Models</h3>
        <p>Manage AI models for watermark embedding and detection.</p>
        <table style={tableStyle}>
          <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Accuracy</th>
                <th style={thStyle}>Version</th>
                <th style={thStyle}>Last Updated</th>
                <th style={thStyle}>Actions</th>
              </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.id}>
                <td style={tdStyle}>{model.id}</td>
                <td style={tdStyle}>{model.name}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: model.type === 'embedding' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                    color: model.type === 'embedding' ? '#00ff00' : '#ffa500',
                  }}>
                    {model.type}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: model.status === 'active' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                    color: model.status === 'active' ? '#00ff00' : '#ff0000',
                  }}>
                    {model.status}
                  </span>
                </td>
                <td style={tdStyle}>{model.accuracy}%</td>
                <td style={tdStyle}>{model.version}</td>
                <td style={tdStyle}>{model.lastUpdated}</td>
                <td style={tdStyle}>
                  <details style={{ marginBottom: '0.5rem' }}>
                    <summary style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.9rem' }}>View Details</summary>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted-cream)' }}>{model.description}</p>
                  </details>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      onClick={() => alert('Upload new model version')}
                    >
                      Update
                    </button>
                    <button
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 165, 0, 0.2)', color: '#ffa500' }}
                      onClick={() => alert('Test model performance')}
                    >
                      Test
                    </button>
                    <button
                      style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255, 0, 0, 0.2)', color: '#ff6b6b' }}
                      onClick={() => alert('Switch to this model')}
                    >
                      Switch
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <h3>Upload New Model</h3>
        <form>
          <label style={styles.label}>Model Name</label>
          <input style={styles.input} type="text" placeholder="Model name" />

          <label style={styles.label}>Model Type</label>
          <select style={styles.select}>
            <option value="embedding">Embedding</option>
            <option value="detection">Detection</option>
          </select>

          <label style={styles.label}>Model File</label>
          <input style={styles.input} type="file" accept=".h5,.pkl,.onnx" />

          <button type="submit" style={styles.button}>
            Upload Model
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3>Performance Metrics</h3>
        <p>Track accuracy and performance metrics for all models.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 230, 211, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Average Accuracy</p>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              {Math.round(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length)}%
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(245, 230, 211, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Total Models</p>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>{models.length}</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(245, 230, 211, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Active Models</p>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              {models.filter(m => m.status === 'active').length}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(245, 230, 211, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Embedding Models</p>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              {models.filter(m => m.type === 'embedding').length}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(245, 230, 211, 0.1)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Detection Models</p>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
              {models.filter(m => m.type === 'detection').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
