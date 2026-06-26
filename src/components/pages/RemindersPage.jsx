import { useState } from "react";
import { Bell, Check, Plus, FolderPlus } from "@phosphor-icons/react";

export function RemindersPage({ reminders, memories, spaces = [], onLinkReminderToSpace, onToggleReminder, onSelectMemory, onCapture }) {
  const today = reminders.filter((item) => !item.done && item.due === "Today");
  const upcoming = reminders.filter((item) => !item.done && item.due !== "Today");
  const done = reminders.filter((item) => item.done);
  
  const openSource = (item) => {
    const source = memories.find((memory) => memory.id === item.sourceId);
    if (source) onSelectMemory(source);
  };

  return (
    <div className="subpage reminders-page">
      <div className="subpage-heading subpage-heading--with-action">
        <div>
          <span className="page-kicker">Context that asks for attention</span>
          <h1>Reminders</h1>
          <p>Every reminder keeps a clear path back to the memory that created it.</p>
        </div>
        <button className="page-action-button" onClick={onCapture}>
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
        completed 
      />
    </div>
  );
}

function ReminderSection({ number, title, items, spaces, onLinkReminderToSpace, empty, onToggle, onOpenSource, completed = false }) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  return (
    <section className={completed ? "reminder-ledger is-completed" : "reminder-ledger"}>
      <header>
        <span>{number}</span>
        <h2>{title}</h2>
        <small>{items.length}</small>
      </header>
      <div>
        {items.length ? (
          items.map((item) => (
            <article key={item.id}>
              <button 
                className="complete-control" 
                onClick={() => onToggle(item.id)} 
                aria-label={item.done ? `Restore ${item.title}` : `Complete ${item.title}`}
              >
                <span>{item.done ? <Check weight="bold" /> : null}</span>
                <em>{item.done ? "Restore" : "Complete"}</em>
              </button>
              
              <div className="reminder-copy">
                <strong>{item.title}</strong>
                <p>{item.due} · {item.time}</p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {item.sourceId && (
                  <button className="source-link" type="button" onClick={() => onOpenSource(item)}>
                    <Bell weight="duotone" /> From {item.source}
                  </button>
                )}
                
                <div style={{ position: "relative" }}>
                  <button 
                    className="source-link" 
                    type="button" 
                    onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
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
                            onClick={() => { 
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
