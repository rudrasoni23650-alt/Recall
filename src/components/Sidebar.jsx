import { Bell, CaretDown, CirclesThreePlus, House, Sparkle, Stack } from "@phosphor-icons/react";

const navItems = [
  { id: "home", label: "Home", icon: House },
  { id: "memories", label: "Memories", icon: Stack },
  { id: "spaces", label: "Spaces", icon: CirclesThreePlus },
  { id: "reminders", label: "Reminders", icon: Bell },
];

export function Sidebar({ session, activePage, onNavigate, onAsk, profileOpen, onToggleProfile, onSignOut }) {
  return (
    <aside className="sidebar">
      <div>
        <button className="brand" type="button" onClick={() => onNavigate("home")}>Second Signal</button>
        <span className="sidebar-label">Workspace</span>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button className={activePage === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => onNavigate(item.id)}><Icon size={23} weight={activePage === item.id ? "duotone" : "regular"} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="nav-rule" />
        <span className="sidebar-label sidebar-label--intelligence">Intelligence</span>
        <button className="ask-button" type="button" onClick={onAsk}><Sparkle size={19} weight="duotone" /><span>Ask Second Signal</span></button>
      </div>
      <div className="profile-wrap">
        <span className="sidebar-label sidebar-label--account">Your space</span>
        {profileOpen ? <div className="profile-menu"><button type="button" onClick={onSignOut}>Return to welcome screen</button><button type="button" onClick={() => { localStorage.removeItem("second-signal-state-v1"); window.location.reload(); }}>Reset local demo</button></div> : null}
        <button className="profile-button" type="button" onClick={onToggleProfile} aria-expanded={profileOpen}>
          <span className="avatar">AK</span><span><strong>{session.name}</strong><small>Local & private</small></span><CaretDown />
        </button>
      </div>
    </aside>
  );
}
