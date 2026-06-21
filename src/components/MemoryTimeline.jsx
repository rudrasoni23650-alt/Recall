import { useState } from "react";
import { ArrowRight, DotsThree, FileText, Image, Link, Play, Waveform } from "@phosphor-icons/react";

const typeIcons = { note: FileText, link: Link, image: Image, voice: Waveform };

export function MemoryTimeline({ memories, onSelectMemory }) {
  const [showEarlier, setShowEarlier] = useState(false);
  const visibleMemories = showEarlier ? memories : memories.slice(0, 4);
  const groups = visibleMemories.reduce((all, memory) => ({ ...all, [memory.dateGroup]: [...(all[memory.dateGroup] ?? []), memory] }), {});

  return <section className="timeline-section"><header className="timeline-heading"><div><span>Recent activity</span><h2>Memory timeline</h2></div><small>{memories.length} memories</small></header>{Object.entries(groups).map(([group, items]) => <div className="timeline-group" key={group}><h3>{group}<span>{group === "Today" ? "Jun 20" : group === "Yesterday" ? "Jun 19" : ""}</span></h3>{items.map((memory) => <MemoryRow memory={memory} key={memory.id} onSelect={() => onSelectMemory(memory)} />)}</div>)}{memories.length > 4 ? <button className={showEarlier ? "show-earlier is-open" : "show-earlier"} type="button" onClick={() => setShowEarlier((value) => !value)}>{showEarlier ? "Hide earlier" : `Show ${memories.length - 4} earlier`} <ArrowRight /></button> : null}</section>;
}

function MemoryRow({ memory, onSelect }) {
  const Icon = typeIcons[memory.type] ?? FileText;
  return <button className="memory-row" type="button" onClick={onSelect}><time>{memory.time}</time><span className={`type-icon type-${memory.type}`}><Icon weight="duotone" /></span><span className="memory-row-copy"><span><small>{memory.type}</small>{memory.title}</span><p>{memory.excerpt}</p></span><span className="memory-tag">{memory.tag}</span>{memory.type === "voice" ? <Play className="row-play" weight="fill" /> : <DotsThree className="row-more" weight="bold" />}</button>;
}
