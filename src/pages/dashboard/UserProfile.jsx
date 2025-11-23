// src/pages/dashboard/UserProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { authAPI } from '../../utils/api';
import { Link } from 'react-router-dom';

export default function UserProfile() {
  const { currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone_number: '',
    profile_picture: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [showDisable2FAForm, setShowDisable2FAForm] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.user_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userResponse = await authAPI.getCurrentUser();
      if (userResponse.user) {
        const user = userResponse.user;
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          profile_picture: user.profile_picture || '',
        });

        const new2FAStatus =
          user.two_factor_enabled === 1 || user.two_factor_enabled === true ? 1 : 0;
        const current2FAStatus =
          currentUser?.two_factor_enabled === 1 || currentUser?.two_factor_enabled === true ? 1 : 0;

        if (new2FAStatus !== current2FAStatus) {
          updateUser({
            two_factor_enabled: new2FAStatus,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.user_id, currentUser?.two_factor_enabled, updateUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      if (!currentUser) {
        setMessage('Please log in to update your profile.');
        setShowMessage(true);
        return;
      }

      await authAPI.updateProfile(profile);
      updateUser(profile);
      setMessage('Profile updated successfully!');
      setShowMessage(true);
    } catch (error) {
      setMessage(error.message || 'Failed to update profile');
      setShowMessage(true);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match.');
      setShowMessage(true);
      setUpdating(false);
      return;
    }

    try {
      if (!currentUser) {
        setMessage('Please log in to change your password.');
        setShowMessage(true);
        return;
      }

      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('Password changed successfully!');
      setShowMessage(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.message || 'Failed to change password');
      setShowMessage(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!showDisable2FAForm) {
      setShowDisable2FAForm(true);
      return;
    }

    setUpdating(true);
    setMessage('');

    // Check if user has a password (OAuth users don't need password)
    // has_password is set by the backend to indicate if user has a password
    const hasPassword = currentUser?.has_password !== false;
    
    if (hasPassword && !disable2FAPassword) {
      setMessage('Password is required to disable 2FA');
      setShowMessage(true);
      setUpdating(false);
      return;
    }

    try {
      // For OAuth users, password can be empty/null
      await authAPI.disable2FA(hasPassword ? disable2FAPassword : '');
      setMessage('2FA disabled successfully!');
      setShowMessage(true);
      setShowDisable2FAForm(false);
      setDisable2FAPassword('');
      
      // Refresh user data from server
      try {
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse && userResponse.user) {
          updateUser({
            ...currentUser,
            ...userResponse.user,
            two_factor_enabled: userResponse.user.two_factor_enabled === 1 || userResponse.user.two_factor_enabled === true ? 1 : 0
          });
        }
      } catch (e) {
        console.warn('Failed to refresh user data:', e);
        // Fallback: just update the 2FA status
        updateUser({ ...currentUser, two_factor_enabled: 0 });
      }
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      setMessage(error.message || 'Failed to disable 2FA');
      setShowMessage(true);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Profile & Security</h2>

      {showMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'rgba(245, 230, 211, 0.1)',
          border: '1px solid rgba(245, 230, 211, 0.3)',
          borderRadius: '8px',
          color: 'var(--accent-gold)',
        }}>
          {message}
          <button onClick={() => setShowMessage(false)} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Profile Information */}
      <div style={styles.card}>
        <h3>Account Details</h3>
        <form onSubmit={handleProfileUpdate}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Full name"
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={profile.email}
            disabled
            placeholder="Email address"
          />

          <label style={styles.label}>Phone Number</label>
          <input
            style={styles.input}
            type="text"
            value={profile.phone_number || ''}
            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
            placeholder="Phone number"
          />

          <button type="submit" style={styles.button} disabled={updating}>
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Security */}
      <div style={styles.card}>
        <h3>Security</h3>
        
        {/* 2FA Status and Toggle */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ color: 'var(--cream)', margin: '0 0 0.5rem 0' }}>Two-Factor Authentication (2FA)</h4>
              <p style={{ color: 'var(--muted-cream)', fontSize: '0.9rem', margin: 0 }}>
                {currentUser?.two_factor_enabled 
                  ? '✅ 2FA is currently enabled on your account'
                  : '🔒 2FA is disabled. Enable it to add an extra layer of security.'}
              </p>
            </div>
            {currentUser?.two_factor_enabled ? (
              <button
                onClick={() => setShowDisable2FAForm(!showDisable2FAForm)}
                disabled={updating}
                style={{
                  ...styles.button,
                  background: showDisable2FAForm ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                  color: showDisable2FAForm ? '#ffa500' : '#ff6b6b',
                  border: `1px solid ${showDisable2FAForm ? 'rgba(255, 165, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                }}
              >
                {showDisable2FAForm ? 'Cancel' : 'Disable 2FA'}
              </button>
            ) : (
              <Link to="/2fa-setup" style={styles.button}>
                Setup 2FA
              </Link>
            )}
          </div>

          {showDisable2FAForm && (
            <div style={{
              background: 'rgba(10, 2, 2, 0.4)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              {/* Check if user has password (OAuth users don't have passwords) */}
              {currentUser?.has_password !== false ? (
                <>
                  <p style={{ color: 'var(--cream)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Enter your password to disable 2FA:
                  </p>
                  <input
                    style={styles.input}
                    type="password"
                    value={disable2FAPassword}
                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoFocus
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={updating || !disable2FAPassword}
                    style={{
                      ...styles.button,
                      marginTop: '0.5rem',
                      background: 'rgba(255, 0, 0, 0.3)',
                      color: '#ff6b6b',
                      opacity: (updating || !disable2FAPassword) ? 0.6 : 1,
                      cursor: (updating || !disable2FAPassword) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updating ? 'Disabling...' : 'Confirm Disable 2FA'}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--cream)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    You're signed in with OAuth (Google/GitHub). No password required to disable 2FA.
                  </p>
                  <button
                    onClick={handleDisable2FA}
                    disabled={updating}
                    style={{
                      ...styles.button,
                      marginTop: '0.5rem',
                      background: 'rgba(255, 0, 0, 0.3)',
                      color: '#ff6b6b',
                      opacity: updating ? 0.6 : 1,
                      cursor: updating ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updating ? 'Disabling...' : 'Confirm Disable 2FA'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {currentUser?.two_factor_enabled && (
          <div style={{
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <p style={{ color: '#00ff00', margin: 0, fontSize: '0.9rem' }}>
              ⚠️ You will be required to enter a 2FA code every time you log in.
            </p>
          </div>
        )}

        <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Change Password</h4>
        <form onSubmit={handlePasswordChange}>
          <label style={styles.label}>Current Password</label>
          <input
            style={styles.input}
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            placeholder="Current password"
          />

          <label style={styles.label}>New Password</label>
          <input
            style={styles.input}
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="New password"
          />

          <label style={styles.label}>Confirm New Password</label>
          <input
            style={styles.input}
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
          />

          <button type="submit" style={styles.button} disabled={updating}>
            {updating ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3>Account & Access</h3>
        <p style={{ color: 'var(--muted-cream)', lineHeight: 1.6 }}>
          Billing and subscription management are currently handled directly by the StegaShield team.
          If you need changes to your plan or have licensing questions, please reach out to support or your account administrator.
        </p>
        <p style={{ color: 'var(--muted-cream)', lineHeight: 1.6, marginTop: '1rem' }}>
          Focus on keeping your profile information accurate and your security settings up to date. 
          This ensures smooth access to watermarking, verification, and attack simulation tools.
        </p>
      </div>
    </div>
  );
}
