// src/pages/dashboard/WatermarkUploader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI, API_BASE_URL } from '../../utils/api';

// Watermark type descriptions
const WATERMARK_TYPES = {
  robust: {
    name: 'StegaShield Robust',
    description: 'Hybrid multi-domain watermark optimized for survivability across social media compression.',
    tier: 'Universal',
    robustness: 'High',
    visibility: 'Invisible',
  },
  semi_fragile: {
    name: 'StegaShield Guard (Semi-Fragile)',
    description: 'DWT + SVD defenses tuned to localize tampering with a forensic heatmap.',
    tier: 'Forensics',
    robustness: 'Medium',
    visibility: 'Invisible',
  },
  hybrid: {
    name: 'StegaShield Forensic Hybrid',
    description: 'Sequential semi-fragile + robust layers for both survivability and tamper localization.',
    tier: 'Premium',
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

const PROFILE_DETAILS = {
  robust: {
    headline: 'Built for repost-heavy workflows',
    mechanics: 'Injects payload into multiple frequency bands so it survives compression, resizing, and tone tweaks.',
    useCases: [
      'Creators distributing content across Instagram, TikTok, or messaging apps',
      'Media monitoring teams proving originals after syndication',
      'Brands protecting evergreen marketing assets that get remixed often',
    ],
  },
  semi_fragile: {
    headline: 'Forensic tamper localization',
    mechanics: 'DWT + SVD embedding flips when pixels are manipulated, producing a heatmap that highlights edit zones.',
    useCases: [
      'Photo desks validating newsroom submissions before publication',
      'Legal/medical teams that must detect even subtle edits or object removal',
      'Insurance or compliance teams documenting chain-of-custody for critical imagery',
    ],
  },
  hybrid: {
    headline: 'Two-layer assurance',
    mechanics: 'Runs semi-fragile first (heatmap) and then robust to survive reposts—best for premium forensic workflows.',
    useCases: [
      'Investigative units sharing evidence externally while preserving tamper alerts',
      'Luxury/enterprise brands issuing certificates of authenticity for digital releases',
      'Universities/hospitals archiving sensitive imagery that must remain trustworthy over time',
    ],
  },
};

export default function WatermarkUploader() {
  const { currentUser } = useAuth();
  const [watermarkType, setWatermarkType] = useState('hybrid');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputImage, setOutputImage] = useState(null);
  const [artifacts, setArtifacts] = useState(null);
  const [metadata, setMetadata] = useState({ name: '', copyright: '', timestamp: '' });
  const [selectedPreset, setSelectedPreset] = useState('copyright_only');
  const [customPresets, setCustomPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInfo, setShowPresetInfo] = useState(false);
  const [customId, setCustomId] = useState('');
  const [showCustomIdPrompt, setShowCustomIdPrompt] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, variant = 'info', duration = 4000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, variant });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
      setArtifacts(null);
      // Reset custom ID prompt when file changes
      setShowCustomIdPrompt(false);
      setCustomId('');
      setLastError(null);
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
      showToast('Please enter a preset name', 'error');
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
    showToast('Preset saved successfully!', 'success');
  };

  const downloadArtifact = async (url, filename = 'download') => {
    if (!url) return;
    try {
      const response = await fetch(url, {
        headers: {
          // Allow downloading protected endpoints in case auth becomes required later.
          Authorization: localStorage.getItem('token')
            ? `Bearer ${localStorage.getItem('token')}`
            : undefined,
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download error:', error);
      showToast(`Failed to download file: ${error.message}`, 'error');
    }
  };

  const safeSlug = (value = '') =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset';

  const downloadImageAndMetadata = async () => {
    if (!outputImage) {
      showToast('Watermarked image is not ready yet.', 'error');
      return;
    }

    const mode = artifacts?.mode || watermarkType;
    const baseName =
      artifacts?.baseName ||
      safeSlug(selectedFile?.name?.split('.').slice(0, -1).join('.') || 'asset');

    const imageFilename = selectedFile
      ? `${safeSlug(selectedFile.name)}_${mode}.png`
      : `${baseName}_${mode}.png`;

    await downloadArtifact(outputImage, imageFilename);

    if (artifacts?.metadataUrl) {
      await downloadArtifact(
        artifacts.metadataUrl,
        `${baseName}_${mode}_metadata.json`
      );
    } else {
      showToast('Image downloaded. Metadata file is not available for this embed.', 'info');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      showToast('Please select an image first.', 'error');
      return;
    }

    setIsProcessing(true);
    setOutputImage(null);

    try {
      if (!currentUser) {
        showToast('Please log in to use this feature.', 'error');
        return;
      }

      // Prepare metadata
      const metadataObj = {
        name: metadata.name || currentUser.name || '',
        copyright: metadata.copyright || '',
        timestamp: metadata.timestamp || new Date().toISOString(),
      };

      // Call API
      const response = await watermarkAPI.embed(selectedFile, watermarkType, metadataObj, customId);

      const baseUrl = API_BASE_URL.replace('/api', '');
      const baseName = safeSlug(selectedFile?.name?.split('.').slice(0, -1).join('.') || 'asset');
      
      // Set output image URL
      if (response.file_url) {
        setOutputImage(`${baseUrl}${response.file_url}`);
      } else {
        setOutputImage(preview);
      }

      setArtifacts({
        metadataUrl: response.metadata_url ? `${baseUrl}${response.metadata_url}` : null,
        heatmapUrl: response.heatmap_url ? `${baseUrl}${response.heatmap_url}` : null,
        mode: response.mode,
        modelMetadata: response.model_metadata,
        baseName,
      });

      showToast('Watermark embedded successfully!', 'success');
      // Reset custom ID prompt on success
      setShowCustomIdPrompt(false);
      setLastError(null);
      setCustomId('');
    } catch (error) {
      console.error('Watermark Error:', error);
      const errorMessage = error.message || 'Failed to embed watermark';
      
      // Check for "Message too long" errors - show custom ID prompt
      const lowerMessage = errorMessage.toLowerCase();
      
      // Comprehensive detection for payload too long errors
      const hasTooLong = lowerMessage.includes('too long');
      const hasNotEnoughCapacity = lowerMessage.includes('not have enough capacity');
      const hasBlocksError = lowerMessage.includes('need') && lowerMessage.includes('blocks') && lowerMessage.includes('only') && lowerMessage.includes('available');
      const hasMessageTooLong = lowerMessage.includes('message too long');
      const hasEmbedFailed = lowerMessage.includes('embed failed') && hasTooLong;
      
      const isPayloadTooLong = hasTooLong || hasNotEnoughCapacity || hasBlocksError || hasMessageTooLong || hasEmbedFailed;
      
      console.log('Error detection:', { 
        errorMessage, 
        isPayloadTooLong, 
        hasTooLong, 
        hasBlocksError, 
        hasEmbedFailed 
      });
      
      if (isPayloadTooLong) {
        console.log('Showing custom ID prompt');
        setLastError(errorMessage);
        setShowCustomIdPrompt(true);
        showToast(
          'The watermark payload is too long for this image. Please enter a shorter custom ID below and click "Embed Watermark" again.',
          'error',
          8000
        );
      } else {
        showToast(errorMessage, 'error', 6000);
        setShowCustomIdPrompt(false);
      }
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
              Info
            </button>
          </label>
          <select
            style={{
              ...styles.select,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--cream)',
              background: 'rgba(245, 230, 211, 0.1)',
              border: '1px solid rgba(245, 230, 211, 0.3)',
            }}
            value={watermarkType}
            onChange={(e) => {
              setWatermarkType(e.target.value);
              // Reset custom ID prompt when watermark type changes
              setShowCustomIdPrompt(false);
              setCustomId('');
              setLastError(null);
            }}
          >
            {Object.entries(WATERMARK_TYPES).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name.toUpperCase()} ({info.tier})
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
              {PROFILE_DETAILS[watermarkType] && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  <p style={{ color: 'var(--cream)', marginBottom: '0.25rem', fontWeight: 600 }}>
                    {PROFILE_DETAILS[watermarkType].headline}
                  </p>
                  <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>
                    {PROFILE_DETAILS[watermarkType].mechanics}
                  </p>
                  <p style={{ color: 'var(--accent-gold)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Ideal use cases
                  </p>
                  <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                    {PROFILE_DETAILS[watermarkType].useCases.map((caseItem) => (
                      <li key={caseItem} style={{ marginBottom: '0.35rem', color: 'var(--muted-cream)' }}>
                        {caseItem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

          {/* Custom ID Field - shown as fallback when watermark is too long */}
          {showCustomIdPrompt && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(200, 50, 50, 0.15)',
              border: '3px solid rgba(200, 50, 50, 0.6)',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(200, 50, 50, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>⚠️</span>
                <div>
                  <label style={{ ...styles.label, marginBottom: '0.25rem', color: 'var(--accent-gold)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Watermark Payload Too Long
                  </label>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    color: 'var(--muted-cream)',
                  }}>
                    The image is too small to embed the default watermark payload
                  </p>
                </div>
              </div>
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}>
                <p style={{ 
                  marginBottom: '0.75rem', 
                  fontSize: '0.95rem', 
                  color: 'var(--cream)',
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}>
                  <strong>Solution:</strong> Enter a shorter custom watermark ID below (10-15 characters recommended). This will be embedded instead of the default payload.
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: 'var(--muted-cream)',
                  fontStyle: 'italic',
                }}>
                  Examples: "IMG001", "ID123", "ABC123", "PHOTO1"
                </p>
              </div>
              <label style={{ ...styles.label, marginBottom: '0.5rem', color: 'var(--cream)' }}>
                Custom Watermark ID *
              </label>
              <input
                style={{
                  ...styles.input,
                  border: '2px solid rgba(245, 230, 211, 0.6)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  fontSize: '1rem',
                  padding: '0.75rem',
                  color: 'var(--cream)',
                }}
                type="text"
                placeholder="Enter a short ID (e.g., IMG001, ID123)"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <div style={{ 
                marginTop: '1rem', 
                display: 'flex', 
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => {
                    setShowCustomIdPrompt(false);
                    setCustomId('');
                    setLastError(null);
                  }}
                  style={{
                    ...styles.button,
                    background: 'rgba(100, 100, 100, 0.3)',
                    border: '1px solid rgba(245, 230, 211, 0.3)',
                    fontSize: '0.9rem',
                    padding: '0.6rem 1.2rem',
                  }}
                >
                  Cancel
                </button>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--muted-cream)',
                  flex: 1,
                }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Next step:</strong> Enter a short ID above, then click <strong>"Embed Watermark"</strong> button to retry with the custom ID.
                </div>
              </div>
            </div>
          )}

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
                Save as Custom Preset
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {outputImage && (
              <button
                onClick={downloadImageAndMetadata}
                style={{
                  ...styles.button,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.15rem',
                }}
              >
                <span>Download Image + JSON</span>
                <small style={{ fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                  Includes verification metadata
                </small>
              </button>
            )}
          </div>
          {artifacts?.heatmapUrl && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>
                Forensic Heatmap (semi-fragile layer)
              </p>
              <button
                onClick={() =>
                  downloadArtifact(
                    artifacts.heatmapUrl,
                    `${artifacts.baseName || 'asset'}_${artifacts.mode || watermarkType}_heatmap.png`
                  )
                }
                style={{
                  ...styles.button,
                  background: 'rgba(245, 230, 211, 0.08)',
                  color: 'var(--cream)',
                  marginBottom: '0.5rem',
                }}
              >
                Download Heatmap
              </button>
              <img
                src={artifacts.heatmapUrl}
                alt="Heatmap"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 230, 211, 0.2)',
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ ...styles.card, padding: '1.75rem' }}>
          <h3 style={{ marginTop: 0 }}>About StegaShield Watermarks</h3>
          <p style={{ color: 'var(--muted-cream)', marginBottom: '1rem' }}>
            Pick the right profile for your workflow. Each preset balances survivability, tamper sensitivity,
            and reporting artifacts differently.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {Object.entries(WATERMARK_TYPES).map(([key, info]) => (
              <div
                key={key}
                style={{
                  border: '1px solid rgba(245, 230, 211, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  background: key === watermarkType ? 'rgba(245, 230, 211, 0.08)' : 'rgba(10,2,2,0.4)',
                }}
              >
                <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>{info.name}</h4>
                <p style={{ color: 'var(--muted-cream)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  {info.description}
                </p>
                <p style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {PROFILE_DETAILS[key].headline}
                </p>
                <p style={{ color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
                  {PROFILE_DETAILS[key].mechanics}
                </p>
                <ul style={{ paddingLeft: '1rem', margin: '0.75rem 0 0 0', color: 'var(--muted-cream)', fontSize: '0.85rem' }}>
                  {PROFILE_DETAILS[key].useCases.map((caseItem) => (
                    <li key={caseItem} style={{ marginBottom: '0.35rem' }}>
                      {caseItem}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
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
