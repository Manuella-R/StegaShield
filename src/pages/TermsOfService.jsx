import React from 'react';
import { Link } from 'react-router-dom';
import '../css/styles.css';

export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))', color: 'var(--cream)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '3rem' }}>
          <Link to="/" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>← Back to Home</Link>
        </nav>

        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>Terms of Service</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: 'var(--muted-cream)' }}>Last updated: January 15, 2025</p>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing and using StegaShield, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>2. Description of Service</h2>
            <p style={{ marginBottom: '1rem' }}>
              StegaShield provides AI-powered watermarking and deepfake detection services for digital media. 
              We offer various subscription plans with different features and limits.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>3. User Accounts</h2>
            <p style={{ marginBottom: '1rem' }}>When creating an account, you agree to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>4. Acceptable Use</h2>
            <p style={{ marginBottom: '1rem' }}>You agree not to:</p>
            <ul style={{ marginLeft: '2rem' }}>
              <li>Upload illegal, harmful, or offensive content</li>
              <li>Use the service for fraudulent purposes</li>
              <li>Attempt to bypass security measures</li>
              <li>Violate intellectual property rights</li>
              <li>Interfere with the service's operation</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>5. Subscription and Payments</h2>
            <p style={{ marginBottom: '1rem' }}>
              Subscription fees are charged in advance on a monthly or annual basis. You can cancel your subscription at any time, 
              but refunds are not provided for the current billing period unless required by law.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>6. Intellectual Property</h2>
            <p style={{ marginBottom: '1rem' }}>
              The StegaShield platform, including all software, designs, and content, is protected by intellectual property laws. 
              You retain ownership of media files you upload, but grant us a license to process them.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>7. Limitation of Liability</h2>
            <p style={{ marginBottom: '1rem' }}>
              StegaShield is provided "as is" without warranties of any kind. We are not liable for any damages arising from 
              the use or inability to use our service, including loss of data or revenue.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>8. Changes to Terms</h2>
            <p style={{ marginBottom: '1rem' }}>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email 
              or through the platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.8rem' }}>9. Contact Information</h2>
            <p style={{ marginBottom: '1rem' }}>
              For questions about these Terms of Service, contact us at:
            </p>
            <p style={{ marginLeft: '2rem' }}>
              Email: legal@stegasheild.com<br />
              Address: Gigiri, Nairobi, Kenya<br />
              Phone: 0798298573
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

