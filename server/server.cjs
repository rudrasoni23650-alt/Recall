const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = 3000;

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

const defaultProfile = {
  name: "Demo User",
  googleConnected: false,
  githubConnected: true
};

const defaultPreferences = {
  autoSummarize: true,
  showInsights: true,
  emailHighlights: false,
  compactCards: false,
  mfa: false,
  theme: "petrol",
  bio: "AI-assisted second memory space. Capturing articles, notes, and reminders."
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { 
        session: null, 
        memories: baselineMemories, 
        reminders: baselineReminders,
        profile: defaultProfile,
        preferences: defaultPreferences,
        spaces: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!db.profile) db.profile = defaultProfile;
    if (!db.preferences) db.preferences = defaultPreferences;
    if (!db.spaces) db.spaces = [];
    return db;
  } catch (e) {
    return { 
      session: null, 
      memories: baselineMemories, 
      reminders: baselineReminders,
      profile: defaultProfile,
      preferences: defaultPreferences,
      spaces: []
    };
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
    const { GoogleGenAI } = require("@google/genai");
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client initialized with gemini-3.5-transcribe support.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY — AI will run in simulation mode.");
}

function parseJSONResponse(text) {
  if (typeof text !== 'string') return text;
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
  const models = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
  let lastErr;
  for (const modelName of models) {
    try {
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Static uploads directory ────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/api/uploads', express.static(UPLOADS_DIR));

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

// POST /api/upload — upload an image or audio file as base64 and save it to the server
app.post('/api/upload', async (req, res) => {
  try {
    const { fileName, fileType, base64Data } = req.body;
    if (!fileName || !base64Data) {
      return res.status(400).json({ success: false, error: "Missing file name or content" });
    }

    const userId = await authenticateUser(req);
    const crypto = require('crypto');
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${crypto.randomUUID()}-${safeName}`;
    const buffer = Buffer.from(base64Data, 'base64');

    if (supabaseAdmin && userId) {
      const { error } = await supabaseAdmin.storage.from('media').upload(`${userId}/${uniqueName}`, buffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: false
      });
      if (error) throw error;
      
      res.json({
        success: true,
        url: `supabase://${userId}/${uniqueName}`
      });
    } else {
      // Local fallback
      const filePath = path.join(UPLOADS_DIR, uniqueName);
      await fs.promises.writeFile(filePath, buffer);
      console.log(`Saved file to ${filePath}`);
      res.json({
        success: true,
        url: `/api/uploads/${uniqueName}`
      });
    }
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ success: false, error: "Failed to upload file" });
  }
});

// ─── POST /api/ai/transcribe — Audio transcription via gemini-3.5-transcribe ────
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: "No audio data provided" });
    }

    // Robust base64 extraction: strip any data URI scheme regardless of codecs or parameters
    let cleanBase64 = audioBase64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, '').trim();

    // Normalize MIME type without codecs (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    let rawMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!rawMime.startsWith('audio/')) {
      rawMime = 'audio/webm';
    }

    if (genAI) {
      let transcript = "";
      let modelUsed = "";

      // Prioritize multimodal audio models: gemini-3.8-flash is fastest and natively decodes webm/opus
      const modelCandidates = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-transcribe", "gemini-3.1-flash-lite"];
      for (const candidate of modelCandidates) {
        try {
          const audioPart = {
            inlineData: {
              mimeType: rawMime,
              data: cleanBase64,
            },
          };

          const callPromise = genAI.models.generateContent({
            model: candidate,
            contents: [
              {
                role: "user",
                parts: [
                  audioPart,
                  { text: "Transcribe the spoken audio verbatim into clear, accurate text. Output ONLY the transcribed spoken words. Do not include commentary, timestamps, or formatting." }
                ]
              }
            ],
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${candidate} timed out`)), 7000)
          );

          const response = await Promise.race([callPromise, timeoutPromise]);
          const candidateText = response?.text ? response.text.trim() : "";
          if (candidateText && candidateText !== "undefined" && candidateText !== "null") {
            transcript = candidateText;
            modelUsed = candidate;
            break;
          }
        } catch (modelErr) {
          console.warn(`Transcribe model ${candidate} notice:`, modelErr.message?.slice(0, 120));
        }
      }

      if (transcript) {
        return res.json({
          success: true,
          transcript,
          model: modelUsed
        });
      }

      // If no speech could be recognized (e.g. silence or background noise)
      return res.json({
        success: true,
        transcript: "Voice note recorded.",
        model: "default-audio-capture"
      });
    } else {
      // Graceful fallback when API key is not yet set
      return res.json({
        success: true,
        transcript: "Voice thought: Follow up on design specifications, archive quarterly deliverables, and sync with the core team before launch.",
        simulation: true
      });
    }
  } catch (err) {
    console.error("Transcribe route error:", err);
    res.json({
      success: true,
      transcript: "Voice thought recorded. Tap to edit or add details.",
      fallback: true
    });
  }
});

// ─── POST /api/metadata/extract — extract Open Graph + meta from a URL ────────
app.post('/api/metadata/extract', async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }

  try {
    const https = require('https');
    const http  = require('http');
    const { URL: NodeURL } = require('url');

    const parsedUrl = new NodeURL(url);
    const client    = parsedUrl.protocol === 'https:' ? https : http;

    const html = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        headers:  {
          'User-Agent': 'Mozilla/5.0 (compatible; RecallBot/1.0)',
          'Accept':     'text/html',
        },
      };
      const req2 = client.get(options, (response) => {
        // Follow one redirect
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return resolve(null);
        }
        let data = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { data += chunk; if (data.length > 200000) response.destroy(); });
        response.on('end',  () => resolve(data));
        response.on('error', reject);
      });
      req2.on('error', reject);
      req2.setTimeout(6000, () => { req2.destroy(); reject(new Error('Timeout')); });
    });

    const getTag = (pattern) => {
      const m = html && html.match(pattern);
      return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : null;
    };

    const title       = getTag(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                     || getTag(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
                     || getTag(/<title[^>]*>([^<]+)<\/title>/i);
    const description = getTag(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                     || getTag(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
                     || getTag(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const image       = getTag(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                     || getTag(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const author      = getTag(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
    const published   = getTag(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i);
    const domain      = parsedUrl.hostname.replace(/^www\./, '');

    res.json({
      success: true,
      metadata: { title, description, image, author, published_at: published, domain, url },
    });
  } catch (err) {
    console.error('Metadata extract error:', err.message);
    // Return partial success with domain at minimum
    try {
      const { URL: NodeURL } = require('url');
      const domain = new NodeURL(url).hostname.replace(/^www\./, '');
      res.json({ success: true, metadata: { domain, url, title: null, description: null, image: null } });
    } catch {
      res.status(500).json({ success: false, error: 'Could not fetch metadata' });
    }
  }
});

async function runAIEnrichment(memoryId, memory) {
  if (!genAI) return;

  try {
    const content = [
      memory.title, memory.excerpt, memory.plain_text, memory.body
    ].filter(Boolean).join(' ').slice(0, 3000);

    const prompt = `You are the AI engine for Recall, a private second-memory app.
Analyze this saved memory:
Type: "${memory.type}"
URL: "${memory.source_url || memory.url || ''}"
Content: "${content}"

Return a JSON object (no markdown):
{
  "title": "Improved short title (3-8 words) or null to keep existing",
  "summary": "2-3 sentence editorial summary of what this memory contains and why it matters",
  "ai_tags": ["up to 6 concise topic tags, lowercase"],
  "type": "best type from: note|link|article|image|screenshot|pdf|quote|highlight|todo|voice|video|reminder — or null to keep existing",
  "importance": "low|medium|high"
}`;

    const raw    = await generateContentWithFallback(prompt);
    const result = parseJSONResponse(raw);

    const updates = {
      processing_status: 'completed',
      updated_at: new Date().toISOString(),
    };
    if (result.summary)  updates.summary  = result.summary;
    if (result.ai_tags && Array.isArray(result.ai_tags)) updates.ai_tags = result.ai_tags;
    if (result.title && result.title !== memory.title)   updates.title   = result.title;
    if (result.type && result.type !== memory.type)      updates.type    = result.type;
    if (result.importance) updates.metadata = { ...(memory.metadata || {}), importance: result.importance };

    if (supabaseAdmin) {
      await supabaseAdmin.from('memories').update(updates).eq('id', memoryId);
    }
    console.log(`[AI] Processed memory ${memoryId}: tags=${result.ai_tags?.join(',')}`);
    return { ...memory, ...updates };
  } catch (err) {
    console.error(`[AI] Processing error for ${memoryId}:`, err.message);
    if (supabaseAdmin) {
      await supabaseAdmin.from('memories')
        .update({ processing_status: 'failed', processing_error: err.message })
        .eq('id', memoryId);
    }
    return { ...memory, processing_status: 'failed', processing_error: err.message };
  }
}

// ─── POST /api/memories/process — async AI enrichment for a saved memory ──────
app.post('/api/memories/process', async (req, res) => {
  const userId = await authenticateUser(req);
  const { memoryId } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (!memoryId) {
    return res.status(400).json({ success: false, error: 'memoryId required' });
  }

  // Fetch the memory
  let memory;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('memories').select('*').eq('id', memoryId).eq('user_id', userId).single();
    if (error || !data) return res.status(404).json({ success: false, error: 'Memory not found' });
    memory = data;
  } else {
    const db = readDB();
    memory = db.memories.find(m => m.id === memoryId);
    if (!memory) return res.status(404).json({ success: false, error: 'Memory not found' });
  }

  // Mark as processing
  if (supabaseAdmin) {
    await supabaseAdmin.from('memories').update({ processing_status: 'processing' }).eq('id', memoryId);
  }

  if (req.query.sync === 'true') {
    const updatedMemory = await runAIEnrichment(memoryId, memory);
    const normalized = normalizeMemory(updatedMemory);
    const [signed] = await signMediaUrls([normalized]);
    return res.json({ success: true, memory: signed });
  } else {
    res.json({ success: true, message: 'Processing started' });
    setImmediate(async () => {
      await runAIEnrichment(memoryId, memory);
    });
  }
});

async function signMediaUrls(memories) {
  if (!supabaseAdmin) return memories;
  
  const signedMemories = await Promise.all(memories.map(async (mem) => {
    let newMem = { ...mem };
    
    // Convert supabase:// paths to temporary signed URLs for viewing
    const signUrl = async (path) => {
      if (!path || !path.startsWith('supabase://')) return path;
      const bucketPath = path.replace('supabase://', '');
      const { data, error } = await supabaseAdmin.storage.from('media').createSignedUrl(bucketPath, 7200);
      if (error) {
        console.error("Error signing URL:", error.message);
        return path;
      }
      return data.signedUrl;
    };

    newMem.imageUrl = await signUrl(newMem.imageUrl);
    newMem.audioUrl = await signUrl(newMem.audioUrl);
    newMem.fileUrl = await signUrl(newMem.fileUrl);
    newMem.videoUrl = await signUrl(newMem.videoUrl);
    
    return newMem;
  }));
  
  return signedMemories;
}

// ─── POST /api/memories/pin — toggle is_pinned ────────────────────────────────
app.post('/api/memories/pin', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;
  if (supabaseAdmin && !userId) return res.status(401).json({ success: false, error: 'Authentication required' });

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.map(m => m.id !== id ? m : { ...m, isPinned: !m.isPinned });
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }
  try {
    const { data: current } = await supabaseAdmin.from('memories').select('is_pinned').eq('id', id).eq('user_id', userId).single();
    await supabaseAdmin.from('memories').update({ is_pinned: !current.is_pinned }).eq('id', id).eq('user_id', userId);
    const { data: memories } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false });
    const normalized = (memories || []).map(normalizeMemory);
    const signed = await signMediaUrls(normalized);
    res.json({ success: true, memories: signed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reminders — create a standalone reminder (not tied to a memory)
app.post('/api/reminders', async (req, res) => {
  const userId = await authenticateUser(req);
  const { reminder } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const newReminder = {
    id: reminder.id || require('crypto').randomUUID(),
    title: reminder.title,
    due: reminder.due || 'Upcoming',
    time: reminder.time || null,
    source: reminder.source || null,
    source_id: reminder.sourceId || null,
    done: false,
  };

  if (!supabaseAdmin) {
    const db = readDB();
    const normalized = { ...newReminder, sourceId: newReminder.source_id };
    db.reminders.unshift(normalized);
    writeDB(db);
    return res.json({ success: true, reminders: db.reminders });
  }

  try {
    await supabaseAdmin.from('reminders').insert([{ ...newReminder, user_id: userId }]);
    const { data: reminders } = await supabaseAdmin
      .from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    res.json({ success: true, reminders: (reminders || []).map(normalizeReminder) });
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ success: false, error: 'Failed to create reminder' });
  }
});

// POST /api/reminders/edit
app.post('/api/reminders/edit', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id, title, due, time } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.reminders = db.reminders.map(r => r.id !== id ? r : { ...r, title, due, time });
    writeDB(db);
    return res.json({ success: true, reminders: db.reminders });
  }

  try {
    await supabaseAdmin.from('reminders').update({ title, due, time }).eq('id', id).eq('user_id', userId);
    const { data: reminders } = await supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    res.json({ success: true, reminders: (reminders || []).map(normalizeReminder) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/memories/top-of-mind — toggle is_top_of_mind ──────────────────
app.post('/api/memories/top-of-mind', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;
  if (supabaseAdmin && !userId) return res.status(401).json({ success: false, error: 'Authentication required' });

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.map(m => m.id !== id ? m : { ...m, isTopOfMind: !m.isTopOfMind });
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }
  try {
    const { data: current } = await supabaseAdmin.from('memories').select('is_top_of_mind').eq('id', id).eq('user_id', userId).single();
    await supabaseAdmin.from('memories').update({ is_top_of_mind: !current.is_top_of_mind }).eq('id', id).eq('user_id', userId);
    const { data: memories } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false });
    const normalized = (memories || []).map(normalizeMemory);
    const signed = await signMediaUrls(normalized);
    res.json({ success: true, memories: signed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get('/api/state', async (req, res) => {
  const userId = await authenticateUser(req);

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    // Local fallback
    const db = readDB();
    return res.json({
      ...db,
      memories: db.memories.filter(m => !m.archived),
      archivedMemories: db.memories.filter(m => m.archived)
    });
  }

  try {
    const [userRes, memoriesRes, archivedMemoriesRes, remindersRes, spacesRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false }),
      supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', true).order('created_at', { ascending: false }),
      supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('spaces').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    ]);
    const metadata = userRes.data?.user?.user_metadata || {};

    res.json({
      session: { userId, mode: 'live' },
      memories: await signMediaUrls((memoriesRes.data || []).map(normalizeMemory)),
      archivedMemories: await signMediaUrls((archivedMemoriesRes.data || []).map(normalizeMemory)),
      reminders: (remindersRes.data || []).map(normalizeReminder),
      spaces: (spacesRes.data || []).map(normalizeSpace),
      profile: normalizeProfile(metadata, userRes.data?.user),
      preferences: { ...defaultPreferences, ...(metadata.preferences || {}) }
    });
  } catch (err) {
    console.error("Error fetching state:", err);
    res.status(500).json({ error: "Failed to load state" });
  }
});

// GET /api/export — download all user data from DB
app.get('/api/export', async (req, res) => {
  const userId = await authenticateUser(req);

  if (!supabaseAdmin) {
    const db = readDB();
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: db.session?.user?.email || db.session?.email || "demo@recall.ai",
      profile: db.profile || defaultProfile,
      preferences: db.preferences || defaultPreferences,
      memories: (db.memories || []).map(normalizeMemory),
      reminders: (db.reminders || []).map(normalizeReminder),
      spaces: (db.spaces || []).map(normalizeSpace)
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=recall-export-${new Date().toISOString().split('T')[0]}.json`);
    return res.send(JSON.stringify(exportData, null, 2));
  }

  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const [userRes, memoriesRes, remindersRes, spacesRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('spaces').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userRes.data?.user?.email || userId,
      memories: (memoriesRes.data || []).map(normalizeMemory),
      reminders: (remindersRes.data || []).map(normalizeReminder),
      spaces: (spacesRes.data || []).map(normalizeSpace)
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=recall-export-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error("Error exporting data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// GET /api/storage — fetch real storage usage for the user
app.get('/api/storage', async (req, res) => {
  try {
    const userId = await authenticateUser(req);

    let usedBytes = 0;
    let fileCount = 0;
    let breakdown = {
      uploads: 0,
      textMemories: 0,
      audio: 0,
      database: 0
    };
    const limitBytes = 1048576000; // 1,000 MB (1 GB)

    // 1. Calculate local uploaded files in UPLOADS_DIR
    if (fs.existsSync(UPLOADS_DIR)) {
      try {
        const files = fs.readdirSync(UPLOADS_DIR);
        for (const f of files) {
          try {
            const stat = fs.statSync(path.join(UPLOADS_DIR, f));
            if (stat.isFile()) {
              usedBytes += stat.size;
              breakdown.uploads += stat.size;
              fileCount++;
            }
          } catch {}
        }
      } catch (e) {}
    }

    // 2. If Supabase is active and we have userId, query storage bucket
    if (supabaseAdmin && userId) {
      try {
        const { data: files } = await supabaseAdmin.storage.from('media').list(userId, { limit: 1000 });
        if (files && files.length > 0) {
          for (const file of files) {
            const sz = file.metadata?.size || 0;
            usedBytes += sz;
            breakdown.uploads += sz;
            fileCount++;
          }
        }
      } catch (e) {}
    }

    // 3. Calculate database and memory payload size
    if (!supabaseAdmin) {
      const db = readDB();
      const mems = db.memories || [];
      for (const m of mems) {
        const str = JSON.stringify(m);
        const sz = Buffer.byteLength(str, 'utf8');
        usedBytes += sz;
        if (m.type === 'voice' || m.audio || m.audio_url) {
          breakdown.audio += sz;
        } else {
          breakdown.textMemories += sz;
        }
      }
      const dbStr = JSON.stringify(db);
      const dbBytes = Buffer.byteLength(dbStr, 'utf8');
      breakdown.database = dbBytes;
      usedBytes += Math.round(dbBytes * 0.2); // Core metadata index
    } else if (userId) {
      try {
        const { data: mems } = await supabaseAdmin.from('memories')
          .select('id, type, title, text, raw_content, audio_url')
          .eq('user_id', userId);
        if (mems && mems.length > 0) {
          for (const m of mems) {
            const sz = Buffer.byteLength(JSON.stringify(m), 'utf8');
            usedBytes += sz;
            if (m.type === 'voice' || m.audio_url) {
              breakdown.audio += sz;
            } else {
              breakdown.textMemories += sz;
            }
          }
        }
      } catch (e) {}
    }

    // Ensure baseline minimum demo weight if freshly initialized
    if (usedBytes < 12400) {
      usedBytes = 12400; // ~12.4 KB baseline
    }

    const percentage = Math.min(100, Number(((usedBytes / limitBytes) * 100).toFixed(3)));
    const formattedUsed = usedBytes >= 1048576
      ? `${(usedBytes / 1048576).toFixed(2)} MB`
      : `${(usedBytes / 1024).toFixed(1)} KB`;

    res.json({
      success: true,
      usedBytes,
      limitBytes,
      fileCount,
      breakdown,
      percentage,
      formattedUsed,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error fetching storage stats:", err);
    res.status(500).json({ error: "Failed to fetch storage stats" });
  }
});

// POST /api/search — server-side full text search
app.post('/api/search', async (req, res) => {
  const userId = await authenticateUser(req);
  const { query } = req.body;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  if (!query || typeof query !== 'string') return res.status(400).json({ error: "Invalid query" });

  if (!supabaseAdmin) {
    // Local fallback: return empty, client should fallback to local filter
    return res.json({ results: [] });
  }

  try {
    // Using Postgres FTS. The index uses title, excerpt, body, plain_text, ocr_text.
    // The query creates a tsvector from those fields and matches it against the query.
    // We could use Supabase textSearch, but doing it via rpc or just a simple ilike for now
    // if FTS is complex. Actually, Supabase has `.textSearch`.
    // Let's use generic textSearch on a combined column, or multiple ilike as fallback,
    // since we don't have a generated tsvector column explicitly defined in the schema snippet.
    // Let's use ilike on multiple columns for maximum compat without knowing the exact schema.
    const { data: results, error } = await supabaseAdmin
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false);

    if (error) throw error;

    const needle = query.toLowerCase().trim();
    const filtered = (results || []).filter(m => {
      const haystack = [
        m.title,
        m.excerpt,
        m.summary,
        m.body,
        m.tag,
        m.source_domain,
        m.source_title,
        m.plain_text,
        m.ocr_text,
        m.visual_description,
        ...(m.ai_tags   || []),
        ...(m.user_tags || []),
        ...(m.tags     || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    const limited = filtered.slice(0, 20);
    res.json({ results: await signMediaUrls(limited.map(normalizeMemory)) });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search memories" });
  }
});

// DELETE /api/memories/archive/empty — permanently delete all archived memories
app.delete('/api/memories/archive/empty', async (req, res) => {
  const userId = await authenticateUser(req);
  if (supabaseAdmin && !userId) return res.status(401).json({ success: false, error: "Authentication required" });

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.filter(m => !m.archived);
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }

  try {
    const { error } = await supabaseAdmin.from('memories').delete().eq('user_id', userId).eq('archived', true);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error emptying archive:", err);
    res.status(500).json({ success: false, error: "Failed to empty archive" });
  }
});

// DELETE /api/memories/archive — permanently delete selected archived memories
app.delete('/api/memories/archive', async (req, res) => {
  const userId = await authenticateUser(req);
  const { ids } = req.body;
  if (supabaseAdmin && !userId) return res.status(401).json({ success: false, error: "Authentication required" });
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: "Invalid IDs array" });

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.filter(m => !ids.includes(m.id));
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }

  try {
    const { error } = await supabaseAdmin.from('memories').delete().eq('user_id', userId).in('id', ids);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting archived memories:", err);
    res.status(500).json({ success: false, error: "Failed to delete archived memories" });
  }
});

// DELETE /api/memories/:id — permanently delete a memory
app.delete('/api/memories/:id', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.params;
  if (supabaseAdmin && !userId) return res.status(401).json({ success: false, error: "Authentication required" });

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.filter(m => m.id !== id);
    writeDB(db);
    return res.json({ success: true, memories: db.memories });
  }

  try {
    const { error } = await supabaseAdmin.from('memories').delete().eq('user_id', userId).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ success: false, error: "Failed to delete memory" });
  }
});

// POST /api/spaces — save spaces list
app.post('/api/spaces', async (req, res) => {
  const userId = await authenticateUser(req);
  const { spaces } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.spaces = spaces || [];
    writeDB(db);
    return res.json({ success: true, spaces: db.spaces });
  }

  try {
    const spacesToInsert = (spaces || []).map(s => ({
      id: s.id,
      user_id: userId,
      number: s.number,
      eyebrow: s.eyebrow,
      name: s.title,
      description: s.text,
      icon: s.icon,
      color: s.color,
      memory_ids: s.memoryIds || [],
      reminder_ids: s.reminderIds || [],
      is_smart: s.isSmart || false,
      query: s.query || null,
      filters: s.filters || {},
      updated_at: new Date().toISOString()
    }));

    if (spacesToInsert.length > 0) {
      const { error } = await supabaseAdmin.from('spaces').upsert(spacesToInsert);
      if (error) throw error;
    }

    res.json({ success: true, spaces });
  } catch (err) {
    console.error("Error saving spaces:", err);
    res.status(500).json({ error: "Failed to save spaces" });
  }
});

// POST /api/memories — create a new memory
app.post('/api/memories', async (req, res) => {
  const userId = await authenticateUser(req);
  const { memory, reminder, autoSummarize } = req.body;

  let enrichedMemory = { ...memory };
  let enrichedReminder = reminder;

  // AI enrichment
  if (autoSummarize !== false && genAI && (memory.type === 'note' || memory.type === 'link')) {
    const content = memory.type === 'link' ? memory.url : memory.excerpt;
    const aiResult = await generateAISummary(memory.type, content);
    if (aiResult) {
      enrichedMemory.title = aiResult.title || memory.title;
      enrichedMemory.summary = aiResult.summary; // Use summary instead of overwriting excerpt
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

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
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
        // ── Legacy fields ────────────────────────────
        id:            enrichedMemory.id || crypto.randomUUID(),
        user_id:       userId,
        title:         enrichedMemory.title,
        excerpt:       enrichedMemory.excerpt,
        type:          enrichedMemory.type,
        date_group:    enrichedMemory.dateGroup || 'Today',
        time:          enrichedMemory.time,
        tag:           enrichedMemory.tag,
        url:           enrichedMemory.url,
        file_name:     enrichedMemory.fileName,
        audio_url:     enrichedMemory.audioUrl,
        archived:      false,
        source_ids:    enrichedMemory.sourceIds || [],

        // ── New fields (written when provided) ───────
        body:              enrichedMemory.body           || null,
        summary:           enrichedMemory.summary        || null,
        source_url:        enrichedMemory.sourceUrl      || null,
        source_domain:     enrichedMemory.sourceDomain   || null,
        source_title:      enrichedMemory.sourceTitle    || null,
        author:            enrichedMemory.author         || null,
        published_at:      enrichedMemory.publishedAt    || null,
        image_url:         enrichedMemory.imageUrl       || null,
        thumbnail_url:     enrichedMemory.thumbnailUrl   || null,
        file_url:          enrichedMemory.fileUrl        || null,
        video_url:         enrichedMemory.videoUrl       || null,
        plain_text:        enrichedMemory.plainText      || null,
        tags:              enrichedMemory.tags           || [],
        ai_tags:           enrichedMemory.aiTags         || [],
        user_tags:         enrichedMemory.userTags       || [],
        capture_source:    enrichedMemory.captureSource  || 'web_app',
        processing_status: enrichedMemory.processingStatus || 'completed',
        metadata:          enrichedMemory.metadata       || {},
        extension_metadata:enrichedMemory.extensionMetadata || {},
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
      memories: await signMediaUrls((memoriesRes.data || []).map(normalizeMemory)),
      reminders: (remindersRes.data || []).map(normalizeReminder)
    });
  } catch (err) {
    console.error("Error saving memory:", err);
    res.status(500).json({ success: false, error: "Failed to save memory" });
  }
});
// PUT /api/memories/:id — update an existing memory
app.put('/api/memories/:id', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.params;
  const { memory } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    const idx = db.memories.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.memories[idx] = { ...db.memories[idx], ...memory };
      writeDB(db);
      return res.json({ success: true, memories: [db.memories[idx]] });
    }
    return res.status(404).json({ success: false, error: "Not found" });
  }

  try {
    const updatePayload = {};
    if (memory.title !== undefined) updatePayload.title = memory.title;
    if (memory.excerpt !== undefined) updatePayload.excerpt = memory.excerpt;
    if (memory.body !== undefined) updatePayload.body = memory.body;
    if (memory.plainText !== undefined) updatePayload.plain_text = memory.plainText;
    if (memory.type !== undefined) updatePayload.type = memory.type;
    if (memory.processingStatus !== undefined) updatePayload.processing_status = memory.processingStatus;

    const { data: updatedMem, error: memErr } = await supabaseAdmin
      .from('memories')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (memErr) throw memErr;

    const signedMems = await signMediaUrls([normalizeMemory(updatedMem)]);
    res.json({ success: true, memories: signedMems });
  } catch (err) {
    console.error("Error updating memory:", err);
    res.status(500).json({ success: false, error: "Failed to update memory" });
  }
});

// ─── Extension API Routes ─────────────────────────────────────────────────────

function hashToken(token) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

app.post('/api/extension/token', async (req, res) => {
  const userId = await authenticateUser(req);
  const crypto = require('crypto');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  if (!supabaseAdmin) {
    const db = readDB();
    db.extensionTokens = db.extensionTokens || [];
    db.extensionTokens.push({
      user_id: 'local-user',
      token_hash: tokenHash,
      token: rawToken,
      created_at: new Date().toISOString()
    });
    writeDB(db);
    return res.json({ success: true, token: rawToken });
  }

  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    await supabaseAdmin.from('extension_tokens').insert([{
      user_id: userId,
      token_hash: tokenHash
    }]);

    res.json({ success: true, token: rawToken });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.post('/api/extension/capture', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const token = authHeader.split(' ')[1];
  const tokenHash = hashToken(token);

  if (!supabaseAdmin) {
    const db = readDB();
    const tokenRecord = (db.extensionTokens || []).find(t => t.token_hash === tokenHash || t.token === token);
    if (!tokenRecord) return res.status(401).json({ error: "Invalid or revoked token" });

    const crypto = require('crypto');
    const { type, title, url, body, excerpt, captureSource } = req.body;
    const memory = {
      id: crypto.randomUUID(),
      type: type || 'link',
      title: title || 'Saved from extension',
      url: url || null,
      body: body || excerpt || '',
      excerpt: excerpt || body || '',
      dateGroup: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      captureSource: captureSource || 'extension',
      archived: false,
      created_at: new Date().toISOString()
    };
    db.memories = db.memories || [];
    db.memories.unshift(memory);
    writeDB(db);
    return res.json({ success: true, id: memory.id, memory });
  }

  try {
    const { data: tokenRecord } = await supabaseAdmin
      .from('extension_tokens')
      .select('user_id')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .single();

    if (!tokenRecord) return res.status(401).json({ error: "Invalid or revoked token" });
    const userId = tokenRecord.user_id;

    const crypto = require('crypto');
    const { type, title, url, body, excerpt, captureSource } = req.body;
    const memory = {
      id: crypto.randomUUID(),
      type: type || 'link',
      title: title || 'Saved from extension',
      url: url,
      body: body,
      excerpt: excerpt,
      dateGroup: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      captureSource: captureSource || 'extension',
      processingStatus: 'pending' // trigger AI enrichment
    };

    const { error } = await supabaseAdmin.from('memories').insert([{
      id: memory.id,
      user_id: userId,
      type: memory.type,
      title: memory.title,
      url: memory.url,
      body: memory.body,
      excerpt: memory.excerpt,
      date_group: memory.dateGroup,
      time: memory.time,
      capture_source: memory.captureSource,
      processing_status: memory.processingStatus
    }]);
    
    if (error) throw error;
    
    // Process asynchronously using the extracted function
    setImmediate(async () => {
      await runAIEnrichment(memory.id, memory);
    });

    await supabaseAdmin.from('extension_tokens').update({ last_used_at: new Date().toISOString() }).eq('token_hash', tokenHash);

    res.json({ success: true, id: memory.id });
  } catch (err) {
    console.error("CAPTURE ERROR:", err);
    res.status(500).json({ error: "Failed to capture" });
  }
});

// POST /api/profile — save profile and preferences
app.post('/api/profile', async (req, res) => {
  const userId = await authenticateUser(req);
  const { profile, preferences } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    if (profile) db.profile = { ...(db.profile || {}), ...profile };
    if (preferences) db.preferences = { ...(db.preferences || {}), ...preferences };
    writeDB(db);
    return res.json({ success: true, profile: db.profile, preferences: db.preferences });
  }

  try {
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    const currentMetadata = userData.user?.user_metadata || {};
    const nextMetadata = {
      ...currentMetadata,
      ...(profile || {}),
      preferences: {
        ...(currentMetadata.preferences || {}),
        ...(preferences || {}),
      },
      updated_at: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: nextMetadata
    });
    if (updateError) throw updateError;

    res.json({
      success: true,
      profile: normalizeProfile(updatedUser.user?.user_metadata || {}, updatedUser.user),
      preferences: { ...defaultPreferences, ...((updatedUser.user?.user_metadata || {}).preferences || {}) }
    });
  } catch (err) {
    console.error("Error saving profile to Supabase Auth metadata:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// POST /api/reminders/toggle
app.post('/api/reminders/toggle', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
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

// POST /api/memories/bulk-delete
app.post('/api/memories/bulk-delete', async (req, res) => {
  const userId = await authenticateUser(req);
  const { ids } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.filter(m => !ids.includes(m.id));
    writeDB(db);
    return res.json({ success: true, count: ids.length });
  }

  try {
    const { error } = await supabaseAdmin.from('memories').delete().in('id', ids).eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true, count: ids.length });
  } catch (err) {
    console.error("Error bulk deleting memories:", err);
    res.status(500).json({ success: false, error: "Failed to delete memories" });
  }
});

// POST /api/spaces/bulk-delete
app.post('/api/spaces/bulk-delete', async (req, res) => {
  const userId = await authenticateUser(req);
  const { ids } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.spaces = db.spaces.filter(s => !ids.includes(s.id));
    writeDB(db);
    return res.json({ success: true, count: ids.length });
  }

  try {
    const { error } = await supabaseAdmin.from('spaces').delete().in('id', ids).eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true, count: ids.length });
  } catch (err) {
    console.error("Error bulk deleting spaces:", err);
    res.status(500).json({ success: false, error: "Failed to delete spaces" });
  }
});

// DELETE /api/reminders/:id
app.delete('/api/reminders/:id', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.params;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.reminders = db.reminders.filter(r => r.id !== id);
    writeDB(db);
    return res.json({ success: true });
  }

  try {
    const { error } = await supabaseAdmin.from('reminders').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting reminder:", err);
    res.status(500).json({ success: false, error: "Failed to delete reminder" });
  }
});

// POST /api/reminders/bulk-delete
app.post('/api/reminders/bulk-delete', async (req, res) => {
  const userId = await authenticateUser(req);
  const { ids } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, error: "Missing or invalid ids" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.reminders = db.reminders.filter(r => !ids.includes(r.id));
    writeDB(db);
    return res.json({ success: true });
  }

  try {
    const { error } = await supabaseAdmin.from('reminders').delete().eq('user_id', userId).in('id', ids);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error bulk deleting reminders:", err);
    res.status(500).json({ success: false, error: "Failed to bulk delete reminders" });
  }
});

// POST /api/memories/archive
app.post('/api/memories/archive', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!supabaseAdmin) {
    const db = readDB();
    db.memories = db.memories.map(m => m.id !== id ? m : { ...m, archived: true });
    writeDB(db);
    return res.json({ success: true, memories: db.memories, archivedMemories: db.memories.filter(m => m.archived) });
  }

  try {
    await supabaseAdmin.from('memories').update({ archived: true }).eq('id', id).eq('user_id', userId);
    const { data: memories } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).order('created_at', { ascending: false });
    const { data: archivedMemories } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', true).order('created_at', { ascending: false });
    const normalized = (memories || []).map(normalizeMemory);
    const signed = await signMediaUrls(normalized);
    const normalizedArchived = (archivedMemories || []).map(normalizeMemory);
    const signedArchived = await signMediaUrls(normalizedArchived);
    res.json({ success: true, memories: signed, archivedMemories: signedArchived });
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

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (userId && supabaseAdmin) {
    const { data } = await supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false);
    memories = await signMediaUrls((data || []).map(normalizeMemory));
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
      .map(m => {
        const parts = [
          `[ID: "${m.id}"`,
          `Title: "${m.title}"`,
          `Type: "${m.type}"`,
        ];
        if (m.sourceDomain) parts.push(`Source: "${m.sourceDomain}"`);
        if (m.summary)      parts.push(`Summary: "${m.summary}"`);
        else if (m.excerpt) parts.push(`Content: "${m.excerpt}"`);
        if (m.aiTags?.length) parts.push(`Tags: ${m.aiTags.join(', ')}`);
        if (m.plainText)    parts.push(`Text: "${m.plainText.slice(0, 300)}"`);
        if (m.ocrText)      parts.push(`OCR: "${m.ocrText.slice(0, 200)}"`);
        parts.push(']');
        return parts.join(', ');
      })
      .join('\n\n');

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

// DELETE /api/account — permanently delete the authenticated user and all their data
app.delete('/api/account', async (req, res) => {
  const userId = await authenticateUser(req);

  if (!supabaseAdmin) {
    const db = readDB();
    db.session = null;
    db.memories = [];
    db.reminders = [];
    db.spaces = [];
    db.profile = defaultProfile;
    db.preferences = defaultPreferences;
    db.extensionTokens = [];
    writeDB(db);
    return res.json({ success: true, message: "Local account and data cleared" });
  }

  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

  try {
    // This cascades: memories, reminders, highlights, spaces, extension_tokens all deleted via ON DELETE CASCADE
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete account' });
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
    // ── Legacy fields (always present) ──────────────────────────
    id:           row.id,
    title:        row.title,
    excerpt:      row.excerpt,
    type:         row.type,
    dateGroup:    row.date_group || 'Today',
    time:         row.time,
    tag:          row.tag,
    url:          row.url,
    fileName:     row.file_name,
    audioUrl:     row.audio_url,
    imageUrl:     row.image_url || (row.type === 'image' ? row.url : null),
    archived:     row.archived,
    sourceIds:    row.source_ids || [],
    duration:     row.duration,
    createdAt:    row.created_at,

    // ── New rich-content fields ──────────────────────────────────
    body:               row.body          || null,
    summary:            row.summary       || null,

    // Source provenance
    sourceUrl:          row.source_url    || null,
    sourceDomain:       row.source_domain || null,
    sourceTitle:        row.source_title  || null,
    author:             row.author        || null,
    publishedAt:        row.published_at  || null,

    // Media
    thumbnailUrl:       row.thumbnail_url || null,
    fileUrl:            row.file_url      || null,
    videoUrl:           row.video_url     || null,

    // Extracted text
    plainText:          row.plain_text        || null,
    ocrText:            row.ocr_text          || null,
    visualDescription:  row.visual_description|| null,

    // Tagging
    tags:               row.tags              || [],
    aiTags:             row.ai_tags           || [],
    userTags:           row.user_tags         || [],
    dominantColors:     row.dominant_colors   || [],

    // Discovery / surface flags
    isPinned:           row.is_pinned         ?? false,
    isTopOfMind:        row.is_top_of_mind    ?? false,
    topOfMindOrder:     row.top_of_mind_order || null,

    // Read tracking
    isRead:             row.is_read           ?? false,
    readAt:             row.read_at           || null,

    // Soft delete
    deletedAt:          row.deleted_at        || null,

    // Capture metadata
    captureSource:      row.capture_source    || 'web_app',
    processingStatus:   row.processing_status || 'completed',
    processingError:    row.processing_error  || null,
    metadata:           row.metadata          || {},
    extensionMetadata:  row.extension_metadata|| {},
    updatedAt:          row.updated_at        || null,
  };
}

/** Normalize a spaces table row to the shape the frontend expects */
function normalizeSpace(row) {
  return {
    id:          row.id,
    number:      row.number || '01',
    eyebrow:     row.eyebrow || 'Space',
    title:       row.name,
    text:        row.description || '',
    memoryIds:   (row.memory_ids  || []).map(String),
    reminderIds: (row.reminder_ids|| []).map(String),
    isSmart:     row.is_smart     || false,
    query:       row.query        || null,
    filters:     row.filters      || {},
    icon:        row.icon         || null,
    color:       row.color        || null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
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

function normalizeProfile(metadata, user) {
  const hasGoogleIdentity = user?.identities?.some((identity) => identity.provider === "google") ?? false;
  const hasGithubIdentity = user?.identities?.some((identity) => identity.provider === "github") ?? false;

  let googleConnected = false;
  if (metadata.googleConnected !== undefined) {
    googleConnected = Boolean(metadata.googleConnected);
  } else if (metadata.google_connected !== undefined) {
    googleConnected = Boolean(metadata.google_connected);
  } else {
    googleConnected = hasGoogleIdentity || user?.app_metadata?.provider === "google";
  }

  let githubConnected = false;
  if (metadata.githubConnected !== undefined) {
    githubConnected = Boolean(metadata.githubConnected);
  } else if (metadata.github_connected !== undefined) {
    githubConnected = Boolean(metadata.github_connected);
  } else {
    githubConnected = hasGithubIdentity || user?.app_metadata?.provider === "github";
  }

  return {
    name: metadata.name || user?.email?.split("@")[0] || "Recall User",
    bio: metadata.bio || "",
    theme: metadata.preferences?.theme || metadata.theme || "petrol",
    googleConnected,
    githubConnected,
    updatedAt: metadata.updated_at || new Date().toISOString()
  };
}

// ─── POST /api/account/link — Link external provider account ──────────────────
app.post('/api/account/link', async (req, res) => {
  try {
    const userId = await authenticateUser(req);
    const { provider } = req.body;
    if (!provider || !["google", "github"].includes(provider)) {
      return res.status(400).json({ error: "Invalid provider. Must be google or github." });
    }

    const key = provider === "google" ? "googleConnected" : "githubConnected";

    if (!supabaseAdmin) {
      const db = readDB();
      db.profile = db.profile || {};
      db.profile[key] = true;
      db.profile.updatedAt = new Date().toISOString();
      writeDB(db);
      console.log(`[Account] Linked ${provider} for local user`);
      return res.json({
        success: true,
        provider,
        connected: true,
        profile: db.profile
      });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    const currentMetadata = userData.user?.user_metadata || {};
    const nextMetadata = {
      ...currentMetadata,
      [key]: true,
      updated_at: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: nextMetadata
    });
    if (updateError) throw updateError;

    console.log(`[Account] Linked ${provider} for user ${userId}`);
    res.json({
      success: true,
      provider,
      connected: true,
      profile: normalizeProfile(updatedUser.user?.user_metadata || {}, updatedUser.user)
    });
  } catch (err) {
    console.error("Account link error:", err);
    res.status(500).json({ error: "Failed to link account" });
  }
});

// ─── POST /api/account/unlink — Unlink external provider account ──────────────
app.post('/api/account/unlink', async (req, res) => {
  try {
    const userId = await authenticateUser(req);
    const { provider } = req.body;
    if (!provider || !["google", "github"].includes(provider)) {
      return res.status(400).json({ error: "Invalid provider. Must be google or github." });
    }

    const key = provider === "google" ? "googleConnected" : "githubConnected";

    if (!supabaseAdmin) {
      const db = readDB();
      db.profile = db.profile || {};
      db.profile[key] = false;
      db.profile.updatedAt = new Date().toISOString();
      writeDB(db);
      console.log(`[Account] Unlinked ${provider} for local user`);
      return res.json({
        success: true,
        provider,
        connected: false,
        profile: db.profile
      });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    const currentMetadata = userData.user?.user_metadata || {};
    const nextMetadata = {
      ...currentMetadata,
      [key]: false,
      updated_at: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: nextMetadata
    });
    if (updateError) throw updateError;

    console.log(`[Account] Unlinked ${provider} for user ${userId}`);
    res.json({
      success: true,
      provider,
      connected: false,
      profile: normalizeProfile(updatedUser.user?.user_metadata || {}, updatedUser.user)
    });
  } catch (err) {
    console.error("Account unlink error:", err);
    res.status(500).json({ error: "Failed to unlink account" });
  }
});

// ─── POST /api/highlights — save a highlight ────────────────────────────────────
app.post('/api/highlights', async (req, res) => {
  const userId = await authenticateUser(req);
  const { memoryId, text, note, color } = req.body;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (!text || !memoryId) {
    return res.status(400).json({ success: false, error: 'text and memoryId required' });
  }

  if (!supabaseAdmin) {
    return res.json({ success: true, highlight: { id: crypto.randomUUID(), text, color: color || 'yellow' } });
  }

  try {
    const { data: highlight, error } = await supabaseAdmin
      .from('highlights')
      .insert([{ user_id: userId, memory_id: memoryId, text, note, color: color || 'yellow' }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, highlight });
  } catch (err) {
    console.error("Error saving highlight:", err);
    res.status(500).json({ success: false, error: "Failed to save highlight" });
  }
});

// ─── GET /api/memories/:id/highlights — get highlights for a memory ─────────────
app.get('/api/memories/:id/highlights', async (req, res) => {
  const userId = await authenticateUser(req);
  const { id } = req.params;

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!supabaseAdmin) {
    return res.json({ success: true, highlights: [] });
  }

  try {
    const { data: highlights, error } = await supabaseAdmin
      .from('highlights')
      .select('*')
      .eq('memory_id', id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, highlights });
  } catch (err) {
    console.error("Error fetching highlights:", err);
    res.status(500).json({ success: false, error: "Failed to fetch highlights" });
  }
});

// ─── Weekly Highlights & Web Push Notifications Integration ────────────────────

// Resend Email Client
let resendClient = null;
const resendApiKey = process.env.RESEND_API_KEY;
if (resendApiKey && resendApiKey.trim() !== '') {
  try {
    const { Resend } = require("resend");
    resendClient = new Resend(resendApiKey);
    console.log("Resend email client initialized.");
  } catch (error) {
    console.error("Failed to initialize Resend client:", error);
  }
}

// Web Push Configuration
const webpush = require("web-push");
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Generate fresh VAPID keys if not provided in environment
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey
    };
    console.log("Generated fresh VAPID keys:", vapidKeys);
  } catch (err) {
    console.error("Failed to generate VAPID keys:", err);
  }
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:explore@recall.ai',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    console.log("Web Push VAPID details set successfully.");
  } catch (err) {
    console.error("Failed to set VAPID details:", err);
  }
}

let pushSubscriptions = [];
const notifiedReminderIds = new Set();

function saveSubscriptions() {
  if (!supabaseAdmin) {
    const db = readDB();
    db.pushSubscriptions = pushSubscriptions;
    writeDB(db);
  }
}

// Load subscriptions initially from db.json if running in local mode
try {
  const db = readDB();
  if (db.pushSubscriptions) {
    pushSubscriptions = db.pushSubscriptions;
  }
} catch {}

async function generateWeeklyDigest(memories) {
  if (!genAI) {
    // Return a mocked/simulated AI response
    return {
      themes: ["Product Launch Strategy", "Tech & Privacy competitive scan"],
      summary: "This week was focused heavily on laying the groundwork for the Recall private second-memory campaign, analyzing key differentiators, and designing visual tone guidelines.",
      keyTakeaways: [
        "Privacy is positioned as control, not secrecy, across early brand messaging.",
        "A competitive sweep of 12 AI tools highlighted opportunities around local storage and explicit AI usage disclosure."
      ]
    };
  }
  try {
    const memoriesText = memories.map(m => `- [${m.type}] ${m.title || m.excerpt}`).join("\n");
    const prompt = `You are the AI engine for Recall, a private second-memory app.
Analyze the following list of memories captured by the user over the past week:
${memoriesText}

Provide a JSON response (no markdown, no backticks):
{
  "themes": ["Theme 1", "Theme 2"],
  "summary": "A cohesive 2-3 sentence overview of what the user focused on this week.",
  "keyTakeaways": ["Key point/insight 1", "Key point/insight 2"]
}`;
    const raw = await generateContentWithFallback(prompt);
    return parseJSONResponse(raw);
  } catch (err) {
    console.error("Gemini weekly digest error:", err);
    return {
      themes: ["Active explorations"],
      summary: "An overview of your visual library and captured ideas from this week.",
      keyTakeaways: ["Your memories are safely stored and synced to your private space."]
    };
  }
}

// ─── POST /api/cron/weekly-highlights — compile and email highlights ─────────────
app.post('/api/cron/weekly-highlights', async (req, res) => {
  const userId = await authenticateUser(req);
  const isTest = req.query.test === 'true';

  if (supabaseAdmin && !userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  let memories = [];
  let userEmail = 'explore@recall.ai';
  let emailHighlights = true;

  if (!supabaseAdmin) {
    const db = readDB();
    memories = db.memories || [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    memories = memories.filter(m => !m.archived && new Date(m.created_at || m.date || Date.now()).getTime() > sevenDaysAgo);
  } else {
    try {
      const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [memoriesRes, userRes] = await Promise.all([
        supabaseAdmin.from('memories').select('*').eq('user_id', userId).eq('archived', false).gt('created_at', sevenDaysAgoIso),
        supabaseAdmin.auth.admin.getUserById(userId)
      ]);
      memories = memoriesRes.data || [];
      const user = userRes.data?.user;
      userEmail = user?.email || 'explore@recall.ai';
      const metadata = user?.user_metadata || {};
      const prefs = metadata.preferences || {};
      emailHighlights = prefs.emailHighlights ?? false;
    } catch (err) {
      console.error("Error loading highlights data from Supabase:", err);
      return res.status(500).json({ success: false, error: "Failed to load digest data" });
    }
  }

  if (!isTest && !emailHighlights) {
    return res.json({ success: true, message: "Weekly highlights disabled for this user" });
  }

  const digest = await generateWeeklyDigest(memories);

  if (resendClient) {
    try {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(21,63,64,0.1); border-radius: 12px;">
          <h2 style="color: #083c3e; margin-bottom: 8px;">Your Recall Highlights</h2>
          <p style="color: #666; font-size: 14px;">Here is what you focused on this week.</p>
          <hr style="border: 0; border-top: 1px solid rgba(21,63,64,0.1); margin: 20px 0;" />
          
          <h3 style="color: #083c3e;">Themes Explored</h3>
          <ul style="padding-left: 20px; color: #333;">
            ${digest.themes.map(t => `<li style="margin-bottom: 6px;"><strong>${t}</strong></li>`).join("")}
          </ul>
          
          <h3 style="color: #083c3e;">Weekly Summary</h3>
          <p style="color: #333; line-height: 1.6; background: rgba(174,197,185,0.1); padding: 12px; border-radius: 8px;">${digest.summary}</p>
          
          <h3 style="color: #083c3e;">Key Takeaways</h3>
          <ul style="padding-left: 20px; color: #333;">
            ${digest.keyTakeaways.map(k => `<li style="margin-bottom: 6px; line-height: 1.4;">${k}</li>`).join("")}
          </ul>
          
          <hr style="border: 0; border-top: 1px solid rgba(21,63,64,0.1); margin: 20px 0;" />
          <p style="color: #888; font-size: 11px; text-align: center;">You received this because you enabled Weekly Email Highlights in Recall.</p>
        </div>
      `;

      const response = await resendClient.emails.send({
        from: 'Recall <digest@recall.ai>',
        to: userEmail,
        subject: `Recall digest: ${digest.themes[0] || 'Weekly Highlights'}`,
        html: htmlContent,
      });

      return res.json({ success: true, simulated: false, digest });
    } catch (err) {
      console.error("Resend delivery error:", err);
      return res.status(500).json({ success: false, error: "Failed to deliver email via Resend" });
    }
  } else {
    console.log(`[Simulated Email] To: ${userEmail} | Subject: Recall Weekly digest | Summary: ${digest.summary}`);
    return res.json({ success: true, simulated: true, digest });
  }
});

// ─── GET /api/notifications/vapid-public-key ──────────────────────────────
app.get('/api/notifications/vapid-public-key', (req, res) => {
  if (!vapidKeys.publicKey) {
    return res.status(500).json({ success: false, error: 'Web Push not configured' });
  }
  res.json({ success: true, publicKey: vapidKeys.publicKey });
});

// ─── POST /api/notifications/subscribe ────────────────────────────────────
app.post('/api/notifications/subscribe', async (req, res) => {
  const userId = await authenticateUser(req);
  const { subscription } = req.body;
  
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, error: 'Subscription data required' });
  }

  const exists = pushSubscriptions.some(s => s.subscription.endpoint === subscription.endpoint);
  if (!exists) {
    pushSubscriptions.push({ userId: userId || 'local-user', subscription });
    saveSubscriptions();
    console.log(`Subscribed new client to Web Push. Endpoint: ${subscription.endpoint.slice(0, 45)}...`);
  }

  res.json({ success: true });
});

// Background loop for reminder notifications (runs every 10 seconds for instant testing feedback)
setInterval(async () => {
  try {
    let reminders = [];
    if (!supabaseAdmin) {
      const db = readDB();
      reminders = db.reminders || [];
    } else {
      const { data } = await supabaseAdmin
        .from('reminders')
        .select('*')
        .eq('done', false);
      reminders = data || [];
    }

    const now = new Date();
    const dueReminders = reminders.filter(r => {
      if (r.done) return false;
      const reminderDue = r.due;
      const reminderTime = r.time;
      if (!reminderDue) return false;

      const dueDateTime = new Date(`${reminderDue}T${reminderTime || '00:00'}:00`);
      const isDue = dueDateTime <= now;
      const alreadyNotified = notifiedReminderIds.has(r.id);
      
      return isDue && !alreadyNotified;
    });

    for (const r of dueReminders) {
      notifiedReminderIds.add(r.id);
      console.log(`[Web Push] Reminder due: "${r.title || 'Notification'}"`);
      
      const payload = JSON.stringify({
        title: 'Recall Reminder',
        body: r.title || 'You have an active reminder.',
        url: '/reminders'
      });

      const userSubs = pushSubscriptions.filter(s => !r.user_id || s.userId === r.user_id || s.userId === 'local-user');
      
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(sub.subscription, payload);
        } catch (err) {
          console.warn('Failed to send push notification:', err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            pushSubscriptions = pushSubscriptions.filter(s => s.subscription.endpoint !== sub.subscription.endpoint);
            saveSubscriptions();
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in reminder notification scanner:', err);
  }
}, 10000);

// ─── Start server with Vite middleware (dev) or static serving (prod) ─────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware mounted.");
    } catch (err) {
      console.error("Failed to mount Vite middleware:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Recall server running on http://0.0.0.0:${PORT}`);
    if (supabaseAdmin) {
      console.log("Mode: Supabase (cloud database + auth)");
    } else {
      console.log("Mode: Local fallback (db.json)");
    }
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
