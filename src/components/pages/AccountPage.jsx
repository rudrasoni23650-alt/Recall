import { useState } from "react";
import { 
  DownloadSimple, 
  Key, 
  Trash, 
  Shield, 
  ArrowRight, 
  Cardholder, 
  User, 
  PaintBrush, 
  Sliders,
  GithubLogo,
  GoogleLogo
} from "@phosphor-icons/react";

export function AccountPage({ 
  session, 
  memories, 
  reminders, 
  onSignOut, 
  onSaveProfile, 
  toast, 
  preferences, 
  updatePreferences, 
  setToast,
  onLinkAccount
}) {
  // Profile settings
  const [name, setName] = useState(session?.name || session?.user?.email?.split("@")[0] || "User");
  const [bio, setBio] = useState(preferences?.bio || "AI-assisted second memory space. Capturing articles, notes, and reminders.");
  const [theme, setTheme] = useState(preferences?.theme || "petrol");
  const [savingProfile, setSavingProfile] = useState(false);

  // Preference Toggles derived from props
  const autoSummarize = preferences?.autoSummarize ?? true;
  const showInsights = preferences?.showInsights ?? true;
  const emailHighlights = preferences?.emailHighlights ?? false;
  const compactCards = preferences?.compactCards ?? false;
  const mfa = preferences?.mfa ?? false;

  // Account settings
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleToggle = (key, currentVal, label) => {
    const newVal = !currentVal;
    updatePreferences({ [key]: newVal });
    if (setToast) {
      setToast(`${label} ${newVal ? "enabled" : "disabled"}`);
    }
  };

  const handleSaveProfileSubmit = (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      onSaveProfile({ name, theme, bio });
      setSavingProfile(false);
    }, 600);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setUpdatingPassword(true);
    setTimeout(() => {
      setPassword("");
      setNewPassword("");
      setUpdatingPassword(false);
      alert("Password updated (simulated). In cloud mode, check your email for the confirmation link.");
    }, 800);
  };

  const handleExportData = () => {
    const exportObj = {
      exportedAt: new Date().toISOString(),
      user: session?.user?.email || "demo-user",
      memories: memories,
      reminders: reminders,
      preferences: {
        autoSummarize,
        showInsights,
        emailHighlights,
        compactCards,
        theme
      }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `recall_space_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isGoogle = !!session?.googleConnected;
  const isGithub = !!session?.githubConnected;

  return (
    <div className="subpage account-page" style={{ maxWidth: "100%", margin: "0" }}>
      <div className="subpage-heading">
        <div>
          <span className="page-kicker">Settings dashboard</span>
          <h1>Account & Settings</h1>
          <p>Customize your profile, configure layout preferences, toggle AI models, and manage security.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "28px", marginTop: "32px" }}>
        
        {/* Section 1: Profile Identity */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={20} weight="duotone" /> Profile Details
          </h2>
          <form onSubmit={handleSaveProfileSubmit} style={{ display: "grid", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
              Display Name
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                style={{ height: "42px", padding: "0 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none" }} 
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
              Short Bio
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={2}
                style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none", resize: "none", fontFamily: "inherit" }} 
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="primary-button" disabled={savingProfile} style={{ height: "40px", fontSize: "12px", padding: "0 16px" }}>
                {savingProfile ? "Saving..." : "Save changes"} <ArrowRight weight="bold" />
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Workspace Preferences (Toggles!) */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={20} weight="duotone" /> Preferences & Toggles
          </h2>
          <div style={{ display: "grid", gap: "16px" }}>
            
            {/* Toggle 1: Auto Summarize */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Auto-Summarize Captures</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Use Gemini models to summarize and organize new notes and links automatically.</p>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input 
                  type="checkbox" 
                  checked={autoSummarize} 
                  onChange={() => handleToggle("autoSummarize", autoSummarize, "Auto-Summarize Captures")} 
                  style={{ width: "42px", height: "24px", appearance: "none", background: autoSummarize ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
                />
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: autoSummarize ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
              </label>
            </div>

            {/* Toggle 2: Show AI Insights */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Show AI Insights & Actions</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Display AI summaries and suggested action plans inside resurfaced memory cards.</p>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input 
                  type="checkbox" 
                  checked={showInsights} 
                  onChange={() => handleToggle("showInsights", showInsights, "Show AI Insights")} 
                  style={{ width: "42px", height: "24px", appearance: "none", background: showInsights ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
                />
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: showInsights ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
              </label>
            </div>

            {/* Toggle 3: Email Highlights */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Email Weekly Highlights</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Receive a clean newsletter of resurfaced memories once a week.</p>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input 
                  type="checkbox" 
                  checked={emailHighlights} 
                  onChange={() => handleToggle("emailHighlights", emailHighlights, "Weekly Email Highlights")} 
                  style={{ width: "42px", height: "24px", appearance: "none", background: emailHighlights ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
                />
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: emailHighlights ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
              </label>
            </div>

            {/* Toggle 4: Compact Cards */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Compact Memory Grid</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Render all memories in a compact layout with minimized padding and detail views.</p>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input 
                  type="checkbox" 
                  checked={compactCards} 
                  onChange={() => handleToggle("compactCards", compactCards, "Compact Memory Grid")} 
                  style={{ width: "42px", height: "24px", appearance: "none", background: compactCards ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
                />
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: compactCards ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
              </label>
            </div>

          </div>
        </section>

        {/* Section 3: Visual Theme Customization */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <PaintBrush size={20} weight="duotone" /> Visual Customization
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
            Space Visual Theme
            <select 
              value={theme} 
              onChange={(e) => {
                setTheme(e.target.value);
                onSaveProfile({ name, theme: e.target.value, bio });
              }}
              style={{ height: "42px", padding: "0 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none" }}
            >
              <option value="petrol">Deep Petrol (Default)</option>
              <option value="dark">Classic Dark</option>
              <option value="warm">Warm Editorial</option>
            </select>
          </label>
        </section>

        {/* Section 4: Security & Credentials */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Key size={20} weight="duotone" /> Security Credentials
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
              <button className="primary-button" type="submit" disabled={updatingPassword || !newPassword} style={{ height: "40px", fontSize: "12px", padding: "0 16px" }}>
                {updatingPassword ? "Updating..." : "Update password"} <ArrowRight weight="bold" />
              </button>
            </div>
          </form>
        </section>

        {/* Section 5: Two-Factor Authentication (2FA) */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={20} weight="duotone" /> Two-Factor Authentication (2FA)
            </h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Add an extra layer of protection to your Recall space.</p>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
            <input 
              type="checkbox" 
              checked={mfa} 
              onChange={() => handleToggle("mfa", mfa, "Two-Factor Authentication")} 
              style={{ width: "42px", height: "24px", appearance: "none", background: mfa ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
            />
            <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: mfa ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
          </label>
        </section>

        {/* Section 6: Storage & Connected Accounts */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cardholder size={20} weight="duotone" /> Account details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Registered Email</span>
              <p style={{ fontSize: "14px", fontWeight: "600", margin: "4px 0 0" }}>{session?.user?.email || "explore@recall.ai"}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Subscription Tier</span>
              <p style={{ fontSize: "14px", fontWeight: "600", margin: "4px 0 0", color: "var(--coral-deep)" }}>Recall Pro (Free MVP)</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Connected Accounts</span>
            <div style={{ display: "grid", gap: "10px", marginBottom: "18px" }}>
              <button
                type="button"
                onClick={() => onLinkAccount && onLinkAccount("google")}
                style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.3)", borderRadius: "8px", border: "1px solid rgba(21,63,64,0.05)", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 600 }}><GoogleLogo size={17} weight="bold" /> Google</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isGoogle ? "#10b981" : "var(--muted)" }}>{isGoogle ? "CONNECTED" : "NOT LINKED"}</span>
              </button>
              <button
                type="button"
                onClick={() => onLinkAccount && onLinkAccount("github")}
                style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.3)", borderRadius: "8px", border: "1px solid rgba(21,63,64,0.05)", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 600 }}><GithubLogo size={17} weight="bold" /> GitHub</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isGithub ? "#10b981" : "var(--muted)" }}>{isGithub ? "CONNECTED" : "NOT LINKED"}</span>
              </button>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Space Storage Limits</span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>
              <span>5.4 MB of 1,000 MB used</span>
              <span>0.5%</span>
            </div>
            <div style={{ height: "8px", width: "100%", background: "rgba(21,63,64,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "0.5%", background: "var(--coral, #f38a7c)", borderRadius: "4px" }} />
            </div>
          </div>
        </section>

        {/* Section 7: Data Export */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <DownloadSimple size={20} weight="duotone" /> Data Portability & Archive
            </h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Download a complete backup JSON containing your archive.</p>
          </div>
          <button className="primary-button" type="button" onClick={handleExportData} style={{ height: "40px", fontSize: "12px", padding: "0 16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <DownloadSimple size={16} weight="bold" /> Export Archive
          </button>
        </section>

        {/* Section 8: Danger Zone */}
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
