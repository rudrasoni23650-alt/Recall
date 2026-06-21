import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { MemoryCard } from "./MemoryCard.jsx";

export function CommandPalette({ memories, onClose, onCapture, onSelect }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.toLowerCase();
    return memories.filter((memory) => `${memory.title} ${memory.excerpt} ${memory.tag}`.toLowerCase().includes(needle));
  }, [memories, query]);
  return <div className="overlay command-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Search memories"><div className="command-input"><MagnifyingGlass /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by idea, source, or feeling…" /><button onClick={onClose} aria-label="Close search"><X /></button></div><div className="command-results"><button className="command-action" onClick={onCapture}><Plus /><span><strong>Capture a new memory</strong><small>⌘ N</small></span></button><p className="command-label">{query ? `${results.length} matching memories` : "Recent memories"}</p><div className="command-memory-cards">{results.slice(0, 5).map((memory) => <MemoryCard key={memory.id} memory={memory} variant="compact" onSelect={onSelect} />)}</div>{!results.length ? <div className="no-results">No memory matches that yet.</div> : null}</div></section></div>;
}
