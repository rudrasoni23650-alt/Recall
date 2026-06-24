const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Supabase (server-side, service role — bypasses RLS) ───────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin = null;
let supabaseAuthVerifier = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    // Used only to verify JWT tokens from the frontend
    supabaseAuthVerifier = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log("Supabase admin client initialized.");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err.message);
  }
} else {
  console.warn("No SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — running in local JSON fallback mode.");
}

// ─── Local JSON fallback (used when Supabase is not yet configured) ──────────
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'db.json');

const baselineMemories = [
  { id: "launch-core", title: "Launch brief — core messaging", excerpt: "Refined messaging pillars and audience narrative for launch.", type: "note", dateGroup: "Today", time: "9:41 AM", tag: "Launch", sourceIds: ["customer-interview", "privacy-reference"], archived: false },
  { id: "market-landscape", title: "Privacy-first AI — market landscape", excerpt: "Competitive scan and messaging angles.", type: "link", dateGroup: "Yesterday", time: "4:22 PM", tag: "Research", sourceIds: ["privacy-reference", "launch-core"], archived: false },
  { id: "launch-moodboard", title: "Launch moodboard", excerpt: "Visual direction and tone for the campaign.", type: "image", dateGroup: "Yesterday", time: "11:07 AM", tag: "Brand", sourceIds: ["launch-core", "market-landscape"], archived: false },
  { id: "customer-interview", title: "Customer interview — Maya Chen", excerpt: "Key themes: trust, transparency, and control.", type: "voice", dateGroup: "May 12", time: "7:36 PM", duration: "2:31", tag: "Interview", sourceIds: ["launch-core"], archived: false },
  { id: "privacy-reference", title: "Saved reference — privacy patterns", excerpt: "Strong examples of clear, human messaging.", type: "note", dateGroup: "May 12", time: "10:15 AM", tag: "Reference", sourceIds: ["market-landscape", "launch-core"], archived: false }
];

const baselineReminders = [
  { id: "reminder-1", title: "Refine one-liner in the launch brief", due: "Today", time: "11:30 AM", source: "Launch brief", sourceId: "launch-core", done: false },
  { id: "reminder-2", title: "Add proof points from customer interviews", due: "Tomorrow", time: "9:00 AM", source: "Maya Chen interview", sourceId: "customer-interview", done: false }
];

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { session: null, memories: baselineMemories, reminders: baselineReminders };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return { session: null, memories: baselineMemories, reminders: baselineReminders };
  }
}

function writeDB(data) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch {}
}

// ─── Gemini AI client ────────────────────────────────────────────────────────
let genAI = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Gemini AI client initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY — AI will run in simulation mode.");
}

function parseJSONResponse(text) {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {
    const fb = trimmed.indexOf('{'), lb = trimmed.lastIndexOf('}');
    if (fb !== -1 && lb > fb) {
      try { return JSON.parse(trimmed.substring(fb, lb + 1)); } catch {}
    }
    throw new Error("Failed to parse JSON from model response");
  }
}

async function generateContentWithFallback(prompt) {
  if (!genAI) throw new Error("API client not initialized");
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-flash-latest"];
  let lastErr;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName, generationConfig: { responseMimeType: "application/json" } },
        { timeout: 8000 }
      );
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`Model ${modelName} failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error("All models failed");
}

async function generateAISummary(type, content) {
  if (!genAI) return null;
  try {
    const prompt = `You are the AI engine for Recall, a private second-memory app. 
Analyze the following captured item of type "${type}": "${content}"

Provide a JSON response (no markdown, no backticks):
{
  "title": "A short, clean descriptive title (3-7 words)",
  "summary": "A concise 2-sentence editorial summary",
  "action": "A single brief actionable next step, or null"
}`;
    return parseJSONResponse(await generateContentWithFallback(prompt));
  } catch (err) {
    console.error("Gemini summarization error:", err);
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

/**
 * Authenticate a request by verifying the Supabase JWT in the Authorization header.
 * Returns the user_id (UUID string) or null if unauthenticated / Supabase not configured.
 */
async function authenticateUser(req) {
  if (!supabaseAuthVerifier) return null; // local fallback mode

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabaseAuthVerifier.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/state — load session + memories + reminders
app.get('/api/state', async (req, res) => {
  const userId = await authenticateUser(req);

  if (!userId || !supabaseAdmin) {
    // Local fallback
    const db = readDB();
    return res.json(db);
  }

  try {
    const [memoriesRes, remindersRes] = await Promise.all([
      supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false }),
      supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    res.json({
      session: { userId, mode: 'live' },
      memories: (memoriesRes.data || []).map(normalizeMemory),
      reminders: (remindersRes.data || []).map(normalizeReminder)
    });
  } catch (err) {
    console.error("Error fetching state:", err);
    res.status(500).json({ error: "Failed to load state" });
  }
});

// POST /api/memories — create a new memory
app.post('/api/memories', async (req, res) => {
  const userId = await authenticateUser(req);
  const { memory, reminder } = req.body;

  let enrichedMemory = { ...memory };
  let enrichedReminder = reminder;

  // AI enrichment
  if (genAI && (memory.type === 'note' || memory.type === 'link')) {
    const content = memory.type === 'link' ? memory.url : memory.excerpt;
    const aiResult = await generateAISummary(memory.type, content);
    if (aiResult) {
      enrichedMemory.title = aiResult.title || memory.title;
      enrichedMemory.excerpt = aiResult.summary || memory.excerpt;
      if (aiResult.action && !reminder) {
        enrichedReminder = {
          id: crypto.randomUUID(),
          title: aiResult.action,
          due: "Upcoming",
          time: "9:00 AM",
          source: enrichedMemory.title,
          sourceId: enrichedMemory.id,
          done: false,
        };
      }
    }
  }

  if (!userId || !supabaseAdmin) {
    // Local fallback
    const db = readDB();
    db.memories.unshift(enrichedMemory);
    if (enrichedReminder) db.reminders.unshift(enrichedReminder);
    writeDB(db);
    return res.json({ success: true, memories: db.memories, reminders: db.reminders });
  }

  try {
    const { data: newMemory, error: memErr } = await supabaseAdmin
      .from('memories')
      .insert([{
        id: enrichedMemory.id || crypto.randomUUID(),
        user_id: userId,
        title: enrichedMemory.title,
        excerpt: enrichedMemory.excerpt,
        type: enrichedMemory.type,
        date_group: enrichedMemory.dateGroup || 'Today',
        time: enrichedMemory.time,
        tag: enrichedMemory.tag,
        url: enrichedMemory.url,
        file_name: enrichedMemory.fileName,
        audio_url: enrichedMemory.audioUrl,
        archived: false,
        source_ids: enrichedMemory.sourceIds || []
      }])
      .select()
      .single();

    if (memErr) throw memErr;

    let newReminder = null;
    if (enrichedReminder) {
      const { data: rem, error: remErr } = await supabaseAdmin
        .from('reminders')
        .insert([{
          id: enrichedReminder.id || crypto.randomUUID(),
          user_id: userId,
          title: enrichedReminder.title,
          due: enrichedReminder.due,
          time: enrichedReminder.time,
          source: enrichedReminder.source,
          source_id: newMemory.id,
          done: false
        }])
        .select()
        .single();
      if (!remErr) newReminder = rem;
    }

    // Return fresh state
    const [memoriesRes, remindersRes] = await Promise.all([
      supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false }),
      supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    res.json({
      success: true,
      memories: (memoriesRes.data || []).map(normalizeMemory),
      reminders: (remindersRes.data || []).map(normalizeReminder)
    });
  } catch (err) {
    console.error("Error saving memory:", err);
    res.status(500).json({ success: false, error: "Failed to save memory" });
  }
});

// POST /api/reminders/toggle
app.post('/api/reminders/toggle', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;

  if (!userId || !supabaseAdmin) {
    const db = readDB();
    db.reminders = db.reminders.map(r => r.id !== id ? r : { ...r, done: !r.done });
    writeDB(db);
    return res.json({ success: true, reminders: db.reminders });
  }

  try {
    const { data: current } = await supabaseAdmin.from('reminders').select('done').eq('id', id).eq('user_id', userId).single();
    await supabaseAdmin.from('reminders').update({ done: !current.done }).eq('id', id).eq('user_id', userId);
    const { data: reminders } = await supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    res.json({ success: true, reminders: (reminders || []).map(normalizeReminder) });
  } catch (err) {
    console.error("Error toggling reminder:", err);
    res.status(500).json({ success: false, error: "Failed to toggle reminder" });
  }
});

// POST /api/memories/archive
app.post('/api/memories/archive', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;

  if (!userId || !supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.map(m => m.id !== id ? m : { ...m, archived: true });
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }

  try {
    await supabaseAdmin.from('memories').update({ archived: true }).eq('id', id).eq('user_id', userId);
    const { data: memories } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false });
    res.json({ success: true, memories: (memories || []).map(normalizeMemory) });
  } catch (err) {
    console.error("Error archiving memory:", err);
    res.status(500).json({ success: false, error: "Failed to archive memory" });
  }
});

// POST /api/ask — Gemini RAG Q&A
app.post('/api/ask', async (req, res) => {
  const userId = await authenticateUser(req);
  const { question } = req.body;

  let memories = [];

  if (userId && supabaseAdmin) {
    const { data } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false);
    memories = (data || []).map(normalizeMemory);
  } else {
    const db = readDB();
    memories = db.memories.filter(m => !m.archived);
  }

  if (!genAI) {
    return res.json({
      success: true,
      answer: "Your notes consistently frame privacy as control, not secrecy. The strongest proof points are local storage, clear sources, and exportability. Customer language suggests leading with confidence rather than technical detail.",
      sources: memories.slice(0, 3)
    });
  }

  try {
    const context = memories
      .map(m => `[ID: "${m.id}", Title: "${m.title}", Type: "${m.type}", Content: "${m.excerpt}"]`)
      .join("\n\n");

    const prompt = `You are Ask Recall, the user's intelligent AI companion and second-memory assistant.
Here is the context representing the user's active memories:
${context}

User question: "${question}"

Instructions:
1. You can answer any type of question, solve problems, write code, plan, or discuss ideas.
2. If the user's question relates to or benefits from their memories, use them to answer accurately and personally.
3. If the question does not relate to their memories, answer it fully like a standard helpful assistant.
4. Keep answers clear and concise (2-4 sentences usually, longer for detailed technical requests).
5. Provide a JSON response (no markdown, no backticks):
{
  "answer": "Your formatted response text",
  "referencedIds": ["memory", "IDs", "you", "used", "or", "empty", "array"]
}`;

    const text = await generateContentWithFallback(prompt);
    const responseData = parseJSONResponse(text);
    const sources = (responseData.referencedIds || [])
      .map(id => memories.find(m => m.id === id))
      .filter(Boolean);

    res.json({ success: true, answer: responseData.answer, sources });
  } catch (err) {
    console.error("Gemini Q&A error:", err);
    res.status(500).json({ success: false, error: "AI reasoning failed" });
  }
});

// POST /api/signout — handled client-side via Supabase Auth SDK now,
// but keep this route for local fallback compatibility
app.post('/api/signout', async (req, res) => {
  if (!supabaseAdmin) {
    const db = readDB();
    db.session = null;
    writeDB(db);
  }
  res.json({ success: true });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a Supabase snake_case row to the camelCase shape the frontend expects */
function normalizeMemory(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    type: row.type,
    dateGroup: row.date_group || 'Today',
    time: row.time,
    tag: row.tag,
    url: row.url,
    fileName: row.file_name,
    audioUrl: row.audio_url,
    archived: row.archived,
    sourceIds: row.source_ids || [],
    duration: row.duration,
    createdAt: row.created_at,
  };
}

function normalizeReminder(row) {
  return {
    id: row.id,
    title: row.title,
    due: row.due,
    time: row.time,
    source: row.source,
    sourceId: row.source_id,
    done: row.done,
    createdAt: row.created_at,
  };
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (supabaseAdmin) {
    console.log("Mode: Supabase (cloud database + auth)");
  } else {
    console.log("Mode: Local fallback (db.json)");
  }
});
