import {
  ArrowRight,
  ArrowSquareOut,
  FileText,
  Image,
  Link,
  Play,
  Waveform,
} from "@phosphor-icons/react";
import fallbackBoardImg from "../assets/privacy-positioning-board.png";

const typeDetails = {
  note: { label: "Note", Icon: FileText },
  link: { label: "Link", Icon: Link },
  image: { label: "Image", Icon: Image },
  voice: { label: "Voice", Icon: Waveform },
};

export function MemoryCard({ memory, onSelect, variant = "library", context = "" }) {
  const { label, Icon } = typeDetails[memory.type] ?? typeDetails.note;
  const isCompact = variant === "compact";

  return (
    <button
      className={`memory-card memory-card--${variant} memory-card--${memory.type}`}
      type="button"
      onClick={() => onSelect(memory)}
      aria-label={`Open memory: ${memory.title}`}
    >
      {!isCompact ? (
        <div className="memory-card-visual">
          {memory.type === "image" ? (
            <img src={memory.imageUrl || (memory.type === "image" && memory.url) || fallbackBoardImg} alt={`Visual preview: ${memory.title}`} />
          ) : (
            <div className="memory-card-cover">
              <span className="memory-card-cover-label"><Icon weight="duotone" /> {label}</span>
              {memory.type === "voice" ? (
                <span className="memory-card-voice">
                  <Play weight="fill" />
                  <strong>{memory.duration ?? "0:00"}</strong>
                  <small>{memory.audioUrl ? "Tap to preview recording" : "Recorded conversation"}</small>
                </span>
              ) : null}
              {memory.type === "link" ? (
                <span className="memory-card-link"><small>Saved from</small><strong>{memory.url ? new URL(memory.url).hostname : "Research collection"}</strong><ArrowSquareOut /></span>
              ) : null}
              {memory.type === "note" ? (
                <blockquote>{memory.excerpt}</blockquote>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <span className={`memory-card-icon type-${memory.type}`}><Icon weight="duotone" /></span>
      )}

      <div className="memory-card-body">
        <div className="memory-card-meta">
          <span>{label}</span>
          <span>{memory.dateGroup} · {memory.time}</span>
        </div>
        <h3>{memory.title}</h3>
        <p>{memory.excerpt}</p>
        <div className="memory-card-footer">
          <span>{context || memory.tag}</span>
          <span>{memory.type === "voice" && memory.duration ? memory.duration : isCompact ? "Open" : "View memory"}<ArrowRight weight="bold" /></span>
        </div>
      </div>
    </button>
  );
}
