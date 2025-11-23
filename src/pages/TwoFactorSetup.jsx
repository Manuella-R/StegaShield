import React, { useState, useEffect, useRef } from "react";
import QRCodeLib from 'qrcode';
import { useAuth } from "../AuthContext";
import { authAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

// --- Main React Component ---
export default function TwoFactorSetup() {
    const { currentUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [qrValue, setQrValue] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const canvasRef = useRef(null);

    // Effect to generate the QR code once a QR value exists
    useEffect(() => {
        if (qrValue && canvasRef.current) {
            generateQRCodeCanvas();
        }
    }, [qrValue]);

    const generateQRCodeCanvas = async () => {
        if (!canvasRef.current || !qrValue) return;
        
        try {
            // Generate QR code using local library
            await QRCodeLib.toCanvas(canvasRef.current, qrValue, { 
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        } catch (err) {
            console.error("Error in QR code generation:", err);
            setError("Failed to generate QR code image.");
        }
    };

    // --- Generate QR Code and Secret from Backend ---
    const generateQR = async () => {
        try {
            setError(null);
            setMessage("");
            setIsGenerating(true);

            // Call backend to generate secret
            const response = await authAPI.setup2FA();
            
            if (response && response.secret && response.qrCode) {
                setSecret(response.secret);
                setQrValue(response.qrCode);
                setShowPopup(true);
            } else {
                setError("Failed to generate 2FA secret. Please try again.");
            }
        } catch (err) {
            console.error("Error generating QR:", err);
            setError(err.message || "Something went wrong while generating the QR code.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Verify and Enable 2FA ---
    const handleVerifyAndEnable = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError("Please enter a 6-digit verification code");
            return;
        }

        setIsVerifying(true);
        setError(null);
        setMessage("");

        try {
            await authAPI.enable2FA(verificationCode);
            setSuccess(true);
            setMessage("✅ 2FA enabled successfully!");
            
            // Refresh user data to get updated 2FA status
            if (currentUser) {
                try {
                    const userResponse = await authAPI.getCurrentUser();
                    if (userResponse && userResponse.user) {
                        // Update context with full user data
                        updateUser({
                            ...currentUser,
                            ...userResponse.user,
                            two_factor_enabled: userResponse.user.two_factor_enabled === 1 || userResponse.user.two_factor_enabled === true ? 1 : 0
                        });
                    }
                } catch (e) {
                    console.warn('Failed to refresh user data:', e);
                    // Fallback: just update the 2FA status
                    updateUser({ ...currentUser, two_factor_enabled: 1 });
                }
            }
            
            // Close popup and redirect after a delay
            setTimeout(() => {
                setShowPopup(false);
                navigate('/dashboard/profile');
            }, 2000);
        } catch (err) {
            console.error("Error enabling 2FA:", err);
            setError(err.message || "Invalid verification code. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    // --- Copy secret to clipboard (modern approach) ---
    const copySecret = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(secret);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = secret;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy secret: ', err);
            setError("Failed to copy secret.");
        }
    };
    
    // --- Close popup ---
    const closePopup = () => {
        setShowPopup(false);
        setQrValue(""); // Reset QR value to allow regeneration
    };

    return (
        <div
            className="auth-container"
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: "#f9f9f9",
            }}
        >
            <div
                className="auth-card"
                style={{
                    background: "#fff",
                    padding: "2rem",
                    borderRadius: "16px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    width: "400px",
                }}
            >
                <h1 className="title" style={{ marginBottom: "10px" }}>
                    Two-Factor Authentication Setup
                </h1>
                <p className="subtitle" style={{ marginBottom: "20px" }}>
                    Secure your account with a TOTP authenticator app.
                </p>
                {currentUser && (
                    <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                        Setting up 2FA for: <strong>{currentUser.email}</strong>
                    </p>
                )}

                {error && (
                    <p style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffe6e6', borderRadius: '4px' }}>
                        {error}
                    </p>
                )}

                <button
                    onClick={generateQR}
                    disabled={isGenerating}
                    className="btn"
                    style={{
                        background: "#111",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontWeight: "500",
                        cursor: isGenerating ? "not-allowed" : "pointer",
                        border: "none",
                        opacity: isGenerating ? 0.7 : 1,
                    }}
                >
                    {isGenerating ? "Generating..." : "Generate QR Code"}
                </button>

                {showPopup && (
                    <div
                        className="popup-overlay"
                        onClick={closePopup}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            className="popup-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: "#141313ff",
                                borderRadius: "16px",
                                padding: "2rem",
                                width: "360px",
                                textAlign: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            }}
                        >
                            <h2 style={{ marginBottom: "10px" }}>Scan this QR Code</h2>
                            <p style={{ color: "#555", marginBottom: "15px" }}>
                                Use Google or Microsoft Authenticator.
                            </p>
                            
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '200px',
                                border: qrValue ? 'none' : '1px dashed #181616ff',
                                borderRadius: '8px',
                                margin: '10px 0'
                            }}>
                                {qrValue ? (
                                    <canvas 
                                        ref={canvasRef} 
                                        width="200" 
                                        height="200"
                                    />
                                ) : (
                                    <p>Generating QR code...</p>
                                )}
                            </div>

                            <p style={{ marginTop: "15px", wordBreak: "break-all" }}>
                                Or manually enter this secret:
                                <br />
                                <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>{secret}</strong>
                            </p>

                            <button
                                onClick={copySecret}
                                disabled={!secret}
                                style={{
                                    color: "#0077ff",
                                    background: "transparent",
                                    border: "none",
                                    cursor: secret ? "pointer" : "not-allowed",
                                    marginTop: "8px",
                                    opacity: secret ? 1 : 0.5,
                                }}
                            >
                                {copied ? "Copied!" : "Copy Secret"}
                            </button>

                            {!success && (
                                <div style={{ marginTop: "1.5rem" }}>
                                    <p style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                                        Enter the code from your Authenticator app to verify and enable 2FA:
                                    </p>
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setVerificationCode(value);
                                        }}
                                        placeholder="000000"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid #ddd",
                                            fontSize: "1.25rem",
                                            textAlign: "center",
                                            letterSpacing: "0.5rem",
                                            fontFamily: "monospace",
                                            marginBottom: "0.5rem",
                                        }}
                                        maxLength={6}
                                    />
                                    {error && (
                                        <p style={{ color: "#ff0000", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                                            {error}
                                        </p>
                                    )}
                                    {message && (
                                        <p style={{ color: "#00aa00", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                                            {message}
                                        </p>
                                    )}
                                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                        <button
                                            onClick={handleVerifyAndEnable}
                                            disabled={isVerifying || verificationCode.length !== 6}
                                            className="btn"
                                            style={{
                                                background: "#111",
                                                color: "#fff",
                                                borderRadius: "10px",
                                                padding: "0.6rem 1.5rem",
                                                border: "none",
                                                cursor: (isVerifying || verificationCode.length !== 6) ? "not-allowed" : "pointer",
                                                opacity: (isVerifying || verificationCode.length !== 6) ? 0.6 : 1,
                                            }}
                                        >
                                            {isVerifying ? "Verifying..." : "Verify & Enable"}
                                        </button>
                                        <button
                                            onClick={closePopup}
                                            className="btn"
                                            style={{
                                                background: "transparent",
                                                color: "#666",
                                                borderRadius: "10px",
                                                padding: "0.6rem 1.5rem",
                                                border: "1px solid #ddd",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}