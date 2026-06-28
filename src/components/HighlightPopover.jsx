import { motion } from "motion/react";
import { HighlighterCircle } from "@phosphor-icons/react";

export function HighlightPopover({ position, onHighlight }) {
  if (!position) return null;

  return (
    <motion.div
      className="highlight-popover"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      style={{
        position: 'fixed',
        top: position.top - 48,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <button 
        className="highlight-action-btn"
        onMouseDown={(e) => {
          e.preventDefault(); // prevent selection clear
          onHighlight();
        }}
      >
        <HighlighterCircle weight="fill" size={20} color="var(--yellow)" />
        Highlight
      </button>
    </motion.div>
  );
}
