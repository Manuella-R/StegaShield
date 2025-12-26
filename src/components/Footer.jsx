import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Footer() {
  const { currentUser } = useAuth();

  return (
    <footer style={{
      background: 'rgba(10, 2, 2, 0.9)',
      padding: '3rem 2rem',
      borderTop: '1px solid rgba(245, 230, 211, 0.2)',
      marginTop: '4rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.3rem' }}>StegaShield</h3>
            <p style={{ color: 'var(--muted-cream)', lineHeight: '1.7' }}>
              AI-powered watermarking and deepfake detection platform protecting digital authenticity and trust.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li><Link to="/" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Home</Link></li>
              <li><Link to="/about" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>About</Link></li>
              <li><Link to="/blog" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Blog</Link></li>
              <li><Link to="/pricing" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li><Link to="/dashboard/support" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Help & FAQs</Link></li>
              <li><Link to="/contact" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Contact Us</Link></li>
              <li><Link to="/terms" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Terms of Service</Link></li>
              <li><Link to="/privacy" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', color: 'var(--muted-cream)' }}>
              <li>Email: info@stegasheild.com</li>
              <li>Phone: 0798298573</li>
              <li>Support: support@stegasheild.com</li>
              <li>Location: Gigiri, Nairobi, Kenya</li>
            </ul>
          </div>
        </div>
        <div style={{ 
          borderTop: '1px solid rgba(245, 230, 211, 0.2)', 
          paddingTop: '2rem', 
          textAlign: 'center', 
          color: 'var(--muted-cream)',
          fontSize: '0.9rem'
        }}>
          <p>© 2025 StegaShield. All rights reserved. | Protecting Digital Truth Since 2024</p>
          <p style={{ marginTop: '0.5rem' }}>
            Built with ❤️ for a more authentic digital world
          </p>
        </div>
      </div>
    </footer>
  );
}

