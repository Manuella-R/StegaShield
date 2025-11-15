// src/pages/TwoFactorVerify.jsx
import React, { useState } from "react";
import { authenticator } from "otplib";
import { useNavigate } from "react-router-dom";

export default function TwoFactorVerify() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleVerify = () => {
    const secret = localStorage.getItem("totpSecret");
    if (!secret) {
      setMessage("No secret found. Please set up 2FA first.");
      return;
    }

    const isValid = authenticator.verify({ token: code, secret });
    if (isValid) {
      setMessage("✅ Verification successful!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } else {
      setMessage("❌ Invalid code. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">Two-Factor Verification</h1>
        <p className="subtitle">Enter the 6-digit code from your Authenticator app.</p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          className="input"
        />
        <button onClick={handleVerify} className="btn">
          Verify Code →
        </button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
