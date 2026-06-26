export function createApiMock(options = {}) {
  const {
    failAsk = false,
    failArchive = false,
    failRemindersToggle = false,
  } = options;

  let state = {
    session: { userId: "demo-user", mode: "demo" },
    memories: [
      { id: "launch-core", title: "Launch brief — core messaging", excerpt: "Refined messaging pillars and audience narrative for launch.", type: "note", dateGroup: "Today", time: "9:41 AM", tag: "Launch", sourceIds: ["customer-interview", "privacy-reference"], archived: false },
      { id: "market-landscape", title: "Privacy-first AI — market landscape", excerpt: "Competitive scan and messaging angles.", type: "link", dateGroup: "Yesterday", time: "4:22 PM", tag: "Research", sourceIds: ["privacy-reference", "launch-core"], archived: false },
      { id: "launch-moodboard", title: "Launch moodboard", excerpt: "Visual direction and tone for the campaign.", type: "image", dateGroup: "Yesterday", time: "11:07 AM", tag: "Brand", sourceIds: ["launch-core", "market-landscape"], archived: false },
      { id: "customer-interview", title: "Customer interview — Maya Chen", excerpt: "Key themes: trust, transparency, and control.", type: "voice", dateGroup: "May 12", time: "7:36 PM", tag: "Interview", sourceIds: ["launch-core"], archived: false, duration: "2:31" },
      { id: "privacy-reference", title: "Saved reference — privacy patterns", excerpt: "Strong examples of clear, human messaging.", type: "note", dateGroup: "May 12", time: "10:15 AM", tag: "Reference", sourceIds: ["market-landscape", "launch-core"], archived: false },
    ],
    reminders: [
      { id: "reminder-1", title: "Refine one-liner in the launch brief", due: "Today", time: "11:30 AM", source: "Launch brief", sourceId: "launch-core", done: false },
      { id: "reminder-2", title: "Add proof points from customer interviews", due: "Tomorrow", time: "9:00 AM", source: "Maya Chen interview", sourceId: "customer-interview", done: false },
    ],
  };

  return {
    getState: () => structuredClone(state),
    setState: (next) => { state = next; },

    // /api/state (GET)
    handleStateGet: async () => {
      return {
        ...state,
        profile: { name: "Demo User", googleConnected: false, githubConnected: true },
        preferences: { autoSummarize: true, showInsights: true, emailHighlights: false, compactCards: false, mfa: false, theme: "petrol", bio: "AI-assisted second memory space. Capturing articles, notes, and reminders." },
      };
    },

    // /api/memories (POST)
    handleMemoriesPost: async (body) => {
      const { memory, reminder } = body || {};
      const memoryToInsert = { ...memory, archived: false };
      if (!memoryToInsert.id) memoryToInsert.id = crypto.randomUUID();

      state.memories.unshift(memoryToInsert);

      if (reminder?.title) {
        const reminderToInsert = {
          id: reminder.id || crypto.randomUUID(),
          title: reminder.title,
          due: reminder.due || "Today",
          time: reminder.time || "9:00 AM",
          source: reminder.source || memoryToInsert.title,
          sourceId: memoryToInsert.id,
          done: false,
        };
        state.reminders.unshift(reminderToInsert);
      }

      return { success: true, memories: state.memories, reminders: state.reminders };
    },

    // /api/memories/archive (POST)
    handleArchivePost: async (body) => {
      if (failArchive) return { success: false, message: "Archive failed (mock)." };
      const { id } = body || {};
      state.memories = state.memories.map((m) => (m.id === id ? { ...m, archived: true } : m));
      state.memories = state.memories.filter((m) => !m.archived);
      return { success: true, memories: state.memories };
    },

    // /api/reminders/toggle (POST)
    handleRemindersTogglePost: async (body) => {
      if (failRemindersToggle) return { success: false, message: "Reminder toggle failed (mock)." };
      const { id } = body || {};
      state.reminders = state.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
      return { success: true, reminders: state.reminders };
    },

    // /api/ask (POST)
    handleAskPost: async (body) => {
      if (failAsk) return { success: false, message: "Ask failed (mock)." };
      const { question } = body || {};
      const memories = state.memories;
      const sources = memories.slice(0, 2);

      return {
        success: true,
        answer: `Answer from your space (mock).\n\nQuestion: "${question}"\n\nKey idea: recall keeps your context connected with clear, source-traceable memories.`,
        sources,
      };
    },

    // /api/profile (POST)
    handleProfilePost: async () => ({ success: true, profile: {}, preferences: {} }),

    // /api/signout (POST)
    handleSignoutPost: async () => ({ success: true }),
  };
}
