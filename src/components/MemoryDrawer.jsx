import { useState } from "react";
import { Archive, ArrowLeft, ArrowSquareOut, Export, FileText, FolderPlus, Image, Link, Plus, Sparkle, Waveform, X } from "@phosphor-icons/react";
import { motion } from "motion/react";

const TYPE_ICON = { note: FileText, link: Link, image: Image, voice: Waveform };

export function MemoryDrawer({ memory, memories, spaces = [], onLinkMemoryToSpace, onNavigate, onArchive, onClose }) {
  const [history, setHistory] = useState([]);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [showAddSpace, setShowAddSpace] = useState(false);
  const connectedSpaces = (spaces || []).filter(space => space.memoryIds?.includes(memory.id));
  const availableSpaces = (spaces || []).filter(space => !space.memoryIds?.includes(memory.id));
  const memoryById = new Map(memories.map((item) => [item.id, item]));
  const sources = (memory.sourceIds ?? []).map((id) => memoryById.get(id)).filter(Boolean);

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
          <button className="icon-button" onClick={onClose} aria-label="Close memory"><X /></button>
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

        <section>
          <h2><Sparkle weight="fill" /> AI summary</h2>
          <p>
            This memory connects your focus on trust with the launch narrative. The clearest opportunity is to support the privacy promise with direct customer language and verifiable sources.
          </p>
        </section>

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
          
          <div className="drawer-add-space-control" style={{ position: 'relative' }}>
            <button className="text-action-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 }} type="button" onClick={() => setShowAddSpace(!showAddSpace)}>
              <Plus /> Add to space
            </button>
            {showAddSpace && (
              <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {availableSpaces.map(space => (
                  <button type="button" key={space.id} onClick={() => { onLinkMemoryToSpace(memory.id, space.id); setShowAddSpace(false); }} style={{ background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                    {space.title}
                  </button>
                ))}
                {availableSpaces.length === 0 && <p style={{ fontSize: '12px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>All spaces connected or no spaces created.</p>}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2>Extracted action</h2>
          <label className="drawer-task">
            <input type="checkbox" />
            <span className="check-ring" />
            Add one customer quote to the launch brief.
          </label>
        </section>

        <footer>
          <button className="secondary-button" onClick={exportMemory}><Export /> Export Markdown</button>
          <button className="quiet-button" onClick={() => onArchive(memory.id)}><Archive /> Archive</button>
        </footer>
      </motion.aside>
    </motion.div>
  );
}
