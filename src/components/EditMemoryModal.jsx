import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { X, CalendarBlank, Clock } from "@phosphor-icons/react";
import { formatMemoryDateGroup, formatMemoryTime, toYYYYMMDD, toHHMM, getMemoryDateTime } from "../lib/dateUtils";

export function EditMemoryModal({ memory, onClose, onSave }) {
  const { dateGroup: initDateGroup, time: initTime } = getMemoryDateTime(memory);
  const [title, setTitle] = useState(memory.title || "");
  const [excerpt, setExcerpt] = useState(memory.excerpt || "");
  const [dateVal, setDateVal] = useState(() => {
    const ts = memory.createdAt || memory.created_at;
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return toYYYYMMDD(initDateGroup);
  });
  const [timeVal, setTimeVal] = useState(() => toHHMM(initTime || memory.time) || "09:00");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    setProcessing(true);
    let updatedCreatedAt = memory.createdAt || memory.created_at;
    let updatedTime = memory.time;
    let updatedDateGroup = memory.dateGroup;

    if (dateVal) {
      const timeStr = timeVal || "12:00";
      const composed = new Date(`${dateVal}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`);
      if (!isNaN(composed.getTime())) {
        updatedCreatedAt = composed.toISOString();
        updatedDateGroup = formatMemoryDateGroup(composed);
        updatedTime = formatMemoryTime(composed);
      }
    }

    await onSave(memory.id, {
      title: title.trim(),
      excerpt: excerpt.trim(),
      dateGroup: updatedDateGroup,
      time: updatedTime,
      createdAt: updatedCreatedAt,
      created_at: updatedCreatedAt,
    });
    setProcessing(false);
    onClose();
  };

  return (
    <motion.div
      key="edit-memory-overlay"
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="modal capture-modal"
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div style={{ flex: 1, marginRight: "16px" }}>
            <input 
              type="text" 
              placeholder="Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ 
                width: "100%", 
                border: "none", 
                background: "transparent", 
                font: "400 24px var(--display)", 
                margin: "0", 
                color: "var(--ink)", 
                outline: "none" 
              }}
            />
          </div>
          <button
            id="edit-memory-close-btn"
            className="icon-button"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            style={{
              flexShrink: 0,
              cursor: "pointer",
              position: "relative",
              zIndex: 10,
            }}
          >
            <X size={20} style={{ pointerEvents: "none" }} />
          </button>
        </header>

        <div className="capture-body">
          <textarea
            ref={inputRef}
            className="capture-textarea"
            placeholder="Edit your memory..."
            style={{ marginTop: "16px" }}
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            disabled={processing}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: "14px", padding: "10px 14px", background: "var(--surface-muted, rgba(0,0,0,0.03))", borderRadius: "10px", fontSize: "13px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarBlank size={16} style={{ color: "var(--ink-secondary)" }} />
              <span style={{ color: "var(--ink-secondary)", fontWeight: 500 }}>Date:</span>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                disabled={processing}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "13px",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} style={{ color: "var(--ink-secondary)" }} />
              <span style={{ color: "var(--ink-secondary)", fontWeight: 500 }}>Time:</span>
              <input
                type="time"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                disabled={processing}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "13px",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        <footer className="capture-footer">
          <div className="capture-footer-left"></div>
          <div className="capture-footer-right">
            <button 
              className="primary-button" 
              type="button"
              onClick={handleSave}
              disabled={processing}
            >
              {processing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
