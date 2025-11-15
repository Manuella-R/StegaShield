import React from 'react';
import { Link } from 'react-router-dom';
import '../css/styles.css';

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))', color: 'var(--cream)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '3rem' }}>
          <Link to="/" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>← Back to Home</Link>
        </nav>

        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: 'var(--accent-gold)' }}>About StegaShield</h1>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
          <section style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem' }}>Our Mission</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.15rem' }}>
              In an era where digital media manipulation is becoming increasingly sophisticated, StegaShield stands as a beacon of authenticity. 
              Our mission is to provide cutting-edge tools that protect digital truth and enable trust in the content we consume, create, and share.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              We believe that in a world where AI can generate convincing deepfakes and images can be easily manipulated, there must be reliable 
              mechanisms to verify authenticity. StegaShield combines advanced steganography techniques with state-of-the-art AI detection to create 
              a comprehensive solution for media authentication.
            </p>
          </section>

          <section style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem' }}>Our Technology</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              StegaShield leverages multiple watermarking algorithms including:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1.5rem' }}>
              <li><strong>LSB (Least Significant Bit) Watermarking:</strong> Basic invisible embedding suitable for casual use</li>
              <li><strong>DWT (Discrete Wavelet Transform):</strong> Robust watermarking resistant to compression and transformations</li>
              <li><strong>DCT (Discrete Cosine Transform):</strong> Advanced frequency-domain embedding for high-quality results</li>
              <li><strong>SVD (Singular Value Decomposition):</strong> Enterprise-grade watermarking with exceptional robustness</li>
            </ul>
            <p style={{ marginBottom: '1rem' }}>
              Our deepfake detection uses convolutional neural networks trained on extensive datasets to identify subtle artifacts 
              and inconsistencies that indicate AI-generated or manipulated content.
            </p>
          </section>

          <section style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem' }}>Who We Serve</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>📰 Journalists</h3>
                <p>Verify sources and authenticate images for news reporting</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🎨 Content Creators</h3>
                <p>Protect your intellectual property and prove ownership</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🏛️ Government</h3>
                <p>Ensure authenticity in official communications and documents</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🔬 Researchers</h3>
                <p>Maintain integrity in academic and scientific publications</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🏢 Enterprises</h3>
                <p>Protect brand assets and verify content authenticity</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>👥 Social Platforms</h3>
                <p>Detect and flag manipulated content for user safety</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem' }}>Our Values</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🔒 Privacy First</h3>
                <p>Your data and media files are encrypted and secure</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🎯 Accuracy</h3>
                <p>We strive for the highest detection and embedding accuracy</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🚀 Innovation</h3>
                <p>Continuously improving our algorithms and features</p>
              </div>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>🤝 Trust</h3>
                <p>Building transparent and reliable authentication solutions</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem' }}>Contact Us</h2>
            <p style={{ marginBottom: '1rem' }}>
              Have questions or want to learn more? We'd love to hear from you!
            </p>
            <p style={{ marginLeft: '2rem' }}>
              Email: info@stegasheild.com<br />
              Support: support@stegasheild.com<br />
              Address: [Your Company Address]<br />
              Phone: [Your Phone Number]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

