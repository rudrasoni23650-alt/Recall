import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { toYYYYMMDD, toHHMM, formatDue, formatTime } from "../lib/dateUtils.js";
import { DatePicker, TimePicker } from "./CustomPickers.jsx";

export function EditReminderModal({ reminder, onClose, onSave }) {
  const [title, setTitle] = useState(reminder.title || "");
  const [due, setDue] = useState(toYYYYMMDD(reminder.due || "Today"));
  const [time, setTime] = useState(toHHMM(reminder.time || "9:00 AM"));
  const [processing, setProcessing] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    setProcessing(true);
    onSave(reminder.id, {
      title: title.trim(),
      due: formatDue(due),
      time: formatTime(time)
    });
  };

  return (
    <AnimatePresence>
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
          style={{
            width: "100%",
            maxWidth: "460px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Edit Reminder</span>
              <h2 id="capture-title" style={{ font: "400 24px var(--display)", margin: "8px 0 0", color: "var(--ink)" }}>Adjust details</h2>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close edit"><X /></button>
          </header>

          <div className="capture-fields" style={{ display: "grid", gap: "16px" }}>
            <label className="capture-main-field" style={{ display: "grid", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
              What should we remind you about?
              <input
                autoFocus
                type="text"
                placeholder="Next action item"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "42px",
                  border: "1px solid var(--line)",
                  background: "var(--canvas)",
                  padding: "0 12px",
                  borderRadius: "6px",
                  color: "var(--ink)",
                  fontSize: "13px"
                }}
              />
            </label>

            <div className="reminder-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "var(--muted)", position: "relative", overflow: "visible" }}>
                <span>When</span>
                <DatePicker value={due} onChange={setDue} />
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "var(--muted)", position: "relative", overflow: "visible" }}>
                <span>Time</span>
                <TimePicker value={time} onChange={setTime} />
              </label>
            </div>
          </div>

          <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{ color: "var(--muted)", fontSize: "11px" }}>Keep your agenda up to date</span>
            <button 
              className="primary-button" 
              onClick={handleSave} 
              disabled={processing || !title.trim()}
              style={{ padding: "8px 16px", height: "auto", minHeight: "auto" }}
            >
              {processing ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
