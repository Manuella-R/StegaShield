// src/pages/dashboard/SupportHelp.jsx
import React, { useState } from 'react';
import { styles } from '../../styles/dashboardStyles';

export default function SupportHelp() {
  const [activeSection, setActiveSection] = useState('faq');

  const faqs = [
    {
      question: 'What is watermarking?',
      answer: 'Watermarking is the process of embedding invisible information into media files to prove authenticity and ownership. StegaShield uses advanced steganography techniques to embed watermarks that are imperceptible to the human eye but can be detected by our verification systems. This allows you to prove ownership of your content and verify if media has been tampered with.',
    },
    {
      question: 'How does deepfake detection work?',
      answer: 'Our AI models analyze visual artifacts, facial inconsistencies, lighting patterns, and other subtle clues that indicate manipulation. We use convolutional neural networks trained on extensive datasets of authentic and manipulated media. The system can detect deepfakes, face swaps, and other AI-generated content with over 95% accuracy.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support common image formats (PNG, JPEG, GIF, BMP) and video formats (MP4, MOV, AVI, MKV). Images should be at least 500x500 pixels for best results, and videos can be up to 1080p resolution. Larger files may take longer to process.',
    },
    {
      question: 'How secure is my data?',
      answer: 'We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. All uploaded files are stored securely and can be automatically deleted after processing if you enable the option. We never share your content with third parties without your explicit consent.',
    },
    {
      question: 'Can I use StegaShield for commercial purposes?',
      answer: 'Yes, depending on your plan. Free plans are for personal use only. Pro and Enterprise plans support commercial use, including watermarking for businesses, agencies, and organizations. Enterprise plans also include white-label options and custom integration.',
    },
    {
      question: 'What watermarking algorithms do you offer?',
      answer: 'We offer multiple algorithms: Basic (LSB) for simple use cases, Robust (DWT/DCT) for compression-resistant embedding, and Blind/Non-blind watermarking for advanced applications. Each algorithm has different trade-offs between visibility, robustness, and processing time.',
    },
    {
      question: 'How accurate is the deepfake detection?',
      answer: 'Our deepfake detection achieves 95%+ accuracy on standard benchmarks. The accuracy depends on the quality of the manipulated content and the training data used to create it. Higher-quality deepfakes may require additional analysis.',
    },
    {
      question: 'Can I watermark videos?',
      answer: 'Yes! Video watermarking is available in Pro and Enterprise plans. We support frame-by-frame embedding and can handle videos up to 1080p. Processing time depends on video length and resolution.',
    },
    {
      question: 'What happens if my watermark is detected as tampered?',
      answer: 'If tampering is detected, you\'ll receive a detailed report showing where modifications occurred, confidence scores, and recommended actions. For legal purposes, these reports can be downloaded as PDF documents with timestamps and verification codes.',
    },
    {
      question: 'Do you offer API access?',
      answer: 'Yes, API access is available for Enterprise plan subscribers. Our REST API allows you to integrate watermarking and verification into your own applications. Documentation and API keys are provided upon subscription.',
    },
    {
      question: 'How long does processing take?',
      answer: 'Processing time varies by file size and type. Images typically process in 5-30 seconds, while videos may take 1-5 minutes depending on length. Enterprise users have priority processing for faster results.',
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of the current billing period. No refunds are provided for partial billing periods unless required by law.',
    },
  ];

  const tutorials = [
    {
      title: 'Getting Started with Watermarking',
      description: 'Learn how to embed invisible watermarks in your images and videos to protect your intellectual property.',
      steps: [
        'Log in to your StegaShield account and navigate to the Watermark Embedding section',
        'Click "Upload Image" or "Upload Video" and select your media file (supports PNG, JPEG, MP4, MOV)',
        'Choose your watermark type: Basic (free), Robust (paid), or Blind/Non-blind (Pro+)',
        'Optionally add metadata like copyright information, creator name, or timestamp',
        'Click "Apply Watermark" and wait for processing (usually 5-30 seconds for images)',
        'Preview the watermarked file - it should look identical to the original',
        'Download the watermarked file and save it securely',
        'Keep the original for comparison and store verification keys if provided',
      ],
    },
    {
      title: 'Verifying Media Authenticity',
      description: 'Learn how to verify if a media file is authentic, tampered, or contains a deepfake.',
      steps: [
        'Go to the Verification section in your dashboard',
        'Upload the file you want to verify (can be a suspected fake or your own watermarked content)',
        'Wait for the AI analysis to complete - this may take 10-60 seconds depending on file complexity',
        'Review the authenticity status: Authentic (green), Tampered (orange), or Deepfake Suspected (red)',
        'Check the confidence score - higher scores indicate more reliable results',
        'Read the detailed detection report showing what was analyzed and what was found',
        'Download the verification report as a PDF if needed for legal or documentation purposes',
        'Take appropriate action based on the results (e.g., remove content if it\'s a confirmed deepfake)',
      ],
    },
    {
      title: 'Understanding Verification Results',
      description: 'Learn how to interpret verification results, confidence scores, and detection details.',
      steps: [
        'Review the authenticity status: "Authentic" means the content appears genuine, "Tampered" indicates modifications, and "Deepfake Suspected" suggests AI-generated content',
        'Check the confidence score (0-100%): Scores above 80% are highly reliable, 60-80% are moderately reliable, and below 60% require additional verification',
        'Read detection details: Look for specific information about what was detected (e.g., "Facial inconsistencies found", "Watermark integrity confirmed")',
        'Understand false positives: Even authentic content may occasionally flag as suspicious - always review the detailed report',
        'Compare multiple verifications: If unsure, verify the same content multiple times or use different detection models',
        'Consider context: Results should be interpreted alongside other factors like source credibility and content context',
        'Download reports: Save verification reports with timestamps for legal or documentation purposes',
        'Contact support: If results seem incorrect, contact our support team with the file and report for manual review',
      ],
    },
    {
      title: 'Managing Your Watermarked Content',
      description: 'Best practices for organizing and managing your watermarked media files.',
      steps: [
        'Create a dedicated folder structure for originals and watermarked versions',
        'Always keep the original file alongside the watermarked version for comparison',
        'Maintain a log of what files have been watermarked and when',
        'Store verification keys or metadata separately in a secure location',
        'Regularly verify your watermarked content to ensure the watermark is still detectable',
        'Back up both original and watermarked files in multiple locations',
        'Use consistent naming conventions (e.g., "original_filename_wm.jpg")',
        'Document any distribution or sharing of watermarked content',
      ],
    },
    {
      title: 'Setting Up Two-Factor Authentication',
      description: 'Enhance your account security with two-factor authentication.',
      steps: [
        'Navigate to your Profile settings in the dashboard',
        'Click on "Security" section and find "Two-Factor Authentication"',
        'Choose your 2FA method: Authenticator App (recommended) or Email',
        'If using an authenticator app, scan the QR code with Google Authenticator or similar app',
        'Enter the verification code from your authenticator app to confirm setup',
        'Save your backup codes in a secure location',
        'Test the setup by logging out and logging back in with 2FA',
        'Ensure your phone or authenticator device is accessible when needed',
      ],
    },
    {
      title: 'Upgrading Your Subscription Plan',
      description: 'How to upgrade from Free to Pro or Enterprise plans.',
      steps: [
        'Go to your Profile page and click on "Subscription"',
        'Review the available plans and their features',
        'Click "Upgrade" on the plan you want',
        'Choose your payment method (MPESA, Card, PayPal, or Flutterwave)',
        'Enter your payment details securely',
        'Confirm the payment amount and billing cycle (monthly or annual)',
        'Complete the payment transaction',
        'Your plan will be activated immediately upon successful payment',
        'Check your email for a receipt and confirmation',
      ],
    },
  ];

  const resources = [
    {
      title: 'AI Authenticity in the Digital Age',
      description: 'A comprehensive guide to understanding the importance of media authenticity in an AI-driven world. Learn about the challenges posed by deepfakes, how they impact society, and why verification tools are essential.',
      content: 'As AI technology advances, the ability to create convincing fake images and videos has become more accessible. This article explores the implications for journalism, politics, business, and personal security.',
    },
    {
      title: 'Copyright Protection with Watermarking',
      description: 'How invisible watermarking helps protect your intellectual property and provides legal proof of ownership. Includes case studies and best practices.',
      content: 'Watermarking serves as a digital fingerprint that can prove ownership even after content is shared, copied, or modified. Learn how to use watermarking effectively to protect your creative work.',
    },
    {
      title: 'Deepfake Detection Technologies',
      description: 'An in-depth overview of deepfake detection methods, AI models, and technologies used to identify manipulated content.',
      content: 'Deepfake detection relies on identifying subtle artifacts left by AI generation models. This article explains how neural networks analyze facial movements, lighting inconsistencies, and other telltale signs.',
    },
    {
      title: 'Best Practices for Media Security',
      description: 'Essential tips and best practices for securing your media files, protecting your digital assets, and preventing unauthorized use.',
      content: 'From encryption to access control, learn comprehensive strategies for protecting your digital media. Includes practical steps you can implement today.',
    },
    {
      title: 'Steganography: The Science Behind Invisible Watermarks',
      description: 'Explore the mathematical and technical foundations of steganography and how it enables invisible watermark embedding.',
      content: 'Steganography is the art and science of hiding information. This article explains how digital steganography works, different embedding algorithms, and their trade-offs.',
    },
    {
      title: 'The Legal Landscape of Digital Authentication',
      description: 'Understanding the legal implications of watermarking, deepfake detection, and digital content verification in various jurisdictions.',
      content: 'As digital authentication becomes more important, laws are evolving. Learn about copyright, defamation, and authentication standards relevant to your jurisdiction.',
    },
    {
      title: 'Building Trust in Social Media',
      description: 'How platforms and users can combat misinformation and fake content using authentication tools.',
      content: 'Social media platforms face increasing pressure to verify content authenticity. This resource discusses verification mechanisms, user education, and platform policies.',
    },
    {
      title: 'Enterprise Watermarking Solutions',
      description: 'A guide for organizations implementing watermarking at scale, including API integration, workflow automation, and compliance considerations.',
      content: 'Large organizations need scalable solutions for protecting thousands of assets. Learn about enterprise features, API integration, and best practices for organizational deployment.',
    },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Help & Education</h2>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid rgba(245, 230, 211, 0.2)' }}>
        <button
          onClick={() => setActiveSection('faq')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeSection === 'faq' ? 'var(--accent-gold)' : 'transparent',
            color: activeSection === 'faq' ? 'var(--dark-red)' : 'var(--cream)',
            border: 'none',
            borderBottom: activeSection === 'faq' ? '2px solid var(--accent-gold)' : 'none',
            cursor: 'pointer',
            fontWeight: activeSection === 'faq' ? 'bold' : 'normal',
          }}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveSection('tutorials')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeSection === 'tutorials' ? 'var(--accent-gold)' : 'transparent',
            color: activeSection === 'tutorials' ? 'var(--dark-red)' : 'var(--cream)',
            border: 'none',
            borderBottom: activeSection === 'tutorials' ? '2px solid var(--accent-gold)' : 'none',
            cursor: 'pointer',
            fontWeight: activeSection === 'tutorials' ? 'bold' : 'normal',
          }}
        >
          Tutorials
        </button>
        <button
          onClick={() => setActiveSection('resources')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeSection === 'resources' ? 'var(--accent-gold)' : 'transparent',
            color: activeSection === 'resources' ? 'var(--dark-red)' : 'var(--cream)',
            border: 'none',
            borderBottom: activeSection === 'resources' ? '2px solid var(--accent-gold)' : 'none',
            cursor: 'pointer',
            fontWeight: activeSection === 'resources' ? 'bold' : 'normal',
          }}
        >
          Resources
        </button>
      </div>

      {/* FAQ Section */}
      {activeSection === 'faq' && (
        <div style={styles.card}>
          <h3>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{
                padding: '1rem',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '8px',
              }}>
                <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{faq.question}</h4>
                <p style={{ color: 'var(--muted-cream)' }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tutorials Section */}
      {activeSection === 'tutorials' && (
        <div style={styles.card}>
          <h3>Tutorials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            {tutorials.map((tutorial, index) => (
              <div key={index} style={{
                padding: '1.5rem',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '8px',
              }}>
                <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{tutorial.title}</h4>
                <p style={{ color: 'var(--muted-cream)', marginBottom: '1rem' }}>{tutorial.description}</p>
                <ol style={{ color: 'var(--muted-cream)', paddingLeft: '1.5rem' }}>
                  {tutorial.steps.map((step, stepIndex) => (
                    <li key={stepIndex} style={{ marginBottom: '0.5rem' }}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Section */}
      {activeSection === 'resources' && (
        <div style={styles.card}>
          <h3>Resources</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {resources.map((resource, index) => (
              <div key={index} style={{
                padding: '1.5rem',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 230, 211, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{resource.title}</h4>
                <p style={{ color: 'var(--muted-cream)', marginBottom: '0.75rem', lineHeight: '1.6' }}>{resource.description}</p>
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.9rem' }}>Read more...</summary>
                  <p style={{ color: 'var(--muted-cream)', marginTop: '0.75rem', lineHeight: '1.6', fontSize: '0.95rem' }}>{resource.content}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
