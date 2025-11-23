// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const { currentUser, userRole, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Redirect to login page after logout
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const headerStyle = {
    padding: '0.85rem 2rem',
    background: 'rgba(10, 2, 2, 0.75)',
    borderBottom: '1px solid rgba(245, 230, 211, 0.14)',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '1.5rem',
    fontSize: '0.95rem',
    color: 'var(--cream)',
    backdropFilter: 'blur(16px)',
  };

  const buttonStyle = {
    padding: '0.55rem 1.1rem',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-soft))',
    color: 'var(--dark-maroon)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  return (
    <header style={headerStyle}>
      {currentUser && (
        <span>
          Welcome, <strong>{currentUser.email || currentUser.name}</strong> ({userRole})
        </span>
      )}
      <button
        onClick={toggleDarkMode}
        style={{
          padding: '0.5rem',
          border: 'none',
          background: 'transparent',
          color: 'var(--cream)',
          cursor: 'pointer',
          fontSize: '1.2rem',
        }}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? '🌙' : '☀️'}
      </button>
      <span style={{ cursor: 'pointer' }}>🔔</span>
      <button
        style={buttonStyle}
        onClick={handleLogout}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-2px)';
          event.currentTarget.style.boxShadow = '0 12px 20px rgba(212, 175, 55, 0.25)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
          event.currentTarget.style.boxShadow = 'none';
        }}
      >
        Logout
      </button>
    </header>
  );
}