import { useState } from "react";
import { CalendarBlank, MagnifyingGlass, Plus, Sparkle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar.jsx";
import { MobileNav } from "./MobileNav.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { MemoriesPage } from "./pages/MemoriesPage.jsx";
import { SpacesPage } from "./pages/SpacesPage.jsx";
import { RemindersPage } from "./pages/RemindersPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { MemoryCard } from "./MemoryCard.jsx";
import { FocusMode } from "./FocusMode.jsx";
import { PencilSimple } from "@phosphor-icons/react";

const pageComponents = { home: HomePage, memories: MemoriesPage, spaces: SpacesPage, reminders: RemindersPage, profile: ProfilePage, account: AccountPage };

export function Workspace(props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const Page = pageComponents[props.activePage] ?? HomePage;

  const todayDateStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  
  const todayReminders = (props.reminders || []).filter(r => r.due === "Today" && !r.done);
  const groupedReminders = {};
  todayReminders.forEach(r => {
    const t = r.time || "All Day";
    if (!groupedReminders[t]) groupedReminders[t] = [];
    groupedReminders[t].push(r);
  });

  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === "All Day") return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, h, m, ampm] = match;
    h = parseInt(h, 10);
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 24;
    return h * 60 + parseInt(m, 10);
  };

  const sortedTimes = Object.keys(groupedReminders).sort((a, b) => parseTime(a) - parseTime(b));

  return (
    <main className="app-shell">
      <Sidebar {...props} profileOpen={profileOpen} onToggleProfile={() => setProfileOpen((value) => !value)} />
      <section className="workspace-canvas">
        <header className="workspace-header">
          <button className="search-trigger" type="button" onClick={props.onSearch}>
            <MagnifyingGlass size={21} /><span>Search your memories</span><kbd>⌘ K</kbd>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="page-action-button" type="button" onClick={() => setFocusModeOpen(true)}>
              <PencilSimple size={16} weight="bold" /> Focus
            </button>
            <button className="capture-button" type="button" onClick={props.onCapture}>
              <span className="capture-dot"><Plus size={14} weight="bold" /></span><span>Capture</span>
            </button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={props.activePage}
            initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(5px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.8 }}
            style={{ minWidth: 0, width: "100%", overflowX: "hidden" }}
          >
            <Page {...props} />
          </motion.div>
        </AnimatePresence>
      </section>
      <aside className="context-rail">
        <section className="context-section context-today">
          <div className="context-heading"><h2>Today</h2><CalendarBlank size={22} /></div>
          <p className="context-date">{todayDateStr}</p>
          {sortedTimes.length > 0 ? (
            sortedTimes.map(time => {
              const items = groupedReminders[time];
              const titles = items.map(i => i.title).join(", ");
              return (
                <div className="agenda-item" key={time}>
                  <time>{time}</time>
                  <span />
                  <p><strong>{titles}</strong></p>
                </div>
              );
            })
          ) : (
            <p className="rail-empty">No agenda for today.</p>
          )}
        </section>
        <section className="context-section">
          <div className="context-heading"><h2>Reminders</h2><span>{props.reminders.filter((item) => !item.done).length}</span></div>
          <div className="rail-reminders">
            {props.reminders.length ? props.reminders.slice(0, 2).map((item) => (
              <label className={item.done ? "rail-reminder is-done" : "rail-reminder"} key={item.id}>
                <input type="checkbox" checked={item.done} onChange={() => props.onToggleReminder(item.id)} />
                <span className="check-ring" /><span>{item.title}<small>{item.due}</small></span>
              </label>
            )) : <p className="rail-empty">Nothing is asking for your attention.</p>}
          </div>
        </section>
        <section className="context-section related-section">
          <div className="context-heading"><h2>Related memory</h2></div>
          {props.memories.length ? <MemoryCard memory={props.memories[1] ?? props.memories[0]} variant="compact" context="Related to today" onSelect={props.onSelectMemory} onEdit={props.onEditMemory} /> : <p className="rail-empty">Related memories will appear here.</p>}
        </section>
        <button className="mobile-ask" type="button" onClick={props.onAsk}><Sparkle weight="fill" /> Ask Recall</button>
      </aside>
      <MobileNav {...props} />
      {profileOpen ? <button className="profile-scrim" type="button" aria-label="Close profile menu" onClick={() => setProfileOpen(false)} /> : null}

      <AnimatePresence>
        {focusModeOpen && (
          <FocusMode 
            onClose={() => setFocusModeOpen(false)} 
            onSaveComplete={(mem) => {
              if (props.onMemoryUpsert) props.onMemoryUpsert(mem);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
