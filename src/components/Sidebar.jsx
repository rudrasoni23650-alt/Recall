import { Bell, CaretDown, CirclesThreePlus, House, Sparkle, Stack, X, Folders, Clock } from "@phosphor-icons/react";
import { motion } from "motion/react";
import logoLightAlpha from "../assets/logo-light-alpha.png";

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
        <motion.button className="brand" whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} type="button" onClick={() => onNavigate("home")}>
          <img src={logoLightAlpha} alt="Recall Logo" className="brand-logo" /> Recall
        </motion.button>
        <span className="sidebar-label">Workspace</span>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <motion.button style={{ outline: "none" }} className={activePage === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => onNavigate(item.id)} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}><Icon size={23} weight={activePage === item.id ? "duotone" : "regular"} /><span>{item.label}</span></motion.button>;
          })}
        </nav>
        <div className="nav-rule" />
        <span className="sidebar-label sidebar-label--intelligence">Intelligence</span>
        <motion.button className="ask-button" whileHover={{ scale: 1.02, y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} type="button" onClick={onAsk}><Sparkle size={19} weight="duotone" /><span>Ask Recall</span></motion.button>
      </div>
      <div className="profile-wrap">
        <span className="sidebar-label sidebar-label--account">Your space</span>
        {profileOpen ? <div className="profile-menu"><button type="button" onClick={onSignOut}>Return to welcome screen</button><button type="button" onClick={() => { localStorage.removeItem("recall-state-v1"); window.location.reload(); }}>Reset local demo</button></div> : null}
        <motion.button className="profile-button" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} type="button" onClick={onToggleProfile} aria-expanded={profileOpen}>
          <span className="avatar">{session.name ? session.name.slice(0,2).toUpperCase() : session.user?.email ? session.user.email.slice(0,2).toUpperCase() : "DU"}</span><span><strong>{session.name || session.user?.email || "Demo User"}</strong><small>Local & private</small></span><CaretDown />
        </motion.button>
      </div>
    </aside>
  );
}
