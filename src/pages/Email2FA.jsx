import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/authpages.css";

export default function Email2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem("pendingUser") || "";

  const [sentCode, setSentCode] = useState("");
  const [userCode, setUserCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSent, setHasSent] = useState(false); // Prevent duplicate sends

  // Automatically send the 2FA code once when user lands here
  useEffect(() => {
    if (email && !hasSent) {
      sendCode();
    } else if (!email) {
      alert("No email found! Redirecting to login...");
      navigate("/");
    }
  }, [email]);

  // Function to send the 2FA code
  const sendCode = async () => {
    if (hasSent) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/send-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Verification code sent to ${email}`);
        setSentCode(data.code.toString());
        setHasSent(true);
      } else {
        alert("❌ Failed to send verification email.");
      }
    } catch (error) {
      console.error("2FA Send Error:", error);
      alert("⚠️ Something went wrong while sending the verification email.");
    } finally {
      setLoading(false);
    }
  };

  // Function to verify the 2FA code
  const verifyCode = () => {
    if (userCode.trim() === sentCode.trim()) {
      setVerified(true);
      alert("✅ 2FA Verified Successfully!");
      localStorage.removeItem("pendingUser");
      navigate("/dashboard");
    } else {
      alert("❌ Incorrect code, please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">Email Two-Factor Authentication</h1>
        <p className="subtitle">
          A verification code has been sent to <b>{email}</b>
        </p>

        {!verified ? (
          <>
            <input
              type="text"
              placeholder="Enter the 6-digit code"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="input"
            />
            <button onClick={verifyCode} className="btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <p className="subtitle">
              Didn’t get the code?{" "}
              <button
                type="button"
                onClick={() => {
                  setHasSent(false);
                  sendCode();
                }}
                disabled={loading}
                className="link"
              >
                Resend Email
              </button>
            </p>
          </>
        ) : (
          <p>🎉 2FA verified! Redirecting to your dashboard...</p>
        )}
      </div>
    </div>
  );
}
