// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))',
          color: 'var(--accent-gold)',
          fontSize: '1.25rem',
          letterSpacing: '0.04em',
        }}
      >
        Preparing your secure workspace...
      </div>
    );
  }

  if (!currentUser) {
    // If user is not logged in, redirect them to the home/login page
    return <Navigate to="/" replace />;
  }

  // If user is logged in, render the child components
  return children;
}