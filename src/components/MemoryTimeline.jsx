import { useState } from "react";
import { ArrowRight, DotsThree, FileText, Image, Link, Play, Waveform } from "@phosphor-icons/react";
import { getMemoryDateTime, getTimelineDateLabel } from "../lib/dateUtils";

const typeIcons = { note: FileText, link: Link, image: Image, voice: Waveform };

export function MemoryTimeline({ memories, onSelectMemory }) {
  const [showEarlier, setShowEarlier] = useState(false);
  const visibleMemories = showEarlier ? memories : memories.slice(0, 4);

  // Group by resolved dynamic dateGroup
  const groups = visibleMemories.reduce((all, memory) => {
    const { dateGroup } = getMemoryDateTime(memory);
    return { ...all, [dateGroup]: [...(all[dateGroup] ?? []), memory] };
  }, {});

  return (
    <section className="timeline-section">
      <header className="timeline-heading">
        <div>
          <span>Recent activity</span>
          <h2>Memory timeline</h2>
        </div>
        <small>{memories.length} memories</small>
      </header>
      {Object.entries(groups).map(([group, items]) => (
        <div className="timeline-group" key={group}>
          <h3>
            {group}
            <span>{getTimelineDateLabel(group)}</span>
          </h3>
          {items.map((memory) => (
            <MemoryRow memory={memory} key={memory.id} onSelect={() => onSelectMemory(memory)} />
          ))}
        </div>
      ))}
      {memories.length > 4 ? (
        <button
          className={showEarlier ? "show-earlier is-open" : "show-earlier"}
          type="button"
          onClick={() => setShowEarlier((value) => !value)}
        >
          {showEarlier ? "Hide earlier" : `Show ${memories.length - 4} earlier`} <ArrowRight />
        </button>
      ) : null}
    </section>
  );
}

function MemoryRow({ memory, onSelect }) {
  const Icon = typeIcons[memory.type] ?? FileText;
  const { time } = getMemoryDateTime(memory);

  return (
    <button className="memory-row" type="button" onClick={onSelect}>
      <time>{time}</time>
      <span className={`type-icon type-${memory.type}`}>
        <Icon weight="duotone" />
      </span>
      <span className="memory-row-copy">
        <span>
          <small>{memory.type}</small>
          {memory.title}
        </span>
        <p>{memory.summary || memory.excerpt}</p>
      </span>
      <span className="memory-tag">{memory.tag}</span>
      {memory.type === "voice" ? <Play className="row-play" weight="fill" /> : <DotsThree className="row-more" weight="bold" />}
    </button>
  );
}

