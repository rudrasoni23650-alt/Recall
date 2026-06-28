import { useState, useEffect } from "react";
import { ShieldCheck, ArrowRight, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase.js";

export function MFAVerificationModal({ onVerify, onCancel }) {
  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFactors() {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        
        const totpFactor = data.totp.find(f => f.status === 'verified');
        if (totpFactor) {
          setFactorId(totpFactor.id);
        } else {
          setError("No verified TOTP factor found.");
        }
      } catch (err) {
        console.error("MFA load error:", err);
        setError("Failed to load MFA factors");
      }
    }
    loadFactors();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6 || !factorId) return;
    
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
      
      // Successfully verified AAL2
      onVerify();
    } catch (err) {
      console.error("MFA Verification Error:", err);
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay capture-overlay">
      <motion.section
        className="capture-modal mfa-modal"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{ maxWidth: "400px", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)" }}
      >
        <header className="capture-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={20} /> Two-Factor Auth</h2>
          {onCancel && (
            <button onClick={onCancel} className="icon-button" aria-label="Cancel">
              <X size={20} />
            </button>
          )}
        </header>
        
        <div className="capture-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
            Please enter the 6-digit code from your authenticator app to continue.
          </p>
          
          <form onSubmit={handleVerify} style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "24px", padding: "16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "rgba(255,255,255,0.5)" }}
              autoFocus
              required
            />
            
            {error && <p style={{ color: "var(--coral, #f38a7c)", fontSize: "12px", margin: 0 }}>{error}</p>}
            
            <button className="primary-button" type="submit" disabled={loading || code.length < 6 || !factorId} style={{ height: "40px", width: "100%", justifyContent: "center", marginTop: "8px" }}>
              {loading ? "Verifying..." : "Verify"} <ArrowRight weight="bold" />
            </button>
          </form>
        </div>
      </motion.section>
    </div>
  );
}
