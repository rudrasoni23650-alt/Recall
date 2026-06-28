import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { MemoryCard } from "../MemoryCard.jsx";

const ALL_STACKS = [
  { id: "all",        label: "All"         },
  { id: "pinned",     label: "Pinned"      },
  { id: "top",        label: "Top of Mind" },
  { id: "note",       label: "Notes"       },
  { id: "link",       label: "Links"       },
  { id: "article",    label: "Articles"    },
  { id: "image",      label: "Images"      },
  { id: "screenshot", label: "Screenshots" },
  { id: "pdf",        label: "PDFs"        },
  { id: "quote",      label: "Quotes"      },
  { id: "highlight",  label: "Highlights"  },
  { id: "todo",       label: "To-dos"      },
  { id: "voice",      label: "Voice"       },
  { id: "video",      label: "Videos"      },
];

function filterMemories(memories, stack) {
  if (stack === "all")     return memories;
  if (stack === "pinned")  return memories.filter(m => m.isPinned);
  if (stack === "top")     return memories.filter(m => m.isTopOfMind);
  return memories.filter(m => m.type === stack);
}

// Only show stacks that have at least one memory (or are "all")
function visibleStacks(memories) {
  return ALL_STACKS.filter(s => {
    if (s.id === "all") return true;
    return filterMemories(memories, s.id).length > 0;
  });
}

export function MemoriesPage({ memories, onCapture, onSelectMemory, onEditMemory, onDeleteMemoriesBulk, preferences }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeStack, setActiveStack] = useState("all");
  const stacks = useMemo(() => visibleStacks(memories), [memories]);
  const filtered = useMemo(() => filterMemories(memories, activeStack), [memories, activeStack]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onDeleteMemoriesBulk(Array.from(selectedIds));
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="subpage memories-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div>
          <span className="page-kicker">Your visual library</span>
          <h1>Memories</h1>
          <p>Everything you save, understood and easy to recognize at a glance.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isSelecting && memories.length > 0 && (
            <button 
              className="page-action-button" 
              type="button" 
              onClick={() => setIsSelecting(true)}
              style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(21, 63, 64, 0.1)' }}
            >
              Select
            </button>
          )}
          <button className="page-action-button" type="button" onClick={onCapture}>
            <Plus weight="bold" /> New memory
          </button>
        </div>
      </div>

      {memories.length ? (
        <section className="memory-board" aria-label="Memory library">
          <header className="memory-board-toolbar">
            <div className="memory-board-info">
              <span>Library</span>
              <strong>{filtered.length} {filtered.length === 1 ? "memory" : "memories"}</strong>
            </div>
            <div className="memory-filters memory-stacks" aria-label="Filter memories">
              {stacks.map(s => (
                <button
                  key={s.id}
                  className={activeStack === s.id ? "is-active" : ""}
                  type="button"
                  onClick={() => setActiveStack(s.id)}
                >
                  {s.label}
                  <span className="stack-count">
                    {s.id === "all" ? memories.length : filterMemories(memories, s.id).length}
                  </span>
                </button>
              ))}
            </div>
          </header>
          {filtered.length ? (
            <div className="memory-card-grid">
              {filtered.map(memory => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onSelect={isSelecting ? () => toggleSelection(memory.id) : onSelectMemory}
                  onEdit={onEditMemory}
                  variant={preferences?.compactCards ? "compact" : "library"}
                  isSelecting={isSelecting}
                  isSelected={selectedIds.has(memory.id)}
                />
              ))}
            </div>
          ) : (
            <div className="memory-filter-empty">
              <MagnifyingGlass />
              <p>No {activeStack} memories yet.</p>
              <button type="button" onClick={onCapture}>Capture one</button>
            </div>
          )}
        </section>
      ) : (
        <div className="subpage-empty">
          <MagnifyingGlass />
          <h2>No memories yet</h2>
          <p>Your captures will appear here.</p>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isSelecting && (
            <div className="selection-bar-wrapper">
              <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.88)', 
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(21, 63, 64, 0.15)', 
                  padding: '12px 24px', 
                  borderRadius: '99px', 
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '24px', 
                  pointerEvents: 'auto'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--petrol)' }}>{selectedIds.size} selected</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="page-action-button" 
                    onClick={() => { setIsSelecting(false); setSelectedIds(new Set()); }}
                    style={{ height: '36px', minHeight: '36px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="page-action-button" 
                    style={{ height: '36px', minHeight: '36px', fontSize: '11px', color: '#ee4c26', borderColor: 'rgba(238, 76, 38, 0.3)', background: 'rgba(255, 255, 255, 0.5)' }} 
                    onClick={handleBulkDelete} 
                    disabled={selectedIds.size === 0}
                  >
                    Delete Selected
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
