import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { Workspace } from "./components/Workspace.jsx";
import { CaptureModal } from "./components/CaptureModal.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { MemoryDrawer } from "./components/MemoryDrawer.jsx";
import { AskPanel } from "./components/AskPanel.jsx";
import { supabase } from "./lib/supabase.js";
import { DemoTourModal } from "./components/DemoTourModal.jsx";
import demoMoodboardImg from "./assets/privacy-positioning-board.png";
import demoNotebookImg from "./assets/asset-notebook.png";
import demoVoiceAudio from "./assets/demo-voice-interview.wav";

const FIRST_RUN_PROFILE_KEY = "recall-first-run-profile-pending";
const PROFILE_ONBOARDED_KEY = "recall-profile-onboarded-user";

// ─── Demo baseline data (injected directly — no API call needed) ──────────────
const DEMO_MEMORIES = [
  {
    id: "launch-core",
    title: "Launch brief — core messaging",
    excerpt: "Refined messaging pillars and audience narrative for the product launch. Privacy as control, not secrecy. Leads with confidence over technical detail.",
    type: "note",
    dateGroup: "Today",
    time: "9:41 AM",
    tag: "Launch",
    sourceIds: ["customer-interview", "privacy-reference"],
    archived: false,
  },
  {
    id: "market-landscape",
    title: "Privacy-first AI — market landscape",
    excerpt: "Competitive scan across 12 tools. Key differentiators: local storage, clear data export, and explicit AI usage disclosure. Messaging opportunity in trust.",
    type: "link",
    url: "https://example.com/privacy-ai-landscape",
    dateGroup: "Today",
    time: "4:22 PM",
    tag: "Research",
    sourceIds: ["privacy-reference", "launch-core"],
    archived: false,
  },
  {
    id: "launch-moodboard",
    title: "Launch moodboard — visual direction",
    excerpt: "Visual tone and palette for the campaign. Muted naturals, editorial photography, and confident serif headings. References Notion and Linear's early brand moments.",
    type: "image",
    imageUrl: demoMoodboardImg,
    dateGroup: "Yesterday",
    time: "11:07 AM",
    tag: "Brand",
    sourceIds: ["launch-core", "market-landscape"],
    archived: false,
  },
  {
    id: "customer-interview",
    title: "Customer interview — Maya Chen",
    excerpt: "Three consistent themes: trust through transparency, discomfort with invisible AI, and desire for exportable data. Quote: \"Control matters more than technical detail.\"",
    type: "voice",
    audioUrl: demoVoiceAudio,
    duration: "2:31",
    dateGroup: "Yesterday",
    time: "7:36 PM",
    tag: "Interview",
    sourceIds: ["launch-core"],
    archived: false,
  },
  {
    id: "privacy-reference",
    title: "Saved reference — privacy patterns in SaaS",
    excerpt: "Strong examples of clear, human messaging around privacy. Highlights: Fastmail's data manifesto, Obsidian's local-first commitment, and Linear's transparency reports.",
    type: "note",
    dateGroup: "May 12",
    time: "10:15 AM",
    tag: "Reference",
    sourceIds: ["market-landscape", "launch-core"],
    archived: false,
  },
  {
    id: "onboarding-flow",
    title: "Onboarding flow — first 5 minutes",
    excerpt: "Mapped the critical path from sign-up to first capture. Key drop-off at step 3 (space setup). Recommendation: defer space creation, show value first.",
    type: "note",
    dateGroup: "May 10",
    time: "2:00 PM",
    tag: "Product",
    sourceIds: ["customer-interview"],
    archived: false,
  },
  {
    id: "competitor-teardown",
    title: "Competitor teardown — Mem, Notion AI, Rewind",
    excerpt: "Mem bets on full automation. Notion AI is additive, not native. Rewind captures everything but nothing is meaningfully connected. Gap: intentional capture with smart context.",
    type: "link",
    url: "https://example.com/competitor-analysis",
    dateGroup: "May 8",
    time: "3:45 PM",
    tag: "Research",
    sourceIds: ["market-landscape"],
    archived: false,
  },
];

const DEMO_REMINDERS = [
  {
    id: "reminder-1",
    title: "Refine one-liner in the launch brief",
    due: "Today",
    time: "11:30 AM",
    source: "Launch brief",
    sourceId: "launch-core",
    done: false,
  },
  {
    id: "reminder-2",
    title: "Add proof points from customer interviews",
    due: "Tomorrow",
    time: "9:00 AM",
    source: "Maya Chen interview",
    sourceId: "customer-interview",
    done: false,
  },
  {
    id: "reminder-3",
    title: "Review privacy-first competitor positioning",
    due: "Upcoming",
    time: "2:00 PM",
    source: "Market landscape",
    sourceId: "market-landscape",
    done: true,
  },
];

const DEMO_SPACES = [
  {
    id: "launch-narrative-space",
    number: "01",
    eyebrow: "Active project",
    title: "Launch narrative",
    text: "Messaging, market notes, customer language, and the decisions shaping the launch.",
    memoryIds: ["launch-core", "customer-interview", "privacy-reference", "market-landscape", "launch-moodboard"],
    reminderIds: ["reminder-1", "reminder-2"]
  },
  {
    id: "privacy-patterns-space",
    number: "02",
    eyebrow: "Smart space",
    title: "Privacy patterns",
    text: "Product references and trust-building examples collected from across your memories.",
    memoryIds: ["privacy-reference", "market-landscape", "launch-core"],
    reminderIds: ["reminder-3"]
  },
  {
    id: "ideas-worth-returning-space",
    number: "03",
    eyebrow: "Smart space",
    title: "Ideas worth returning to",
    text: "Loose thoughts with enough shared context to become something more useful.",
    memoryIds: ["onboarding-flow", "competitor-teardown"],
    reminderIds: []
  }
];

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
  const [spaces, setSpaces] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [toast, setToast] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("recall-preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          autoSummarize: true,
          showInsights: true,
          emailHighlights: false,
          compactCards: false,
          mfa: false,
          theme: localStorage.getItem("recall-theme") || "petrol",
          bio: "AI-assisted second memory space. Capturing articles, notes, and reminders.",
          ...parsed,
        };
      }
    } catch {}
    return {
      autoSummarize: true,
      showInsights: true,
      emailHighlights: false,
      compactCards: false,
      mfa: false,
      theme: localStorage.getItem("recall-theme") || "petrol",
      bio: "AI-assisted second memory space. Capturing articles, notes, and reminders.",
    };
  });

  const updatePreferences = async (newPrefs) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem("recall-preferences", JSON.stringify(updated));
      return updated;
    });

    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          preferences: newPrefs
        })
      });
    } catch (err) {
      console.error("Failed to save preferences to backend:", err);
    }
  };

  const applyTheme = (themeName) => {
    const root = document.documentElement;
    if (themeName === "dark") {
      root.style.setProperty("--petrol", "#021c1d");
      root.style.setProperty("--petrol-light", "#164c4e");
    } else if (themeName === "warm") {
      root.style.setProperty("--petrol", "#332c25");
      root.style.setProperty("--petrol-light", "#5e5246");
    } else {
      // default petrol
      root.style.setProperty("--petrol", "#083c3e");
      root.style.setProperty("--petrol-light", "#153f40");
    }
  };

  useEffect(() => {
    applyTheme(preferences.theme || "petrol");
  }, [preferences.theme]);

  const getProviderConnections = (user) => {
    const provider = user?.app_metadata?.provider || "";
    const identities = user?.identities || [];

    return {
      googleConnected: provider === "google" || identities.some((id) => id.provider === "google"),
      githubConnected: provider === "github" || identities.some((id) => id.provider === "github"),
    };
  };

  const enrichSession = (s, liveUser = null) => {
    if (!s) return null;
    const currentUser = liveUser || s.user;
    const providerConnections = getProviderConnections(currentUser);

    if (!s.isDemo) {
      return {
        ...s,
        user: currentUser || s.user,
        ...providerConnections,
      };
    }

    const savedGoogle = localStorage.getItem("google-connected");
    const savedGithub = localStorage.getItem("github-connected");

    return {
      ...s,
      googleConnected: savedGoogle !== null ? savedGoogle === "true" : providerConnections.googleConnected,
      githubConnected: savedGithub !== null ? savedGithub === "true" : providerConnections.githubConnected,
    };
  };

  const refreshConnectedAccounts = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) return;

    setSession((prev) => {
      if (!prev || prev.isDemo) return prev;
      return enrichSession(prev, userData.user);
    });
  };

  const syncAccountLinkToBackend = async (key, value) => {
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          profile: {
            [key]: value
          }
        })
      });
    } catch (err) {
      console.error("Failed to save connection status to backend:", err);
    }
  };

  const handleLinkAccount = async (provider) => {
    if (!session) return;
    const isGoogle = provider === "google";
    const connectedKey = isGoogle ? "googleConnected" : "githubConnected";
    const currentVal = session[connectedKey];

    if (currentVal) {
      // Disconnecting: Ask for confirmation first
      const confirmDisconnect = window.confirm(
        `Are you sure you want to disconnect your ${isGoogle ? "Google" : "GitHub"} account?`
      );
      if (!confirmDisconnect) return;

      try {
        // Supabase manual identity unlink if running live
        if (!session.isDemo && supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          const targetIdentity = user?.identities?.find(id => id.provider === provider);
          if (targetIdentity) {
            const { error } = await supabase.auth.unlinkIdentity(targetIdentity);
            if (error) throw error;
          }
        } else {
          localStorage.setItem(isGoogle ? "google-connected" : "github-connected", "false");
        }

        const newVal = false;
        setToast(isGoogle ? "Google account disconnected" : "GitHub account disconnected");
        setSession((prev) => {
          if (!prev) return null;
          return { ...prev, [connectedKey]: newVal };
        });
        syncAccountLinkToBackend(connectedKey, newVal);
      } catch (err) {
        console.error("Failed to unlink identity in Supabase:", err);
        setToast(`Could not disconnect ${isGoogle ? "Google" : "GitHub"}: ${err.message || "please try again"}`);
      }
    } else {
      if (!session.isDemo && supabase && supabase.auth.linkIdentity) {
        // Live Supabase Mode: Trigger real OAuth identity link redirect
        setToast(`Redirecting to ${isGoogle ? "Google" : "GitHub"} to link account...`);
        try {
          const { error } = await supabase.auth.linkIdentity({
            provider,
            options: {
              redirectTo: window.location.origin
            }
          });
          if (error) {
            if (error.message?.toLowerCase().includes("manual linking")) {
              setToast("Failed: Please enable 'Allow manual linking' in your Supabase Auth Settings.");
            } else {
              setToast(`Failed to link account: ${error.message}`);
            }
          }
        } catch (err) {
          console.error("Failed to link identity in Supabase:", err);
          setToast(`Failed to link account: ${err.message || "please try again"}`);
        }
      } else {
        // Connecting: Open the simulated OAuth consent popup centered on screen
        const width = 500;
        const height = 620;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          `/auth-sim.html?provider=${provider}`,
          "oauth-link",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );

        if (!popup) {
          setToast("Popup blocked! Please allow popups to open the authentication window.");
        }
      }
    }
  };

  // Listen for OAuth messages from the popup window
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'oauth-success') {
        const provider = event.data.provider;
        const isGoogle = provider === "google";
        const connectedKey = isGoogle ? "googleConnected" : "githubConnected";

        localStorage.setItem(isGoogle ? "google-connected" : "github-connected", "true");
        setToast(isGoogle ? "Google account connected" : "GitHub account connected");
        setSession((prev) => {
          if (!prev) return null;
          return { ...prev, [connectedKey]: true };
        });
        syncAccountLinkToBackend(connectedKey, true);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [session]);

  // ─── Supabase Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    const routeFirstRunProfile = (s) => {
      if (!s || s.isDemo || localStorage.getItem(FIRST_RUN_PROFILE_KEY) !== "true") return false;
      const userId = s.user?.id || "local-user";
      if (localStorage.getItem(PROFILE_ONBOARDED_KEY) === userId) {
        localStorage.removeItem(FIRST_RUN_PROFILE_KEY);
        return false;
      }
      localStorage.removeItem(FIRST_RUN_PROFILE_KEY);
      localStorage.setItem(PROFILE_ONBOARDED_KEY, userId);
      setActivePage("profile");
      return true;
    };

    // Get initial session (page refresh / return visit)
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s) {
        const { data: userData } = await supabase.auth.getUser();
        setSession(enrichSession(s, userData?.user));
      } else {
        setSession(null);
      }
      setAuthLoading(false);
      if (s) {
        loadState();
        routeFirstRunProfile(s);
      }
    });

    // Subscribe to future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(enrichSession(s));
        if (s) {
          setTimeout(() => {
            refreshConnectedAccounts();
          }, 0);
          loadState();
          routeFirstRunProfile(s);
        } else {
          setMemories([]);
          setReminders([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        refreshConnectedAccounts();
      }
    };

    window.addEventListener("focus", refreshConnectedAccounts);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.removeEventListener("focus", refreshConnectedAccounts);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, []);

  async function loadState() {
    try {
      const data = await apiFetch("/api/state");
      if (data.memories) setMemories(data.memories);
      if (data.reminders) setReminders(data.reminders);
      if (data.spaces) setSpaces(data.spaces);
      if (data.profile) {
        setSession((prev) => {
          if (!prev) return null;
          const isLive = !prev.isDemo;
          return {
            ...prev,
            name: data.profile.name || prev.name,
            ...(isLive ? {} : {
              googleConnected: data.profile.googleConnected,
              githubConnected: data.profile.githubConnected,
            })
          };
        });
      }
      if (data.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...data.preferences
        }));
      }
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
    if (mode === "demo") {
      setSession(enrichSession({ user: { email: "explore@recall.ai", id: "demo-user" }, name: "Demo User", isDemo: true }));
      setShowTour(true);
      setMemories(DEMO_MEMORIES);
      setReminders(DEMO_REMINDERS);
      setSpaces(DEMO_SPACES);
      setActivePage("home");
      return;
    }
    if (mode === "empty") {
      localStorage.setItem(FIRST_RUN_PROFILE_KEY, "true");
      const { supabase } = await import("./lib/supabase.js");
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        window.dispatchEvent(new CustomEvent("recall:open-auth", { detail: { mode: "create" } }));
        return;
      }
      return;
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
      url: draft.type === "image" ? draft.imageUrl : draft.url,
      fileName: draft.fileName,
      audioUrl: draft.audioUrl,
      imageUrl: draft.imageUrl,
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

    if (session?.isDemo) {
      setMemories(prev => [memory, ...prev]);
      if (reminder) setReminders(prev => [reminder, ...prev]);
      setCaptureOpen(false);
      setToast("Memory saved and organized");

      if (draft.spaceId) {
        const updatedSpaces = spaces.map(space => {
          if (space.id === draft.spaceId) {
            const newMemoryIds = [...(space.memoryIds || [])];
            if (!newMemoryIds.includes(memoryId)) newMemoryIds.push(memoryId);
            
            const newReminderIds = [...(space.reminderIds || [])];
            if (reminder && !newReminderIds.includes(reminder.id)) newReminderIds.push(reminder.id);

            return {
              ...space,
              memoryIds: newMemoryIds,
              reminderIds: newReminderIds
            };
          }
          return space;
        });
        setSpaces(updatedSpaces);
      }
      return;
    }

    try {
      const data = await apiFetch("/api/memories", {
        method: "POST",
        body: JSON.stringify({ memory, reminder, autoSummarize: preferences.autoSummarize }),
      });
      setMemories(data.memories);
      if (data.reminders) setReminders(data.reminders);
      setCaptureOpen(false);
      setToast("Memory saved and organized");

      if (draft.spaceId) {
        const updatedSpaces = spaces.map(space => {
          if (space.id === draft.spaceId) {
            const newMemoryIds = [...(space.memoryIds || [])];
            if (!newMemoryIds.includes(memoryId)) newMemoryIds.push(memoryId);
            
            const newReminderIds = [...(space.reminderIds || [])];
            if (reminder && !newReminderIds.includes(reminder.id)) newReminderIds.push(reminder.id);

            return {
              ...space,
              memoryIds: newMemoryIds,
              reminderIds: newReminderIds
            };
          }
          return space;
        });
        await updateSpaces(updatedSpaces);
      }
    } catch (err) {
      console.error("addMemory error:", err);
      setToast("Failed to save memory");
    }
  };

  const updateSpaces = async (updatedSpaces) => {
    setSpaces(updatedSpaces);
    if (session && !session.isDemo) {
      try {
        await apiFetch("/api/spaces", {
          method: "POST",
          body: JSON.stringify({ spaces: updatedSpaces }),
        });
      } catch (err) {
        console.error("Failed to persist spaces:", err);
      }
    }
  };

  const linkMemoryToSpace = async (memoryId, spaceId) => {
    const updatedSpaces = spaces.map(space => {
      if (space.id === spaceId) {
        const newMemoryIds = [...(space.memoryIds || [])];
        if (!newMemoryIds.includes(memoryId)) {
          newMemoryIds.push(memoryId);
        }
        return { ...space, memoryIds: newMemoryIds };
      }
      return space;
    });
    await updateSpaces(updatedSpaces);
    setToast("Memory connected to space");
  };

  const linkReminderToSpace = async (reminderId, spaceId) => {
    const updatedSpaces = spaces.map(space => {
      if (space.id === spaceId) {
        const newReminderIds = [...(space.reminderIds || [])];
        if (!newReminderIds.includes(reminderId)) {
          newReminderIds.push(reminderId);
        }
        return { ...space, reminderIds: newReminderIds };
      }
      return space;
    });
    await updateSpaces(updatedSpaces);
    setToast("Reminder connected to space");
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
    setShowTour(false);
    setActivePage("home");
  };

  const handleSaveProfile = async (profileData) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: profileData.name,
      };
    });
    
    // Save theme, bio to preferences (posts to backend via updatePreferences)
    await updatePreferences({
      theme: profileData.theme,
      bio: profileData.bio,
    });
    
    // Save profile details to backend
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          profile: {
            name: profileData.name
          }
        })
      });
    } catch (err) {
      console.error("Failed to save profile name to backend:", err);
    }
    
    localStorage.setItem("recall-theme", profileData.theme);
    applyTheme(profileData.theme);
    setToast("Profile updated");
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

  if (!session || activePage === "landing") {
    // Don't expose the demo session on the landing page — visitors exploring the demo
    // should see the normal signed-out welcome screen when they return to root.
    const welcomeSession = session?.isDemo ? null : session;
    return <WelcomeScreen session={welcomeSession} onEnter={enterDemo} onNavigateToApp={(page) => setActivePage(page || "home")} />;
  }


  return (
    <>
      <Workspace
        session={session}
        activePage={activePage}
        memories={visibleMemories}
        reminders={reminders}
        spaces={spaces}
        onUpdateSpaces={updateSpaces}
        onLinkMemoryToSpace={linkMemoryToSpace}
        onLinkReminderToSpace={linkReminderToSpace}
        onNavigate={setActivePage}
        onSaveProfile={handleSaveProfile}
        onCapture={() => setCaptureOpen(true)}
        onSaveMemory={addMemory}
        onSearch={() => setSearchOpen(true)}
        onAsk={() => setAskOpen(true)}
        onSelectMemory={setSelectedMemory}
        onToggleReminder={toggleReminder}
        onSignOut={handleSignOut}
        preferences={preferences}
        updatePreferences={updatePreferences}
        setToast={setToast}
        onLinkAccount={handleLinkAccount}
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
            spaces={spaces}
            onLinkMemoryToSpace={linkMemoryToSpace}
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
        {showTour ? (
          <DemoTourModal onClose={() => setShowTour(false)} />
        ) : null}
      </AnimatePresence>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </>
  );
}
