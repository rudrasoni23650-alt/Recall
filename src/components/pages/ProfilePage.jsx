import { useState, useEffect } from "react";
import {
  ArrowRight,
  Cloud,
  GithubLogo,
  GoogleLogo,
  User,
  ShieldCheck,
  PaintBrush,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Database,
  Check
} from "@phosphor-icons/react";
import { apiFetch } from "../../lib/api.js";

export function ProfilePage({
  session,
  onSaveProfile,
  preferences,
  updatePreferences,
  onLinkAccount,
  applyTheme,
  setToast
}) {
  const [name, setName] = useState(session?.name || session?.user?.email?.split("@")[0] || "User");
  const [bio, setBio] = useState(preferences?.bio || "AI-assisted second memory space. Capturing articles, notes, and reminders.");
  const [theme, setTheme] = useState(preferences?.theme || localStorage.getItem("recall-theme") || "petrol");
  const [saving, setSaving] = useState(false);

  // Cloud Storage Real-Time State
  const [storageData, setStorageData] = useState({
    usedBytes: 88400,
    limitBytes: 1048576000,
    percentage: "0.1",
    formattedUsed: "86.3 KB",
    formattedLimit: "1,000 MB",
    storageType: "cloud",
    breakdown: {
      textBytes: 45000,
      mediaBytes: 31000,
      audioBytes: 0,
      indexBytes: 12400
    }
  });
  const [refreshingStorage, setRefreshingStorage] = useState(false);
  const [storageLastUpdated, setStorageLastUpdated] = useState(null);

  // Fetch real-time cloud storage
  const fetchStorageData = async (showToast = false) => {
    setRefreshingStorage(true);
    try {
      const res = await apiFetch("/api/storage");
      if (res && res.usedBytes !== undefined) {
        setStorageData(res);
        setStorageLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (showToast && setToast) {
          setToast("Cloud storage metrics refreshed");
        }
      }
    } catch (err) {
      console.warn("Could not refresh live storage stats:", err);
    } finally {
      setRefreshingStorage(false);
    }
  };

  useEffect(() => {
    fetchStorageData(false);
  }, []);

  // Synchronize theme with preferences prop if updated elsewhere
  useEffect(() => {
    if (preferences?.theme && preferences.theme !== theme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme]);

  const themes = [
    {
      id: "petrol",
      name: "Deep Petrol",
      subtitle: "Signature Forest & Sand",
      colors: {
        rail: "#083c3e",
        surface: "#f7f7f1",
        canvas: "#f1f2eb",
        accent: "#dc806d"
      }
    },
    {
      id: "dark",
      name: "Midnight Obsidian",
      subtitle: "Pure Obsidian Black & High-Contrast",
      colors: {
        rail: "#000000",
        surface: "#0c0c0c",
        canvas: "#000000",
        accent: "#f38a78"
      }
    },
    {
      id: "monochrome",
      name: "Minimalist Studio",
      subtitle: "Graphite & Gallery White",
      colors: {
        rail: "#181a1c",
        surface: "#ffffff",
        canvas: "#f2f3f5",
        accent: "#e25d48"
      }
    },
    {
      id: "apple-glass",
      name: "Frosted Glass",
      subtitle: "Liquid Translucency & Vibrant Blue",
      colors: {
        rail: "rgba(245, 247, 250, 0.85)",
        surface: "rgba(255, 255, 255, 0.75)",
        canvas: "#f5f6f9",
        accent: "#0071e3"
      }
    }
  ];

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    if (applyTheme) {
      applyTheme(themeId);
    }
    if (updatePreferences) {
      updatePreferences({ theme: themeId });
    }
    if (setToast) {
      const selected = themes.find(t => t.id === themeId);
      setToast(`Switched space theme to ${selected?.name || themeId}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSaveProfile) {
        await onSaveProfile({ name, theme, bio });
      }
    } finally {
      setSaving(false);
    }
  };

  const isGoogle = Boolean(session?.googleConnected);
  const isGithub = Boolean(session?.githubConnected);
  const userEmail = session?.user?.email || "Account Owner";

  const formatBytes = (bytes) => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="subpage profile-page" style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "60px" }}>
      <div className="subpage-heading" style={{ marginBottom: "24px" }}>
        <div>
          <span className="page-kicker">Personal settings</span>
          <h1 style={{ font: "400 32px var(--display)", margin: "4px 0 8px", color: "var(--ink)" }}>Profile & Space Settings</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            Configure your workspace identity, customize theme palettes, monitor real-time cloud storage, and manage linked OAuth accounts.
          </p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "24px", width: "100%", minWidth: 0 }}>
        
        {/* 1. Space Customization with Themes */}
        <section
          className="settings-section"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ font: "500 18px var(--display)", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <PaintBrush size={20} weight="duotone" style={{ color: "var(--coral-deep)" }} /> Space Customization & Themes
            </h2>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Changes apply instantly across your workspace
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {themes.map((t) => {
              const isSelected = theme === t.id;
              const accentColor = t.colors.accent;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`theme-card-option ${isSelected ? "is-active" : ""}`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                    boxShadow: isSelected ? `0 8px 24px -4px ${accentColor}35, 0 0 0 1px ${accentColor}30` : undefined
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="theme-card-title">{t.name}</span>
                    {isSelected ? (
                      <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        color: accentColor,
                        background: `${accentColor}18`,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        border: `1px solid ${accentColor}30`
                      }}>
                        <Check size={12} weight="bold" /> ACTIVE
                      </span>
                    ) : null}
                  </div>

                  <span className="theme-card-subtitle">{t.subtitle}</span>

                  {/* Swatch Preview Strip */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <div
                      title="Rail background"
                      style={{
                        width: "28px",
                        height: "20px",
                        borderRadius: "4px",
                        background: t.colors.rail,
                        border: "1px solid rgba(255,255,255,0.14)"
                      }}
                    />
                    <div
                      title="Canvas background"
                      style={{
                        width: "28px",
                        height: "20px",
                        borderRadius: "4px",
                        background: t.colors.canvas,
                        border: "1px solid rgba(255,255,255,0.14)"
                      }}
                    />
                    <div
                      title="Card surface"
                      style={{
                        width: "28px",
                        height: "20px",
                        borderRadius: "4px",
                        background: t.colors.surface,
                        border: "1px solid rgba(255,255,255,0.14)"
                      }}
                    />
                    <div
                      title="Accent accent"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        background: t.colors.accent,
                        border: "1px solid rgba(255,255,255,0.14)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Real-Time Cloud Storage */}
        <section
          className="settings-section"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ font: "500 18px var(--display)", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <Cloud size={20} weight="duotone" style={{ color: "var(--coral, var(--petrol))" }} /> Cloud Storage & Space Allocation
            </h2>
            <button
              type="button"
              onClick={() => fetchStorageData(true)}
              disabled={refreshingStorage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--line)",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background 0.15s ease"
              }}
            >
              <ArrowsClockwise size={14} weight="bold" className={refreshingStorage ? "spin-icon" : ""} />
              {refreshingStorage ? "Syncing..." : "Refresh Live Metrics"}
            </button>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                {storageData.formattedUsed} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "13px" }}>of {storageData.formattedLimit} allocated</span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--coral-deep)" }}>
                {storageData.percentage}% capacity
              </span>
            </div>

            {/* Live Progress Bar */}
            <div className="storage-track-bar" style={{ height: "10px", width: "100%", borderRadius: "6px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(parseFloat(storageData.percentage) || 0.1, 0.4)}%`,
                  background: "linear-gradient(90deg, var(--coral), var(--coral-deep))",
                  borderRadius: "6px",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              />
            </div>
          </div>

          {/* Breakdown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "18px" }}>
            <div className="storage-metric-box">
              <span className="storage-metric-label">
                Text & Notes
              </span>
              <span className="storage-metric-value">
                {formatBytes(storageData.breakdown?.textBytes)}
              </span>
            </div>
            <div className="storage-metric-box">
              <span className="storage-metric-label">
                Uploads & Media
              </span>
              <span className="storage-metric-value">
                {formatBytes(storageData.breakdown?.mediaBytes)}
              </span>
            </div>
            <div className="storage-metric-box">
              <span className="storage-metric-label">
                Voice & Audio
              </span>
              <span className="storage-metric-value">
                {formatBytes(storageData.breakdown?.audioBytes)}
              </span>
            </div>
            <div className="storage-metric-box">
              <span className="storage-metric-label">
                Metadata & Index
              </span>
              <span className="storage-metric-value">
                {formatBytes(storageData.breakdown?.indexBytes)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "11px", color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Database size={13} /> {storageData.storageType === "cloud" ? "Supabase Cloud Database & Storage Active" : "Encrypted Local Database Active"}
            </span>
            {storageLastUpdated && <span>Last verified: {storageLastUpdated}</span>}
          </div>
        </section>

        {/* 3. Linked Accounts (Real Backend Operations) */}
        <section
          className="settings-section"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ font: "500 18px var(--display)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <ShieldCheck size={20} weight="duotone" style={{ color: "#10b981" }} /> Connected Authentication Accounts
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              Connect multiple providers to sign in or unlink identity credentials from your database record.
            </p>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {/* Google Account Card */}
            <div className="account-card-box">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.06)"
                }}>
                  <GoogleLogo size={20} weight="bold" style={{ color: "#ea4335" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Google Account</span>
                    {isGoogle ? (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#059669",
                        background: "rgba(16,185,129,0.12)",
                        padding: "2px 8px",
                        borderRadius: "12px"
                      }}>
                        <CheckCircle size={12} weight="fill" /> CONNECTED & VERIFIED
                      </span>
                    ) : (
                      <span className="not-linked-badge" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        background: "rgba(0,0,0,0.05)",
                        padding: "2px 8px",
                        borderRadius: "12px"
                      }}>
                        NOT LINKED
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px", display: "block" }}>
                    {isGoogle ? `Linked to ${userEmail}` : "Sign in quickly using your Google identity"}
                  </span>
                </div>
              </div>

              <div>
                {isGoogle ? (
                  <button
                    type="button"
                    onClick={() => onLinkAccount && onLinkAccount("google")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#b91c1c",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <XCircle size={14} weight="bold" /> Unlink Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onLinkAccount && onLinkAccount("google")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ink)",
                      background: "rgba(21,63,64,0.08)",
                      border: "1px solid var(--line)",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <GoogleLogo size={14} weight="bold" /> Connect Google
                  </button>
                )}
              </div>
            </div>

            {/* GitHub Account Card */}
            <div className="account-card-box">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#24292e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                }}>
                  <GithubLogo size={20} weight="fill" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>GitHub Account</span>
                    {isGithub ? (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#059669",
                        background: "rgba(16,185,129,0.12)",
                        padding: "2px 8px",
                        borderRadius: "12px"
                      }}>
                        <CheckCircle size={12} weight="fill" /> CONNECTED & VERIFIED
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        background: "rgba(0,0,0,0.05)",
                        padding: "2px 8px",
                        borderRadius: "12px"
                      }}>
                        NOT LINKED
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px", display: "block" }}>
                    {isGithub ? "Connected for developer synchronization" : "Link your GitHub developer credentials"}
                  </span>
                </div>
              </div>

              <div>
                {isGithub ? (
                  <button
                    type="button"
                    onClick={() => onLinkAccount && onLinkAccount("github")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#b91c1c",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <XCircle size={14} weight="bold" /> Unlink Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onLinkAccount && onLinkAccount("github")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ink)",
                      background: "rgba(21,63,64,0.08)",
                      border: "1px solid var(--line)",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <GithubLogo size={14} weight="bold" /> Connect GitHub
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Personal Identity */}
        <section
          className="settings-section"
          style={{
            background: "rgba(255,255,255,0.4)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <h2 style={{ font: "500 18px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
            <User size={20} weight="duotone" style={{ color: "var(--coral, var(--petrol))" }} /> Personal Identity & Bio
          </h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
              Display Name
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your full or display name"
                style={{
                  height: "42px",
                  padding: "0 14px",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  background: "var(--surface)",
                  fontSize: "14px",
                  color: "var(--ink)",
                  outline: "none"
                }} 
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
              Workspace Bio
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={3}
                placeholder="Describe your space or focus areas..."
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  background: "var(--surface)",
                  fontSize: "14px",
                  color: "var(--ink)",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit"
                }} 
              />
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
            style={{
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600
            }}
          >
            {saving ? "Saving changes..." : "Save Profile & Settings"} <ArrowRight weight="bold" />
          </button>
        </div>
      </form>
    </div>
  );
}
