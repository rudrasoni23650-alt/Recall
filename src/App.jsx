import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { Workspace } from "./components/Workspace.jsx";
import { CaptureModal } from "./components/CaptureModal.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { MemoryDrawer } from "./components/MemoryDrawer.jsx";
import { AskPanel } from "./components/AskPanel.jsx";
import { supabase } from "./lib/supabase.js";

// ─── API helper: attaches Supabase JWT to every request ──────────────────────
async function apiFetch(path, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // In production, use VITE_API_URL; in dev, use the Vite proxy (/api → localhost:5001)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  return res.json();
}

export function App() {
  const [session, setSession] = useState(null);
  const [memories, setMemories] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [toast, setToast] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Supabase Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    // Get initial session (page refresh / return visit)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
      if (s) loadState();
    });

    // Subscribe to future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s) {
          loadState();
        } else {
          setMemories([]);
          setReminders([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadState() {
    try {
      const data = await apiFetch("/api/state");
      if (data.memories) setMemories(data.memories);
      if (data.reminders) setReminders(data.reminders);
    } catch (err) {
      console.error("State load error:", err);
    }
  }

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setCaptureOpen(true);
      }
      if (event.key === "Escape") {
        setCaptureOpen(false);
        setSearchOpen(false);
        setAskOpen(false);
        setSelectedMemory(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleMemories = useMemo(
    () => memories.filter((memory) => !memory.archived),
    [memories]
  );

  // ─── Auth actions ──────────────────────────────────────────────────────────

  /**
   * enterDemo: called from WelcomeScreen for "Explore the space" (anonymous)
   * or after OAuth redirect (Google/Apple/email).
   * For demo/empty: try anonymous sign-in first; if Supabase anonymous auth
   * isn't enabled, fall back to dispatching an event that opens the auth modal.
   */
  const enterDemo = async (mode) => {
    if (mode === "demo" || mode === "empty") {
      const { supabase } = await import("./lib/supabase.js");
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        // Anonymous auth not enabled — signal WelcomeScreen to open real auth modal
        window.dispatchEvent(new CustomEvent("recall:open-auth", { detail: { mode: "create" } }));
        return;
      }
    }
    // Auth state change listener will call loadState() automatically
    setActivePage("home");
  };

  // ─── Data mutations ────────────────────────────────────────────────────────
  const addMemory = async (draft) => {
    const memoryId = crypto.randomUUID();
    const memory = {
      id: memoryId,
      title: draft.title || "Untitled thought",
      excerpt: draft.excerpt,
      type: draft.type,
      dateGroup: "Today",
      time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()),
      tag: draft.type === "voice" ? "Voice" : "Inbox",
      url: draft.url,
      fileName: draft.fileName,
      audioUrl: draft.audioUrl,
      archived: false,
    };

    let reminder = null;
    if (draft.reminder?.title) {
      reminder = {
        id: crypto.randomUUID(),
        title: draft.reminder.title,
        due: draft.reminder.due || "Today",
        time: draft.reminder.time || "9:00 AM",
        source: memory.title,
        sourceId: memoryId,
        done: false,
      };
    }

    try {
      const data = await apiFetch("/api/memories", {
        method: "POST",
        body: JSON.stringify({ memory, reminder }),
      });
      setMemories(data.memories);
      if (data.reminders) setReminders(data.reminders);
      setCaptureOpen(false);
      setToast("Memory saved and organized");
    } catch (err) {
      console.error("addMemory error:", err);
      setToast("Failed to save memory");
    }
  };

  const toggleReminder = async (id) => {
    try {
      const data = await apiFetch("/api/reminders/toggle", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setReminders(data.reminders);
      const item = data.reminders.find((r) => r.id === id);
      if (item) setToast(item.done ? "Reminder completed" : "Reminder moved back to upcoming");
    } catch (err) {
      console.error("toggleReminder error:", err);
    }
  };

  const archiveMemory = async (id) => {
    try {
      const data = await apiFetch("/api/memories/archive", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setMemories(data.memories);
      setSelectedMemory(null);
      setToast("Memory archived");
    } catch (err) {
      console.error("archiveMemory error:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await apiFetch("/api/signout", { method: "POST" });
    setSession(null);
    setMemories([]);
    setReminders([]);
    setActivePage("home");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--petrol, #063334)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <WelcomeScreen onEnter={enterDemo} />;

  return (
    <>
      <Workspace
        session={session}
        activePage={activePage}
        memories={visibleMemories}
        reminders={reminders}
        onNavigate={setActivePage}
        onCapture={() => setCaptureOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onAsk={() => setAskOpen(true)}
        onSelectMemory={setSelectedMemory}
        onToggleReminder={toggleReminder}
        onSignOut={handleSignOut}
      />
      <AnimatePresence>
        {captureOpen ? <CaptureModal onClose={() => setCaptureOpen(false)} onSave={addMemory} /> : null}
        {searchOpen ? (
          <CommandPalette
            memories={visibleMemories}
            onClose={() => setSearchOpen(false)}
            onCapture={() => { setSearchOpen(false); setCaptureOpen(true); }}
            onSelect={(memory) => { setSearchOpen(false); setSelectedMemory(memory); }}
          />
        ) : null}
        {selectedMemory ? (
          <MemoryDrawer
            memory={selectedMemory}
            memories={visibleMemories}
            onNavigate={setSelectedMemory}
            onArchive={archiveMemory}
            onClose={() => setSelectedMemory(null)}
          />
        ) : null}
        {askOpen ? (
          <AskPanel
            memories={visibleMemories}
            onSelectMemory={setSelectedMemory}
            onClose={() => setAskOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </>
  );
}
