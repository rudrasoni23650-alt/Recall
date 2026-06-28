import { useMemo, useState, useEffect } from "react";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { MemoryCard } from "./MemoryCard.jsx";
import { apiFetch } from "../lib/api.js";

export function CommandPalette({ memories, onClose, onCapture, onSelect, onEdit }) {
  const [query, setQuery] = useState("");
  const [serverResults, setServerResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setServerResults(null);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await apiFetch('/api/search', {
          method: 'POST',
          body: JSON.stringify({ query: needle })
        });
        if (data && data.results && data.results.length > 0) {
          setServerResults(data.results);
        } else if (data && data.results && data.results.length === 0) {
          setServerResults([]);
        }
      } catch (err) {
        console.error("Server search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return memories.slice(0, 8);
    
    // Fallback: client-side filter
    const localFiltered = memories.filter((m) => {
      const haystack = [
        m.title,
        m.excerpt,
        m.summary,
        m.body,
        m.tag,
        m.sourceDomain,
        m.sourceTitle,
        m.plainText,
        m.ocrText,
        m.visualDescription,
        ...(m.aiTags   || []),
        ...(m.userTags || []),
        ...(m.tags     || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    if (serverResults !== null && serverResults.length > 0) {
      const seen = new Set(localFiltered.map((m) => m.id));
      const combined = [...localFiltered];
      serverResults.forEach((m) => {
        if (!seen.has(m.id)) {
          combined.push(m);
        }
      });
      return combined;
    }

    return localFiltered;
  }, [memories, query, serverResults]);

  return (
    <motion.div
      className="overlay command-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.section
        className="command-palette"
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        role="dialog"
        aria-modal="true"
        aria-label="Search memories"
      >
        <div className="command-input">
          <MagnifyingGlass />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by idea, source, tag, or feeling…"
          />
          <button onClick={onClose} aria-label="Close search"><X /></button>
        </div>
        <div className="command-results">
          <button className="command-action" onClick={onCapture}>
            <Plus />
            <span>
              <strong>Capture a new memory</strong>
              <small>⌘ N</small>
            </span>
          </button>
          <p className="command-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSearching ? (
              <>Searching...</>
            ) : (
              <>{query ? `${results.length} matching memor${results.length === 1 ? "y" : "ies"}` : "Recent memories"}</>
            )}
          </p>
          <div className="command-memory-cards">
            {results.slice(0, 6).map((memory) => (
              <MemoryCard key={memory.id} memory={memory} variant="compact" onSelect={onSelect} onEdit={onEdit} />
            ))}
          </div>
          {query && !results.length ? (
            <div className="no-results">No memory matches that yet.</div>
          ) : null}
        </div>
      </motion.section>
    </motion.div>
  );
}
