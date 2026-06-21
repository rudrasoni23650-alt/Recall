import { Bell, CirclesThreePlus, House, Plus, Stack } from "@phosphor-icons/react";

export function MobileNav({ activePage, onNavigate, onCapture }) {
  const item = (id, label, Icon) => <button className={activePage === id ? "is-active" : ""} onClick={() => onNavigate(id)}><Icon /><span>{label}</span></button>;
  return <nav className="mobile-nav" aria-label="Mobile navigation">{item("home", "Home", House)}{item("memories", "Memories", Stack)}<button className="mobile-capture" onClick={onCapture}><Plus weight="bold" /></button>{item("spaces", "Spaces", CirclesThreePlus)}{item("reminders", "Reminders", Bell)}</nav>;
}
