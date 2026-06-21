import { useState } from "react";
import { ArrowUp, FileText, Sparkle, X } from "@phosphor-icons/react";

export function AskPanel({ memories, onSelectMemory, onClose }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const ask = () => { if (!question.trim()) return; setAnswer("Your notes consistently frame privacy as control, not secrecy. The strongest proof points are local storage, clear sources, and exportability. Customer language suggests leading with confidence rather than technical detail."); };
  const openSource = (memory) => {
    onClose();
    onSelectMemory(memory);
  };
  return <div className="drawer-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="ask-panel" role="dialog" aria-modal="true" aria-label="Ask Second Signal"><header><div><Sparkle weight="fill" /><span>Ask Second Signal</span></div><button className="icon-button" onClick={onClose} aria-label="Close Ask Second Signal"><X /></button></header><div className="ask-body">{answer ? <div className="answer-block"><span>Answer from your space</span><p>{answer}</p><div className="answer-sources"><small>Referenced memories · select one to inspect the source</small>{memories.slice(0, 3).map((memory) => <button type="button" key={memory.id} onClick={() => openSource(memory)}><FileText /> {memory.title}</button>)}</div></div> : <div className="ask-empty"><Sparkle weight="duotone" /><h2>Ask what your memories know.</h2><p>Try “What themes keep appearing in my launch research?”</p></div>}</div><form className="ask-form" onSubmit={(event) => { event.preventDefault(); ask(); }}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your memories…" /><button aria-label="Ask question"><ArrowUp weight="bold" /></button></form></aside></div>;
}
