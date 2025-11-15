// src/pages/Home.js
import React, { useEffect } from "react";
import "../css/styles.css"; // keep your CSS in styles.css
import { Link } from "react-router-dom";



function Home() {
  console.log('Home component rendering...');
  
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

    // --- Stacking cards scroll animation ---
    const cards = [
      document.getElementById("card1"),
      document.getElementById("card2"),
      document.getElementById("card3"),
    ];

    function updateCards() {
      const section = document.querySelector(".stacking-section");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollProgress =
        -rect.top / (rect.height - window.innerHeight);

      cards.forEach((card, index) => {
        if (!card) return;

        const cardProgress = Math.max(
          0,
          Math.min(1, (scrollProgress - index * 0.33) * 3)
        );

        const scale = 0.9 + cardProgress * 0.1;
        const translateY = (1 - cardProgress) * 50;
        const opacity = 0.3 + cardProgress * 0.7;
        const zIndex = index + 1;

        card.style.transform = `translateY(${translateY}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
      });
    }

    window.addEventListener("scroll", updateCards);
    updateCards();

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

    // --- Form submission handler ---
    const form = document.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        alert(
          "Thank you for your message! We will get back to you soon."
        );
        form.reset();
      });
    }

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("scroll", updateCards);
      anchors.forEach((anchor) =>
        anchor.removeEventListener("click", () => {})
      );
      if (form) {
        form.removeEventListener("submit", () => {});
      }
    };
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav>
       
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><Link to="/about">About</Link></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
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
            AI-powered steganography and deepfake detection for authenticity
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
          <p>AI-driven analysis of media authenticity</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Content Validation</h3>
          <p>Detect tampering and alterations instantly</p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="stacking-section">
        <div className="sticky-container">
          <div className="card-stack">
            <div className="stack-card" id="card1">
              <span className="badge">The Mission</span>
              <h2>Digital Media Under Attack</h2>
              <p>
                From fake news to deepfakes, authenticity matters more than ever. Every day, millions of manipulated 
                images and videos circulate online, eroding trust in digital content. StegaShield provides the tools 
                needed to verify authenticity and protect intellectual property in this challenging landscape.
              </p>
            </div>
            <div className="stack-card" id="card2">
              <span className="badge">The Vision</span>
              <h2>Building Trusted Systems</h2>
              <p>
                We envision a future where every digital file carries verifiable proof of its authenticity. Through 
                invisible watermarking and AI-powered detection, we're creating a new standard for digital trust—one 
                where creators can protect their work and consumers can verify what they see.
              </p>
            </div>
            <div className="stack-card" id="card3">
              <span className="badge">The Impact</span>
              <h2>Protecting What Matters</h2>
              <p>
                Journalism, government communications, academic research, and social media platforms all depend on authentic 
                content. StegaShield empowers these critical sectors with enterprise-grade tools that ensure integrity, 
                prevent fraud, and maintain public trust in an increasingly digital world.
              </p>
            </div>
          </div>
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
          <p>Advanced neural networks analyze visual artifacts, facial inconsistencies, and manipulation patterns to identify 
          AI-generated or altered content with 95%+ accuracy.</p>
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
            <h4>AI Processing</h4>
            <p>Our advanced AI algorithms analyze your media and embed an invisible watermark using steganography. The process takes just seconds for images and minutes for videos, all while maintaining visual quality.</p>
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
              Our AI invisibly embeds a watermark using advanced steganography algorithms.
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

      {/* Pricing Section */}
      <section id="pricing" className="features-strip" style={{ padding: '4rem 2rem', background: 'rgba(10, 2, 2, 0.6)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Plans & Pricing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="feature-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Free</h3>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold', margin: '1rem 0' }}>$0/month</p>
            <p>For casual users</p>
            <ul style={{ textAlign: 'left', marginTop: '1rem', listStyle: 'none', padding: 0 }}>
              <li>✓ Basic embedding</li>
              <li>✓ Limited uploads</li>
              <li>✓ Simple verification</li>
            </ul>
            <Link to="/auth" style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}>
              Get Started
            </Link>
          </div>
          <div className="feature-card" style={{ textAlign: 'center', padding: '2rem', border: '2px solid var(--accent-gold)' }}>
            <h3>Pro</h3>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold', margin: '1rem 0' }}>$9.99/month</p>
            <p>For content creators</p>
            <ul style={{ textAlign: 'left', marginTop: '1rem', listStyle: 'none', padding: 0 }}>
              <li>✓ Blind + non-blind watermarking</li>
              <li>✓ Enhanced detection</li>
              <li>✓ Unlimited uploads</li>
            </ul>
            <Link to="/auth" style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}>
              Upgrade Now
            </Link>
          </div>
          <div className="feature-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Enterprise</h3>
            <p style={{ fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 'bold', margin: '1rem 0' }}>$29.99/month</p>
            <p>For organizations</p>
            <ul style={{ textAlign: 'left', marginTop: '1rem', listStyle: 'none', padding: 0 }}>
              <li>✓ All Pro features</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
              <li>✓ Custom solutions</li>
            </ul>
            <Link to="/auth" style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}>
              Contact Sales
            </Link>
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
              <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Sales:</p>
              <p style={{ color: 'var(--accent-gold)' }}>sales@stegasheild.com</p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.5rem' }}>📞 Phone</h3>
              <p style={{ marginBottom: '0.5rem' }}>Office Hours:</p>
              <p style={{ color: 'var(--muted-cream)' }}>Monday - Friday, 9 AM - 6 PM</p>
              <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Phone:</p>
              <p style={{ color: 'var(--accent-gold)' }}>+1 (555) 123-4567</p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(10, 2, 2, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.5rem' }}>📍 Office</h3>
              <p style={{ color: 'var(--muted-cream)', lineHeight: '1.8' }}>
                123 Technology Drive<br />
                San Francisco, CA 94105<br />
                United States
              </p>
            </div>
          </div>

          <form style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="your.email@example.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select id="subject" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(10, 2, 2, 0.6)', color: 'var(--cream)', border: '1px solid rgba(245, 230, 211, 0.3)' }}>
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Sales & Pricing</option>
                <option>Partnership Opportunities</option>
                <option>Media & Press</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" placeholder="Tell us how we can help..." rows="6" required></textarea>
            </div>
            <button type="submit" className="cta-button" style={{ width: '100%' }}>
              Send Message
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
                AI-powered watermarking and deepfake detection platform protecting digital authenticity and trust.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
                <li><a href="#home" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Home</a></li>
                <li><Link to="/about" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>About</Link></li>
                <li><Link to="/blog" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Blog</Link></li>
                <li><a href="#pricing" style={{ color: 'var(--muted-cream)', textDecoration: 'none' }}>Pricing</a></li>
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
                <li>Phone: +1 (555) 123-4567</li>
                <li>Support: support@stegasheild.com</li>
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
