import { useEffect, useMemo, useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { Workspace } from "./components/Workspace.jsx";
import { CaptureModal } from "./components/CaptureModal.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { MemoryDrawer } from "./components/MemoryDrawer.jsx";
import { AskPanel } from "./components/AskPanel.jsx";
import { demoMemories, demoReminders } from "./data/demoData.js";

const STORAGE_KEY = "second-signal-state-v1";
const demoMemoryById = new Map(demoMemories.map((memory) => [memory.id, memory]));
const demoReminderById = new Map(demoReminders.map((reminder) => [reminder.id, reminder]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.version === 1 ? saved : null;
  } catch {
    return null;
  }
}

export function App() {
  const saved = useMemo(loadState, []);
  const [session, setSession] = useState(saved?.session ?? null);
  const [memories, setMemories] = useState(() => saved?.memories?.map((memory) => ({ ...demoMemoryById.get(memory.id), ...memory })) ?? demoMemories);
  const [reminders, setReminders] = useState(() => saved?.reminders?.map((reminder) => ({ ...demoReminderById.get(reminder.id), ...reminder })) ?? demoReminders);
  const [activePage, setActivePage] = useState("home");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, session, memories, reminders }));
  }, [session, memories, reminders]);

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

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleMemories = useMemo(() => memories.filter((memory) => !memory.archived), [memories]);

  const enterDemo = (mode) => {
    if (mode === "empty") {
      setMemories([]);
      setReminders([]);
    } else if (memories.length === 0) {
      setMemories(demoMemories);
      setReminders(demoReminders);
    }
    setSession({ name: "Alex Kim", mode });
    setActivePage("home");
  };

  const addMemory = (draft) => {
    const memory = {
      id: crypto.randomUUID(),
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
    setMemories((current) => [memory, ...current]);
    if (draft.reminder?.title) {
      setReminders((current) => [{
        id: crypto.randomUUID(),
        title: draft.reminder.title,
        due: draft.reminder.due || "Today",
        time: draft.reminder.time || "9:00 AM",
        source: memory.title,
        sourceId: memory.id,
        done: false,
      }, ...current]);
    }
    setCaptureOpen(false);
    setToast("Memory saved and organized");
  };

  const toggleReminder = (id) => {
    setReminders((current) => current.map((item) => {
      if (item.id !== id) return item;
      setToast(item.done ? "Reminder moved back to upcoming" : "Reminder completed");
      return { ...item, done: !item.done };
    }));
  };

  const archiveMemory = (id) => {
    setMemories((current) => current.map((memory) => memory.id === id ? { ...memory, archived: true } : memory));
    setSelectedMemory(null);
    setToast("Memory archived");
  };

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
        onSignOut={() => { setSession(null); setActivePage("home"); }}
      />
      <>
        {captureOpen ? <CaptureModal onClose={() => setCaptureOpen(false)} onSave={addMemory} /> : null}
        {searchOpen ? <CommandPalette memories={visibleMemories} onClose={() => setSearchOpen(false)} onCapture={() => { setSearchOpen(false); setCaptureOpen(true); }} onSelect={(memory) => { setSearchOpen(false); setSelectedMemory(memory); }} /> : null}
        {selectedMemory ? <MemoryDrawer memory={selectedMemory} memories={visibleMemories} onNavigate={setSelectedMemory} onArchive={archiveMemory} onClose={() => setSelectedMemory(null)} /> : null}
        {askOpen ? <AskPanel memories={visibleMemories} onSelectMemory={setSelectedMemory} onClose={() => setAskOpen(false)} /> : null}
      </>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </>
  );
}
