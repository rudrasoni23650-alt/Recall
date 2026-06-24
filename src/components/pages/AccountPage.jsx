import { useState } from "react";
import { DownloadSimple, Key, Trash, Shield, ArrowRight, Cardholder } from "@phosphor-icons/react";

export function AccountPage({ session, memories, reminders, onSignOut, toast }) {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mfa, setMfa] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleExportData = () => {
    // Generate and download a JSON file of their memories & reminders
    const exportObj = {
      exportedAt: new Date().toISOString(),
      user: session?.user?.email || "demo-user",
      memories: memories,
      reminders: reminders
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `recall_space_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setUpdating(true);
    setTimeout(() => {
      setPassword("");
      setNewPassword("");
      setUpdating(false);
      alert("Password updated (simulated). In cloud mode, check your email for the confirmation link.");
    }, 800);
  };

  return (
    <div className="subpage account-page" style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="subpage-heading">
        <div>
          <span className="page-kicker">Security and credentials</span>
          <h1>Account</h1>
          <p>Configure password settings, export your personal archives, or manage account billing.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "28px", marginTop: "32px" }}>
        
        {/* Account Details */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cardholder size={20} weight="duotone" /> Subscription Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Registered Email</span>
              <p style={{ fontSize: "14px", fontWeight: "600", margin: "4px 0 0" }}>{session?.user?.email || "explore@recall.ai"}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Plan Tier</span>
              <p style={{ fontSize: "14px", fontWeight: "600", margin: "4px 0 0", color: "var(--coral-deep, #e27668)" }}>Recall Pro MVP (Free Tier)</p>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Key size={20} weight="duotone" /> Update Security Credentials
          </h2>
          <form onSubmit={handleUpdatePassword} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
                Current Password
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ height: "42px", padding: "0 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none" }} 
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
                New Password
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ height: "42px", padding: "0 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none" }} 
                />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="primary-button" type="submit" disabled={updating || !newPassword} style={{ height: "40px", fontSize: "12px", padding: "0 16px" }}>
                {updating ? "Updating..." : "Update password"} <ArrowRight weight="bold" />
              </button>
            </div>
          </form>
        </section>

        {/* Multi-Factor Authentication (MFA) */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={20} weight="duotone" /> Two-Factor Authentication (2FA)
            </h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Add an extra layer of protection to your Recall space.</p>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={mfa} 
              onChange={() => setMfa(!mfa)} 
              style={{ width: "42px", height: "24px", appearance: "none", background: mfa ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "0.2s outline-color, 0.2s background-color", outline: "none" }} 
            />
            <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: mfa ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
          </label>
        </section>

        {/* Data Portability (Export) */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <DownloadSimple size={20} weight="duotone" /> Data Portability & Backup
            </h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Download a complete record of your memories and reminders as a JSON archive.</p>
          </div>
          <button className="primary-button" type="button" onClick={handleExportData} style={{ height: "40px", fontSize: "12px", padding: "0 16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <DownloadSimple size={16} weight="bold" /> Export Archive
          </button>
        </section>

        {/* Danger Zone */}
        <section className="settings-section" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
              <Trash size={20} weight="duotone" /> Danger Zone
            </h2>
            <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>Permanently erase your Recall space and delete your account details.</p>
          </div>
          <button 
            className="primary-button" 
            type="button" 
            onClick={() => {
              if (confirm("Are you absolutely sure you want to delete your Recall space? This cannot be undone.")) {
                onSignOut();
              }
            }} 
            style={{ height: "40px", fontSize: "12px", padding: "0 16px", background: "#ef4444", borderColor: "#dc2626", color: "#fff" }}
          >
            Delete Account
          </button>
        </section>

      </div>
    </div>
  );
}
