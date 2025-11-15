// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom'; // 👈 Import NavLink
import { useAuth } from '../AuthContext';

// --- NavLink Components ---
// We create a helper component to style our NavLinks
const NavButton = ({ to, children }) => {
  const navLinkStyle = ({ isActive }) => ({
    width: '100%',
    padding: '0.65rem 1rem',
    borderRadius: '6px',
    background: isActive
      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.55), rgba(212, 175, 55, 0.35))'
      : 'transparent',
    color: 'var(--cream)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: isActive ? 600 : 400,
    letterSpacing: '0.01em',
    transition: 'all 0.25s ease',
    textDecoration: 'none',
    display: 'block',
    border: isActive ? '1px solid rgba(245, 230, 211, 0.35)' : '1px solid transparent',
  });

  return (
    <NavLink to={to} style={navLinkStyle}>
      {children}
    </NavLink>
  );
};

// --- Main Sidebar Component ---
export default function Sidebar() {
  const { userRole } = useAuth(); // 👈 Get role directly from context

  const sidebarStyle = {
    width: '240px',
    background: 'linear-gradient(180deg, rgba(29, 6, 6, 0.95) 0%, rgba(61, 14, 14, 0.9) 100%)',
    color: 'var(--cream)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    flexShrink: 0,
    overflowY: 'auto',
    padding: '1.75rem 1.2rem',
    borderRight: '1px solid rgba(245, 230, 211, 0.12)',
    backdropFilter: 'blur(12px)',
  };

  const sectionTitleStyle = {
    color: 'rgba(245, 230, 211, 0.6)',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    margin: '1.5rem 0 0.7rem 0.75rem',
  };

  return (
    <aside style={sidebarStyle}>
      <h1
        style={{
          color: 'var(--accent-gold)',
          textAlign: 'center',
          fontSize: '1.4rem',
          fontWeight: 600,
          marginBottom: '1.8rem',
          letterSpacing: '0.04em',
        }}
      >
        StegaShield
      </h1>

      <div>
        <div style={sectionTitleStyle}>User Tools</div>
        {/* We use relative paths. 'watermark' will go to '/dashboard/watermark' */}
        <NavButton to="/dashboard">Watermark Image</NavButton>
        <NavButton to="/dashboard/verify">Verify Image</NavButton>
        <NavButton to="/dashboard/playground">Attack Playground</NavButton>
        <NavButton to="/dashboard/history">Activity History</NavButton>
        <NavButton to="/dashboard/announcements">Announcements</NavButton>
        <NavButton to="/dashboard/tickets">My Tickets</NavButton>
        <NavButton to="/dashboard/profile">Profile & Billing</NavButton>
        <NavButton to="/dashboard/support">Support & Help</NavButton>

        {(userRole === 'admin' || userRole === 'developer' || userRole === 'moderator') && (
          <>
            <div style={sectionTitleStyle}>Admin Panel</div>
            <NavButton to="/dashboard/admin">Analytics</NavButton>
            <NavButton to="/dashboard/admin/users">User Management</NavButton>
            <NavButton to="/dashboard/admin/reports">Flagged Reports</NavButton>
            <NavButton to="/dashboard/admin/plans">Plan Management</NavButton>
            <NavButton to="/dashboard/admin/models">AI Models</NavButton>
            <NavButton to="/dashboard/admin/announce">Announcements</NavButton>
            <NavButton to="/dashboard/admin/tickets">Support Tickets</NavButton>
            <NavButton to="/dashboard/admin/security">Security Logs</NavButton>
          </>
        )}
      </div>
    </aside>
  );
}