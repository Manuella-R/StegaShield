// src/components/OnboardingOverlay.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingOverlay({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Start here: watermark an image',
      description: 'Upload an image and embed a watermark to protect your content.',
      action: () => {
        navigate('/dashboard');
        onComplete();
      },
      buttonText: 'Go to Watermark',
    },
    {
      number: 2,
      title: 'Then test it in Verify',
      description: 'Verify your watermarked image to ensure it works correctly.',
      action: () => {
        navigate('/dashboard/verify');
        onComplete();
      },
      buttonText: 'Go to Verify',
    },
    {
      number: 3,
      title: 'Visit Support if you\'re stuck',
      description: 'Check out our help section for tutorials, FAQs, and support.',
      action: () => {
        navigate('/dashboard/support');
        onComplete();
      },
      buttonText: 'Go to Support',
    },
  ];

  const current = steps[currentStep - 1];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipAll = () => {
    onComplete();
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '2rem',
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.95), rgba(61, 14, 14, 0.95))',
    border: '2px solid rgba(245, 230, 211, 0.3)',
    borderRadius: '20px',
    padding: '2.5rem',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    textAlign: 'center',
  };

  const stepIndicatorStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
  };

  const stepDotStyle = (active) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: active ? 'var(--accent-gold)' : 'rgba(245, 230, 211, 0.3)',
    transition: 'all 0.3s ease',
  });

  return (
    <div style={overlayStyle} onClick={skipAll}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={skipAll}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-gold)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(245, 230, 211, 0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          ×
        </button>

        {/* Step indicator */}
        <div style={stepIndicatorStyle}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={stepDotStyle(currentStep === step.number)}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            color: 'var(--accent-gold)',
            fontSize: '1.75rem',
            marginBottom: '1rem',
            marginTop: 0,
          }}>
            Step {current.number}: {current.title}
          </h2>
          <p style={{
            color: 'var(--muted-cream)',
            fontSize: '1.1rem',
            lineHeight: '1.6',
          }}>
            {current.description}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={current.action}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-gold)',
              color: 'var(--dark-red)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {current.buttonText} →
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245, 230, 211, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(245, 230, 211, 0.1)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={skipAll}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--muted-cream)',
                border: '1px solid rgba(245, 230, 211, 0.2)',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(245, 230, 211, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              Get Started
            </button>
          )}
        </div>

        {/* Skip link */}
        <button
          onClick={skipAll}
          style={{
            marginTop: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-cream)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            opacity: 0.7,
          }}
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}

