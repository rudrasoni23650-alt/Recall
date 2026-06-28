import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { 
  DownloadSimple, 
  Key, 
  Trash, 
  EnvelopeSimple, 
  Password, 
  Shield, 
  ShieldCheck, 
  ArrowRight, 
  Download,
  GithubLogo,
  GoogleLogo,
  PuzzlePiece,
  Archive,
  Warning,
  X,
  Check,
  User
} from "@phosphor-icons/react";
import { supabase } from "../../lib/supabase.js";
import { apiFetch } from "../../lib/api.js";
import { MFASetupModal } from "../MFASetupModal.jsx";

export function AccountPage({ 
  session, 
  memories, 
  archivedMemories,
  onEmptyArchive,
  onDeleteArchivedMemories,
  reminders, 
  onSignOut, 
  onSaveProfile, 
  toast, 
  preferences, 
  updatePreferences, 
  setToast,
  onLinkAccount
}) {
  const [name, setName] = useState(session?.name || session?.user?.email?.split("@")[0] || "User");
  const [bio, setBio] = useState(preferences?.bio || "AI-assisted second memory space. Capturing articles, notes, and reminders.");
  const [theme, setTheme] = useState(preferences?.theme || "petrol");
  const [savingProfile, setSavingProfile] = useState(false);

  const autoSummarize = preferences?.autoSummarize ?? true;
  const showInsights = preferences?.showInsights ?? true;
  const emailHighlights = preferences?.emailHighlights ?? false;
  const compactCards = preferences?.compactCards ?? false;
  const mfa = preferences?.mfa ?? false;
  const pushNotifications = preferences?.pushNotifications ?? false;
  const [sendingDigest, setSendingDigest] = useState(false);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [extensionToken, setExtensionToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);

  const [selectedArchiveIds, setSelectedArchiveIds] = useState(new Set());
  const [archiveModalState, setArchiveModalState] = useState({ open: false, type: null });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [storageStats, setStorageStats] = useState({ usedBytes: 0, limitBytes: 1048576000 });
  const [fetchingStorage, setFetchingStorage] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchStorage() {
      if (!session?.user || session.isDemo) return;
      setFetchingStorage(true);
      try {
        const data = await apiFetch('/api/storage');
        if (mounted && data && typeof data.usedBytes === 'number') {
          setStorageStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch storage stats', err);
      } finally {
        if (mounted) setFetchingStorage(false);
      }
    }
    fetchStorage();
    return () => { mounted = false; };
  }, [session]);

  const [mfaModalOpen, setMfaModalOpen] = useState(false);

  const handleToggle = async (key, currentVal, label) => {
    if (key === 'mfa') {
      if (currentVal) {
        if (confirm("Are you sure you want to disable Two-Factor Authentication?")) {
          try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            const totpFactor = data.totp.find(f => f.status === 'verified');
            if (totpFactor) {
              const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
              if (unenrollError) throw unenrollError;
              updatePreferences({ mfa: false });
              if (setToast) setToast("Two-Factor Authentication disabled");
            }
          } catch (err) {
            console.error("MFA disable error", err);
            alert("Failed to disable MFA. Try again.");
          }
        }
      } else {
        setMfaModalOpen(true);
      }
      return;
    }

    const newVal = !currentVal;
    updatePreferences({ [key]: newVal });
    if (setToast) {
      setToast(`${label} ${newVal ? "enabled" : "disabled"}`);
    }
  };

  const sendTestDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await fetch('/api/cron/weekly-highlights?test=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        if (setToast) setToast(data.simulated ? "Simulated test digest email printed to server logs!" : "Test digest email sent via Resend!");
      } else {
        throw new Error(data.error || "Failed to trigger highlights");
      }
    } catch (err) {
      console.error("Highlights email error:", err);
      alert(`Failed to send test email: ${err.message}`);
    } finally {
      setSendingDigest(false);
    }
  };

  const handleTogglePush = async (currentVal) => {
    if (currentVal) {
      updatePreferences({ pushNotifications: false });
      if (setToast) setToast("Push Notifications disabled");
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Permission not granted for notifications.");
        return;
      }

      const res = await fetch('/api/notifications/vapid-public-key');
      const data = await res.json();
      if (!data.success || !data.publicKey) {
        throw new Error("Failed to load VAPID public key");
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      });

      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ subscription })
      });
      const saveResult = await saveRes.json();
      if (!saveResult.success) throw new Error("Failed to store subscription");

      updatePreferences({ pushNotifications: true });
      if (setToast) setToast("Push Notifications enabled!");
    } catch (err) {
      console.error("Web Push registration error:", err);
      alert(`Push subscription failed: ${err.message}`);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const toggleArchiveSelection = (id) => {
    setSelectedArchiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllArchives = () => {
    if (selectedArchiveIds.size === archivedMemories?.length) {
      setSelectedArchiveIds(new Set());
    } else {
      setSelectedArchiveIds(new Set(archivedMemories?.map(m => m.id) || []));
    }
  };

  const handleConfirmDelete = () => {
    if (archiveModalState.type === 'empty') {
      onEmptyArchive?.();
    } else if (archiveModalState.type === 'selected') {
      onDeleteArchivedMemories?.(Array.from(selectedArchiveIds));
    }
    setArchiveModalState({ open: false, type: null });
    setSelectedArchiveIds(new Set());
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const sessionData = await supabase.auth.getSession();
      const token = sessionData?.data?.session?.access_token;
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete account');
      await supabase.auth.signOut();
      onSignOut();
    } catch (err) {
      console.error('Delete account error:', err);
      if (setToast) setToast(err.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
      setDeleteModalOpen(false);
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    const provider = session?.user?.app_metadata?.provider;
    const identities = session?.user?.identities || [];
    const hasPasswordIdentity = identities.some(id => id.provider === 'email');
    if (provider && provider !== 'email' && !hasPasswordIdentity) {
      if (setToast) setToast(`Password login isn't available for ${provider} accounts.`);
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassword('');
      setNewPassword('');
      if (setToast) setToast('Password updated successfully.');
    } catch (err) {
      console.error('Password update error:', err);
      if (setToast) setToast(err.message || 'Failed to update password. Please try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleGenerateExtensionToken = async () => {
    setGeneratingToken(true);
    try {
      const sessionData = await supabase.auth.getSession();
      const token = sessionData?.data?.session?.access_token;
      
      const res = await fetch("/api/extension/token", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExtensionToken(data.token);
        if (setToast) setToast("Token generated! Copy it to your extension.");
      } else {
        alert("Failed to generate token.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating token");
    }
    setGeneratingToken(false);
  };

  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await apiFetch('/api/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `recall_space_export_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (setToast) setToast("Export downloaded successfully");
    } catch (err) {
      console.error("Export error:", err);
      if (setToast) setToast("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const isGoogle = !!session?.googleConnected;
  const isGithub = !!session?.githubConnected;

  return (
    <div className="subpage account-page">
      <div className="subpage-heading">
        <div>
          <span className="page-kicker">Settings dashboard</span>
          <h1>Account & Settings</h1>
          <p>Customize your profile, configure layout preferences, toggle AI models, and manage security.</p>
        </div>
      </div>

      <motion.div style={{ display: "grid", gap: "28px", marginTop: "32px", width: "100%", minWidth: 0 }}>
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

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={20} weight="duotone" /> Preferences & Toggles
          </h2>
          <div style={{ display: "grid", gap: "16px" }}>
            
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Email Weekly Highlights</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Receive a clean newsletter of resurfaced memories once a week.</p>
                {emailHighlights && (
                  <button 
                    onClick={sendTestDigest}
                    disabled={sendingDigest}
                    className="page-action-button"
                    style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11px', height: 'auto', minHeight: 'auto', background: 'rgba(255,255,255,0.15)' }}
                  >
                    {sendingDigest ? "Sending..." : "Send Test Digest"}
                  </button>
                )}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Push Notifications</strong>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>Get real-time browser alerts when scheduled reminders are due.</p>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input 
                  type="checkbox" 
                  checked={pushNotifications} 
                  onChange={() => handleTogglePush(pushNotifications)} 
                  style={{ width: "42px", height: "24px", appearance: "none", background: pushNotifications ? "var(--coral, #f38a7c)" : "rgba(21,63,64,0.15)", borderRadius: "12px", cursor: "pointer", transition: "0.2s background-color", outline: "none" }} 
                />
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", margin: "4px", transform: pushNotifications ? "translateX(18px)" : "translateX(0)", transition: "0.2s transform" }} />
              </label>
            </div>

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

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Palette size={20} weight="duotone" /> Visual Customization
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

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h2 style={{ font: "400 20px var(--display)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Password size={20} weight="duotone" /> Security Credentials
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

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} weight="duotone" /> Two-Factor Authentication (2FA)
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

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <PuzzlePiece size={20} weight="duotone" /> Browser Extension Token
              </h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Generate an API token to link the Recall Web Clipper to your account.</p>
            </div>
            <button className="primary-button" type="button" onClick={handleGenerateExtensionToken} disabled={generatingToken} style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}>
              {generatingToken ? "Generating..." : "Generate Token"}
            </button>
          </div>
          {extensionToken && (
            <div style={{ background: "rgba(0,0,0,0.1)", padding: "12px", borderRadius: "8px", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <code style={{ fontSize: "13px", color: "var(--ink)", wordBreak: "break-all" }}>{extensionToken}</code>
              <button onClick={() => { navigator.clipboard.writeText(extensionToken); if(setToast) setToast("Copied to clipboard"); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--petrol)", fontWeight: "600", fontSize: "12px" }}>Copy</button>
            </div>
          )}
        </section>

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
              <span>
                {fetchingStorage ? "Loading..." : `${(storageStats.usedBytes / 1024 / 1024).toFixed(1)} MB of ${(storageStats.limitBytes / 1024 / 1024).toFixed(0)} MB used`}
              </span>
              <span>
                {fetchingStorage ? "--" : `${((storageStats.usedBytes / storageStats.limitBytes) * 100).toFixed(1)}%`}
              </span>
            </div>
            <div style={{ height: "8px", width: "100%", background: "rgba(21,63,64,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((storageStats.usedBytes / storageStats.limitBytes) * 100, 100)}%`, background: "var(--coral, #f38a7c)", borderRadius: "4px", transition: "width 0.5s ease" }} />
            </div>
          </div>
        </section>

        <section className="settings-section" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <div>
            <h3>Data Export</h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 16px" }}>Download a JSON backup of your entire space.</p>
          </div>
          <button 
            className="primary-button" 
            type="button" 
            onClick={handleExportData} 
            disabled={exporting}
            style={{ height: "40px", fontSize: "12px", padding: "0 16px", display: "flex", gap: "8px", alignItems: "center" }}
          >
            <Download size={16} weight="bold" /> {exporting ? "Exporting..." : "Export Data"}
          </button>
        </section>

        <section className="settings-section" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Archive size={20} weight="duotone" /> Archived Memories
              </h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Review and permanently delete archived memories.</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {selectedArchiveIds.size > 0 && (
                <button 
                  className="secondary-button" 
                  type="button" 
                  onClick={() => setArchiveModalState({ open: true, type: 'selected' })}
                  style={{ height: "32px", fontSize: "12px", padding: "0 12px", color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.2)" }}
                >
                  <Trash size={14} /> Delete Selected ({selectedArchiveIds.size})
                </button>
              )}
              {archivedMemories?.length > 0 && (
                <button 
                  className="secondary-button" 
                  type="button" 
                  onClick={() => setArchiveModalState({ open: true, type: 'empty' })}
                  style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
                >
                  <Trash size={14} /> Empty Archive
                </button>
              )}
            </div>
          </div>

          {archivedMemories?.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "8px", color: "var(--muted)", fontSize: "12px" }}>
              Your archive is empty.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--line)", gap: "12px" }}>
                <button 
                  type="button"
                  onClick={toggleAllArchives}
                  style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid var(--muted)", background: selectedArchiveIds.size === archivedMemories?.length ? "var(--petrol)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  {selectedArchiveIds.size === archivedMemories?.length && <Check size={10} weight="bold" color="#fff" />}
                </button>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {selectedArchiveIds.size > 0 ? `${selectedArchiveIds.size} Selected` : "Select All"}
                </span>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {archivedMemories?.map((mem) => (
                  <div key={mem.id} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid var(--line)", gap: "12px", cursor: "pointer" }} onClick={() => toggleArchiveSelection(mem.id)}>
                    <div
                      style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid var(--muted)", background: selectedArchiveIds.has(mem.id) ? "var(--petrol)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {selectedArchiveIds.has(mem.id) && <Check size={10} weight="bold" color="#fff" />}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mem.title || "Untitled Memory"}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mem.excerpt || "No summary available"}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>{new Date(mem.createdAt || mem.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="settings-section" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ font: "400 20px var(--display)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
              <Trash size={20} weight="duotone" /> Danger Zone
            </h2>
            <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>Permanently erase your Recall space and all your data. This cannot be undone.</p>
          </div>
          <button 
            className="primary-button" 
            type="button" 
            onClick={() => { setDeleteModalOpen(true); setDeleteConfirmText(''); }}
            style={{ height: "40px", fontSize: "12px", padding: "0 16px", background: "#ef4444", borderColor: "#dc2626", color: "#fff" }}
          >
            Delete Account
          </button>
        </section>
        {/* Modals */}
        {archiveModalState.open && (
          <div className="overlay capture-overlay" onMouseDown={(e) => e.target === e.currentTarget && setArchiveModalState({ open: false, type: null })}>
            <motion.section className="capture-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>
                {archiveModalState.type === 'empty' ? "Empty Archive?" : "Delete Selected?"}
              </h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px" }}>
                This action is permanent and cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="secondary-button" onClick={() => setArchiveModalState({ open: false, type: null })}>Cancel</button>
                <button className="primary-button" style={{ background: "var(--coral, #f38a7c)", color: "#fff" }} onClick={handleConfirmDelete}>Confirm Delete</button>
              </div>
            </motion.section>
          </div>
        )}

        {deleteModalOpen && (
          <div className="overlay capture-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDeleteModalOpen(false)}>
            <motion.section className="capture-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ maxWidth: "400px" }}>
              <h2 style={{ fontSize: "18px", color: "var(--coral, #f38a7c)", margin: "0 0 16px" }}>Delete Account?</h2>
              <p style={{ fontSize: "14px", color: "var(--ink)", margin: "0 0 16px" }}>
                This is permanent. All your memories, spaces, reminders, and uploads will be irrevocably deleted from the server.
              </p>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px" }}>
                Type <strong>DELETE</strong> below to confirm.
              </p>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder="DELETE"
                style={{ width: "100%", padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", marginBottom: "24px" }} 
              />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="secondary-button" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                <button 
                  className="primary-button" 
                  disabled={deleteConfirmText !== 'DELETE' || deletingAccount} 
                  style={{ background: "var(--coral, #f38a7c)", color: "#fff" }} 
                  onClick={handleDeleteAccount}
                >
                  {deletingAccount ? "Deleting..." : "Delete Account Forever"}
                </button>
              </div>
            </motion.section>
          </div>
        )}

        {mfaModalOpen && (
          <MFASetupModal 
            onClose={() => setMfaModalOpen(false)} 
            onVerify={() => updatePreferences({ mfa: true })} 
          />
        )}
      </motion.div>
    </div>
  );
}
