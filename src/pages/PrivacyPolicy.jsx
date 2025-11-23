import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/styles.css';

// Use a different component name to avoid privacy extension blocking
export default function PrivacyPolicyPage() {
  // Log when component loads to debug
  useEffect(() => {
    console.log('PrivacyPolicyPage component loaded successfully');
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))', color: 'var(--cream)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '3rem' }}>
          <Link to="/" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>← Back to Home</Link>
        </nav>

        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>Privacy Policy</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: 'var(--muted-cream)' }}>Last updated: January 15, 2025</p>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>1. Introduction</h2>
            <p style={{ marginBottom: '1rem' }}>
              Welcome to StegaShield. We are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>2. Information We Collect</h2>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>2.1 Personal Information</h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Profile picture and preferences</li>
            </ul>

            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>2.2 Usage Information</h3>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Media files you upload for watermarking or verification</li>
              <li>Processing history and reports</li>
              <li>IP address and device information</li>
              <li>Usage patterns and preferences</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '1rem' }}>We use your information to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Provide and improve our services</li>
              <li>Process watermarking and verification requests</li>
              <li>Manage your account and subscription</li>
              <li>Send important updates and notifications</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>4. Data Security</h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement industry-standard security measures to protect your data, including encryption, secure servers, 
              and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>5. Data Retention</h2>
            <p style={{ marginBottom: '1rem' }}>
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. 
              You can request deletion of your data at any time through your account settings.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>6. Your Rights</h2>
            <p style={{ marginBottom: '1rem' }}>You have the right to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>7. Third-Party Services</h2>
            <p style={{ marginBottom: '1rem' }}>
              We use third-party services for payment processing, email delivery, and analytics. These services have their own 
              privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>8. Contact Us</h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p style={{ marginLeft: '2rem' }}>
              Email: privacy@stegasheild.com<br />
              Address: Gigiri, Nairobi, Kenya<br />
              Phone: 0798298573
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

