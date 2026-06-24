import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { MemoryCard } from "./MemoryCard.jsx";

export function CommandPalette({ memories, onClose, onCapture, onSelect }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.toLowerCase();
    return memories.filter((memory) => `${memory.title} ${memory.excerpt} ${memory.tag}`.toLowerCase().includes(needle));
  }, [memories, query]);
  return <motion.div className="overlay command-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.section className="command-palette" initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} role="dialog" aria-modal="true" aria-label="Search memories"><div className="command-input"><MagnifyingGlass /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by idea, source, or feeling…" /><button onClick={onClose} aria-label="Close search"><X /></button></div><div className="command-results"><button className="command-action" onClick={onCapture}><Plus /><span><strong>Capture a new memory</strong><small>⌘ N</small></span></button><p className="command-label">{query ? `${results.length} matching memories` : "Recent memories"}</p><div className="command-memory-cards">{results.slice(0, 5).map((memory) => <MemoryCard key={memory.id} memory={memory} variant="compact" onSelect={onSelect} />)}</div>{!results.length ? <div className="no-results">No memory matches that yet.</div> : null}</div></motion.section></motion.div>;
}
