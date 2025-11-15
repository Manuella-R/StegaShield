// src/pages/dashboard/WatermarkUploader.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI, API_BASE_URL } from '../../utils/api';

// Watermark type descriptions
const WATERMARK_TYPES = {
  basic: {
    name: 'Basic (LSB)',
    description: 'Least Significant Bit embedding - Simple and fast, good for beginners. Visible under extreme compression.',
    tier: 'Free tier',
    robustness: 'Low',
    visibility: 'Invisible',
  },
  robust: {
    name: 'Robust (DWT/DCT)',
    description: 'Discrete Wavelet/Discrete Cosine Transform - Resistant to JPEG compression and resizing. Best for most use cases.',
    tier: 'Paid tier',
    robustness: 'Medium',
    visibility: 'Invisible',
  },
  blind: {
    name: 'Blind Watermarking',
    description: 'No original image needed for verification - Perfect for distributed content verification.',
    tier: 'Pro+',
    robustness: 'High',
    visibility: 'Invisible',
  },
  'non-blind': {
    name: 'Non-Blind Watermarking',
    description: 'Original image required for verification - Maximum security and accuracy for critical applications.',
    tier: 'Pro+',
    robustness: 'Very High',
    visibility: 'Invisible',
  },
};

// Metadata presets
const METADATA_PRESETS = {
  copyright_only: {
    name: 'Copyright Only',
    template: {
      name: '',
      copyright: '© [YEAR] [COMPANY]',
      timestamp: new Date().toISOString(),
    },
    description: 'Simple copyright notice',
  },
  copyright_photographer: {
    name: 'Copyright + Photographer',
    template: {
      name: '[PHOTOGRAPHER NAME]',
      copyright: '© [YEAR] [PHOTOGRAPHER NAME]',
      timestamp: new Date().toISOString(),
    },
    description: 'Copyright with photographer attribution',
  },
  newsroom: {
    name: 'Newsroom Asset',
    template: {
      name: '[REPORTER NAME]',
      copyright: '© [YEAR] [NEWSROOM] - Desk: [DESK]',
      timestamp: new Date().toISOString(),
    },
    description: 'ID + timestamp + desk assignment',
  },
  custom: {
    name: 'Custom',
    template: null,
    description: 'Create your own preset',
  },
};

export default function WatermarkUploader() {
  const { currentUser } = useAuth();
  const [watermarkType, setWatermarkType] = useState('basic');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputImage, setOutputImage] = useState(null);
  const [metadata, setMetadata] = useState({ name: '', copyright: '', timestamp: '' });
  const [selectedPreset, setSelectedPreset] = useState('copyright_only');
  const [customPresets, setCustomPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInfo, setShowPresetInfo] = useState(false);

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('watermarkPresets');
    if (saved) {
      setCustomPresets(JSON.parse(saved));
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setOutputImage(null);
    }
  };

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'custom') {
      return; // Don't change metadata for custom
    }
    if (presetKey.startsWith('custom_')) {
      // Load custom preset
      const presetId = presetKey.replace('custom_', '');
      const preset = customPresets.find(p => p.id === presetId);
      if (preset && preset.template) {
        setMetadata({ ...preset.template });
      }
    } else {
      // Load built-in preset
      const preset = METADATA_PRESETS[presetKey];
      if (preset && preset.template) {
        let template = { ...preset.template };
        // Replace placeholders
        if (template.copyright) {
          template.copyright = template.copyright
            .replace('[YEAR]', new Date().getFullYear())
            .replace('[COMPANY]', currentUser?.name || '[COMPANY]')
            .replace('[PHOTOGRAPHER NAME]', currentUser?.name || '[PHOTOGRAPHER NAME]')
            .replace('[NEWSROOM]', currentUser?.name || '[NEWSROOM]')
            .replace('[DESK]', 'ASSIGNMENT');
        }
        if (template.name) {
          template.name = template.name
            .replace('[PHOTOGRAPHER NAME]', currentUser?.name || '[PHOTOGRAPHER NAME]')
            .replace('[REPORTER NAME]', currentUser?.name || '[REPORTER NAME]');
        }
        if (!template.timestamp) {
          template.timestamp = new Date().toISOString();
        }
        setMetadata(template);
      }
    }
  };

  const saveCustomPreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: presetName,
      template: { ...metadata },
      description: 'Custom preset',
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('watermarkPresets', JSON.stringify(updated));
    setPresetName('');
    setSelectedPreset(`custom_${newPreset.id}`);
    alert('Preset saved successfully!');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Please select an image first.');
      return;
    }

    setIsProcessing(true);
    setOutputImage(null);

    try {
      if (!currentUser) {
        alert('Please log in to use this feature.');
        return;
      }

      // Prepare metadata
      const metadataObj = {
        name: metadata.name || currentUser.name || '',
        copyright: metadata.copyright || '',
        timestamp: metadata.timestamp || new Date().toISOString(),
      };

      // Call API
      const response = await watermarkAPI.embed(selectedFile, watermarkType, metadataObj);
      
      // Set output image URL
      if (response.file_url) {
        setOutputImage(`${API_BASE_URL.replace('/api', '')}${response.file_url}`);
      } else {
        setOutputImage(preview);
      }

      alert('Watermark embedded successfully!');
    } catch (error) {
      console.error('Watermark Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTypeInfo = WATERMARK_TYPES[watermarkType] || WATERMARK_TYPES.basic;

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Embed Watermark</h2>
      <div style={styles.grid}>
        {/* --- Column 1: Upload & Configure --- */}
        <div style={styles.card}>
          <h3>1. Upload & Configure</h3>
          <label style={styles.label}>Upload Image</label>
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

          <label style={styles.label}>
            Watermark Type
            <button
              onClick={() => setShowPresetInfo(!showPresetInfo)}
              style={{
                marginLeft: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-gold)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              title="Learn more about watermark types"
            >
              ℹ️
            </button>
          </label>
          <select
            style={styles.select}
            value={watermarkType}
            onChange={(e) => setWatermarkType(e.target.value)}
          >
            {Object.entries(WATERMARK_TYPES).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name} ({info.tier})
              </option>
            ))}
          </select>

          {/* Watermark Type Info Box */}
          {showPresetInfo && (
            <div style={{
              padding: '1rem',
              marginTop: '0.5rem',
              background: 'rgba(245, 230, 211, 0.1)',
              border: '1px solid rgba(245, 230, 211, 0.3)',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}>
              <h4 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>{currentTypeInfo.name}</h4>
              <p style={{ margin: '0.5rem 0', color: 'var(--muted-cream)' }}>{currentTypeInfo.description}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <span><strong>Robustness:</strong> {currentTypeInfo.robustness}</span>
                <span><strong>Visibility:</strong> {currentTypeInfo.visibility}</span>
              </div>
            </div>
          )}

          <label style={styles.label}>Metadata Preset</label>
          <select
            style={styles.select}
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            {Object.entries(METADATA_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.name}
              </option>
            ))}
            {customPresets.map(preset => (
              <option key={`custom_${preset.id}`} value={`custom_${preset.id}`}>
                {preset.name} (Custom)
              </option>
            ))}
          </select>

          <label style={styles.label}>Metadata Details</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Name/Author"
            value={metadata.name}
            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Copyright tag"
            value={metadata.copyright}
            onChange={(e) => setMetadata({ ...metadata, copyright: e.target.value })}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Timestamp (auto-filled)"
            value={metadata.timestamp || new Date().toISOString()}
            onChange={(e) => setMetadata({ ...metadata, timestamp: e.target.value })}
            readOnly
          />

          {/* Save Custom Preset */}
          {selectedPreset === 'custom' && (
            <div style={{
              padding: '1rem',
              marginTop: '1rem',
              background: 'rgba(245, 230, 211, 0.05)',
              border: '1px solid rgba(245, 230, 211, 0.2)',
              borderRadius: '8px',
            }}>
              <input
                style={{ ...styles.input, marginBottom: '0.5rem' }}
                type="text"
                placeholder="Preset name (e.g., 'My default watermark')"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <button
                onClick={saveCustomPreset}
                style={{
                  ...styles.button,
                  width: '100%',
                  fontSize: '0.9rem',
                  padding: '0.5rem',
                }}
              >
                💾 Save as Custom Preset
              </button>
            </div>
          )}

          <button
            style={styles.button}
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Apply Watermark'}
          </button>
        </div>

        {/* --- Column 2: Preview & Download --- */}
        <div style={styles.card}>
          <h3>2. Preview & Download</h3>
          <div
            style={{
              height: '300px',
              background: 'rgba(10, 2, 2, 0.6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted-cream)',
              overflow: 'hidden',
              border: '1px solid rgba(245, 230, 211, 0.18)',
              boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.35)',
            }}
          >
            {outputImage ? (
              <img
                src={outputImage}
                alt="Watermarked Result"
                style={{ width: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
              />
            ) : (
              <p>{isProcessing ? 'Generating image...' : '[Watermark Preview]'}</p>
            )}
          </div>
          {outputImage && (
            <a
              href={outputImage}
              download={`watermarked_${selectedFile.name}`}
              style={{
                ...styles.button,
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '1rem',
              }}
            >
              📥 Download Image
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
