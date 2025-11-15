// src/pages/dashboard/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/dashboardStyles';
import { useAuth } from '../../AuthContext';
import { authAPI, paymentsAPI } from '../../utils/api';
import { Link } from 'react-router-dom';

export default function UserProfile() {
  const { currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone_number: '',
    profile_picture: '',
  });
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('MPESA');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [showDisable2FAForm, setShowDisable2FAForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.user_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch user profile
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.user) {
          const user = userResponse.user;
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            profile_picture: user.profile_picture || '',
          });
          
          // Only update context if 2FA status actually changed to avoid infinite loop
          const new2FAStatus = user.two_factor_enabled === 1 || user.two_factor_enabled === true ? 1 : 0;
          const current2FAStatus = currentUser?.two_factor_enabled === 1 || currentUser?.two_factor_enabled === true ? 1 : 0;
          
          if (new2FAStatus !== current2FAStatus) {
            // Only update if 2FA status changed
            updateUser({
              two_factor_enabled: new2FAStatus
            });
          }
        }

        // Fetch current plan
        const planResponse = await paymentsAPI.getCurrentPlan();
        if (planResponse.plan) {
          setCurrentPlan(planResponse.plan);
        }

        // Fetch all plans
        const plansResponse = await paymentsAPI.getPlans();
        if (plansResponse.plans) {
          setPlans(plansResponse.plans);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.user_id]); // Only depend on user_id, not the entire currentUser object

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
      await fetchData();
    } catch (error) {
      setMessage(error.message || 'Failed to disable 2FA');
      setShowMessage(true);
    } finally {
      setUpdating(false);
    }
  };

  const handlePlanChange = async (planId, paymentMethod = 'MPESA') => {
    try {
      if (!currentUser) {
        setMessage('Please log in to change your plan.');
        setShowMessage(true);
        return;
      }

      // For MPESA, phone number is required
      if (paymentMethod === 'MPESA' && !mpesaPhoneNumber) {
        setMessage('Please enter your MPESA phone number.');
        setShowMessage(true);
        return;
      }

      // Create payment
      const response = await paymentsAPI.createPayment(planId, paymentMethod, mpesaPhoneNumber, null);
      
      if (paymentMethod === 'MPESA') {
        setMessage(response.instructions || 'MPESA STK Push initiated. Please complete payment on your phone.');
        
        // Refresh user data after a delay to check if payment was confirmed
        setTimeout(async () => {
          try {
            await fetchData();
          } catch (error) {
            console.error('Error refreshing data:', error);
          }
        }, 4000);
      } else {
        setMessage('Payment initiated. Please complete the payment to upgrade your plan.');
      }
      
      setShowMessage(true);
    } catch (error) {
      setMessage(error.message || 'Failed to change plan');
      setShowMessage(true);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Profile & Billing</h2>

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

      {/* Subscription */}
      <div style={styles.card}>
        <h3>Subscription</h3>
        {currentPlan && (
          <p><strong>Current Plan:</strong> {currentPlan.plan_name} - ${currentPlan.price}/month</p>
        )}
        <p style={{ marginTop: '1rem', marginBottom: '1rem' }}>Available Plans:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {plans.map(plan => (
            <div key={plan.plan_id} style={{
              padding: '1rem',
              border: '1px solid rgba(245, 230, 211, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{plan.plan_name}</h4>
                  <p style={{ color: 'var(--muted-cream)', fontSize: '0.9rem' }}>{plan.description}</p>
                  <p style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>${plan.price}/month</p>
                </div>
                <button
                  onClick={() => {
                    if (currentPlan?.plan_id !== plan.plan_id) {
                      // Show payment method selection
                      setSelectedPaymentMethod('MPESA');
                      setMpesaPhoneNumber(currentUser?.phone_number || '');
                    }
                  }}
                  style={styles.button}
                  disabled={currentPlan?.plan_id === plan.plan_id}
                >
                  {currentPlan?.plan_id === plan.plan_id ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
              
              {/* Payment Method Selection (only show when upgrading) */}
              {currentPlan?.plan_id !== plan.plan_id && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(10, 2, 2, 0.5)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <label style={styles.label}>Payment Method</label>
                  <select
                    style={styles.select}
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    <option value="MPESA">MPESA</option>
                    <option value="Stripe">Stripe (Card)</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                  
                  {selectedPaymentMethod === 'MPESA' && (
                    <>
                      <label style={styles.label}>MPESA Phone Number</label>
                      <input
                        style={styles.input}
                        type="tel"
                        placeholder="254712345678"
                        value={mpesaPhoneNumber}
                        onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                      />
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-cream)' }}>
                        Format: 254712345678 (including country code)
                      </p>
                    </>
                  )}
                  
                  <button
                    onClick={() => handlePlanChange(plan.plan_id, selectedPaymentMethod)}
                    style={{
                      ...styles.button,
                      background: 'var(--accent-gold)',
                      color: 'var(--dark-maroon)',
                    }}
                  >
                    Pay with {selectedPaymentMethod}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
