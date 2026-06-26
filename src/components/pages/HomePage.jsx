import { ArrowRight, FileText, Image, Link, Sparkle, Waveform } from "@phosphor-icons/react";
import { MemoryTimeline } from "../MemoryTimeline.jsx";
import boardImage from "../../assets/privacy-positioning-board.png";

export function HomePage({ memories, onCapture, onSelectMemory, reminders = [], preferences }) {
  if (!memories.length) {
    return (
      <div className="home-page">
        <section className="empty-home">
          <div className="empty-mark"><Sparkle weight="fill" /></div>
          <h1>Your space is quiet.</h1>
          <p>Capture your first thought, link, image, or voice note. Recall will organize it and bring it back when it becomes useful.</p>
          <button className="primary-button" type="button" onClick={onCapture}>
            Capture your first memory <ArrowRight weight="bold" />
          </button>
        </section>
      </div>
    );
  }

  // Check if we are in the demo space containing the baseline memories
  const isDemo = memories.some(m => m.id === "launch-core");

  // For a real user's space, only show resurfacing if we have at least 2 memories to select from
  const showResurfacing = isDemo || memories.length >= 2;

  // Select memory to resurface
  // If demo, use the first one (which is launch-core)
  // If real, use the oldest one (the last memory in the array)
  const resurfacedMemory = isDemo 
    ? (memories.find(m => m.id === "launch-core") || memories[0]) 
    : memories[memories.length - 1];

  // Helper details for types
  const typeDetails = {
    note: { label: "Note", Icon: FileText },
    link: { label: "Link", Icon: Link },
    image: { label: "Image", Icon: Image },
    voice: { label: "Voice", Icon: Waveform },
  };

  const { label, Icon } = typeDetails[resurfacedMemory.type] ?? typeDetails.note;

  // Find a suggested step from reminders if any is linked to this memory
  const linkedReminder = reminders.find(r => r.sourceId === resurfacedMemory.id && !r.done);
  const suggestedAction = linkedReminder ? linkedReminder.title : `Review this ${resurfacedMemory.type} for key takeaways.`;

  return (
    <div className="home-page">
      {showResurfacing && (
        <>
          <section className="home-intro">
            <div>
              <span className="page-kicker">Daily resurfacing</span>
              <h1>Returned to you</h1>
              <p>An older memory that may help with what you’re doing today.</p>
            </div>
            <button 
              className="why-button" 
              type="button" 
              title={isDemo 
                ? "This memory relates to your active launch brief and today's interview." 
                : "Recall surfaced this older memory to help keep your active ideas connected."
              }
            >
              Why this appeared <span>i</span>
            </button>
          </section>

          {isDemo ? (
            // Hardcoded demo experience for perfect styling matching mock
            <article className="returned-memory">
              <button className="memory-source-preview" type="button" onClick={() => onSelectMemory(resurfacedMemory)}>
                <div className="source-meta"><FileText weight="duotone" /> Note <span>May 9, 2024</span></div>
                <h2>Launch brief — core messaging</h2>
                <p>A working brief with audience insights, message pillars, and proof points.</p>
                <img src={boardImage} alt="Launch brief with core messaging and proof points" />
              </button>
              <div className="memory-understanding">
                {preferences?.showInsights !== false && (
                  <>
                    <div className="ai-label"><Sparkle weight="fill" /> AI summary</div>
                    <p>This brief brings your strongest launch ideas into one place. The clearest message is simple: capture without friction, understand automatically, and return to useful ideas with context.</p>
                  </>
                )}
                <div className="sources-used">
                  <span><Link /> Sources used</span>
                  <button onClick={() => onSelectMemory(resurfacedMemory)}><FileText /> Launch brief v1.2 <time>May 9, 2024</time></button>
                  <button onClick={() => {
                    const m = memories.find(x => x.id === "customer-interview") || resurfacedMemory;
                    onSelectMemory(m);
                  }}><Waveform /> Customer interview — Maya Chen <time>May 14, 2024</time></button>
                  <button onClick={() => {
                    const m = memories.find(x => x.id === "privacy-reference") || resurfacedMemory;
                    onSelectMemory(m);
                  }}><FileText /> Core messaging notes <time>Apr 28, 2024</time></button>
                </div>
                {preferences?.showInsights !== false && (
                  <div className="suggested-action">
                    <span className="action-icon"><Sparkle weight="fill" /></span>
                    <span><small>Suggested next step</small>Review customer interview for supporting quotes.</span>
                    <button type="button" onClick={() => onSelectMemory(resurfacedMemory)}>Open memory</button>
                  </div>
                )}
              </div>
            </article>
          ) : (
            // Dynamic experience for a real user's space
            <article className="returned-memory">
              <button className="memory-source-preview" type="button" onClick={() => onSelectMemory(resurfacedMemory)}>
                <div className="source-meta"><Icon weight="duotone" /> {label} <span>{resurfacedMemory.dateGroup}</span></div>
                <h2>{resurfacedMemory.title}</h2>
                <p>{resurfacedMemory.excerpt}</p>
                {resurfacedMemory.type === "image" && (
                  <img src={resurfacedMemory.url || boardImage} alt={resurfacedMemory.title} />
                )}
              </button>
              <div className="memory-understanding">
                {preferences?.showInsights !== false && (
                  <>
                    <div className="ai-label"><Sparkle weight="fill" /> AI summary</div>
                    <p>{resurfacedMemory.excerpt || "This memory contains your saved information. Recall will bring it back when it is relevant to your context."}</p>
                  </>
                )}
                <div className="sources-used">
                  <span><Link /> Sources used</span>
                  <button onClick={() => onSelectMemory(resurfacedMemory)}>
                    <Icon /> {resurfacedMemory.title} <time>{resurfacedMemory.time}</time>
                  </button>
                </div>
                {preferences?.showInsights !== false && (
                  <div className="suggested-action">
                    <span className="action-icon"><Sparkle weight="fill" /></span>
                    <span><small>Suggested next step</small>{suggestedAction}</span>
                    <button type="button" onClick={() => onSelectMemory(resurfacedMemory)}>Open memory</button>
                  </div>
                )}
              </div>
            </article>
          )}
        </>
      )}

      <MemoryTimeline memories={memories} onSelectMemory={onSelectMemory} />
    </div>
  );
}
