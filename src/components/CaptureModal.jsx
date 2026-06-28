import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bell, FileArrowUp, FileText, FilePdf, Image, Link,
  Microphone, Quotes, Sparkle, Stop, VideoCamera, X,
  CheckSquare, Highlighter, Article,
} from "@phosphor-icons/react";
import { supabase } from "../lib/supabase.js";
import { toYYYYMMDD, toHHMM, formatDue, formatTime } from "../lib/dateUtils.js";
import { DatePicker, TimePicker } from "./CustomPickers.jsx";

const TYPES = [
  { id: "note",       label: "Note",        icon: FileText,    group: "write" },
  { id: "link",       label: "Link",         icon: Link,        group: "save" },
  { id: "article",    label: "Article",      icon: Article,     group: "save" },
  { id: "image",      label: "Image",        icon: Image,       group: "save" },
  { id: "screenshot", label: "Screenshot",   icon: Image,       group: "save" },
  { id: "pdf",        label: "PDF / File",   icon: FilePdf,     group: "save" },
  { id: "video",      label: "Video",        icon: VideoCamera, group: "save" },
  { id: "quote",      label: "Quote",        icon: Quotes,      group: "write" },
  { id: "highlight",  label: "Highlight",    icon: Highlighter, group: "write" },
  { id: "todo",       label: "To-do",        icon: CheckSquare, group: "write" },
  { id: "voice",      label: "Voice",        icon: Microphone,  group: "record" },
  { id: "reminder",   label: "Reminder",     icon: Bell,        group: "action" },
];

const URL_RE = /^https?:\/\//i;

// Types that use the drop-zone for file upload
const FILE_TYPES = new Set(["image", "screenshot", "pdf"]);
// Types that accept a URL field
const LINK_TYPES = new Set(["link", "article", "video"]);
// Types that use a plain textarea
const TEXT_TYPES = new Set(["note", "quote", "highlight", "todo"]);

function detectType(raw) {
  if (!raw) return null;
  const t = raw.trim();
  if (URL_RE.test(t)) {
    const lc = t.toLowerCase();
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(t)) return "video";
    // default for any URL is "link"; user can switch to "article"
    return "link";
  }
  return "note";
}

export function CaptureModal({ onClose, onSave }) {
  const [type, setType]           = useState("note");
  const [text, setText]           = useState("");
  const [title, setTitle]         = useState("");
  const [file, setFile]           = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl]   = useState("");
  const [elapsed, setElapsed]     = useState(0);
  const [due, setDue]             = useState(toYYYYMMDD("Today"));
  const [time, setTime]           = useState(toHHMM("9:00 AM"));
  const [processing, setProcessing] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [error, setError]         = useState("");
  const [activeGroup, setActiveGroup] = useState("write");

  const recorderRef = useRef(null);
  const streamRef   = useRef(null);
  const chunksRef   = useRef([]);
  const metaTimerRef = useRef(null);

  // Recording timer
  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setElapsed(v => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  // Cleanup blob URLs on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const changeType = (nextType) => {
    if (recording) recorderRef.current?.stop();
    setType(nextType);
    setError("");
    setActiveGroup(TYPES.find(t => t.id === nextType)?.group || "write");
  };

  // Auto-detect type from pasted text
  const handleTextChange = (val) => {
    setText(val);
    setError("");
    const detected = detectType(val);
    if (detected && (type === "note" || LINK_TYPES.has(type))) {
      setType(detected);
      setActiveGroup(TYPES.find(t => t.id === detected)?.group || "write");
    }
  };

  // Debounced URL metadata fetch
  const handleUrlChange = (val) => {
    setText(val);
    setError("");
    if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
    if (!URL_RE.test(val.trim())) return;
    metaTimerRef.current = setTimeout(async () => {
      try {
        setFetchingMeta(true);
        const res = await fetch("/api/metadata/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: val.trim() }),
        });
        const data = await res.json();
        if (data.success && data.metadata) {
          const m = data.metadata;
          if (m.title && !title) setTitle(m.title);
        }
      } catch { /* silent */ } finally {
        setFetchingMeta(false);
      }
    }, 900);
  };

  // ── Voice recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Browser recording unavailable. Upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current  = stream;
      recorderRef.current = recorder;
      chunksRef.current  = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
      };
      recorder.start();
      setElapsed(0);
      setRecording(true);
    } catch {
      setError("Microphone access denied. Choose Upload to add an existing recording.");
    }
  };

  const stopRecording = () =>
    recorderRef.current?.state === "recording" && recorderRef.current.stop();

  const formattedElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  // ── Validation ───────────────────────────────────────────────────────────────
  const isFileType  = FILE_TYPES.has(type);
  const isLinkType  = LINK_TYPES.has(type);
  const isTextType  = TEXT_TYPES.has(type);
  const isVoice     = type === "voice";
  const isReminder  = type === "reminder";

  const validUrl = !isLinkType || URL_RE.test(text.trim());
  const canSave  = isFileType
    ? !!file
    : isVoice
    ? !!audioUrl
    : !!text.trim() && validUrl;

  // ── File upload helper ───────────────────────────────────────────────────────
  const uploadFile = async (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch("/api/upload", {
            method: "POST",
            headers,
            body: JSON.stringify({
              fileName: fileObj.name,
              fileType: fileObj.type,
              base64Data: reader.result.split(",")[1],
            }),
          });
          const data = await res.json();
          if (data.success && data.url) resolve(data.url);
          else reject(new Error(data.error || "Upload failed"));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileObj);
    });
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!canSave) {
      setError(
        isLinkType  ? "Paste a complete URL starting with http:// or https://." :
        isFileType  ? "Choose a file to upload." :
        "Add some content before saving."
      );
      return;
    }
    setProcessing(true);
    const cleanText = text.trim();

    // Build a title if none provided
    const autoTitle =
      isLinkType  ? (() => { try { return new URL(cleanText).hostname.replace("www.", ""); } catch { return cleanText.slice(0, 64); } })() :
      isFileType  ? (file?.name || "Uploaded file") :
      isVoice     ? "Recorded thought" :
      type === "quote" ? `"${cleanText.slice(0, 60)}…"` :
      type === "todo"  ? cleanText.split(/\n/)[0].slice(0, 64) :
      cleanText.split(/\n|\.|:/)[0].slice(0, 64);

    const memoryTitle = title.trim() || autoTitle;

    let finalImageUrl = undefined;
    let finalAudioUrl = audioUrl;
    let finalFileUrl  = undefined;

    try {
      if (isFileType && file) {
        const uploadedUrl = await uploadFile(file);
        if (type === "pdf") finalFileUrl  = uploadedUrl;
        else                finalImageUrl = uploadedUrl;
      } else if (isVoice && audioUrl) {
        const blob = await fetch(audioUrl).then(r => r.blob());
        const audioFile = new File([blob], `voice-${Date.now()}.wav`, { type: blob.type || "audio/wav" });
        finalAudioUrl = await uploadFile(audioFile);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("File upload failed. Please try again.");
      setProcessing(false);
      return;
    }

    // Build excerpt
    const excerpt =
      isLinkType  ? `Saved from ${(() => { try { return new URL(cleanText).hostname; } catch { return cleanText; } })()}` :
      isFileType  ? `Uploaded ${file?.name} · ${Math.max(1, Math.round((file?.size || 0) / 1024))} KB` :
      isVoice     ? `Recorded voice note · ${formattedElapsed}` :
      type === "quote" ? cleanText :
      type === "todo"  ? cleanText :
      cleanText;

    // Determine capture source label
    const captureSource = "web_app";

    window.setTimeout(() => onSave({
      type:          isReminder ? "note" : type,
      title:         memoryTitle,
      excerpt,
      url:           isLinkType ? cleanText : undefined,
      fileName:      file?.name,
      audioUrl:      finalAudioUrl || undefined,
      imageUrl:      finalImageUrl,
      fileUrl:       finalFileUrl,
      captureSource,
      processingStatus: (isLinkType || isFileType) ? "pending" : "completed",
      reminder: isReminder
        ? { title: cleanText, due: formatDue(due), time: formatTime(time) }
        : undefined,
    }), 780);
  };

  const groups = [...new Set(TYPES.map(t => t.group))];
  const visibleTypes = TYPES.filter(t => t.group === activeGroup);

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.section
        className="modal capture-modal"
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
      >
        <header>
          <div>
            <span>Quick capture</span>
            <h2 id="capture-title">What should come back later?</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close capture"><X /></button>
        </header>

        {/* Group tabs */}
        <div className="capture-group-tabs">
          {groups.map(g => (
            <button
              key={g}
              className={activeGroup === g ? "is-active" : ""}
              onClick={() => { setActiveGroup(g); setType(TYPES.find(t => t.group === g)?.id || "note"); setError(""); }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>

        {/* Type chips */}
        <div className="capture-types">
          {visibleTypes.map(({ id, label, icon: Icon }) => (
            <button
              className={type === id ? "is-active" : ""}
              key={id}
              onClick={() => changeType(id)}
            >
              <Icon weight="duotone" />
              {label}
            </button>
          ))}
        </div>

        <div className="capture-fields">
          {/* Text / URL input */}
          {(isTextType || isLinkType || isReminder) && (
            <label className="capture-main-field">
              {isLinkType  ? (type === "video" ? "Video URL" : "Web address") :
               isReminder  ? "What should we remind you about?" :
               type === "quote" ? "The quote" :
               type === "highlight" ? "Highlighted text" :
               type === "todo"   ? "What needs to be done?" :
               "Your thought"}
              {type === "note" ? (
                <textarea
                  autoFocus
                  placeholder="Write without organizing…"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              ) : (
                <input
                  autoFocus
                  type={isLinkType ? "url" : "text"}
                  placeholder={
                    isLinkType   ? "https://example.com/article" :
                    isReminder   ? "Follow up on the launch narrative" :
                    type === "quote" ? "The exact words you want to remember" :
                    type === "highlight" ? "Selected text from article or document" :
                    "Next action item"
                  }
                  value={text}
                  onChange={(e) => isLinkType ? handleUrlChange(e.target.value) : handleTextChange(e.target.value)}
                />
              )}
              {fetchingMeta && (
                <span className="capture-meta-loading">
                  <Sparkle weight="fill" /> Fetching page info…
                </span>
              )}
            </label>
          )}

          {/* File drop-zone */}
          {isFileType && (
            <label
              className={file ? "drop-zone has-file" : "drop-zone"}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0] ?? null); }}
            >
              <input
                type="file"
                accept={type === "pdf" ? ".pdf,.doc,.docx,.txt,.md" : "image/*"}
                onChange={(e) => setFile(e.target.files[0] ?? null)}
              />
              <FileArrowUp weight="duotone" />
              <strong>{file ? file.name : type === "pdf" ? "Drop a PDF or document" : "Drop an image or screenshot"}</strong>
              <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB · Ready to save` : "or click to choose a file"}</span>
            </label>
          )}

          {/* Voice recorder */}
          {isVoice && (
            <div className={recording ? "recorder is-recording" : "recorder"}>
              <button onClick={recording ? stopRecording : startRecording}>
                {recording ? <Stop weight="fill" /> : <Microphone weight="fill" />}
              </button>
              <div>
                <strong>{recording ? `Recording ${formattedElapsed}` : audioUrl ? "Recording ready" : "Ready to record"}</strong>
                <span>{recording ? "Tap stop when the thought is complete." : audioUrl ? "Listen back before saving." : "Your browser will ask for microphone access."}</span>
              </div>
              <div className="wave-bars" aria-hidden="true">
                {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
              </div>
              {audioUrl ? <audio controls src={audioUrl} /> : null}
            </div>
          )}

          {/* Reminder time pickers */}
          {isReminder && (
            <div className="reminder-fields">
              <label style={{ position: "relative", overflow: "visible" }}>
                When
                <DatePicker value={due} onChange={setDue} />
              </label>
              <label>
                Time
                <TimePicker value={time} onChange={setTime} />
              </label>
            </div>
          )}

          {/* Optional title */}
          {!isReminder && (
            <label className="optional-title">
              Title <span>optional</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recall can create one for you"
              />
            </label>
          )}
        </div>

        {error ? <p className="capture-error" role="alert">{error}</p> : null}

        <div className="capture-insight">
          <Sparkle weight="fill" />
          <span><strong>Recall will organize this.</strong> It will suggest a title, summary, related memories, and any useful next step.</span>
        </div>

        <footer>
          <span>{processing ? "Understanding your capture…" : (isLinkType || isFileType) ? "Recall will process this after saving" : "Saved to your space"}</span>
          <button className="primary-button" onClick={save} disabled={processing}>
            {processing ? "Organizing…" : isReminder ? "Create reminder" : "Save memory"}
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
