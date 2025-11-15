// src/pages/AuthPages.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/authpages.css";
import { useAuth } from "../AuthContext";
import { authAPI } from "../utils/api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider, isFirebaseConfigured } from "../firebase";

export default function AuthPages() {
  const navigate = useNavigate();
  const { login, register, oauthLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    rememberMe: false,
  });
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Input Change ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- Email/Password Auth ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        // 🔐 Login flow
        const response = await login(formData.email, formData.password);
        
        // Check if 2FA is required
        if (response && response.requires2FA) {
          // Redirect to 2FA verification
          navigate('/2fa-verify-auth', { 
            state: { 
              user_id: response.user_id, 
              email: response.email 
            } 
          });
          return;
        }
        
        setMessage("Login successful!");
        setShowPopup(true);
        navigate("/dashboard");
      } else {
        // 🆕 Signup flow
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
        });
        setMessage(`Account created for ${formData.email}. Welcome to StegaShield!`);
        setShowPopup(true);
        navigate("/dashboard");
      }
    } catch (error) {
      setMessage(error.message || "An error occurred. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password ---
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage("Please enter your email to reset your password.");
      setShowPopup(true);
      return;
    }

    try {
      await authAPI.forgotPassword(formData.email);
      setMessage("If the email exists, a password reset link has been sent to your inbox.");
      setShowPopup(true);
    } catch (error) {
      setMessage(error.message || "An error occurred. Please try again.");
      setShowPopup(true);
    }
  };

  // --- Google Sign-In ---
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setMessage("Firebase is not configured. Please configure Firebase to use Google sign-in. See firebase.js for setup instructions.");
      setShowPopup(true);
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Send Firebase ID token to backend to create/login user
      const idToken = await user.getIdToken();
      
      // Call backend to handle OAuth user
      const response = await oauthLogin({
        provider: 'google',
        id_token: idToken,
        email: user.email,
        name: user.displayName || user.email,
        photo_url: user.photoURL
      });
      
      // Check if 2FA is required
      if (response && response.requires2FA) {
        // Redirect to 2FA verification
        navigate('/2fa-verify-auth', { 
          state: { 
            user_id: response.user_id, 
            email: response.email,
            oauth: true
          } 
        });
        return;
      }
      
      setMessage("Google sign-in successful!");
      setShowPopup(true);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setMessage(error.message || "Failed to sign in with Google. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // --- GitHub Sign-In ---
  const handleGithubSignIn = async () => {
    if (!isFirebaseConfigured) {
      setMessage("Firebase is not configured. Please configure Firebase to use GitHub sign-in. See firebase.js for setup instructions.");
      setShowPopup(true);
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      // Sign in with GitHub using Firebase
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      
      // Send Firebase ID token to backend to create/login user
      const idToken = await user.getIdToken();
      
      // Call backend to handle OAuth user
      const response = await oauthLogin({
        provider: 'github',
        id_token: idToken,
        email: user.email,
        name: user.displayName || user.email || user.providerData[0]?.email || 'GitHub User',
        photo_url: user.photoURL
      });
      
      // Check if 2FA is required
      if (response && response.requires2FA) {
        // Redirect to 2FA verification
        navigate('/2fa-verify-auth', { 
          state: { 
            user_id: response.user_id, 
            email: response.email,
            oauth: true
          } 
        });
        return;
      }
      
      setMessage("GitHub sign-in successful!");
      setShowPopup(true);
      navigate("/dashboard");
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      setMessage(error.message || "Failed to sign in with GitHub. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Popup Close ---
  const closePopup = () => setShowPopup(false);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">S</div>

        <h1 className="title">{isLogin ? "Welcome Back" : "Create Account"}</h1>
        <p className="subtitle">
          {isLogin
            ? "Sign in to continue to StegaShield"
            : "Sign up to get started with StegaShield"}
        </p>

        {/* Status Popup */}
        {showPopup && (
          <div className="popup-overlay" onClick={closePopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <p>{message}</p>
              <button className="btn" onClick={closePopup}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* --- Auth Form --- */}
        <form onSubmit={handleSubmit} className="form">
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full name"
                required
                className="input"
              />
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Phone number (optional)"
                className="input"
              />
            </>
          )}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email address"
            required
            className="input"
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              className="input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-btn"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {isLogin && (
            <div className="form-options">
              <label>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="link"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In →" : "Sign Up →"}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn-outline google"
          disabled={!isFirebaseConfigured || loading}
          title={!isFirebaseConfigured ? "Firebase not configured" : ""}
        >
          {loading ? "Processing..." : `Sign ${isLogin ? "in" : "up"} with Google`}
        </button>

        <button
          type="button"
          onClick={handleGithubSignIn}
          className="btn-outline github"
          disabled={!isFirebaseConfigured || loading}
          title={!isFirebaseConfigured ? "Firebase not configured" : ""}
        >
          {loading ? "Processing..." : `Sign ${isLogin ? "in" : "up"} with GitHub`}
        </button>

        <p className="toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({
                name: "",
                email: "",
                password: "",
                rememberMe: false,
              });
              setMessage("");
            }}
            className="link"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
