import { useState } from "react";
import { ArrowRight, FolderOpen, Plus, X } from "@phosphor-icons/react";
import { MemoryCard } from "../MemoryCard.jsx";

const initialSpaces = [
  { number: "01", eyebrow: "Active project", title: "Launch narrative", count: 8, text: "Messaging, market notes, customer language, and the decisions shaping the launch." },
  { number: "02", eyebrow: "Smart space", title: "Privacy patterns", count: 5, text: "Product references and trust-building examples collected from across your memories." },
  { number: "03", eyebrow: "Smart space", title: "Ideas worth returning to", count: 12, text: "Loose thoughts with enough shared context to become something more useful." },
];

export function SpacesPage({ memories, onSelectMemory }) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const createSpace = (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const space = {
      number: String(spaces.length + 1).padStart(2, "0"),
      eyebrow: "Manual space",
      title,
      count: 0,
      text: "A focused space ready for the memories you choose.",
    };
    setSpaces((current) => [...current, space]);
    setSelectedSpace(space);
    setNewTitle("");
    setCreating(false);
  };

  return (
    <div className="subpage spaces-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div><span className="page-kicker">Themes that stay current</span><h1>Spaces</h1><p>Living collections that organize themselves as your memory grows.</p></div>
        <button className="page-action-button" type="button" onClick={() => setCreating(true)}><Plus weight="bold" /> New space</button>
      </div>

      {creating ? <form className="new-space-form" onSubmit={createSpace}><label>Space name<input autoFocus value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="For example, Product launch" /></label><button className="primary-button" type="submit" disabled={!newTitle.trim()}>Create space</button><button className="quiet-button" type="button" onClick={() => { setCreating(false); setNewTitle(""); }}>Cancel</button></form> : null}

      <div className="spaces-ledger">
        {spaces.map((space, index) => (
          <article className={index === 0 ? "space-row is-featured" : "space-row"} key={space.title}>
            <span className="space-number">{space.number}</span>
            <div className="space-content"><span className="space-eyebrow">{space.eyebrow} · {Math.min(space.count, memories.length + 3)} memories</span><h2>{space.title}</h2><p>{space.text}</p></div>
            <button className="space-open-button" type="button" onClick={() => setSelectedSpace(space)} aria-label={`Open ${space.title}`}><span>Open</span><ArrowRight weight="bold" /></button>
          </article>
        ))}
      </div>

      <section className="space-explainer"><span>How spaces work</span><div><h2>Manual when you need control.<br />Automatic when you do not.</h2><p>Create a space for a focused project, or let Recall suggest one when a theme keeps appearing. A memory can belong to several spaces without being duplicated.</p></div></section>

      {selectedSpace ? <SpaceDrawer space={selectedSpace} memories={memories} onSelectMemory={onSelectMemory} onClose={() => setSelectedSpace(null)} /> : null}
    </div>
  );
}

function SpaceDrawer({ space, memories, onSelectMemory, onClose }) {
  const spaceMemories = space.eyebrow === "Manual space" ? [] : memories.slice(0, 3);
  return <div className="drawer-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="space-drawer" role="dialog" aria-modal="true" aria-label={`Space: ${space.title}`}><header><div><span>{space.eyebrow}</span><small>{spaceMemories.length} connected memories</small></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close space"><X /></button></header><div className="space-drawer-mark"><FolderOpen weight="duotone" /></div><h1>{space.title}</h1><p>{space.text}</p><section><span>Memories in this space</span><div className="space-memory-list">{spaceMemories.map((memory) => <MemoryCard key={memory.id} memory={memory} variant="compact" context={space.title} onSelect={(selected) => { onClose(); onSelectMemory(selected); }} />)}{!spaceMemories.length ? <div className="space-drawer-empty"><strong>This space is ready.</strong><span>Future captures can be added here.</span></div> : null}</div></section></aside></div>;
}
