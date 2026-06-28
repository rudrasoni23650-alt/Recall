import {
  ArrowRight, ArrowSquareOut,
  Article, Bell, CheckSquare, Square, FileText, FilePdf,
  Highlighter, Image, Link, Play, Quotes,
  VideoCamera, Waveform, PushPin, Star, PencilSimple, Sparkle
} from "@phosphor-icons/react";
import fallbackBoardImg from "../assets/privacy-positioning-board.png";

const typeDetails = {
  note:       { label: "Note",        Icon: FileText    },
  link:       { label: "Link",        Icon: Link        },
  article:    { label: "Article",     Icon: Article     },
  image:      { label: "Image",       Icon: Image       },
  screenshot: { label: "Screenshot",  Icon: Image       },
  pdf:        { label: "PDF",         Icon: FilePdf     },
  video:      { label: "Video",       Icon: VideoCamera },
  quote:      { label: "Quote",       Icon: Quotes      },
  highlight:  { label: "Highlight",   Icon: Highlighter },
  todo:       { label: "To-do",       Icon: CheckSquare },
  voice:      { label: "Voice",       Icon: Waveform    },
  reminder:   { label: "Reminder",    Icon: Bell        },
};

export function MemoryCard({ memory, onSelect, onEdit, variant = "library", context = "", isSelecting = false, isSelected = false }) {
  const { label, Icon } = typeDetails[memory.type] ?? typeDetails.note;
  const isCompact = variant === "compact";

  // Resolve image for visual preview
  const previewImage =
    memory.imageUrl ||
    memory.thumbnailUrl ||
    (memory.type === "image" || memory.type === "screenshot" ? memory.url : null);

  const domainLabel = memory.sourceDomain || (memory.url ? (() => {
    try { return new URL(memory.url).hostname.replace("www.", ""); } catch { return null; }
  })() : null);

  return (
    <button
      className={`memory-card memory-card--${variant} memory-card--${memory.type}`}
      type="button"
      onClick={() => isSelecting ? onSelect(memory.id) : onSelect(memory)}
      aria-label={`Open memory: ${memory.title}`}
      style={{ opacity: isSelecting && !isSelected ? 0.6 : 1 }}
    >
      {!isCompact ? (
        <div className="memory-card-visual">
          {/* Indicator badges */}
          {/* Indicator badges */}
          {(memory.isPinned || memory.isTopOfMind || isSelecting) && (
            <div className="memory-card-badges" style={{ right: (!isSelecting && onEdit && memory.processingStatus !== 'pending') ? '50px' : '10px' }}>
              {isSelecting && (
                <span className="memory-badge memory-badge--select" style={{ background: isSelected ? 'var(--petrol-light)' : 'var(--canvas)' }}>
                  {isSelected ? <CheckSquare weight="fill" color="#fff" /> : <Square color="var(--muted)" />}
                </span>
              )}
              {memory.isPinned     && <span className="memory-badge memory-badge--pinned"><PushPin weight="fill" /></span>}
              {memory.isTopOfMind  && <span className="memory-badge memory-badge--top"><Star weight="fill" /></span>}
            </div>
          )}

          {previewImage ? (
            <img src={previewImage} alt={`Visual preview: ${memory.title}`} />
          ) : (
            <div className="memory-card-cover">
              <span className="memory-card-cover-label"><Icon weight="duotone" /> {label}</span>

              {/* Voice */}
              {memory.type === "voice" && (
                <span className="memory-card-voice">
                  <Play weight="fill" />
                  <strong>{memory.duration ?? "0:00"}</strong>
                  <small>{memory.audioUrl ? "Tap to preview recording" : "Recorded conversation"}</small>
                </span>
              )}

              {/* Link / article / video */}
              {(memory.type === "link" || memory.type === "article" || memory.type === "video") && domainLabel && (
                <span className="memory-card-link">
                  <small>Saved from</small>
                  <strong>{domainLabel}</strong>
                  <ArrowSquareOut />
                </span>
              )}

              {/* Note */}
              {memory.type === "note" && (
                <blockquote>{memory.excerpt}</blockquote>
              )}

              {/* Quote */}
              {memory.type === "quote" && (
                <blockquote className="memory-card-quote">&ldquo;{memory.excerpt}&rdquo;</blockquote>
              )}

              {/* Highlight */}
              {memory.type === "highlight" && (
                <mark className="memory-card-highlight">{memory.excerpt}</mark>
              )}

              {/* Todo */}
              {memory.type === "todo" && (
                <span className="memory-card-todo">
                  <CheckSquare weight={memory.isRead ? "fill" : "duotone"} />
                  <span>{memory.excerpt}</span>
                </span>
              )}

              {/* PDF */}
              {memory.type === "pdf" && (
                <span className="memory-card-link">
                  <small>Document</small>
                  <strong>{memory.fileName || "PDF file"}</strong>
                  <ArrowSquareOut />
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <span className={`memory-card-icon type-${memory.type}`}>
          {isSelecting ? (
            isSelected ? <CheckSquare weight="fill" color="var(--petrol-light)" /> : <Square color="var(--muted)" />
          ) : (
            <Icon weight="duotone" />
          )}
        </span>
      )}

      {!isCompact && onEdit && !isSelecting && memory.processingStatus !== 'pending' && (
        <span 
          className="memory-card-edit-btn" 
          onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
          style={{ 
            position: "absolute", 
            top: "12px", 
            right: "12px", 
            width: "32px", 
            height: "32px", 
            borderRadius: "50%", 
            background: "#ffffff", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "var(--petrol)",
            zIndex: 10,
            border: "1px solid rgba(21, 63, 64, 0.15)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            cursor: "pointer"
          }}
          title="Edit memory"
        >
          <PencilSimple size={16} />
        </span>
      )}

      <div className="memory-card-body">
        <div className="memory-card-meta">
          <span>{label}</span>
          <span>{memory.dateGroup} · {memory.time}</span>
        </div>
        <h3>{memory.title}</h3>
        {memory.type === "note" && !memory.summary ? null : (
          <p>{memory.summary || memory.excerpt}</p>
        )}
        {memory.processingStatus === 'pending' && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
            <Sparkle weight="duotone" /> Re-summarizing...
          </p>
        )}

        {/* AI tags */}
        {!isCompact && memory.aiTags?.length ? (
          <div className="memory-card-tags">
            {memory.aiTags.slice(0, 3).map(tag => (
              <span key={tag} className="memory-tag-chip">{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="memory-card-footer">
          <span>{context || memory.tag}</span>
          <span>
            {memory.type === "voice" && memory.duration ? memory.duration : isCompact ? "Open" : "View memory"}
            <ArrowRight weight="bold" />
          </span>
        </div>
      </div>
    </button>
  );
}
