// src/components/AdminRoute.jsx
import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const { userRole, loading } = useAuth();

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
          fontSize: '1.2rem',
          letterSpacing: '0.04em',
        }}
      >
        Checking elevated access...
      </div>
    );
  }

  // Check if user has admin role (admin, developer, or moderator)
  const isAdmin = userRole === 'admin' || userRole === 'developer' || userRole === 'moderator';

  // If they are done loading and the role is admin, show the page.
  // Otherwise, kick them back to the dashboard.
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
}