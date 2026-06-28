import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, CheckSquare, House, PushPin, Sparkle, Star, Trash, Waveform, X, PencilSimple, Archive, ArrowSquareOut, Export, FileText, FolderPlus, Image, Link, Plus } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { ReadingMode } from "./ReadingMode.jsx";
import { apiFetch } from "../lib/api.js";


const TYPE_ICON = { note: FileText, link: Link, image: Image, voice: Waveform };

export function MemoryDrawer({ memory, memories, spaces = [], onLinkMemoryToSpace, onNavigate, onArchive, onClose, onPin, onTopOfMind, onEdit, onDelete }) {
  const [history, setHistory] = useState([]);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [showAddSpace, setShowAddSpace] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddSpace(false);
      }
    };
    if (showAddSpace) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddSpace]);
  
  const connectedSpaces = (spaces || []).filter(space => space.memoryIds?.includes(memory.id));
  const availableSpaces = (spaces || []).filter(space => !space.memoryIds?.includes(memory.id));
  const memoryById = new Map(memories.map((item) => [item.id, item]));
  const sources = (memory.sourceIds ?? []).map((id) => memoryById.get(id)).filter(Boolean);

  useEffect(() => {
    // Fetch highlights for this memory
    apiFetch(`/api/memories/${memory.id}/highlights`)
      .then(res => {
        if (res.success) setHighlights(res.highlights || []);
      })
      .catch(console.error);
  }, [memory.id]);

  const saveHighlight = async ({ text }) => {
    try {
      const res = await apiFetch(`/api/highlights`, {
        method: "POST",
        body: JSON.stringify({ memoryId: memory.id, text })
      });
      if (res.success && res.highlight) {
        setHighlights(prev => [res.highlight, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save highlight", err);
    }
  };

  const navigateTo = (nextMemory) => {
    setHistory((current) => [...current, memory.id]);
    setOriginalOpen(false);
    onNavigate(nextMemory);
  };

  const goBack = () => {
    const previousId = history.at(-1);
    const previousMemory = memoryById.get(previousId);
    if (!previousMemory) return;
    setHistory((current) => current.slice(0, -1));
    setOriginalOpen(false);
    onNavigate(previousMemory);
  };

  const openOriginal = () => {
    if (memory.url) {
      window.open(memory.url, "_blank", "noopener,noreferrer");
      return;
    }
    setOriginalOpen((value) => !value);
  };

  const exportMemory = () => {
    const content = `# ${memory.title}\n\n${memory.excerpt}\n\nType: ${memory.type}\nSaved: ${memory.dateGroup} at ${memory.time}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${memory.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const SourceIcon = TYPE_ICON[memory.type] ?? FileText;
  const resolvedImageUrl = memory.imageUrl || (memory.type === "image" ? memory.url : null);

  const OriginalCapture = () => {
    if (memory.type === "image" && resolvedImageUrl) {
      return (
        <div className="drawer-original drawer-original--image">
          <img src={resolvedImageUrl} alt={memory.title} />
          {memory.fileName && <small>File: {memory.fileName}</small>}
        </div>
      );
    }
    if (memory.type === "voice") {
      return (
        <div className="drawer-original drawer-original--voice">
          <div className="drawer-voice-header">
            <span className="drawer-voice-icon"><Waveform weight="duotone" /></span>
            <div>
              <strong>{memory.title}</strong>
              <small>{memory.duration ?? "—"} · Recorded conversation</small>
            </div>
          </div>
          {memory.audioUrl ? (
            <audio controls src={memory.audioUrl} className="drawer-audio-player" />
          ) : (
            <p className="drawer-voice-unavailable">Audio recording not available in this preview.</p>
          )}
          <p>{memory.excerpt}</p>
        </div>
      );
    }
    return (
      <div className="drawer-original">
        <span>Captured content</span>
        <p>{memory.excerpt}</p>
        {memory.fileName && <small>File: {memory.fileName}</small>}
      </div>
    );
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
        className="memory-drawer"
        initial={{ y: 40, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Memory: ${memory.title}`}
      >
        <header>
          <div className="drawer-heading">
            {history.length ? (
              <button className="drawer-back" type="button" onClick={goBack} aria-label="Back to previous memory">
                <ArrowLeft />
              </button>
            ) : null}
            <span>{memory.type} · {memory.dateGroup}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {onEdit && (
              <button 
                className="icon-button" 
                onClick={() => onEdit(memory)} 
                aria-label="Edit memory"
                disabled={memory.processingStatus === 'pending'}
                title={memory.processingStatus === 'pending' ? "Summarizing..." : "Edit memory"}
              >
                <PencilSimple />
              </button>
            )}
            {onDelete && (
              <button 
                className="icon-button" 
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete this memory?")) {
                    onDelete(memory.id);
                  }
                }} 
                aria-label="Delete memory"
                title="Delete memory"
              >
                <Trash />
              </button>
            )}
            <button className="icon-button" onClick={onClose} aria-label="Close memory"><X /></button>
          </div>
        </header>

        <h1>{memory.title}</h1>
        <p className="drawer-lead">{memory.excerpt}</p>

        {/* Inline image preview */}
        {memory.type === "image" && resolvedImageUrl && (
          <div className="drawer-inline-image">
            <img src={resolvedImageUrl} alt={memory.title} />
          </div>
        )}

        {/* Inline audio player for voice memories */}
        {memory.type === "voice" && (
          <div className="drawer-inline-voice">
            <div className="drawer-voice-header">
              <span className="drawer-voice-icon"><Waveform weight="duotone" /></span>
              <div>
                <strong>Recorded · {memory.duration ?? "—"}</strong>
                <small>Interview recording</small>
              </div>
            </div>
            {memory.audioUrl ? (
              <audio controls src={memory.audioUrl} className="drawer-audio-player" />
            ) : (
              <p className="drawer-voice-unavailable">Audio file not available in this preview.</p>
            )}
          </div>
        )}

        {/* AI summary section */}
        {memory.summary && (
          <section>
            <h2><Sparkle weight="fill" /> AI summary</h2>
            <p>{memory.summary}</p>
          </section>
        )}

        {/* Highlights section */}
        {highlights.length > 0 && (
          <section className="drawer-highlights">
            <h2><FileText weight="fill" /> Highlights</h2>
            <div className="highlights-list">
              {highlights.map(h => (
                <div key={h.id} className="highlight-item" style={{ borderLeft: `3px solid var(--${h.color || 'yellow'})`, paddingLeft: '12px', marginBottom: '16px' }}>
                  <p style={{ fontStyle: 'italic', color: 'var(--text)', margin: 0 }}>"{h.text}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2><Link /> Sources</h2>
          <button className="drawer-source" type="button" onClick={openOriginal} aria-expanded={!memory.url && originalOpen}>
            <SourceIcon />
            <span className="drawer-source-copy">
              <strong>Original capture</strong>
              <small>
                {memory.url
                  ? "Open the saved link"
                  : memory.type === "image"
                  ? "View the saved image"
                  : memory.type === "voice"
                  ? "Play the recording"
                  : "View the captured content"}
              </small>
            </span>
            <span>
              {memory.dateGroup}
              {memory.url ? <ArrowSquareOut /> : null}
            </span>
          </button>

          {originalOpen ? <OriginalCapture /> : null}

          {sources.map((source) => {
            const SrcIcon = TYPE_ICON[source.type] ?? FileText;
            return (
              <button className="drawer-source" type="button" key={source.id} onClick={() => navigateTo(source)}>
                <SrcIcon />
                <span className="drawer-source-copy">
                  <strong>{source.title}</strong>
                  <small>{source.excerpt}</small>
                </span>
                <span>{source.dateGroup}</span>
              </button>
            );
          })}
          {!sources.length ? <p className="drawer-no-sources">No related saved memories yet.</p> : null}
        </section>

        <section className="drawer-spaces-section">
          <h2><FolderPlus weight="fill" /> Connected Spaces</h2>
          <div className="drawer-spaces-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {connectedSpaces.map(space => (
              <span key={space.id} className="drawer-space-tag" style={{ background: 'var(--petrol-light)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {space.title}
              </span>
            ))}
            {connectedSpaces.length === 0 && <span style={{ color: 'var(--petrol-light)', opacity: 0.7, fontSize: '13px' }}>Not in any spaces yet.</span>}
          </div>
          
          <div className="drawer-add-space-control" style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="text-action-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 }} type="button" onClick={() => setShowAddSpace(!showAddSpace)}>
              <Plus /> Add to space
            </button>
            {showAddSpace && (
              <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px', marginBottom: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {availableSpaces.map(space => (
                  <button type="button" key={space.id} onClick={() => { onLinkMemoryToSpace(memory.id, space.id); setShowAddSpace(false); }} style={{ background: 'var(--canvas-deep)', border: '1px solid var(--line)', color: 'var(--text)', textAlign: 'left', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                    {space.title}
                  </button>
                ))}
                {availableSpaces.length === 0 && <p style={{ fontSize: '12px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>No spaces available. Create one in the Spaces tab.</p>}
              </div>
            )}
          </div>
        </section>

        <footer>
          <button className="secondary-button" onClick={exportMemory}><Export /> Export Markdown</button>
          {(memory.body || memory.plain_text || memory.excerpt) && (
            <button className="quiet-button" onClick={() => setReadingMode(true)}><FileText /> Read</button>
          )}
          <button className="quiet-button" onClick={() => onArchive(memory.id)}><Archive /> Archive</button>
        </footer>
      </motion.aside>

      {readingMode && (
        <ReadingMode 
          memory={memory} 
          onClose={() => setReadingMode(false)} 
          onSaveHighlight={saveHighlight} 
        />
      )}
    </motion.div>
  );
}
