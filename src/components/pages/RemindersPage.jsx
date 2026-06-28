import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, Plus, FolderPlus, PencilSimple, Trash, CheckSquare, Square, X } from "@phosphor-icons/react";

export function RemindersPage({ reminders, memories, spaces = [], onLinkReminderToSpace, onToggleReminder, onSelectMemory, onCapture, onAddReminder, onEditReminder, onDeleteReminder, onDeleteRemindersBulk }) {
  const today = reminders.filter((item) => !item.done && item.due === "Today");
  const upcoming = reminders.filter((item) => !item.done && item.due !== "Today");
  const done = reminders.filter((item) => item.done);
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const openSource = (item) => {
    // If selecting, clicking the card toggles selection instead of opening source
    if (isSelecting) {
      toggleSelection(item.id);
      return;
    }
    const source = memories.find((memory) => memory.id === item.sourceId);
    if (source) onSelectMemory(source);
  };

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
    onDeleteRemindersBulk(Array.from(selectedIds));
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="subpage reminders-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div>
          <span className="page-kicker">Context that asks for attention</span>
          <h1>Reminders</h1>
          <p>Every reminder keeps a clear path back to the memory that created it.</p>
        </div>
        <button className="page-action-button" onClick={onAddReminder || onCapture}>
          <Plus weight="bold" /> New reminder
        </button>
      </div>
      

      <ReminderSection 
        number="01" 
        title="Today" 
        items={today} 
        spaces={spaces}
        onLinkReminderToSpace={onLinkReminderToSpace}
        empty="Nothing else is due today." 
        onToggle={onToggleReminder} 
        onOpenSource={openSource} 
        onEdit={onEditReminder}
        onDelete={setDeleteTargetId}
      />
      
      <ReminderSection 
        number="02" 
        title="Upcoming" 
        items={upcoming} 
        spaces={spaces}
        onLinkReminderToSpace={onLinkReminderToSpace}
        empty="No upcoming reminders." 
        onToggle={onToggleReminder} 
        onOpenSource={openSource} 
        onEdit={onEditReminder}
        onDelete={setDeleteTargetId}
      />
      
      <ReminderSection 
        number="03" 
        title="Completed" 
        items={done} 
        spaces={spaces}
        onLinkReminderToSpace={onLinkReminderToSpace}
        empty="Completed reminders will collect here." 
        onToggle={onToggleReminder} 
        onOpenSource={openSource} 
        onEdit={onEditReminder}
        onDelete={setDeleteTargetId}
        completed 
        isSelecting={isSelecting}
        selectedIds={selectedIds}
        onStartSelection={() => setIsSelecting(true)}
      />

      {isSelecting && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: 'var(--canvas)', border: '1px solid var(--line)', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '24px', zIndex: 100 }}>
          <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="page-action-button" onClick={() => { setIsSelecting(false); setSelectedIds(new Set()); }}>Cancel</button>
            <button className="page-action-button" style={{ color: '#ee4c26', borderColor: 'rgba(238, 76, 38, 0.3)' }} onClick={handleBulkDelete} disabled={selectedIds.size === 0}>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteTargetId && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: 200 }}
            role="presentation"
            onMouseDown={(e) => e.target === e.currentTarget && setDeleteTargetId(null)}
          >
            <motion.div
              className="modal capture-modal"
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              role="dialog"
              aria-modal="true"
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
            >
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Delete Reminder</span>
                  <h2 style={{ font: "400 22px var(--display)", margin: "8px 0 0", color: "var(--ink)" }}>Delete permanently?</h2>
                </div>
                <button className="icon-button" onClick={() => setDeleteTargetId(null)} aria-label="Close delete prompt"><X /></button>
              </header>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                This reminder will be deleted permanently from your space. This action cannot be undone.
              </p>
              <footer style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button 
                  className="page-action-button" 
                  onClick={() => setDeleteTargetId(null)}
                  style={{ height: '36px', minHeight: '36px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  className="primary-button" 
                  onClick={() => {
                    onDeleteReminder(deleteTargetId);
                    setDeleteTargetId(null);
                  }}
                  style={{ height: '36px', minHeight: '36px', fontSize: '12px', background: '#ee4c26', color: '#fff', border: 'none' }}
                >
                  Delete
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReminderSection({ number, title, items, spaces, onLinkReminderToSpace, empty, onToggle, onOpenSource, onEdit, onDelete, completed = false, isSelecting = false, selectedIds = new Set(), onStartSelection }) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  return (
    <section className={completed ? "reminder-ledger is-completed" : "reminder-ledger"}>
      <header>
        <span>{number}</span>
        <h2>{title}</h2>
        <small>{items.length}</small>
        {completed && items.length > 0 && !isSelecting && (
          <button className="reminder-action-btn" type="button" onClick={onStartSelection} style={{ marginLeft: 'auto' }}>
            Select
          </button>
        )}
      </header>
      <div>
        {items.length ? (
          items.map((item) => (
            <article key={item.id} onClick={() => onOpenSource && onOpenSource(item)} style={{ cursor: 'pointer', opacity: isSelecting && !selectedIds.has(item.id) ? 0.6 : 1 }} className="drawer-task">
              {isSelecting && completed ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>
                  {selectedIds.has(item.id) ? (
                    <CheckSquare size={24} color="var(--petrol-light)" weight="fill" />
                  ) : (
                    <Square size={24} color="var(--muted)" />
                  )}
                </div>
              ) : (
                <button 
                  className="complete-control" 
                  onClick={(e) => { e.stopPropagation(); onToggle(item.id); }} 
                  aria-label={item.done ? `Restore ${item.title}` : `Complete ${item.title}`}
                >
                  <span>{item.done ? <Check weight="bold" /> : null}</span>
                  <em>{item.done ? "Restore" : "Complete"}</em>
                </button>
              )}
              
              <div className="reminder-copy">
                <strong>{item.title}</strong>
                <p>{item.due} · {item.time}</p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <button 
                    className="reminder-action-btn" 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === item.id ? null : item.id); }}
                  >
                    <FolderPlus weight="duotone" /> Add to space
                  </button>
                  {activeDropdownId === item.id && (
                    <div className="drawer-space-selector-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {spaces.map(space => {
                        const isConnected = space.reminderIds?.includes(item.id);
                        return (
                          <button 
                            type="button" 
                            key={space.id} 
                            onClick={(e) => { 
                              e.stopPropagation();
                              if (!isConnected) onLinkReminderToSpace(item.id, space.id); 
                              setActiveDropdownId(null); 
                            }} 
                            style={{ background: 'none', border: 'none', color: isConnected ? 'var(--petrol-light)' : 'var(--text)', textAlign: 'left', padding: '6px 8px', borderRadius: '4px', cursor: isConnected ? 'default' : 'pointer', fontSize: '13px', width: '100%', fontWeight: isConnected ? 'bold' : 'normal' }}
                          >
                            {space.title} {isConnected ? "✓" : ""}
                          </button>
                        );
                      })}
                      {spaces.length === 0 && <p style={{ fontSize: '12px', margin: 0, padding: '4px 8px', color: 'var(--text)', opacity: 0.6 }}>No spaces created.</p>}
                    </div>
                  )}
                </div>

                <button 
                  className="reminder-action-btn" 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item); }}
                >
                  Edit
                </button>

                {onDelete && (
                  <button 
                    className="reminder-action-btn" 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    style={{ color: 'var(--text)', opacity: 0.5 }}
                    title="Delete reminder"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="reminder-empty">{empty}</p>
        )}
      </div>
    </section>
  );
}
