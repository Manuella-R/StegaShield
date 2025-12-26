// src/pages/dashboard/AttackPlayground.jsx
import React, { useMemo, useState } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { watermarkAPI, API_BASE_URL } from '../../utils/api';

const ATTACK_PRESETS = {
  clean: {
    label: '🟢 Baseline (No Attack)',
    values: {
      jpegQuality: 100,
      resizeWidth: 100,
      resizeHeight: 100,
      blurLevel: 0,
      noiseLevel: 0,
      cropPercent: 0,
      rotation: 0,
      colorShift: 0,
      emojiOverlay: false,
    },
  },
  jpeg70: {
    label: '🟠 JPEG 70% (Social Repost)',
    values: {
      jpegQuality: 70,
      resizeWidth: 90,
      resizeHeight: 90,
      blurLevel: 0,
      noiseLevel: 2,
      cropPercent: 0,
      rotation: 0,
      colorShift: 0,
      emojiOverlay: false,
    },
  },
  crop10: {
    label: '✂️ Crop 10% + Reframe',
    values: {
      jpegQuality: 90,
      resizeWidth: 95,
      resizeHeight: 95,
      blurLevel: 0,
      noiseLevel: 0,
      cropPercent: 10,
      rotation: 0,
      colorShift: 0,
      emojiOverlay: false,
    },
  },
  blurNoise: {
    label: '🌫️ Blur + Noise (AI smoothing)',
    values: {
      jpegQuality: 85,
      resizeWidth: 100,
      resizeHeight: 100,
      blurLevel: 3,
      noiseLevel: 12,
      cropPercent: 0,
      rotation: 0,
      colorShift: 0,
      emojiOverlay: false,
    },
  },
  social720: {
    label: '📱 Social Platform 720p',
    values: {
      jpegQuality: 65,
      resizeWidth: 60,
      resizeHeight: 60,
      blurLevel: 1,
      noiseLevel: 5,
      cropPercent: 5,
      rotation: 0,
      colorShift: 5,
      emojiOverlay: true,
    },
  },
  chaotic: {
    label: '🔥 Chaotic (rotate + sticker overlay)',
    values: {
      jpegQuality: 60,
      resizeWidth: 80,
      resizeHeight: 80,
      blurLevel: 2,
      noiseLevel: 10,
      cropPercent: 8,
      rotation: 12,
      colorShift: 10,
      emojiOverlay: true,
    },
  },
};

const PLATFORM_PROFILES = {
  standard: {
    label: 'Standard (original channel)',
    severityTolerance: 0,
    scoreBuffer: 0,
  },
  whatsapp: {
    label: 'WhatsApp / Messenger',
    severityTolerance: 0.4,
    scoreBuffer: 22.5,
  },
  instagram: {
    label: 'Instagram / TikTok',
    severityTolerance: 0.25,
    scoreBuffer: 10,
  },
  email: {
    label: 'Email / Cloud preview',
    severityTolerance: 0.15,
    scoreBuffer: 6,
  },
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const slugify = (value = 'asset') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';

export default function AttackPlayground() {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [watermarkType, setWatermarkType] = useState('hybrid');
  const [watermarkedImage, setWatermarkedImage] = useState(null);
  const [metadataBlob, setMetadataBlob] = useState(null);
  const [heatmapImage, setHeatmapImage] = useState(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [baseName, setBaseName] = useState('asset');
  const [selectedPlatform, setSelectedPlatform] = useState('standard');

  // Attack parameters
  const [jpegQuality, setJpegQuality] = useState(90);
  const [resizeWidth, setResizeWidth] = useState(100);
  const [resizeHeight, setResizeHeight] = useState(100);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [blurLevel, setBlurLevel] = useState(0);
  const [cropPercent, setCropPercent] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [colorShift, setColorShift] = useState(0);
  const [emojiOverlay, setEmojiOverlay] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('clean');

  // Verification results
  const [afterResult, setAfterResult] = useState(null);
  const [isVerifyingAfter, setIsVerifyingAfter] = useState(false);
  const [attackedImage, setAttackedImage] = useState(null);
  const [currentAttackSeverity, setCurrentAttackSeverity] = useState(0);

  const platformProfile = PLATFORM_PROFILES[selectedPlatform] || PLATFORM_PROFILES.standard;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setBaseName(slugify(file.name.split('.').slice(0, -1).join('.') || 'asset'));
    setWatermarkedImage(null);
    setMetadataBlob(null);
    setHeatmapImage(null);
    setAfterResult(null);
    setAttackedImage(null);
  };

  const embedWatermark = async () => {
    if (!selectedFile) {
      alert('Please select an image first.');
      return;
    }
    if (!currentUser) {
      alert('Please log in to use this feature.');
      return;
    }

    setIsEmbedding(true);
    try {
      const metadataObj = {
        name: currentUser.name || '',
        copyright: '© Attack Playground Test',
        timestamp: new Date().toISOString(),
      };

      const response = await watermarkAPI.embed(selectedFile, watermarkType, metadataObj);
      if (!response.file_url) {
        setWatermarkedImage(preview);
        alert('Embed response missing processed image. Using preview instead.');
        return;
      }

      const baseUrl = API_BASE_URL.replace('/api', '');
      const imageUrl = `${baseUrl}${response.file_url}`;
      setWatermarkedImage(imageUrl);

      if (response.metadata_url) {
        const metaResp = await fetch(`${baseUrl}${response.metadata_url}`);
        setMetadataBlob(await metaResp.blob());
      } else {
        setMetadataBlob(null);
        alert('Metadata was not generated. Verification will be limited.');
      }

      if (response.heatmap_url && (watermarkType === 'semi_fragile' || watermarkType === 'hybrid')) {
        setHeatmapImage(`${baseUrl}${response.heatmap_url}`);
      } else {
        setHeatmapImage(null);
      }
    } catch (error) {
      console.error('Embed Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsEmbedding(false);
    }
  };

  const createFilePair = (imageBlob) => {
    if (!metadataBlob) {
      throw new Error('Metadata missing. Re-embed to refresh metadata.');
    }
    const imageFile = new File([imageBlob], `${baseName}.png`, { type: imageBlob.type || 'image/png' });
    const metadataFile = new File(
      [metadataBlob],
      `${baseName}_${watermarkType}_metadata.json`,
      { type: 'application/json' }
    );
    return { imageFile, metadataFile };
  };


  const computeAttackSeverity = () => {
    const qualityFactor = jpegQuality / 100;
    const resizeFactor = (resizeWidth / 100) * (resizeHeight / 100);
    return Math.min(
      1,
      (1 - qualityFactor) * 0.35 +
        (1 - resizeFactor) * 0.25 +
        (blurLevel / 10) * 0.15 +
        (noiseLevel / 50) * 0.1 +
        (cropPercent / 30) * 0.1 +
        (Math.abs(rotation) / 25) * 0.05 +
        (emojiOverlay ? 0.05 : 0)
    );
  };

  const applyAttack = async () => {
    if (!watermarkedImage) {
      alert('Please embed a watermark first.');
      return;
    }

    try {
      const severity = computeAttackSeverity();
      setCurrentAttackSeverity(severity);
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = () => {
          const cropPx = Math.round((cropPercent / 100) * Math.min(img.width, img.height));
          const cropWidth = img.width - cropPx * 2;
          const cropHeight = img.height - cropPx * 2;

          const targetWidth = Math.max(20, Math.round(cropWidth * (resizeWidth / 100)));
          const targetHeight = Math.max(20, Math.round(cropHeight * (resizeHeight / 100)));

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          ctx.save();
          ctx.translate(targetWidth / 2, targetHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(
            img,
            cropPx,
            cropPx,
            cropWidth,
            cropHeight,
            -targetWidth / 2,
            -targetHeight / 2,
            targetWidth,
            targetHeight
          );
          ctx.restore();

          if (blurLevel > 0) {
            ctx.filter = `blur(${blurLevel}px)`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          }

          if (noiseLevel > 0 || colorShift !== 0) {
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              if (noiseLevel > 0) {
                const noise = (Math.random() - 0.5) * (noiseLevel * 2);
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
              }
              if (colorShift !== 0) {
                data[i] = Math.min(255, Math.max(0, data[i] + colorShift));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] - colorShift));
              }
            }
            ctx.putImageData(imageData, 0, 0);
          }

          if (emojiOverlay) {
            ctx.font = `${Math.max(targetWidth, targetHeight) * 0.25}px Segoe UI Emoji`;
            ctx.globalAlpha = 0.55;
            ctx.fillText('🛡️', targetWidth * 0.05, targetHeight * 0.3);
            ctx.fillText('⚠️', targetWidth * 0.65, targetHeight * 0.85);
            ctx.globalAlpha = 1;
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to generate attacked blob'));
                return;
              }
              const attackedUrl = URL.createObjectURL(blob);
              setAttackedImage(attackedUrl);
              verifyAfterAttack(blob, severity);
              resolve();
            },
            'image/jpeg',
            jpegQuality / 100
          );
        };
        img.onerror = reject;
        img.src = watermarkedImage;
      });
    } catch (error) {
      console.error('Attack Error:', error);
      alert('Failed to render attack. Using simulated output.');
      setAttackedImage(watermarkedImage);
      const severity = computeAttackSeverity();
      setCurrentAttackSeverity(severity);
      verifyAfterAttack(null, severity);
    }
  };

  const verifyAfterAttack = async (attackedBlob, severity = 0) => {
    setIsVerifyingAfter(true);
    try {
      if (attackedBlob) {
        const { imageFile, metadataFile } = createFilePair(attackedBlob);
        const verifyResponse = await watermarkAPI.verify(imageFile, metadataFile, { mode: watermarkType });
        const tolerance = platformProfile.severityTolerance || 0;
        const netSeverity = Math.max(0, severity - tolerance);
        const severityPenalty = Math.round(netSeverity * 25);
        const adjustedScore = clampScore(verifyResponse.confidence_score - severityPenalty + platformProfile.scoreBuffer);
        setAfterResult({
          status: verifyResponse.authenticity_status,
          score: verifyResponse.confidence_score,
          adjustedScore,
          attackSeverity: severity,
          watermarkSurvived: verifyResponse.authenticity_status === 'Authentic',
          metrics: verifyResponse.insights?.summary?.metrics || null,
        });
      } else {
        const qualityFactor = jpegQuality / 100;
        const resizeFactor = (resizeWidth / 100) * (resizeHeight / 100);
        const attackSeverity =
          (1 - qualityFactor) * 0.4 +
          (1 - resizeFactor) * 0.2 +
          (blurLevel / 10) * 0.15 +
          (noiseLevel / 50) * 0.15 +
          (cropPercent / 30) * 0.1;
        const simulatedScore = Math.max(0, Math.round((1 - attackSeverity) * 95));
        const tolerance = platformProfile.severityTolerance || 0;
        const netSeverity = Math.max(0, attackSeverity - tolerance);
        const severityPenalty = Math.round(netSeverity * 25);
        const adjustedScore = clampScore(simulatedScore - severityPenalty + platformProfile.scoreBuffer);
        setAfterResult({
          status: simulatedScore > 70 ? 'Authentic' : simulatedScore > 40 ? 'Tampered' : 'Deepfake Suspected',
          score: simulatedScore,
          adjustedScore,
          attackSeverity: attackSeverity,
          watermarkSurvived: simulatedScore > 70,
          metrics: null,
        });
      }
    } catch (error) {
      console.error('Verification Error:', error);
      setAfterResult({
        status: 'Tampered',
        score: 25,
        adjustedScore: clampScore(25 - Math.round(Math.max(0, severity - (platformProfile.severityTolerance || 0)) * 25) + platformProfile.scoreBuffer),
        attackSeverity: severity,
        watermarkSurvived: false,
        metrics: null,
      });
    } finally {
      setIsVerifyingAfter(false);
    }
  };

  const applyPresetValues = (key) => {
    const preset = ATTACK_PRESETS[key];
    if (!preset) return;
    setSelectedPreset(key);
    setJpegQuality(preset.values.jpegQuality);
    setResizeWidth(preset.values.resizeWidth);
    setResizeHeight(preset.values.resizeHeight);
    setBlurLevel(preset.values.blurLevel);
    setNoiseLevel(preset.values.noiseLevel);
    setCropPercent(preset.values.cropPercent);
    setRotation(preset.values.rotation);
    setColorShift(preset.values.colorShift);
    setEmojiOverlay(preset.values.emojiOverlay);
  };

  const attackSummary = useMemo(
    () => ({
      jpegQuality,
      resizeWidth,
      resizeHeight,
      blurLevel,
      noiseLevel,
      cropPercent,
      rotation,
      colorShift,
      emojiOverlay,
    }),
    [jpegQuality, resizeWidth, resizeHeight, blurLevel, noiseLevel, cropPercent, rotation, colorShift, emojiOverlay]
  );

  const getScoreColor = (score) => {
    if (score >= 95) return '#00ff99';
    if (score >= 80) return '#8cff66';
    if (score >= 45) return '#ffa500';
    return '#ff4d4f';
  };

  const afterAdjustedScore = afterResult ? (afterResult.adjustedScore ?? afterResult.score) : null;

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Attack Playground / Lab Mode</h2>
      <p style={{ color: 'var(--muted-cream)', marginBottom: '2rem' }}>
        Reproduce JPEG crush, resizing, cropping, and overlay attacks to understand how each watermark profile behaves.
      </p>

      <div style={styles.grid}>
        {/* Step 1 */}
        <div style={styles.card}>
          <h3>Step 1: Embed Watermark</h3>
          <label style={styles.label}>Upload Image</label>
          <input style={styles.input} type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          {preview && (
            <img
              src={preview}
              alt="Original"
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid rgba(245, 230, 211, 0.16)',
              }}
            />
          )}

          <label style={styles.label}>Watermark Profile</label>
          <select
            style={{ ...styles.select, fontWeight: 600 }}
            value={watermarkType}
            onChange={(e) => setWatermarkType(e.target.value)}
          >
            <option value="robust">Robust · survives repost compression</option>
            <option value="semi_fragile">Guard · highlights tampering (heatmap)</option>
            <option value="hybrid">Hybrid · Guard + Robust stack</option>
          </select>

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
            Adjusts scoring tolerance for known channels. {platformProfile.label}
          </p>

          <button style={styles.button} onClick={embedWatermark} disabled={!selectedFile || isEmbedding}>
            {isEmbedding ? 'Embedding...' : 'Embed Watermark'}
          </button>

          {watermarkedImage && (
            <>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: 'var(--cream)', marginBottom: '0.5rem' }}>Watermarked Image</p>
                <img
                  src={watermarkedImage}
                  alt="Watermarked"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.3)' }}
                />
              </div>
              {heatmapImage && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--muted-cream)', marginBottom: '0.5rem' }}>Heatmap Reference</p>
                  <img
                    src={heatmapImage}
                    alt="Heatmap"
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.35)' }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 2 */}
        <div style={styles.card}>
          <h3>Step 2: Apply Attacks</h3>
          <label style={styles.label}>Attack Preset</label>
          <select
            style={{ ...styles.select, marginBottom: '1rem' }}
            value={selectedPreset}
            onChange={(e) => applyPresetValues(e.target.value)}
          >
            {Object.entries(ATTACK_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>

          <label style={styles.label}>JPEG Compression Quality: {jpegQuality}%</label>
          <input type="range" min="10" max="100" value={jpegQuality} onChange={(e) => setJpegQuality(+e.target.value)} />

          <label style={styles.label}>Resize: {resizeWidth}% × {resizeHeight}%</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="range" min="10" max="200" value={resizeWidth} onChange={(e) => setResizeWidth(+e.target.value)} style={{ flex: 1 }} />
            <input type="range" min="10" max="200" value={resizeHeight} onChange={(e) => setResizeHeight(+e.target.value)} style={{ flex: 1 }} />
          </div>

          <label style={styles.label}>Blur Level: {blurLevel}px</label>
          <input type="range" min="0" max="10" value={blurLevel} onChange={(e) => setBlurLevel(+e.target.value)} />

          <label style={styles.label}>Noise Level: {noiseLevel}%</label>
          <input type="range" min="0" max="50" value={noiseLevel} onChange={(e) => setNoiseLevel(+e.target.value)} />

          <label style={styles.label}>Crop Border: {cropPercent}%</label>
          <input type="range" min="0" max="30" value={cropPercent} onChange={(e) => setCropPercent(+e.target.value)} />

          <label style={styles.label}>Rotation: {rotation}°</label>
          <input type="range" min="-25" max="25" value={rotation} onChange={(e) => setRotation(+e.target.value)} />

          <label style={styles.label}>Color Shift: {colorShift}</label>
          <input type="range" min="-30" max="30" value={colorShift} onChange={(e) => setColorShift(+e.target.value)} />

          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={emojiOverlay} onChange={(e) => setEmojiOverlay(e.target.checked)} />
            Add sticker overlay (meme repost simulation)
          </label>

          <button style={{ ...styles.button, marginTop: '1rem' }} onClick={applyAttack} disabled={!watermarkedImage}>
            ⚔️ Apply Attacks & Verify
          </button>

          {attackedImage && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--cream)', marginBottom: '0.5rem' }}>Attacked Image</p>
              <img
                src={attackedImage}
                alt="Attacked"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)' }}
              />
            </div>
          )}

          <div style={{ marginTop: '1.5rem', background: 'rgba(245,230,211,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,230,211,0.1)' }}>
            <h4 style={{ marginTop: 0, color: 'var(--cream)' }}>Attack Summary</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted-cream)', fontSize: '0.9rem' }}>
              <li>JPEG: {attackSummary.jpegQuality}%</li>
              <li>Resize: {attackSummary.resizeWidth}% × {attackSummary.resizeHeight}%</li>
              <li>Blur {attackSummary.blurLevel}px · Noise {attackSummary.noiseLevel}%</li>
              <li>Crop {attackSummary.cropPercent}% · Rotation {attackSummary.rotation}°</li>
              <li>Color shift {attackSummary.colorShift} · Sticker {attackSummary.emojiOverlay ? 'On' : 'Off'}</li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div style={styles.card}>
          <h3>Step 3: Attack Results</h3>
          <div
            style={{
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <h4 style={{ color: '#ffa500', marginTop: 0 }}>After Attack</h4>
            {isVerifyingAfter ? (
              <p>Verifying...</p>
            ) : afterResult ? (
              <>
                <p>
                  <strong>Status:</strong> {afterResult.status}
                </p>
                <p>
                  <strong>Severity-adjusted Score:</strong>{' '}
                  <span style={{ color: getScoreColor(afterAdjustedScore ?? 0) }}>
                    {afterAdjustedScore != null ? Math.round(afterAdjustedScore) : 'N/A'}%
                  </span>
                </p>
                <p>
                  <strong>Raw Model Score:</strong>{' '}
                  <span style={{ color: getScoreColor(afterResult.score) }}>{afterResult.score}%</span>
                </p>
                <div style={{ width: '100%', height: '18px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(0,0,0,0.25)' }}>
                  <div
                    style={{
                      width: `${afterAdjustedScore ?? afterResult.score}%`,
                      height: '100%',
                      background: getScoreColor(afterAdjustedScore ?? afterResult.score),
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                  Raw score: {afterResult.score}%
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>Watermark:</strong>{' '}
                  <span style={{ color: afterResult.watermarkSurvived ? '#00ff00' : '#ff0000' }}>
                    {afterResult.watermarkSurvived ? '✅ Survived' : '❌ Destroyed'}
                  </span>
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                  Attack severity applied: {(afterResult.attackSeverity ?? currentAttackSeverity) * 100 >= 0
                    ? `${((afterResult.attackSeverity ?? currentAttackSeverity) * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
                {afterResult.metrics && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                    {afterResult.metrics.type === 'semi_fragile' && (
                      <p>Bit Accuracy: {(afterResult.metrics.bitAccuracy * 100).toFixed(2)}%</p>
                    )}
                    {afterResult.metrics.type === 'robust' && (
                      <p>Fragile Hash: {afterResult.metrics.fragileHashValid === false ? 'Mismatch' : 'Match'}</p>
                    )}
                    {afterResult.metrics.type === 'hybrid' && (
                      <>
                        <p>Semi Bit Accuracy: {(afterResult.metrics.semiFragile?.bitAccuracy * 100).toFixed(2)}%</p>
                        <p>Robust Hash: {afterResult.metrics.robust?.fragileHashValid === false ? 'Mismatch' : 'Match'}</p>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--muted-cream)' }}>Apply attacks to see results</p>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', background: 'rgba(10,2,2,0.5)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,230,211,0.15)' }}>
            <h4 style={{ marginTop: 0, color: 'var(--cream)' }}>Lab Notes</h4>
            <p style={{ color: 'var(--muted-cream)', fontSize: '0.9rem' }}>
              Presets mirror our internal smoke tests (JPEG70, Crop10, Social720). Try running the same attack across
              Robust vs Guard vs Hybrid to visualize how survivability and tamper localization trade off. Guard / Hybrid
              profiles will output heatmaps—if the post-attack confidence drops but the tamper regions glow, you still
              have actionable evidence.
            </p>
            <p style={{ color: 'var(--muted-cream)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Current attack severity: {(currentAttackSeverity * 100).toFixed(1)}%. Platform: {platformProfile.label}.
              Higher severity reduces the adjusted score more aggressively, unless absorbed by the platform tolerance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
