import { useState } from "react";
import { CalendarBlank, MagnifyingGlass, Plus, Sparkle } from "@phosphor-icons/react";
import { Sidebar } from "./Sidebar.jsx";
import { MobileNav } from "./MobileNav.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { MemoriesPage } from "./pages/MemoriesPage.jsx";
import { SpacesPage } from "./pages/SpacesPage.jsx";
import { RemindersPage } from "./pages/RemindersPage.jsx";
import { MemoryCard } from "./MemoryCard.jsx";

const pageComponents = { home: HomePage, memories: MemoriesPage, spaces: SpacesPage, reminders: RemindersPage };

export function Workspace(props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const Page = pageComponents[props.activePage] ?? HomePage;

  return (
    <main className="app-shell">
      <Sidebar {...props} profileOpen={profileOpen} onToggleProfile={() => setProfileOpen((value) => !value)} />
      <section className="workspace-canvas">
        <header className="workspace-header">
          <button className="search-trigger" type="button" onClick={props.onSearch}>
            <MagnifyingGlass size={21} /><span>Search your memories</span><kbd>⌘ K</kbd>
          </button>
          <button className="capture-button" type="button" onClick={props.onCapture}>
            <span className="capture-dot"><Plus size={14} weight="bold" /></span><span>Capture</span>
          </button>
        </header>
        <Page {...props} />
      </section>
      <aside className="context-rail">
        <section className="context-section context-today">
          <div className="context-heading"><h2>Today</h2><CalendarBlank size={22} /></div>
          <p className="context-date">Friday, June 20</p>
          <div className="agenda-item"><time>10:00 AM</time><span /><p><strong>Deep work</strong><small>Brief & messaging</small></p></div>
          <div className="agenda-item"><time>1:30 PM</time><span /><p><strong>User interview</strong><small>Maya Chen</small></p></div>
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
          {props.memories.length ? <MemoryCard memory={props.memories[1] ?? props.memories[0]} variant="compact" context="Related to today" onSelect={props.onSelectMemory} /> : <p className="rail-empty">Related memories will appear here.</p>}
        </section>
        <button className="mobile-ask" type="button" onClick={props.onAsk}><Sparkle weight="fill" /> Ask Second Signal</button>
      </aside>
      <MobileNav {...props} />
      {profileOpen ? <button className="profile-scrim" type="button" aria-label="Close profile menu" onClick={() => setProfileOpen(false)} /> : null}
    </main>
  );
}
