import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { Workspace } from "./components/Workspace.jsx";
import { CaptureModal } from "./components/CaptureModal.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { MemoryDrawer } from "./components/MemoryDrawer.jsx";
import { AskPanel } from "./components/AskPanel.jsx";
import { EditMemoryModal } from "./components/EditMemoryModal.jsx";
import { EditReminderModal } from "./components/EditReminderModal.jsx";
import { NewReminderModal } from "./components/NewReminderModal.jsx";
import { supabase } from "./lib/supabase.js";
import { DemoTourModal } from "./components/DemoTourModal.jsx";
import demoMoodboardImg from "./assets/privacy-positioning-board.png";
import demoNotebookImg from "./assets/asset-notebook.png";
import demoVoiceAudio from "./assets/demo-voice-interview.wav";
import { formatMemoryDateGroup, formatMemoryTime } from "./lib/dateUtils.js";

const FIRST_RUN_PROFILE_KEY = "recall-first-run-profile-pending";
const PROFILE_ONBOARDED_KEY = "recall-profile-onboarded-user";

// ─── Demo baseline data (injected directly — no API call needed) ──────────────
const nowMs = Date.now();
const DEMO_MEMORIES = [
  {
    id: "launch-core",
    title: "Launch brief — core messaging",
    excerpt: "Refined messaging pillars and audience narrative for the product launch. Privacy as control, not secrecy. Leads with confidence over technical detail.",
    type: "note",
    dateGroup: "Today",
    time: "9:41 AM",
    createdAt: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
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
    dateGroup: "Yesterday",
    time: "4:22 PM",
    createdAt: new Date(nowMs - 26 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(nowMs - 28 * 60 * 60 * 1000).toISOString(),
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
    dateGroup: "May 12",
    time: "7:36 PM",
    createdAt: new Date("2024-05-12T19:36:00.000Z").toISOString(),
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
    createdAt: new Date("2024-05-12T10:15:00.000Z").toISOString(),
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
    createdAt: new Date("2024-05-10T14:00:00.000Z").toISOString(),
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
    createdAt: new Date("2024-05-08T15:45:00.000Z").toISOString(),
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
import { apiFetch } from "./lib/api.js";
import { MFAVerificationModal } from "./components/MFAVerificationModal.jsx";

export function App() {
  const [session, setSession] = useState(null);
  const [memories, setMemories] = useState([]);
  const [archivedMemories, setArchivedMemories] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [activePage, setActivePage] = useState("landing");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newReminderOpen, setNewReminderOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [toast, setToast] = useState("");

  const handleEditMemory = (memory) => {
    setSelectedMemory(null);
    setEditingMemory(memory);
  };

  const handleEditReminder = (reminder) => {
    setSelectedMemory(null);
    setEditingReminder(reminder);
  };
  const [authLoading, setAuthLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [mfaChallengeRequired, setMfaChallengeRequired] = useState(false);

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

  const themeTokens = {
    petrol: {
      "--petrol": "#083c3e",
      "--petrol-deep": "#042627",
      "--petrol-light": "#153f40",
      "--rail-bg": "rgba(8, 60, 62, 0.84)",
      "--canvas": "#f1f2eb",
      "--canvas-deep": "#e8ece3",
      "--surface": "#f7f7f1",
      "--ink": "#153f40",
      "--muted": "#627675",
      "--line": "rgba(21, 63, 64, 0.16)",
      "--rail-text": "#eef5ed",
      "--coral": "#dc806d",
      "--coral-deep": "#c96e5b"
    },
    dark: {
      "--petrol": "#000000",
      "--petrol-deep": "#000000",
      "--petrol-light": "#737373",
      "--rail-bg": "rgba(0, 0, 0, 0.96)",
      "--canvas": "#000000",
      "--canvas-deep": "#080808",
      "--surface": "#0c0c0c",
      "--ink": "#ffffff",
      "--muted": "#a3a3a3",
      "--line": "rgba(255, 255, 255, 0.12)",
      "--rail-text": "#ffffff",
      "--coral": "#f38a78",
      "--coral-deep": "#db6f5c"
    },
    monochrome: {
      "--petrol": "#181a1c",
      "--petrol-deep": "#101112",
      "--petrol-light": "#2d3135",
      "--rail-bg": "rgba(24, 26, 28, 0.88)",
      "--canvas": "#f2f3f5",
      "--canvas-deep": "#e6e8eb",
      "--surface": "#ffffff",
      "--ink": "#121416",
      "--muted": "#686f78",
      "--line": "rgba(18, 20, 22, 0.14)",
      "--rail-text": "#f8f9fa",
      "--coral": "#e25d48",
      "--coral-deep": "#c44632"
    },
    "apple-glass": {
      "--petrol": "#1c2530",
      "--petrol-deep": "#0f161f",
      "--petrol-light": "#2c3847",
      "--rail-bg": "rgba(245, 247, 250, 0.68)",
      "--canvas": "#f5f6f9",
      "--canvas-deep": "#e8ecf2",
      "--surface": "rgba(255, 255, 255, 0.65)",
      "--ink": "#1d1d1f",
      "--muted": "#6e6e73",
      "--line": "rgba(0, 0, 0, 0.08)",
      "--rail-text": "#1d1d1f",
      "--coral": "#0071e3",
      "--coral-deep": "#0056b3"
    }
  };

  const applyTheme = (themeName = "petrol") => {
    const validTheme = themeTokens[themeName] ? themeName : "petrol";
    localStorage.setItem("recall-theme", validTheme);

    // Only apply the theme to the document root if we are currently in the workspace.
    // The landing page must never be affected by workspace themes.
    const isLanding = !session || activePage === "landing";
    if (!isLanding) {
      const selected = themeTokens[validTheme];
      const root = document.documentElement;
      root.setAttribute("data-theme", validTheme);
      Object.entries(selected).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    }
  };

  useEffect(() => {
    const isLanding = !session || activePage === "landing";
    const root = document.documentElement;
    if (isLanding) {
      // The landing page strictly uses the canonical default petrol theme
      root.setAttribute("data-theme", "petrol");
      Object.entries(themeTokens.petrol).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    } else {
      // In the workspace: apply the user's workspace theme preference
      const activeTheme = preferences.theme || localStorage.getItem("recall-theme") || "petrol";
      const validTheme = themeTokens[activeTheme] ? activeTheme : "petrol";
      const selected = themeTokens[validTheme];
      root.setAttribute("data-theme", validTheme);
      Object.entries(selected).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    }
  }, [session, activePage, preferences.theme]);

  const getProviderConnections = (user) => {
    const meta = user?.user_metadata || {};
    const googleFromMeta = meta.googleConnected !== undefined ? Boolean(meta.googleConnected) : null;
    const githubFromMeta = meta.githubConnected !== undefined ? Boolean(meta.githubConnected) : null;

    const provider = user?.app_metadata?.provider || "";
    const identities = user?.identities || [];

    const hasGoogle = googleFromMeta !== null
      ? googleFromMeta
      : (provider === "google" || identities.some((id) => id.provider === "google"));
    const hasGithub = githubFromMeta !== null
      ? githubFromMeta
      : (provider === "github" || identities.some((id) => id.provider === "github"));

    return {
      googleConnected: hasGoogle,
      githubConnected: hasGithub,
    };
  };

  const enrichSession = (s, liveUser = null) => {
    if (!s) return null;
    const currentUser = liveUser || s.user;
    const providerConnections = getProviderConnections(currentUser);

    const savedGoogle = localStorage.getItem("google-connected");
    const savedGithub = localStorage.getItem("github-connected");

    return {
      ...s,
      user: currentUser || s.user,
      googleConnected: savedGoogle !== null ? savedGoogle === "true" : providerConnections.googleConnected,
      githubConnected: savedGithub !== null ? savedGithub === "true" : providerConnections.githubConnected,
    };
  };

  const refreshConnectedAccounts = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) return;

    setSession((prev) => {
      if (!prev) return prev;
      return enrichSession(prev, userData.user);
    });
  };

  const handleLinkAccount = async (provider) => {
    if (!session) return;
    const isGoogle = provider === "google";
    const connectedKey = isGoogle ? "googleConnected" : "githubConnected";
    const currentVal = Boolean(session[connectedKey]);

    if (currentVal) {
      // Disconnecting / Unlinking
      const confirmDisconnect = window.confirm(
        `Are you sure you want to unlink and disconnect your ${isGoogle ? "Google" : "GitHub"} account from Recall?`
      );
      if (!confirmDisconnect) return;

      try {
        setToast(`Unlinking ${isGoogle ? "Google" : "GitHub"} on backend...`);
        // 1. Call backend unlink endpoint
        await apiFetch("/api/account/unlink", {
          method: "POST",
          body: JSON.stringify({ provider })
        });

        // 2. Supabase client-side unlink if live session
        if (!session.isDemo && supabase) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const targetIdentity = user?.identities?.find(id => id.provider === provider);
            if (targetIdentity) {
              await supabase.auth.unlinkIdentity(targetIdentity);
            }
          } catch (e) {
            console.warn("Client unlinkIdentity note:", e);
          }
        }

        // 3. Update local state and storage
        localStorage.setItem(isGoogle ? "google-connected" : "github-connected", "false");
        setSession((prev) => prev ? { ...prev, [connectedKey]: false } : null);
        setToast(`${isGoogle ? "Google" : "GitHub"} account successfully unlinked`);
      } catch (err) {
        console.error("Failed to unlink account on backend:", err);
        setToast(`Could not disconnect ${isGoogle ? "Google" : "GitHub"}: ${err.message || "please try again"}`);
      }
    } else {
      // Connecting
      try {
        setToast(`Connecting ${isGoogle ? "Google" : "GitHub"} account...`);
        // 1. Register link on backend
        await apiFetch("/api/account/link", {
          method: "POST",
          body: JSON.stringify({ provider })
        });

        // 2. Update local state
        localStorage.setItem(isGoogle ? "google-connected" : "github-connected", "true");
        setSession((prev) => prev ? { ...prev, [connectedKey]: true } : null);
        setToast(`${isGoogle ? "Google" : "GitHub"} account connected & verified`);
      } catch (err) {
        console.error("Failed to link account on backend:", err);
        setToast(`Failed to link account: ${err.message || "please try again"}`);
      }
    }
  };

  // Listen for OAuth messages from popup window if opened
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
        apiFetch("/api/account/link", {
          method: "POST",
          body: JSON.stringify({ provider })
        }).catch(err => console.error("Link error:", err));
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [session]);

  useEffect(() => {
    if (activePage && activePage !== "landing") {
      localStorage.setItem("recall-active-page", activePage);
    }
  }, [activePage]);

  useEffect(() => {
    if (session?.isDemo) {
      try {
        localStorage.setItem("recall-demo-memories", JSON.stringify(memories));
      } catch (e) {}
    }
  }, [session?.isDemo, memories]);

  useEffect(() => {
    if (session?.isDemo) {
      try {
        localStorage.setItem("recall-demo-reminders", JSON.stringify(reminders));
      } catch (e) {}
    }
  }, [session?.isDemo, reminders]);

  useEffect(() => {
    if (session?.isDemo) {
      try {
        localStorage.setItem("recall-demo-spaces", JSON.stringify(spaces));
      } catch (e) {}
    }
  }, [session?.isDemo, spaces]);

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

    const checkMFA = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!error && data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2') {
          setMfaChallengeRequired(true);
        } else {
          setMfaChallengeRequired(false);
        }
      } catch (err) {
        console.error("MFA check failed", err);
      }
    };

    // Get initial session (page refresh / return visit)
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s) {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) {
          // If getUser fails (e.g., user was deleted in Supabase), sign out locally
          await supabase.auth.signOut();
          setSession(null);
          setAuthLoading(false);
          return;
        }
        setSession(enrichSession(s, userData.user));
        checkMFA();
        loadState();
        const routed = routeFirstRunProfile(s);
        if (!routed) {
          const savedPage = localStorage.getItem("recall-active-page");
          setActivePage(savedPage && savedPage !== "landing" ? savedPage : "home");
        }
        setAuthLoading(false);
      } else {
        // Check if there was a saved demo session from earlier
        try {
          const savedDemo = localStorage.getItem("recall-demo-session");
          if (savedDemo) {
            const parsed = JSON.parse(savedDemo);
            if (parsed && parsed.user) {
              setSession(parsed);
              const savedMems = localStorage.getItem("recall-demo-memories");
              const savedRems = localStorage.getItem("recall-demo-reminders");
              const savedSpaces = localStorage.getItem("recall-demo-spaces");
              setMemories(savedMems ? JSON.parse(savedMems) : DEMO_MEMORIES);
              setReminders(savedRems ? JSON.parse(savedRems) : DEMO_REMINDERS);
              setSpaces(savedSpaces ? JSON.parse(savedSpaces) : DEMO_SPACES);
              const savedPage = localStorage.getItem("recall-active-page");
              setActivePage(savedPage && savedPage !== "landing" ? savedPage : "home");
              setAuthLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to restore demo session", e);
        }
        setSession(null);
        setAuthLoading(false);
      }
    });


    // Subscribe to future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(enrichSession(s));
        if (s) {
          checkMFA();
          setTimeout(() => {
            refreshConnectedAccounts();
          }, 0);
          loadState();
          const routed = routeFirstRunProfile(s);
          if (!routed) {
            setActivePage((prev) => (prev === "landing" ? "home" : prev));
          }
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
      if (data.archivedMemories) setArchivedMemories(data.archivedMemories);
      if (data.reminders) setReminders(data.reminders);
      if (data.spaces) setSpaces(data.spaces);
      if (data.profile) {
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: data.profile.name || prev.name,
            googleConnected: data.profile.googleConnected !== undefined ? Boolean(data.profile.googleConnected) : prev.googleConnected,
            githubConnected: data.profile.githubConnected !== undefined ? Boolean(data.profile.githubConnected) : prev.githubConnected,
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
        setEditingMemory(null);
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
      const demoUserSession = enrichSession({ user: { email: "explore@recall.ai", id: "demo-user" }, name: "Demo User", isDemo: true });
      setSession(demoUserSession);
      localStorage.setItem("recall-demo-session", JSON.stringify(demoUserSession));
      localStorage.setItem("recall-demo-memories", JSON.stringify(DEMO_MEMORIES));
      localStorage.setItem("recall-demo-reminders", JSON.stringify(DEMO_REMINDERS));
      localStorage.setItem("recall-demo-spaces", JSON.stringify(DEMO_SPACES));
      localStorage.setItem("recall-active-page", "home");
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
    const now = new Date();
    const createdAt = draft.createdAt || now.toISOString();
    const time = draft.time || formatMemoryTime(now);
    const dateGroup = draft.dateGroup || formatMemoryDateGroup(now);

    const memory = {
      ...draft,
      id: memoryId,
      title: draft.title || "Untitled thought",
      excerpt: draft.excerpt,
      type: draft.type,
      createdAt,
      created_at: createdAt,
      dateGroup,
      time,
      tag: draft.type === "voice" ? "Voice" : "Inbox",
      url: draft.type === "image" ? draft.imageUrl : draft.url,
      fileName: draft.fileName,
      audioUrl: draft.audioUrl,
      imageUrl: draft.imageUrl,
      fileUrl: draft.fileUrl,
      captureSource: draft.captureSource || "web_app",
      processingStatus: draft.processingStatus || "completed",
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

      // Trigger async processing if needed
      if (draft.processingStatus === "pending") {
        apiFetch("/api/memories/process", {
          method: "POST",
          body: JSON.stringify({ memoryId: memory.id }),
        }).catch(err => console.error("Async processing error:", err));
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

  const removeMemoryFromSpace = async (memoryId, spaceId) => {
    const updatedSpaces = spaces.map(space => {
      if (space.id === spaceId) {
        return { ...space, memoryIds: (space.memoryIds || []).filter(id => id !== memoryId) };
      }
      return space;
    });
    await updateSpaces(updatedSpaces);
    setToast("Memory removed from space");
  };

  const addReminder = async (draft) => {
    const reminder = {
      id: crypto.randomUUID(),
      title: draft.title,
      due: draft.due || 'Upcoming',
      time: draft.time || null,
      source: null,
      sourceId: null,
      done: false,
    };

    if (session?.isDemo) {
      setReminders(prev => [reminder, ...prev]);
      setToast('Reminder added');
      return;
    }

    try {
      const data = await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({ reminder }),
      });
      if (data.reminders) setReminders(data.reminders);
      setToast('Reminder added');
    } catch (err) {
      console.error('addReminder error:', err);
      setToast('Failed to add reminder');
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

  const deleteReminder = async (id) => {
    try {
      await apiFetch(`/api/reminders/${id}`, { method: "DELETE" });
      setReminders(prev => prev.filter(r => r.id !== id));
      setToast("Reminder deleted");
    } catch (err) {
      console.error("deleteReminder error:", err);
      setToast("Failed to delete reminder");
    }
  };

  const deleteRemindersBulk = async (ids) => {
    try {
      await apiFetch("/api/reminders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setReminders(prev => prev.filter(r => !ids.includes(r.id)));
      setToast(`${ids.length} reminders deleted`);
    } catch (err) {
      console.error("deleteRemindersBulk error:", err);
      setToast("Failed to delete reminders");
    }
  };

  const deleteMemoriesBulk = async (ids) => {
    try {
      await apiFetch("/api/memories/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setMemories(prev => prev.filter(m => !ids.includes(m.id)));
      setToast(`${ids.length} memories deleted`);
    } catch (err) {
      console.error("deleteMemoriesBulk error:", err);
      setToast("Failed to delete memories");
    }
  };

  const deleteSpacesBulk = async (ids) => {
    try {
      await apiFetch("/api/spaces/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setSpaces(prev => prev.filter(s => !ids.includes(s.id)));
      setToast(`${ids.length} spaces deleted`);
    } catch (err) {
      console.error("deleteSpacesBulk error:", err);
      setToast("Failed to delete spaces");
    }
  };

  const editReminder = async (id, updates) => {
    try {
      const data = await apiFetch("/api/reminders/edit", {
        method: "POST",
        body: JSON.stringify({ id, ...updates }),
      });
      setReminders(data.reminders);
      setEditingReminder(null);
      setToast("Reminder updated");
    } catch (err) {
      console.error("editReminder error:", err);
      setToast("Failed to update reminder");
    }
  };

  const archiveMemory = async (id) => {
    try {
      const data = await apiFetch("/api/memories/archive", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setMemories(data.memories);
      if (data.archivedMemories) setArchivedMemories(data.archivedMemories);
      setSelectedMemory(null);
      setToast("Memory archived");
    } catch (err) {
      console.error("archiveMemory error:", err);
    }
  };

  const emptyArchive = async () => {
    try {
      const data = await apiFetch("/api/memories/archive/empty", {
        method: "DELETE"
      });
      if (data.success) {
        setArchivedMemories([]);
        setToast("Archive emptied");
      }
    } catch (err) {
      console.error("emptyArchive error:", err);
    }
  };

  const deleteArchivedMemories = async (ids) => {
    try {
      const data = await apiFetch("/api/memories/archive", {
        method: "DELETE",
        body: JSON.stringify({ ids })
      });
      if (data.success) {
        setArchivedMemories(prev => prev.filter(m => !ids.includes(m.id)));
        setToast(`${ids.length} item${ids.length === 1 ? '' : 's'} permanently deleted`);
      }
    } catch (err) {
      console.error("deleteArchivedMemories error:", err);
    }
  };

  const pinMemory = async (id) => {
    try {
      const data = await apiFetch("/api/memories/pin", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (data.memories) setMemories(data.memories);
      // Update selectedMemory if it was the toggled one
      setSelectedMemory(prev => prev?.id === id ? { ...prev, isPinned: !prev.isPinned } : prev);
      setToast("Pinned status updated");
    } catch (err) {
      // Optimistic local update on error
      setMemories(prev => prev.map(m => m.id !== id ? m : { ...m, isPinned: !m.isPinned }));
      setSelectedMemory(prev => prev?.id === id ? { ...prev, isPinned: !prev.isPinned } : prev);
    }
  };

  const topOfMindMemory = async (id) => {
    try {
      const data = await apiFetch("/api/memories/top-of-mind", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (data.memories) setMemories(data.memories);
      setSelectedMemory(prev => prev?.id === id ? { ...prev, isTopOfMind: !prev.isTopOfMind } : prev);
      setToast("Top of Mind updated");
    } catch {
      setMemories(prev => prev.map(m => m.id !== id ? m : { ...m, isTopOfMind: !m.isTopOfMind }));
      setSelectedMemory(prev => prev?.id === id ? { ...prev, isTopOfMind: !prev.isTopOfMind } : prev);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    try {
      await apiFetch("/api/signout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("recall-demo-session");
    localStorage.removeItem("recall-demo-memories");
    localStorage.removeItem("recall-demo-reminders");
    localStorage.removeItem("recall-demo-spaces");
    localStorage.removeItem("recall-active-page");
    setSession(null);
    setMemories([]);
    setReminders([]);
    setShowTour(false);
    setActivePage("landing");
  };

  const handleSaveProfile = async (profileData) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: profileData.name,
      };
    });
    
    const newPrefs = {
      theme: profileData.theme,
      bio: profileData.bio,
    };

    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem("recall-preferences", JSON.stringify(updated));
      return updated;
    });
    
    localStorage.setItem("recall-theme", profileData.theme);
    applyTheme(profileData.theme);

    // Save profile and preferences together atomically to backend
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          profile: {
            name: profileData.name,
            bio: profileData.bio,
          },
          preferences: newPrefs,
        })
      });
      setToast("Profile and workspace settings saved");
    } catch (err) {
      console.error("Failed to save profile to backend:", err);
      setToast("Saved locally (backend sync pending)");
    }
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

  if (mfaChallengeRequired) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--petrol, #063334)' }}>
        <MFAVerificationModal 
          onVerify={() => {
            setMfaChallengeRequired(false);
            loadState(); // reload user data after verifying
          }} 
          onCancel={async () => {
            await supabase.auth.signOut();
            setMfaChallengeRequired(false);
            setSession(null);
          }}
        />
      </div>
    );
  }

  if (!session || activePage === "landing") {
    // Don't expose the demo session on the landing page — visitors exploring the demo
    // should see the normal signed-out welcome screen when they return to root.
    const welcomeSession = session?.isDemo ? null : session;
    return <WelcomeScreen session={welcomeSession} onEnter={enterDemo} onNavigateToApp={(page) => setActivePage(page || "home")} />;
  }


  const updateMemory = async (id, updates) => {
    if (session?.isDemo) {
      setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      setToast("Memory updated");
      if (selectedMemory?.id === id) {
        setSelectedMemory(prev => ({ ...prev, ...updates }));
      }
      return;
    }
    try {
      const data = await apiFetch(`/api/memories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ memory: { ...updates, processingStatus: "pending" } })
      });
      if (data.memories) {
        setMemories(prev => prev.map(m => m.id === id ? data.memories[0] : m));
        if (selectedMemory?.id === id) {
          setSelectedMemory(data.memories[0]);
        }
      }
      setToast("Memory updated. AI is re-summarizing...");

      // Trigger async processing for re-summarization
      apiFetch("/api/memories/process?sync=true", {
        method: "POST",
        body: JSON.stringify({ memoryId: id }),
      }).then((result) => {
        if (result.memory) {
           setMemories(prev => prev.map(m => m.id === id ? result.memory : m));
           if (selectedMemory?.id === id) {
             setSelectedMemory(result.memory);
           }
           if (result.memory.processingStatus === 'failed') {
             setToast("AI processing failed. Please try again.");
           } else {
             setToast("AI updated the memory summary");
           }
        }
      }).catch(err => console.error("Async processing error:", err));
    } catch (err) {
      console.error(err);
      setToast("Error updating memory");
    }
  };

  const handleMemoryUpsert = (newMem) => {
    setMemories((prev) => {
      const idx = prev.findIndex(m => m.id === newMem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newMem;
        return next;
      }
      return [newMem, ...prev];
    });
  };

  const deleteMemory = async (id) => {
    try {
      await apiFetch(`/api/memories/${id}`, { method: "DELETE" });
      setMemories(prev => prev.filter(m => m.id !== id));
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
      setToast("Memory deleted");
    } catch (err) {
      console.error("deleteMemory error:", err);
      setToast("Failed to delete memory");
    }
  };

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
        onRemoveMemoryFromSpace={removeMemoryFromSpace}
        onSignOut={handleSignOut}
        onArchiveMemory={archiveMemory}
        onPinMemory={pinMemory}
        onTopOfMindMemory={topOfMindMemory}
        onMemoryUpsert={handleMemoryUpsert}
        onDeleteMemory={deleteMemory}
        onEditReminder={handleEditReminder}
        archivedMemories={archivedMemories}
        onEmptyArchive={emptyArchive}
        onDeleteArchivedMemories={deleteArchivedMemories}
        onNavigate={setActivePage}
        onSaveProfile={handleSaveProfile}
        onCapture={() => setCaptureOpen(true)}
        onEditMemory={handleEditMemory}
        onSaveMemory={addMemory}
        onSearch={() => setSearchOpen(true)}
        onAsk={() => setAskOpen(true)}
        onSelectMemory={setSelectedMemory}
        onToggleReminder={toggleReminder}
        onDeleteReminder={deleteReminder}
        onDeleteRemindersBulk={deleteRemindersBulk}
        onDeleteMemoriesBulk={deleteMemoriesBulk}
        onDeleteSpacesBulk={deleteSpacesBulk}
        onAddReminder={() => setNewReminderOpen(true)}
        preferences={preferences}
        updatePreferences={updatePreferences}
        applyTheme={applyTheme}
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
            onEdit={(memory) => { setSearchOpen(false); handleEditMemory(memory); }}
          />
        ) : null}
        {editingMemory ? (
          <EditMemoryModal 
            key={`edit-memory-${editingMemory.id || "active"}`}
            memory={editingMemory} 
            onClose={() => setEditingMemory(null)} 
            onSave={updateMemory} 
          />
        ) : null}
        {editingReminder && (
          <EditReminderModal
            key={`edit-reminder-${editingReminder.id || "active"}`}
            reminder={editingReminder}
            onClose={() => setEditingReminder(null)}
            onSave={editReminder}
          />
        )}
        {selectedMemory && !editingMemory && !editingReminder ? (
          <MemoryDrawer
            memory={selectedMemory}
            memories={visibleMemories}
            spaces={spaces}
            onLinkMemoryToSpace={linkMemoryToSpace}
            onRemoveMemoryFromSpace={removeMemoryFromSpace}
            onNavigate={setSelectedMemory}
            onArchive={archiveMemory}
            onClose={() => setSelectedMemory(null)}
            onPin={pinMemory}
            onTopOfMind={topOfMindMemory}
            onEdit={handleEditMemory}
            onDelete={deleteMemory}
          />
        ) : null}
        {askOpen ? (
          <AskPanel
            memories={visibleMemories}
            onSelectMemory={setSelectedMemory}
            onClose={() => setAskOpen(false)}
          />
        ) : null}
        {newReminderOpen ? (
          <NewReminderModal
            onClose={() => setNewReminderOpen(false)}
            onSave={(draft) => { addReminder(draft); setNewReminderOpen(false); }}
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
