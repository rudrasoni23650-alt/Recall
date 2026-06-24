import { useState } from "react";
import { ArrowRight, Cloud, GithubLogo, GoogleLogo, User, ShieldCheck, PaintBrush } from "@phosphor-icons/react";

export function ProfilePage({ session, onSaveProfile, toast }) {
  const [name, setName] = useState(session?.name || session?.user?.email?.split("@")[0] || "User");
  const [bio, setBio] = useState("AI-assisted second memory space. Capturing articles, notes, and reminders.");
  const [theme, setTheme] = useState("petrol");
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSaveProfile({ name, theme });
      setSaving(false);
    }, 600);
  };

  const isGoogle = session?.user?.app_metadata?.provider === "google" || session?.user?.email?.includes("gmail");
  const isGithub = session?.user?.app_metadata?.provider === "github" || session?.isDemo;

  return (
    <div className="subpage profile-page" style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="subpage-heading">
        <div>
          <span className="page-kicker">Personal settings</span>
          <h1>Profile</h1>
          <p>Configure your workspace visual theme, metadata, and connected accounts.</p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "28px", marginTop: "32px" }}>
        
        {/* Profile Card Info */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={20} weight="duotone" /> Personal Identity
          </h2>
          <div style={{ display: "grid", gap: "16px" }}>
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
                rows={3}
                style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none", resize: "none", fontFamily: "inherit" }} 
              />
            </label>
          </div>
        </section>

        {/* Visual Customization */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <PaintBrush size={20} weight="duotone" /> Space Customization
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--petrol)" }}>
            Visual Theme
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              style={{ height: "42px", padding: "0 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.5)", fontSize: "14px", outline: "none" }}
            >
              <option value="petrol">Deep Petrol (Default)</option>
              <option value="dark">Classic Dark</option>
              <option value="warm">Warm Editorial</option>
            </select>
          </label>
        </section>

        {/* Storage Meter */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cloud size={20} weight="duotone" /> Cloud Storage
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
            <span>5.4 MB of 1,000 MB used</span>
            <span>0.5%</span>
          </div>
          <div style={{ height: "8px", width: "100%", background: "rgba(21,63,64,0.1)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "0.5%", background: "var(--coral, #f38a7c)", borderRadius: "4px" }} />
          </div>
        </section>

        {/* Security & Authentication */}
        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={20} weight="duotone" /> Connected Accounts
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.3)", borderRadius: "8px", border: "1px solid rgba(21,63,64,0.05)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><GoogleLogo size={18} weight="bold" /> Google Account</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: isGoogle ? "#10b981" : "var(--muted)" }}>{isGoogle ? "CONNECTED" : "NOT LINKED"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.3)", borderRadius: "8px", border: "1px solid rgba(21,63,64,0.05)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><GithubLogo size={18} weight="bold" /> GitHub Account</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: isGithub ? "#10b981" : "var(--muted)" }}>{isGithub ? "CONNECTED" : "NOT LINKED"}</span>
            </div>
          </div>
        </section>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving changes..." : "Save changes"} <ArrowRight weight="bold" />
          </button>
        </div>
      </form>
    </div>
  );
}
