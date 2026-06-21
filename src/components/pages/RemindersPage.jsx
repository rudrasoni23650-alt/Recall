import { Bell, Check, Plus } from "@phosphor-icons/react";

export function RemindersPage({ reminders, memories, onToggleReminder, onSelectMemory, onCapture }) {
  const today = reminders.filter((item) => !item.done && item.due === "Today");
  const upcoming = reminders.filter((item) => !item.done && item.due !== "Today");
  const done = reminders.filter((item) => item.done);
  const openSource = (item) => {
    const source = memories.find((memory) => memory.id === item.sourceId);
    if (source) onSelectMemory(source);
  };
  return <div className="subpage reminders-page"><div className="subpage-heading subpage-heading--with-action"><div><span className="page-kicker">Context that asks for attention</span><h1>Reminders</h1><p>Every reminder keeps a clear path back to the memory that created it.</p></div><button className="page-action-button" onClick={onCapture}><Plus weight="bold" /> New reminder</button></div><ReminderSection number="01" title="Today" items={today} empty="Nothing else is due today." onToggle={onToggleReminder} onOpenSource={openSource} /><ReminderSection number="02" title="Upcoming" items={upcoming} empty="No upcoming reminders." onToggle={onToggleReminder} onOpenSource={openSource} /><ReminderSection number="03" title="Completed" items={done} empty="Completed reminders will collect here." onToggle={onToggleReminder} onOpenSource={openSource} completed /></div>;
}

function ReminderSection({ number, title, items, empty, onToggle, onOpenSource, completed = false }) {
  return <section className={completed ? "reminder-ledger is-completed" : "reminder-ledger"}><header><span>{number}</span><h2>{title}</h2><small>{items.length}</small></header><div>{items.length ? items.map((item) => <article key={item.id}><button className="complete-control" onClick={() => onToggle(item.id)} aria-label={item.done ? `Restore ${item.title}` : `Complete ${item.title}`}><span>{item.done ? <Check weight="bold" /> : null}</span><em>{item.done ? "Restore" : "Complete"}</em></button><div className="reminder-copy"><strong>{item.title}</strong><p>{item.due} · {item.time}</p></div><button className="source-link" type="button" onClick={() => onOpenSource(item)} disabled={!item.sourceId}><Bell weight="duotone" /> From {item.source}</button></article>) : <p className="reminder-empty">{empty}</p>}</div></section>;
}
