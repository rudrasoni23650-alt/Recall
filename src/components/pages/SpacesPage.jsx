import { useState } from "react";
import { ArrowLeft, ArrowRight, CirclesThreePlus, FolderOpen, FolderPlus, Plus, X } from "@phosphor-icons/react";
import { MemoryCard } from "../MemoryCard.jsx";

const demoSpaces = [
  {
    id: "launch-narrative-space",
    number: "01",
    eyebrow: "Active project",
    title: "Launch narrative",
    text: "Messaging, market notes, customer language, and the decisions shaping the launch.",
    memoryIds: ["launch-core", "customer-interview", "privacy-reference", "market-landscape", "launch-moodboard"],
    reminderIds: ["reminder-1", "reminder-2"]
  },
  {
    id: "privacy-patterns-space",
    number: "02",
    eyebrow: "Smart space",
    title: "Privacy patterns",
    text: "Product references and trust-building examples collected from across your memories.",
    memoryIds: ["privacy-reference", "market-landscape", "launch-core"],
    reminderIds: ["reminder-3"]
  },
  {
    id: "ideas-worth-returning-space",
    number: "03",
    eyebrow: "Smart space",
    title: "Ideas worth returning to",
    text: "Loose thoughts with enough shared context to become something more useful.",
    memoryIds: ["onboarding-flow", "competitor-teardown"],
    reminderIds: []
  }
];

export function SpacesPage({ memories, reminders, spaces = [], onUpdateSpaces, onSaveMemory, onSelectMemory }) {
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const activeSpaces = spaces.length ? spaces : demoSpaces;

  const createSpace = (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const newSpace = {
      id: crypto.randomUUID(),
      number: String(activeSpaces.length + 1).padStart(2, "0"),
      eyebrow: "Manual space",
      title,
      text: "A focused space ready for the memories you choose.",
      memoryIds: [],
      reminderIds: []
    };
    onUpdateSpaces([...activeSpaces, newSpace]);
    setSelectedSpaceId(newSpace.id);
    setNewTitle("");
    setCreating(false);
  };

  const selectedSpace = activeSpaces.find(s => s.id === selectedSpaceId);

  if (selectedSpace) {
    return (
      <SpaceDetailPage
        space={selectedSpace}
        memories={memories}
        reminders={reminders}
        spaces={activeSpaces}
        onBack={() => setSelectedSpaceId(null)}
        onUpdateSpaces={onUpdateSpaces}
        onSaveMemory={onSaveMemory}
        onSelectMemory={onSelectMemory}
      />
    );
  }

  return (
    <div className="subpage spaces-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div>
          <span className="page-kicker">Themes that stay current</span>
          <h1>Spaces</h1>
          <p>Living collections that organize themselves as your memory grows.</p>
        </div>
        <button className="page-action-button" type="button" onClick={() => setCreating(true)}>
          <Plus weight="bold" /> New space
        </button>
      </div>

      {creating ? (
        <form className="new-space-form" onSubmit={createSpace}>
          <label>
            Space name
            <input 
              autoFocus 
              value={newTitle} 
              onChange={(event) => setNewTitle(event.target.value)} 
              placeholder="For example, Product launch" 
            />
          </label>
          <button className="primary-button" type="submit" disabled={!newTitle.trim()}>
            Create space
          </button>
          <button 
            className="quiet-button" 
            type="button" 
            onClick={() => { setCreating(false); setNewTitle(""); }}
          >
            Cancel
          </button>
        </form>
      ) : null}

      {activeSpaces.length ? (
        <div className="spaces-ledger">
          {activeSpaces.map((space, index) => (
            <article className={index === 0 ? "space-row is-featured" : "space-row"} key={space.id || space.title}>
              <span className="space-number">{space.number}</span>
              <div className="space-content">
                <span className="space-eyebrow">
                  {space.eyebrow} · {(space.memoryIds || []).length} connected memories
                </span>
                <h2>{space.title}</h2>
                <p>{space.text}</p>
              </div>
              <button 
                className="space-open-button" 
                type="button" 
                onClick={() => setSelectedSpaceId(space.id)} 
                aria-label={`Open ${space.title}`}
              >
                <span>Open</span>
                <ArrowRight weight="bold" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="subpage-empty">
          <CirclesThreePlus weight="duotone" />
          <h2>No spaces yet</h2>
          <p>Create a space when a project, theme, or collection needs its own place.</p>
          <button className="primary-button" type="button" onClick={() => setCreating(true)}>
            Create your first space
          </button>
        </div>
      )}

      <section className="space-explainer">
        <span>How spaces work</span>
        <div>
          <h2>Manual when you need control.<br />Automatic when you do not.</h2>
          <p>
            Create a space for a focused project, or let Recall suggest one when a theme keeps appearing. 
            A memory can belong to several spaces without being duplicated.
          </p>
        </div>
      </section>
    </div>
  );
}

function SpaceDetailPage({ space, memories, reminders, spaces, onBack, onUpdateSpaces, onSaveMemory, onSelectMemory }) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);

  const spaceMemories = memories.filter((m) => space.memoryIds?.includes(m.id));
  const spaceReminders = reminders.filter((r) => space.reminderIds?.includes(r.id));
  const availableMemories = memories.filter((m) => !space.memoryIds?.includes(m.id));

  const addMemoryToSpace = (memoryId) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === space.id) {
        const newIds = [...(s.memoryIds || [])];
        if (!newIds.includes(memoryId)) newIds.push(memoryId);
        return { ...s, memoryIds: newIds };
      }
      return s;
    });
    onUpdateSpaces(updatedSpaces);
    setShowAddMemory(false);
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    const title = newReminderTitle.trim();
    if (!title) return;

    await onSaveMemory({
      type: "note",
      title: `Reminder: ${title}`,
      excerpt: `Space reminder: ${title}`,
      spaceId: space.id,
      reminder: {
        title,
        due: "Today",
        time: "9:00 AM"
      }
    });

    setNewReminderTitle("");
    setShowAddReminderForm(false);
  };

  return (
    <div className="subpage space-detail-page">
      <div className="subpage-heading">
        <div>
          <button 
            className="quiet-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--coral)', marginBottom: '12px', padding: 0 }} 
            onClick={onBack}
          >
            <ArrowLeft weight="bold" /> Back to spaces
          </button>
          <span className="page-kicker">{space.eyebrow}</span>
          <h1>{space.title}</h1>
          <p>{space.text}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }}>
        {/* Connected Memories */}
        <section className="space-detail-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text)' }}>Connected Memories ({spaceMemories.length})</h2>
            <div style={{ position: 'relative' }}>
              <button className="page-action-button" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setShowAddMemory(!showAddMemory)}>
                <Plus weight="bold" /> Add Memory
              </button>
              {showAddMemory && (
                <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {availableMemories.map(m => (
                    <button 
                      type="button" 
                      key={m.id} 
                      onClick={() => addMemoryToSpace(m.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {m.title}
                    </button>
                  ))}
                  {availableMemories.length === 0 && <p style={{ fontSize: '11px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>No more memories to add.</p>}
                </div>
              )}
            </div>
          </div>

          <div className="space-memory-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {spaceMemories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} variant="library" onSelect={onSelectMemory} />
            ))}
            {!spaceMemories.length && (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--line)', borderRadius: '12px', color: 'var(--text)', opacity: 0.7 }}>
                No memories connected yet. Click "Add Memory" to connect some!
              </div>
            )}
          </div>
        </section>

        {/* Connected Reminders */}
        <section className="space-detail-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text)' }}>Connected Reminders ({spaceReminders.length})</h2>
            <button className="page-action-button" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setShowAddReminderForm(!showAddReminderForm)}>
              <Plus weight="bold" /> Add Reminder
            </button>
          </div>

          {showAddReminderForm && (
            <form onSubmit={handleAddReminder} style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <input 
                autoFocus 
                type="text" 
                value={newReminderTitle} 
                onChange={(e) => setNewReminderTitle(e.target.value)} 
                placeholder="Reminder action description..." 
                style={{ flex: 1, padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--text)' }} 
              />
              <button className="primary-button" type="submit" style={{ padding: '8px 16px' }}>Save</button>
              <button 
                className="quiet-button" 
                type="button" 
                onClick={() => { setShowAddReminderForm(false); setNewReminderTitle(""); }} 
                style={{ padding: '8px 12px' }}
              >
                Cancel
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {spaceReminders.map((item) => (
              <article key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)' }}>{item.title}</strong>
                  <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--text)' }}>{item.due} · {item.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.done ? (
                    <span style={{ fontSize: '12px', color: 'var(--coral)', background: 'rgba(238,76,38,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Completed</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--petrol-light)', background: 'rgba(22,76,78,0.2)', padding: '2px 8px', borderRadius: '4px' }}>Pending</span>
                  )}
                </div>
              </article>
            ))}
            {!spaceReminders.length && (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--line)', borderRadius: '12px', color: 'var(--text)', opacity: 0.7 }}>
                No reminders linked to this space.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
