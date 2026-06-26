import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bell, FileArrowUp, FileText, Image, Link, Microphone, Sparkle, Stop, X } from "@phosphor-icons/react";

const types = [
  { id: "note", label: "Note", icon: FileText },
  { id: "link", label: "Link", icon: Link },
  { id: "image", label: "Upload", icon: Image },
  { id: "voice", label: "Voice", icon: Microphone },
  { id: "reminder", label: "Reminder", icon: Bell },
];

export function CaptureModal({ onClose, onSave }) {
  const [type, setType] = useState("note");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [due, setDue] = useState("Today");
  const [time, setTime] = useState("9:00 AM");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const changeType = (nextType) => {
    if (recording) recorderRef.current?.stop();
    setType(nextType);
    setError("");
  };

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Browser recording is unavailable here. You can still upload an audio file.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.start();
      setElapsed(0);
      setRecording(true);
    } catch {
      setError("Microphone access was not granted. Choose Upload to add an existing recording instead.");
    }
  };

  const stopRecording = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const formattedElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const validUrl = type !== "link" || /^https?:\/\//i.test(text.trim());
  const canSave = type === "image" ? !!file : type === "voice" ? !!audioUrl : !!text.trim() && validUrl;

  const uploadFile = async (fileObject) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: fileObject.name,
              fileType: fileObject.type,
              base64Data
            })
          });
          const data = await res.json();
          if (data.success && data.url) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || "Upload failed"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileObject);
    });
  };

  const save = async () => {
    if (!canSave) {
      setError(type === "link" ? "Paste a complete link beginning with http:// or https://." : "Add something before saving this memory.");
      return;
    }
    setProcessing(true);
    const cleanText = text.trim();
    const memoryTitle = title.trim() || (type === "link" ? new URL(cleanText).hostname.replace("www.", "") : type === "image" ? file.name : type === "voice" ? "Recorded thought" : cleanText.split(/\n|\.|:/)[0].slice(0, 64));

    let finalImageUrl = undefined;
    let finalAudioUrl = audioUrl;

    try {
      if (type === "image" && file) {
        finalImageUrl = await uploadFile(file);
      } else if (type === "voice" && audioUrl) {
        const blob = await fetch(audioUrl).then((r) => r.blob());
        const audioFile = new File([blob], `voice-recording-${Date.now()}.wav`, { type: blob.type || "audio/wav" });
        finalAudioUrl = await uploadFile(audioFile);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload the file to server.");
      setProcessing(false);
      return;
    }

    window.setTimeout(() => onSave({
      type: type === "reminder" ? "note" : type,
      title: memoryTitle,
      excerpt: type === "link" ? `Saved link from ${new URL(cleanText).hostname}` : type === "image" ? `Uploaded ${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : type === "voice" ? `Recorded voice note · ${formattedElapsed}` : cleanText.slice(0, 140),
      url: type === "link" ? cleanText : undefined,
      fileName: file?.name,
      audioUrl: finalAudioUrl,
      imageUrl: finalImageUrl,
      reminder: type === "reminder" ? { title: cleanText, due, time } : undefined,
    }), 780);
  };

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
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
        <div className="capture-types">
          {types.map(({ id, label, icon: Icon }) => (
            <button className={type === id ? "is-active" : ""} key={id} onClick={() => changeType(id)}>
              <Icon weight="duotone" />
              {label}
            </button>
          ))}
        </div>
        <div className="capture-fields">
          {type !== "voice" && type !== "image" ? (
            <label className="capture-main-field">
              {type === "link" ? "Web address" : type === "reminder" ? "What should we remind you about?" : "Your thought"}
              {type === "note" ? (
                <textarea autoFocus placeholder="Write without organizing…" value={text} onChange={(event) => setText(event.target.value)} />
              ) : (
                <input autoFocus type={type === "link" ? "url" : "text"} placeholder={type === "link" ? "https://example.com/article" : "Follow up on the launch narrative"} value={text} onChange={(event) => { setText(event.target.value); setError(""); }} />
              )}
            </label>
          ) : null}
          {type === "image" ? (
            <label className={file ? "drop-zone has-file" : "drop-zone"} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFile(event.dataTransfer.files[0] ?? null); }}>
              <input type="file" accept="image/*,.pdf,.txt,.md" onChange={(event) => setFile(event.target.files[0] ?? null)} />
              <FileArrowUp weight="duotone" />
              <strong>{file ? file.name : "Drop a file here"}</strong>
              <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB · Ready to save` : "or click to choose an image, PDF, or document"}</span>
            </label>
          ) : null}
          {type === "voice" ? (
            <div className={recording ? "recorder is-recording" : "recorder"}>
              <button onClick={recording ? stopRecording : startRecording}>
                {recording ? <Stop weight="fill" /> : <Microphone weight="fill" />}
              </button>
              <div>
                <strong>{recording ? `Recording ${formattedElapsed}` : audioUrl ? "Recording ready" : "Ready to record"}</strong>
                <span>{recording ? "Tap stop when the thought is complete." : audioUrl ? "Listen back before saving." : "Your browser will ask for microphone access."}</span>
              </div>
              <div className="wave-bars" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
              </div>
              {audioUrl ? <audio controls src={audioUrl} /> : null}
            </div>
          ) : null}
          {type === "reminder" ? (
            <div className="reminder-fields">
              <label>
                When
                <select value={due} onChange={(event) => setDue(event.target.value)}>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>Next week</option>
                </select>
              </label>
              <label>
                Time
                <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="9:00 AM" />
              </label>
            </div>
          ) : null}
          {type !== "reminder" ? (
            <label className="optional-title">
              Title <span>optional</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Recall can create one for you" />
            </label>
          ) : null}
        </div>
        {error ? <p className="capture-error" role="alert">{error}</p> : null}
        <div className="capture-insight">
          <Sparkle weight="fill" />
          <span><strong>Recall will organize this.</strong> It will suggest a title, summary, related memories, and any useful next step.</span>
        </div>
        <footer>
          <span>{processing ? "Understanding your capture…" : "Saved locally in this browser"}</span>
          <button className="primary-button" onClick={save} disabled={processing}>
            {processing ? "Organizing…" : type === "reminder" ? "Create reminder" : "Save memory"}
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
