// src/pages/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // 👈 IMPORTANT
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OnboardingOverlay from '../components/OnboardingOverlay';
import { useAuth } from '../AuthContext';

export default function DashboardLayout() {
  const { currentUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    if (currentUser) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${currentUser.user_id}`);
      if (!hasSeenOnboarding) {
        // Check if this is a new user (created recently)
        // You could also check user.created_at from the API
        const isNewUser = !localStorage.getItem(`user_visited_${currentUser.user_id}`);
        if (isNewUser) {
          setShowOnboarding(true);
        }
      }
    }
  }, [currentUser]);

  const handleOnboardingComplete = () => {
    if (currentUser) {
      localStorage.setItem(`onboarding_seen_${currentUser.user_id}`, 'true');
      localStorage.setItem(`user_visited_${currentUser.user_id}`, 'true');
    }
    setShowOnboarding(false);
  };
  const appStyle = {
    display: 'flex',
    fontFamily: '"Inter", Arial, sans-serif',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92) 0%, rgba(61, 14, 14, 0.85) 100%)',
    color: 'var(--cream)',
  };

  const mainContentStyle = {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'hidden',
    background: 'rgba(10, 2, 2, 0.6)',
    backdropFilter: 'blur(12px)',
  };

  const contentAreaStyle = {
    flexGrow: 1,
    padding: '1.5rem 2rem',
    overflowY: 'auto',
    background: 'linear-gradient(145deg, rgba(92, 26, 26, 0.55), rgba(18, 2, 2, 0.75))',
    borderTop: '1px solid rgba(245, 230, 211, 0.08)',
    borderLeft: '1px solid rgba(245, 230, 211, 0.08)',
    color: 'var(--cream)',
    boxShadow: 'inset 0 0 45px rgba(0, 0, 0, 0.45)',
  };

  return (
    <div style={appStyle}>
      {showOnboarding && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}
      <Sidebar />
      <main style={mainContentStyle}>
        <Header />
        <div style={contentAreaStyle}>
          {/* This is the magic part. React Router will render 
            the correct page component (e.g., WatermarkUploader) 
            right here based on the URL.
          */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}