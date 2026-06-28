export function isToday(dueStr) {
  if (!dueStr) return false;
  if (dueStr === "Today") return true;
  
  // Check if YYYY-MM-DD is today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  return dueStr === todayStr;
}

export function formatDue(dueStr) {
  if (!dueStr) return "";
  if (dueStr === "Today" || dueStr === "Tomorrow" || dueStr === "Next week") return dueStr;
  
  if (isToday(dueStr)) return "Today";
  
  // Format YYYY-MM-DD
  const parts = dueStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return dueStr;
}

export function formatTime(timeStr) {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  
  // Format HH:MM to h:mm AM/PM
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }
  return timeStr;
}

export function toYYYYMMDD(dueStr) {
  if (!dueStr) return "";
  if (dueStr.includes("-") && dueStr.length === 10) return dueStr; // already YYYY-MM-DD
  
  const d = new Date();
  if (dueStr === "Tomorrow") d.setDate(d.getDate() + 1);
  else if (dueStr === "Next week") d.setDate(d.getDate() + 7);
  // Default to today for "Today" or anything else unrecognized
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function toHHMM(timeStr) {
  if (!timeStr) return "";
  if (timeStr.includes(":")) {
    if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr.substring(0, 5);
    
    // Parse h:mm AM/PM to HH:MM
    const parts = timeStr.split(" ");
    if (parts.length === 2) {
      const timeParts = parts[0].split(":");
      let h = parseInt(timeParts[0], 10);
      const m = timeParts[1];
      if (parts[1] === "PM" && h < 12) h += 12;
      if (parts[1] === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }
  return "";
}
