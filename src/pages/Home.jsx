// src/pages/Home.js
import React, { useEffect, useState } from "react";
import "../css/styles.css"; // keep your CSS in styles.css
import { Link } from "react-router-dom";
import { authAPI } from "../utils/api.js";



function Home() {
  console.log('Home component rendering...');
  const [currentCard, setCurrentCard] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const cards = [
    {
      badge: "The Mission",
      title: "Digital Media Under Attack",
      content: "From fake news to deepfakes, authenticity matters more than ever. Every day, millions of manipulated images and videos circulate online, eroding trust in digital content. StegaShield provides the tools needed to verify authenticity and protect intellectual property in this challenging landscape."
    },
    {
      badge: "The Vision",
      title: "Building Trusted Systems",
              content: "We envision a future where every digital file carries verifiable proof of its authenticity. Through invisible watermarking and advanced detection methods, we're creating a new standard for digital trust—one where creators can protect their work and consumers can verify what they see."
    },
    {
      badge: "The Impact",
      title: "Protecting What Matters",
      content: "Journalism, government communications, academic research, and social media platforms all depend on authentic content. StegaShield empowers these critical sectors with enterprise-grade tools that ensure integrity, prevent fraud, and maintain public trust in an increasingly digital world."
    }
  ];

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
  };
  
  useEffect(() => {
    // --- Binary background animation ---
    const bg = document.getElementById("binaryBg");
    if (bg) {
      let binaryText = "";
      for (let i = 0; i < 100000; i++) {
        binaryText += Math.random() > 0.5 ? "1 " : "0 ";
        if (i % 50 === 0) binaryText += "\n";
      }
      bg.textContent = binaryText;
    }


    // --- Smooth scroll for navigation ---
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(
          this.getAttribute("href")
        );
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // Cleanup event listeners on unmount
    return () => {
      anchors.forEach((anchor) =>
        anchor.removeEventListener("click", () => {})
      );
    };
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactMessage('');

    try {
      await authAPI.sendContactForm(contactForm);
      setContactMessage('Thank you for your message! We will get back to you soon.');
      setContactForm({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (error) {
      setContactMessage(error.message || 'Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav>
       
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><Link to="/about">About</Link></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><a href="#help">Help</a></li>
          <li><a href="#contact">Contact</a></li>
          <li>
            <Link to="/auth">Login</Link>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="binary-bg" id="binaryBg"></div>
        <div className="glow-circle glow-1"></div>
        <div className="glow-circle glow-2"></div>
        <div className="hero-content">
          <h1>Protecting Digital Truth with StegaShield</h1>
          <p>
            Advanced steganography and deepfake detection for authenticity
            and trust
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/auth" style={{
              padding: '1rem 2rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}>
              Get Started
            </Link>
            <Link to="/auth" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'var(--cream)',
              border: '2px solid var(--accent-gold)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="features-strip">
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Authentication & Security</h3>
          <p>Secure sign-in with role-based access control</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h3>Invisible Watermarking</h3>
          <p>Robust embedding resistant to transformations</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🕵️</div>
          <h3>Deepfake Detection</h3>
          <p>Advanced analysis of media authenticity</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Content Validation</h3>
          <p>Detect tampering and alterations instantly</p>
        </div>
      </section>

      {/* About Section - Carousel */}
      <section id="about" className="carousel-section">
        <div className="carousel-container">
          <button className="carousel-btn carousel-btn-prev" onClick={prevCard} aria-label="Previous card">
            ‹
          </button>
          <div className="carousel-wrapper">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`carousel-card ${index === currentCard ? 'active' : ''}`}
                style={{
                  transform: `translateX(${(index - currentCard) * 100}%)`,
                  opacity: index === currentCard ? 1 : 0,
                  zIndex: index === currentCard ? 10 : 1,
                }}
              >
                <span className="badge">{card.badge}</span>
                <h2>{card.title}</h2>
                <p>{card.content}</p>
              </div>
            ))}
          </div>
          <button className="carousel-btn carousel-btn-next" onClick={nextCard} aria-label="Next card">
            ›
          </button>
        </div>
        <div className="carousel-indicators">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentCard ? 'active' : ''}`}
              onClick={() => setCurrentCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="features-strip">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>Authentication Module</h3>
          <p>Secure sign-in with multi-factor authentication (2FA), password encryption, and role-based access control. 
          Enterprise-grade security ensures only authorized users can access your protected content.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💧</div>
          <h3>Watermark Embedding</h3>
          <p>Invisible, robust watermarking resistant to compression, cropping, and transformations. Choose from multiple 
          algorithms (LSB, DWT, DCT, SVD) depending on your security and quality requirements.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>Deepfake Detection</h3>
          <p>Advanced algorithms analyze visual artifacts, facial inconsistencies, and manipulation patterns to identify 
          altered or manipulated content with 95%+ accuracy.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Tamper Validation</h3>
          <p>Pixel-level analysis detects modifications, edits, and unauthorized alterations. Get detailed reports with confidence 
          scores showing exactly what changed and where.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📰</div>
          <h3>Journalism Solutions</h3>
          <p>Tools for newsrooms to verify sources, authenticate images, and maintain editorial integrity. Built-in workflows 
          for fact-checking and content verification.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏛️</div>
          <h3>Government & Enterprise</h3>
          <p>Scalable solutions for organizations requiring bulk processing, API integration, and custom deployment options. 
          White-label solutions available for enterprise clients.</p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="timeline" style={{ padding: '4rem 2rem', background: 'rgba(10, 2, 2, 0.6)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>How It Works</h2>
        <div className="timeline-steps" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="timeline-line"></div>
          <div className="step">
            <div className="step-number">1</div>
            <h4>Upload Your Media</h4>
            <p>Simply upload your image or video file through our secure interface. We support all major formats including PNG, JPEG, MP4, and MOV. Your file is encrypted during upload and processing.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Watermark Processing</h4>
            <p>Our advanced algorithms analyze your media and embed an invisible watermark using steganography. The process takes just seconds for images and minutes for videos, all while maintaining visual quality.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Get Verification Report</h4>
            <p>Receive a comprehensive authenticity report with confidence scores, detection details, and verification status. Download PDF reports for legal or documentation purposes.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Protected & Secure</h4>
            <p>Your watermarked content is now protected with an invisible digital fingerprint. Verify authenticity anytime, anywhere, and prove ownership with confidence.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/auth" style={{
              padding: '1rem 2rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'inline-block',
              transition: 'all 0.3s ease',
            }}>
              Try It Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section id="demo" className="features-strip" style={{ padding: '4rem 2rem', background: 'rgba(18, 2, 2, 0.8)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>See StegaShield in Action</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖼️</div>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Original Image</h3>
            <p style={{ color: 'var(--muted-cream)' }}>
              Upload your original image. It looks completely normal to the naked eye.
            </p>
          </div>
          <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Watermark Embedding</h3>
            <p style={{ color: 'var(--muted-cream)' }}>
              Our system invisibly embeds a watermark using advanced steganography algorithms.
            </p>
          </div>
          <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Verification</h3>
            <p style={{ color: 'var(--muted-cream)' }}>
              Verify authenticity anytime with our detection system. Get instant results and detailed reports.
            </p>
          </div>
        </div>
      </section>

      {/* Help & Education Section */}
      <section id="help" className="features-strip" style={{ padding: '4rem 2rem', background: 'rgba(18, 2, 2, 0.8)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Help & Education</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3>📚 FAQs</h3>
            <p>Find answers to frequently asked questions about watermarking, verification, and deepfake detection. Comprehensive guides covering everything from basic concepts to advanced features.</p>
            <Link to="/dashboard/support" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
              View FAQs →
            </Link>
          </div>
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3>🎓 Tutorials</h3>
            <p>Learn how to use StegaShield for watermarking and verification with step-by-step guides. Perfect for beginners and advanced users alike.</p>
            <Link to="/dashboard/support" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
              View Tutorials →
            </Link>
          </div>
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3>📖 Blog & Articles</h3>
            <p>Explore in-depth articles about AI authenticity, copyright protection, deepfake detection, and the latest developments in digital media security.</p>
            <Link to="/blog" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
              Read Articles →
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="contact-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Get in Touch</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '3rem', color: 'var(--muted-cream)' }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.5rem' }}>📧 Email</h3>
              <p style={{ marginBottom: '0.5rem' }}>General Inquiries:</p>
              <p style={{ color: 'var(--accent-gold)' }}>info@stegasheild.com</p>
              <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Support:</p>
              <p style={{ color: 'var(--accent-gold)' }}>support@stegasheild.com</p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.5rem' }}>📞 Phone</h3>
              <p style={{ marginBottom: '0.5rem' }}>Office Hours:</p>
              <p style={{ color: 'var(--muted-cream)' }}>Monday - Friday, 9 AM - 6 PM EAT</p>
              <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Phone:</p>
              <p style={{ color: 'var(--accent-gold)' }}>0798298573</p>
              <p style={{ color: 'var(--muted-cream)', fontSize: '0.9rem', marginTop: '0.25rem' }}>+254 798 298573</p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.5rem' }}>📍 Office</h3>
              <p style={{ color: 'var(--muted-cream)', lineHeight: '1.8' }}>
                Gigiri<br />
                Nairobi, Kenya
              </p>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
            {contactMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                background: contactMessage.includes('Thank you') ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                color: contactMessage.includes('Thank you') ? '#4CAF50' : '#F44336',
                border: `1px solid ${contactMessage.includes('Thank you') ? '#4CAF50' : '#F44336'}`,
                textAlign: 'center'
              }}>
                {contactMessage}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="Your full name" 
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="your.email@example.com" 
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select 
                id="subject" 
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(10, 2, 2, 0.6)', color: 'var(--cream)', border: '1px solid rgba(245, 230, 211, 0.3)' }}
              >
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Security Question</option>
                <option>Partnership Opportunities</option>
                <option>Media & Press</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message" 
                placeholder="Tell us how we can help..." 
                rows="6" 
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="cta-button" 
              style={{ width: '100%' }}
              disabled={contactLoading}
            >
              {contactLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
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
                Advanced watermarking and deepfake detection platform protecting digital authenticity and trust.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
                <li><a href="#home" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Home</a></li>
                <li><Link to="/about" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>About</Link></li>
                <li><Link to="/blog" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
                <li><Link to="/dashboard/support" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Help & FAQs</Link></li>
                <li><a href="#contact" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Contact Us</a></li>
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
    </>
  );
}

export default Home;
