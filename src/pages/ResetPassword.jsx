// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/authpages.css";
import { authAPI } from "../utils/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid reset link. Please request a new password reset.");
      setShowPopup(true);
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!token) {
      setMessage("Invalid reset link. Please request a new password reset.");
      setShowPopup(true);
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      setShowPopup(true);
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setShowPopup(true);
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(token, formData.newPassword);
      setMessage("Password reset successfully! Redirecting to login...");
      setShowPopup(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setMessage(error.message || "Failed to reset password. The link may have expired. Please request a new one.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    if (message.includes("successfully")) {
      navigate("/");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">S</div>

        <h1 className="title">Reset Password</h1>
        <p className="subtitle">Enter your new password below</p>

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

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="form">
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="New password"
              required
              className="input"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--cream)",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            required
            className="input"
            minLength={6}
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--muted-cream)" }}>
          <a
            href="/"
            style={{ color: "var(--accent-gold)", textDecoration: "none" }}
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

