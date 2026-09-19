import { useState, useRef, useEffect } from "react";
import { ArrowUp, FileText, Microphone, Sparkle, Stop, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase.js";

export function AskPanel({ memories, onSelectMemory, onClose }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState([]); // Array of { sender: 'user'|'ai', text: string, sources?: Array }
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechFeedback, setSpeechFeedback] = useState("");
  const messagesEndRef = useRef(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef("");
  const timerIntervalRef = useRef(null);

  // Cleanup all audio resources on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (recorderRef.current && recorderRef.current.state === "recording") {
        try { recorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((track) => track.stop());
        } catch {}
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive or asking state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const transcribeRecordedBlob = async (blob, mimeType) => {
    setIsTranscribing(true);
    setSpeechFeedback("Transcribing audio with Gemini…");

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const rawResult = await base64Promise;
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: rawResult,
          mimeType: mimeType || "audio/webm",
        }),
      });

      const data = await res.json();
      if (data && data.transcript && data.transcript.trim()) {
        const cleanText = data.transcript.trim();
        setQuestion((prev) => {
          const base = prev ? prev.trim() + " " : "";
          return base + cleanText;
        });
        setSpeechFeedback("Voice transcribed");
        setTimeout(() => setSpeechFeedback(""), 2000);
      } else {
        setSpeechFeedback("Could not hear speech clearly. Tap to speak again.");
        setTimeout(() => setSpeechFeedback(""), 3500);
      }
    } catch (err) {
      console.warn("Transcribe request error:", err);
      setSpeechFeedback("Transcription service unavailable. Try typing below.");
      setTimeout(() => setSpeechFeedback(""), 3500);
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopListening = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const startListening = async () => {
    setSpeechFeedback("");
    liveTranscriptRef.current = "";
    chunksRef.current = [];

    // Check mediaDevices support
    if (!navigator.mediaDevices?.getUserMedia) {
      // Direct Web Speech fallback if MediaRecorder/getUserMedia unsupported
      startWebSpeechFallback();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const liveText = liveTranscriptRef.current.trim();

        // If Web Speech API already captured clean words, use it immediately
        if (liveText && liveText.length > 2) {
          setQuestion((prev) => {
            const base = prev ? prev.trim() + " " : "";
            return base + liveText;
          });
          setSpeechFeedback("Voice captured");
          setTimeout(() => setSpeechFeedback(""), 2000);
          return;
        }

        // If Web Speech was silent or blocked, run robust Gemini server transcription
        if (blob && blob.size > 200) {
          await transcribeRecordedBlob(blob, mimeType);
        } else {
          setSpeechFeedback("No speech heard. Tap microphone to try again.");
          setTimeout(() => setSpeechFeedback(""), 3500);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      setSpeechFeedback("Listening… speak your question");

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);

      // Attempt live SpeechRecognition in parallel for real-time visual feedback
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = navigator.language || "en-US";
          rec.onresult = (event) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            if (transcript.trim()) {
              liveTranscriptRef.current = transcript.trim();
              setSpeechFeedback(`“${transcript.trim()}”`);
            }
          };
          // Silently handle recognition notices so audio recording continues unaffected
          rec.onerror = (e) => {
            console.warn("Interim speech notice:", e.error);
          };
          rec.onend = () => {};
          rec.start();
          recognitionRef.current = rec;
        } catch {
          // Live preview unavailable, audio recorder will handle Gemini transcription
        }
      }
    } catch (err) {
      console.warn("Microphone access notice:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setSpeechFeedback("Microphone access blocked. Allow microphone in browser.");
      } else {
        startWebSpeechFallback();
      }
      setTimeout(() => setSpeechFeedback(""), 4000);
    }
  };

  const startWebSpeechFallback = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechFeedback("Voice input is not supported in this browser");
      setTimeout(() => setSpeechFeedback(""), 3500);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = navigator.language || "en-US";
      setIsRecording(true);
      setSpeechFeedback("Listening… speak now");

      rec.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        if (transcript.trim()) {
          setQuestion((prev) => (prev ? prev.trim() + " " : "") + transcript.trim());
          setSpeechFeedback(`“${transcript.trim()}”`);
        }
      };
      rec.onerror = (e) => {
        console.warn("Fallback recognition error:", e.error);
        if (e.error === "not-allowed") {
          setSpeechFeedback("Microphone permission denied");
        } else if (e.error === "no-speech") {
          setSpeechFeedback("No speech detected");
        } else {
          setSpeechFeedback("Microphone input error. Please check permissions.");
        }
        setIsRecording(false);
        setTimeout(() => setSpeechFeedback(""), 3500);
      };
      rec.onend = () => {
        setIsRecording(false);
        setTimeout(() => setSpeechFeedback(""), 2000);
      };
      rec.start();
      recognitionRef.current = rec;
    } catch {
      setSpeechFeedback("Microphone access failed");
      setIsRecording(false);
      setTimeout(() => setSpeechFeedback(""), 3500);
    }
  };

  const toggleVoiceRecording = () => {
    if (isTranscribing) return;
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formattedTime = `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`;

  const ask = () => {
    if (isRecording) {
      stopListening();
    }
    const queryText = question.trim();
    if (!queryText || asking) return;
    
    // Add user message to state
    const newMessages = [...messages, { sender: "user", text: queryText }];
    setMessages(newMessages);
    setQuestion("");
    setSpeechFeedback("");
    setAsking(true);
    
    supabase.auth.getSession().then(({ data: sessionData }) => fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
      },
      body: JSON.stringify({ question: queryText })
    }))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages([...newMessages, { sender: "ai", text: data.answer, sources: data.sources || [] }]);
        } else {
          setMessages([...newMessages, { sender: "ai", text: "I encountered an error querying your memories.", sources: [] }]);
        }
        setAsking(false);
      })
      .catch((err) => {
        console.error("Ask API error:", err);
        setMessages([...newMessages, { sender: "ai", text: "Connection failed. Please check your local server.", sources: [] }]);
        setAsking(false);
      });
  };

  const openSource = (memory) => {
    onClose();
    onSelectMemory(memory);
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3);
        const lines = content.split('\n');
        let language = '';
        let code = content;
        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
          language = lines[0];
          code = lines.slice(1).join('\n');
        }
        return (
          <pre key={index} className="code-block" data-language={language}>
            <code>{code}</code>
          </pre>
        );
      }
      
      const subParts = part.split(/(`[^`\n]+`)/g);
      return (
        <span key={index} style={{ whiteSpace: "pre-wrap" }}>
          {subParts.map((subPart, subIndex) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return <code key={subIndex} className="inline-code">{subPart.slice(1, -1)}</code>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div
      className="drawer-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.aside
        className="ask-panel"
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        role="dialog"
        aria-modal="true"
        aria-label="Ask Recall"
      >
        <header>
          <div>
            <Sparkle size={20} weight="fill" />
            <span>Ask Recall</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close Ask Recall">
            <X />
          </button>
        </header>
        <div className="ask-body">
          {messages.length === 0 ? (
            <div className="ask-empty">
              <Sparkle size={48} weight="duotone" />
              <h2>Ask what your memories know.</h2>
              <p>Try “What themes keep appearing in my launch research?”</p>
            </div>
          ) : (
            <div className="chat-container">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble chat-bubble--${msg.sender}`}>
                  {msg.sender === "ai" && <span className="bubble-label">Answer from your space</span>}
                  <div className="bubble-content">
                    {renderMessageText(msg.text)}
                  </div>
                  {msg.sources && msg.sources.length ? (
                    <div className="answer-sources">
                      <small>Referenced memories · select one to inspect</small>
                      <div className="sources-list">
                        {msg.sources.map((memory) => (
                          <button type="button" key={memory.id} onClick={() => openSource(memory)}>
                            <FileText /> {memory.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              
              {asking && (
                <div className="chat-bubble chat-bubble--ai ask-loading">
                  <Sparkle weight="fill" className="loading-sparkle" />
                  <div className="shimmer-line" />
                  <div className="shimmer-line shorter" />
                  <div className="shimmer-line" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="ask-form-wrapper">
          {(speechFeedback || isRecording || isTranscribing) && (
            <div className={`ask-speech-feedback ${isRecording ? "is-listening" : ""} ${isTranscribing ? "is-transcribing" : ""}`}>
              {isRecording && <span className="ask-speech-pulse" />}
              {isTranscribing && <span className="ask-speech-spinner" />}
              <span className="ask-speech-text">
                {speechFeedback || (isRecording ? `Listening… speak your question (${formattedTime})` : "")}
              </span>
              {isRecording && (
                <button
                  type="button"
                  className="ask-speech-stop-link"
                  onClick={stopListening}
                >
                  Done
                </button>
              )}
            </div>
          )}
          <form
            className="ask-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={
                isRecording
                  ? `Listening… speak your question (${formattedTime})`
                  : isTranscribing
                  ? "Transcribing your voice with Gemini…"
                  : "Ask about your memories…"
              }
              disabled={asking || isTranscribing}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask();
                }
              }}
            />
            <div className="ask-form-actions">
              <button
                type="button"
                className={`ask-speech-button ${isRecording ? "is-active" : ""} ${isTranscribing ? "is-transcribing" : ""}`}
                onClick={toggleVoiceRecording}
                disabled={asking || isTranscribing}
                title={
                  isTranscribing
                    ? "Transcribing voice with Gemini…"
                    : isRecording
                    ? `Recording (${formattedTime}) - click to finish & transcribe`
                    : "Speak your question (Voice speech-to-text)"
                }
                aria-label={isRecording ? "Stop voice recording" : "Speech to text"}
              >
                {isTranscribing ? (
                  <span className="ask-speech-spinner" />
                ) : isRecording ? (
                  <Stop weight="fill" />
                ) : (
                  <Microphone weight="regular" />
                )}
              </button>
              <button
                type="submit"
                className="ask-send-button"
                aria-label="Ask question"
                disabled={asking || isRecording || isTranscribing || !question.trim()}
              >
                <ArrowUp weight="bold" />
              </button>
            </div>
          </form>
        </div>
      </motion.aside>
    </motion.div>
  );
}
