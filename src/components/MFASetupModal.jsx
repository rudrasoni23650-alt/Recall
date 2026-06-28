import { useState, useEffect } from "react";
import { X, ShieldCheck, ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabase.js";

export function MFASetupModal({ onClose, onVerify }) {
  const [qrCode, setQrCode] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function startEnrollment() {
      try {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (error) throw error;
        
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (err) {
        console.error("MFA Enrollment Error:", err);
        setError(err.message || "Failed to start 2FA enrollment");
      }
    }
    startEnrollment();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) return;
    
    setLoading(true);
    setError("");
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code
      });
      
      if (verify.error) throw verify.error;
      
      // Successfully verified
      setStep(2); // Success step
      setTimeout(() => {
        onVerify();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("MFA Verification Error:", err);
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay capture-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.section
        className="capture-modal mfa-modal"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{ maxWidth: "400px", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)" }}
      >
        <header className="capture-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={20} /> Setup Two-Factor Auth</h2>
          <button onClick={onClose} className="icon-button" aria-label="Cancel">
            <X size={20} />
          </button>
        </header>
        
        <div className="capture-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
          {step === 1 ? (
            <>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
                Scan this QR code with your authenticator app (like Authy or Google Authenticator).
              </p>
              
              <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)", alignSelf: "center" }}>
                {qrCode ? (
                  <QRCodeSVG value={qrCode} size={200} />
                ) : (
                  <div style={{ width: "200px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                    {error ? "Failed to load" : "Generating..."}
                  </div>
                )}
              </div>
              
              {secret && (
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                  Secret code: <strong style={{ userSelect: "all", fontFamily: "monospace", letterSpacing: "1px" }}>{secret}</strong>
                </p>
              )}

              <form onSubmit={handleVerify} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ textAlign: "center", letterSpacing: "4px", fontSize: "18px", padding: "12px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "rgba(255,255,255,0.5)" }}
                  autoFocus
                  required
                />
                
                {error && <p style={{ color: "var(--coral, #f38a7c)", fontSize: "12px", margin: 0 }}>{error}</p>}
                
                <button className="primary-button" type="submit" disabled={loading || code.length < 6} style={{ height: "40px", width: "100%", justifyContent: "center" }}>
                  {loading ? "Verifying..." : "Verify & Enable 2FA"} <ArrowRight weight="bold" />
                </button>
              </form>
            </>
          ) : (
            <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <ShieldCheck size={64} weight="duotone" color="#10b981" />
              </motion.div>
              <h3 style={{ margin: 0, color: "var(--ink)", fontSize: "20px" }}>2FA Enabled</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>Your account is now more secure.</p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
