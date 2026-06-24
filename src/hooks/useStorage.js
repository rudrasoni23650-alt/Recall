import { useState, useEffect } from 'react';
import { demoMemories, demoReminders } from '../data/demoData.js';

const STORAGE_KEY = "recall-state-v2";
const demoMemoryById = new Map(demoMemories.map((memory) => [memory.id, memory]));
const demoReminderById = new Map(demoReminders.map((reminder) => [reminder.id, reminder]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Migrate from v1 if needed, or just return v2
    if (saved && (saved.version === 1 || saved.version === 2)) {
      return saved;
    }
    // Fallback to old key if v2 is missing
    const oldSaved = JSON.parse(localStorage.getItem("second-signal-state-v1"));
    if (oldSaved && oldSaved.version === 1) return oldSaved;
    return null;
  } catch {
    return null;
  }
}

export function useStorage() {
  const saved = loadState();

  const [session, setSession] = useState(saved?.session ?? null);
  const [memories, setMemories] = useState(() => saved?.memories?.map((memory) => ({ ...demoMemoryById.get(memory.id), ...memory })) ?? demoMemories);
  const [reminders, setReminders] = useState(() => saved?.reminders?.map((reminder) => ({ ...demoReminderById.get(reminder.id), ...reminder })) ?? demoReminders);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, session, memories, reminders }));
  }, [session, memories, reminders]);

  return {
    session, setSession,
    memories, setMemories,
    reminders, setReminders
  };
}
