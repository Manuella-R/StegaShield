// src/pages/TwoFactorVerifyAuth.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "../css/authpages.css";

export default function TwoFactorVerifyAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verify2FA } = useAuth();
  
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from location state or localStorage
    const stateInfo = location.state;
    const storedInfo = localStorage.getItem('pending2FA');
    
    if (stateInfo && stateInfo.user_id) {
      setUserInfo(stateInfo);
    } else if (storedInfo) {
      try {
        const parsed = JSON.parse(storedInfo);
        setUserInfo(parsed);
      } catch (e) {
        console.error('Failed to parse stored 2FA info:', e);
        navigate('/auth');
      }
    } else {
      // No user info, redirect to login
      navigate('/auth');
    }
  }, [location, navigate]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setMessage("Please enter a 6-digit code");
      return;
    }

    if (!userInfo || !userInfo.user_id) {
      setMessage("Error: User information not found. Please try logging in again.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await verify2FA(userInfo.user_id, code);
      
      if (response && response.token) {
        setMessage("✅ Verification successful!");
        // Clear pending 2FA info
        localStorage.removeItem('pending2FA');
        // Redirect to dashboard
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMessage("❌ Verification failed. Please try again.");
      }
    } catch (error) {
      setMessage(error.message || "❌ Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  if (!userInfo) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">Two-Factor Authentication</h1>
        <p className="subtitle">
          Enter the 6-digit code from your Authenticator app.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          Verifying login for: <strong>{userInfo.email}</strong>
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => {
            // Only allow digits and limit to 6
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
          }}
          onKeyPress={handleKeyPress}
          placeholder="000000"
          className="input"
          style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            letterSpacing: '0.5rem',
            fontFamily: 'monospace',
          }}
          maxLength={6}
          autoFocus
        />

        <button 
          onClick={handleVerify} 
          className="btn"
          disabled={loading || code.length !== 6}
          style={{
            opacity: (loading || code.length !== 6) ? 0.6 : 1,
            cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? "Verifying..." : "Verify Code →"}
        </button>

        {message && (
          <p className={`message ${message.includes('✅') ? 'success' : 'error'}`} style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '8px',
            background: message.includes('✅') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            color: message.includes('✅') ? '#00aa00' : '#ff0000',
          }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
          Need help? <button 
            type="button"
            onClick={() => navigate('/auth')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0077ff',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Go back to login
          </button>
        </p>
      </div>
    </div>
  );
}

