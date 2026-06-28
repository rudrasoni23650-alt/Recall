import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CirclesThreePlus, FolderOpen, FolderPlus, Plus, X, PencilSimple, CheckSquare, Square } from "@phosphor-icons/react";
import { MemoryCard } from "../MemoryCard.jsx";


export function SpacesPage({ memories, reminders, spaces = [], onUpdateSpaces, onSaveMemory, onSelectMemory, onEditMemory, onEditReminder, onDeleteSpacesBulk }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const activeSpaces = spaces || [];

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
        onEditMemory={onEditMemory}
        onEditReminder={onEditReminder}
      />
    );
  }

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onDeleteSpacesBulk(Array.from(selectedIds));
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="subpage spaces-page" style={{ paddingBottom: isSelecting ? '100px' : '0' }}>
      <div className="subpage-heading subpage-heading--with-action">
        <div>
          <span className="page-kicker">Themes that stay current</span>
          <h1>Spaces</h1>
          <p>Living collections that organize themselves as your memory grows.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isSelecting && activeSpaces.length > 0 && (
            <button className="page-action-button" type="button" onClick={() => setIsSelecting(true)}>
              Select
            </button>
          )}
          <button className="page-action-button" type="button" onClick={() => setCreating(true)}>
            <Plus weight="bold" /> New space
          </button>
        </div>
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
          {activeSpaces.map((space, index) => {
            const isSelected = selectedIds.has(space.id);
            return (
              <article 
                className={index === 0 && !isSelecting ? "space-row is-featured" : "space-row"} 
                key={space.id || space.title}
                onClick={() => {
                  if (isSelecting) {
                    toggleSelection(space.id);
                  } else {
                    setSelectedSpaceId(space.id);
                  }
                }}
                style={{ cursor: 'pointer', opacity: isSelecting && !isSelected ? 0.6 : 1 }}
              >
                {isSelecting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>
                    {isSelected ? <CheckSquare size={24} color="var(--petrol-light)" weight="fill" /> : <Square size={24} color="var(--muted)" />}
                  </div>
                ) : (
                  <span className="space-number">{space.number}</span>
                )}
                <div className="space-content">
                  <span className="space-eyebrow">
                    {space.eyebrow} · {(space.memoryIds || []).length} connected memories
                  </span>
                  <h2>{space.title}</h2>
                  <p>{space.text}</p>
                </div>
              </article>
            );
          })}
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

      {createPortal(
        <AnimatePresence>
          {isSelecting && (
            <div className="selection-bar-wrapper">
              <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.88)', 
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(21, 63, 64, 0.15)', 
                  padding: '12px 24px', 
                  borderRadius: '99px', 
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '24px', 
                  pointerEvents: 'auto'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--petrol)' }}>{selectedIds.size} selected</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="page-action-button" 
                    onClick={() => { setIsSelecting(false); setSelectedIds(new Set()); }}
                    style={{ height: '36px', minHeight: '36px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="page-action-button" 
                    style={{ height: '36px', minHeight: '36px', fontSize: '11px', color: '#ee4c26', borderColor: 'rgba(238, 76, 38, 0.3)', background: 'rgba(255, 255, 255, 0.5)' }} 
                    onClick={handleBulkDelete} 
                    disabled={selectedIds.size === 0}
                  >
                    Delete Selected
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function SpaceDetailPage({ space, memories, reminders, spaces, onBack, onUpdateSpaces, onSaveMemory, onSelectMemory, onEditMemory, onEditReminder }) {
  const [activeTab, setActiveTab] = useState("memories");
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);

  const spaceMemories = memories.filter((m) => space.memoryIds?.includes(m.id));
  const spaceReminders = reminders.filter((r) => space.reminderIds?.includes(r.id));
  const availableMemories = memories.filter((m) => !space.memoryIds?.includes(m.id));
  const availableReminders = reminders.filter((r) => !space.reminderIds?.includes(r.id));

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

  const addReminderToSpace = (reminderId) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === space.id) {
        const newIds = [...(s.reminderIds || [])];
        if (!newIds.includes(reminderId)) newIds.push(reminderId);
        return { ...s, reminderIds: newIds };
      }
      return s;
    });
    onUpdateSpaces(updatedSpaces);
    setShowAddReminderForm(false);
  };

  return (
    <div className="subpage space-detail-page">
      <div className="subpage-heading" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <button
            className="quiet-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--coral)', marginBottom: '12px', padding: 0 }}
            onClick={onBack}
          >
            <ArrowLeft weight="bold" /> Back to spaces
          </button>
          <span className="page-kicker">{space.eyebrow}</span>
          <h1 style={{ marginBottom: '8px' }}>{space.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{space.text}</p>
        </div>
      </div>

      {/* Segmented Tab Switcher */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--line)', marginBottom: '24px', marginTop: '24px' }}>
        <button 
          onClick={() => setActiveTab("memories")}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '15px',
            fontWeight: activeTab === "memories" ? '600' : '400',
            color: activeTab === "memories" ? 'var(--ink)' : 'var(--muted)',
            borderBottom: activeTab === "memories" ? '2px solid var(--petrol)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-1px',
            outline: 'none'
          }}
        >
          Connected Memories <span style={{ fontSize: '11px', background: activeTab === "memories" ? 'var(--petrol-light)' : 'rgba(21, 63, 64, 0.08)', color: activeTab === "memories" ? 'var(--canvas)' : 'var(--muted)', padding: '2px 6px', borderRadius: '99px', fontWeight: 'bold' }}>{spaceMemories.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab("reminders")}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '15px',
            fontWeight: activeTab === "reminders" ? '600' : '400',
            color: activeTab === "reminders" ? 'var(--ink)' : 'var(--muted)',
            borderBottom: activeTab === "reminders" ? '2px solid var(--petrol)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-1px',
            outline: 'none'
          }}
        >
          Connected Reminders <span style={{ fontSize: '11px', background: activeTab === "reminders" ? 'var(--petrol-light)' : 'rgba(21, 63, 64, 0.08)', color: activeTab === "reminders" ? 'var(--canvas)' : 'var(--muted)', padding: '2px 6px', borderRadius: '99px', fontWeight: 'bold' }}>{spaceReminders.length}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "memories" ? (
        <section className="space-detail-section">
          {spaceMemories.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <button className="page-action-button" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowAddMemory(!showAddMemory)}>
                    <Plus weight="bold" /> Add Memory
                  </button>
                  {showAddMemory && (
                    <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '240px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {spaceMemories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} variant="library" onSelect={onSelectMemory} onEdit={onEditMemory} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(21, 63, 64, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--petrol-light)' }}>
                <CirclesThreePlus size={24} weight="duotone" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px 0' }}>No memories in this space yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '320px', margin: '0 0 20px 0', lineHeight: 1.5 }}>Bring in links, notes, or highlights to curate this space.</p>
              <div style={{ position: 'relative' }}>
                <button className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddMemory(!showAddMemory)}>
                  <Plus weight="bold" /> Add first memory
                </button>
                {showAddMemory && (
                  <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '240px', marginTop: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
          )}
        </section>
      ) : (
        <section className="space-detail-section">
          {spaceReminders.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <button className="page-action-button" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowAddReminderForm(!showAddReminderForm)}>
                    <Plus weight="bold" /> Add Reminder
                  </button>
                  {showAddReminderForm && (
                    <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '240px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {availableReminders.map(r => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => addReminderToSpace(r.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {r.title}
                        </button>
                      ))}
                      {availableReminders.length === 0 && <p style={{ fontSize: '11px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>No more reminders to add.</p>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {spaceReminders.map((item) => (
                  <article key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--ink)', fontWeight: 500 }}>{item.title}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>{item.due} · {item.time || "All Day"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        className="reminder-action-btn"
                        type="button"
                        onClick={() => onEditReminder && onEditReminder(item)}
                        style={{ border: '1px solid var(--line)', background: 'var(--canvas)', color: 'var(--ink)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      {item.done ? (
                        <span style={{ fontSize: '12px', color: 'var(--petrol-light)', background: 'rgba(21, 63, 64, 0.08)', padding: '4px 10px', borderRadius: '99px', fontWeight: 500 }}>Completed</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--coral)', background: 'rgba(238, 76, 38, 0.08)', padding: '4px 10px', borderRadius: '99px', fontWeight: 500 }}>Active</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(21, 63, 64, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--petrol-light)' }}>
                <Plus size={24} weight="bold" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px 0' }}>No reminders linked to this space</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '320px', margin: '0 0 20px 0', lineHeight: 1.5 }}>Add tasks or goals to keep track of reminders associated with this space.</p>
              <div style={{ position: 'relative' }}>
                <button className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddReminderForm(!showAddReminderForm)}>
                  <Plus weight="bold" /> Link a reminder
                </button>
                {showAddReminderForm && (
                  <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '240px', marginTop: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {availableReminders.map(r => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => addReminderToSpace(r.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {r.title}
                      </button>
                    ))}
                    {availableReminders.length === 0 && <p style={{ fontSize: '11px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>No more reminders to add.</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
