import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { MemoryCard } from "../MemoryCard.jsx";

export function MemoriesPage({ memories, onCapture, onSelectMemory }) {
  const [activeType, setActiveType] = useState("all");
  const types = ["all", "note", "link", "image", "voice"];
  const filteredMemories = useMemo(
    () => activeType === "all" ? memories : memories.filter((memory) => memory.type === activeType),
    [activeType, memories],
  );

  return (
    <div className="subpage memories-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div><span className="page-kicker">Your visual library</span><h1>Memories</h1><p>Everything you save, understood and easy to recognize at a glance.</p></div>
        <button className="page-action-button" type="button" onClick={onCapture}><Plus weight="bold" /> New memory</button>
      </div>

      {memories.length ? (
        <section className="memory-board" aria-label="Memory library">
          <header className="memory-board-toolbar">
            <div><span>Library</span><strong>{filteredMemories.length} {filteredMemories.length === 1 ? "memory" : "memories"}</strong></div>
            <div className="memory-filters" aria-label="Filter memories">
              {types.map((type) => <button className={activeType === type ? "is-active" : ""} type="button" key={type} onClick={() => setActiveType(type)}>{type === "all" ? "All" : `${type[0].toUpperCase()}${type.slice(1)}s`}</button>)}
            </div>
          </header>
          {filteredMemories.length ? <div className="memory-card-grid">{filteredMemories.map((memory) => <MemoryCard memory={memory} onSelect={onSelectMemory} key={memory.id} />)}</div> : <div className="memory-filter-empty"><MagnifyingGlass /><p>No {activeType} memories yet.</p><button type="button" onClick={onCapture}>Capture one</button></div>}
        </section>
      ) : <div className="subpage-empty"><MagnifyingGlass /><h2>No memories yet</h2><p>Your captures will appear here.</p></div>}
    </div>
  );
}
