import { useState } from "react";
import { Archive, ArrowLeft, ArrowSquareOut, Export, FileText, Link, Sparkle, X } from "@phosphor-icons/react";

export function MemoryDrawer({ memory, memories, onNavigate, onArchive, onClose }) {
  const [history, setHistory] = useState([]);
  const [originalOpen, setOriginalOpen] = useState(false);
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
  return <div className="drawer-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="memory-drawer" role="dialog" aria-modal="true" aria-label={`Memory: ${memory.title}`}><header><div className="drawer-heading">{history.length ? <button className="drawer-back" type="button" onClick={goBack} aria-label="Back to previous memory"><ArrowLeft /></button> : null}<span>{memory.type} · {memory.dateGroup}</span></div><button className="icon-button" onClick={onClose} aria-label="Close memory"><X /></button></header><h1>{memory.title}</h1><p className="drawer-lead">{memory.excerpt}</p><section><h2><Sparkle weight="fill" /> AI summary</h2><p>This memory connects your focus on trust with the launch narrative. The clearest opportunity is to support the privacy promise with direct customer language and verifiable sources.</p></section><section><h2><Link /> Sources</h2><button className="drawer-source" type="button" onClick={openOriginal} aria-expanded={!memory.url && originalOpen}><FileText /><span className="drawer-source-copy"><strong>Original capture</strong><small>{memory.url ? "Open the saved link" : "View the captured content"}</small></span><span>{memory.dateGroup}{memory.url ? <ArrowSquareOut /> : null}</span></button>{originalOpen ? <div className="drawer-original"><span>Captured content</span><p>{memory.excerpt}</p>{memory.fileName ? <small>File: {memory.fileName}</small> : null}{memory.audioUrl ? <audio controls src={memory.audioUrl} /> : null}</div> : null}{sources.map((source) => <button className="drawer-source" type="button" key={source.id} onClick={() => navigateTo(source)}><FileText /><span className="drawer-source-copy"><strong>{source.title}</strong><small>{source.excerpt}</small></span><span>{source.dateGroup}</span></button>)}{!sources.length ? <p className="drawer-no-sources">No related saved memories yet.</p> : null}</section><section><h2>Extracted action</h2><label className="drawer-task"><input type="checkbox" /><span className="check-ring" />Add one customer quote to the launch brief.</label></section><footer><button className="secondary-button" onClick={exportMemory}><Export /> Export Markdown</button><button className="quiet-button" onClick={() => onArchive(memory.id)}><Archive /> Archive</button></footer></aside></div>;
}
