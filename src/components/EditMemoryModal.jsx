import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "@phosphor-icons/react";

export function EditMemoryModal({ memory, onClose, onSave }) {
  const [title, setTitle] = useState(memory.title || "");
  const [excerpt, setExcerpt] = useState(memory.excerpt || "");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    setProcessing(true);
    await onSave(memory.id, { title: title.trim(), excerpt: excerpt.trim() });
    setProcessing(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal capture-modal"
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
            <button className="icon-button" type="button" onClick={onClose}><X /></button>
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
    </AnimatePresence>
  );
}
