import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, HighlighterCircle } from "@phosphor-icons/react";
import { HighlightPopover } from "./HighlightPopover.jsx";

export function ReadingMode({ memory, onClose, onSaveHighlight }) {
  const containerRef = useRef(null);
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const text = sel.toString().trim();
      
      if (text.length > 0 && containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
        setSelection({
          text,
          rect: {
            top: rect.top,
            left: rect.left + rect.width / 2,
          }
        });
      } else {
        setSelection(null);
      }
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const handleHighlight = () => {
    if (selection && selection.text) {
      onSaveHighlight({ text: selection.text });
      window.getSelection().removeAllRanges();
      setSelection(null);
    }
  };

  const contentToRead = memory.body || memory.plain_text || memory.excerpt || "No readable content available.";

  return (
    <motion.div
      className="reading-mode-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <header className="reading-mode-header">
        <button className="icon-button" onClick={onClose} aria-label="Exit reading mode">
          <ArrowLeft weight="bold" /> Back
        </button>
        <span className="reading-mode-domain">{memory.sourceDomain || memory.type}</span>
        <div style={{ width: 40 }} /> {/* spacer */}
      </header>

      <main className="reading-mode-content prose" ref={containerRef}>
        <h1>{memory.title}</h1>
        {memory.author && <p className="author-byline">By {memory.author}</p>}
        
        <div className="article-body">
          {contentToRead.split("\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </main>

      {selection && (
        <HighlightPopover 
          position={selection.rect} 
          onHighlight={handleHighlight} 
        />
      )}
    </motion.div>
  );
}
