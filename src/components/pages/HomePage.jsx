import { ArrowRight, FileText, Link, Sparkle, Waveform } from "@phosphor-icons/react";
import { MemoryTimeline } from "../MemoryTimeline.jsx";
import boardImage from "../../assets/privacy-positioning-board.png";

export function HomePage({ memories, onCapture, onSelectMemory }) {
  if (!memories.length) {
    return <section className="empty-home"><div className="empty-mark"><Sparkle weight="fill" /></div><h1>Your space is quiet.</h1><p>Capture your first thought, link, image, or voice note. Second Signal will organize it and bring it back when it becomes useful.</p><button className="primary-button" type="button" onClick={onCapture}>Capture your first memory <ArrowRight weight="bold" /></button></section>;
  }

  return (
    <div className="home-page">
      <section className="home-intro"><div><span className="page-kicker">Daily resurfacing</span><h1>Returned to you</h1><p>An older memory that may help with what you’re doing today.</p></div><button className="why-button" type="button" title="This memory relates to your active launch brief and today's interview.">Why this appeared <span>i</span></button></section>
      <article className="returned-memory">
        <button className="memory-source-preview" type="button" onClick={() => onSelectMemory(memories[0])}>
          <div className="source-meta"><FileText weight="duotone" /> Note <span>May 9, 2024</span></div>
          <h2>Launch brief — core messaging</h2>
          <p>A working brief with audience insights, message pillars, and proof points.</p>
          <img src={boardImage} alt="Launch brief with core messaging and proof points" />
        </button>
        <div className="memory-understanding">
          <div className="ai-label"><Sparkle weight="fill" /> AI summary</div>
          <p>This brief brings your strongest launch ideas into one place. The clearest message is simple: capture without friction, understand automatically, and return to useful ideas with context.</p>
          <div className="sources-used"><span><Link /> Sources used</span><button onClick={() => onSelectMemory(memories[0])}><FileText /> Launch brief v1.2 <time>May 9, 2024</time></button><button onClick={() => onSelectMemory(memories[3] ?? memories[0])}><Waveform /> Customer interview — Maya Chen <time>May 14, 2024</time></button><button onClick={() => onSelectMemory(memories[4] ?? memories[0])}><FileText /> Core messaging notes <time>Apr 28, 2024</time></button></div>
          <div className="suggested-action"><span className="action-icon"><Sparkle weight="fill" /></span><span><small>Suggested next step</small>Review customer interview for supporting quotes.</span><button type="button" onClick={() => onSelectMemory(memories[0])}>Open memory</button></div>
        </div>
      </article>
      <MemoryTimeline memories={memories} onSelectMemory={onSelectMemory} />
    </div>
  );
}
