import { useState, useEffect, useRef } from "react";
import { CalendarBlank, Clock, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { formatTime } from "../lib/dateUtils.js";

export function DatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const [y, m] = value.split("-");
      return new Date(y, m - 1, 1);
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayFormat = (val) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return val;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    return { days, firstDayIndex };
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const selectDate = (day) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const { days, firstDayIndex } = getDaysInMonth(currentMonth);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="custom-picker-container" ref={containerRef} style={{ position: "relative" }}>
      <div className="custom-picker-input" onClick={() => setIsOpen(!isOpen)}>
        <span>{displayFormat(value) || "Select date"}</span>
        <CalendarBlank size={18} />
      </div>
      {isOpen && (
        <div className="custom-picker-popover date-popover">
          <div className="calendar-header">
            <button type="button" onClick={prevMonth}><CaretLeft /></button>
            <strong>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</strong>
            <button type="button" onClick={nextMonth}><CaretRight /></button>
          </div>
          <div className="calendar-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="cal-day-name">{d}</div>)}
            {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const y = currentMonth.getFullYear();
              const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
              const d = String(day).padStart(2, "0");
              const isSelected = value === `${y}-${m}-${d}`;
              const isToday = new Date().toDateString() === new Date(y, currentMonth.getMonth(), day).toDateString();
              
              return (
                <button
                  key={day}
                  type="button"
                  className={`cal-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function TimePicker({ value, onChange }) {
  // Value comes in as HH:MM format typically, but let's parse it to h:mm and AM/PM
  const [timeText, setTimeText] = useState("");
  const [ampm, setAmpm] = useState("AM");

  useEffect(() => {
    if (value) {
      if (value.includes("AM") || value.includes("PM")) {
        const parts = value.split(" ");
        setTimeText(parts[0]);
        setAmpm(parts[1] || "AM");
      } else if (value.includes(":")) {
        // HH:MM 24h
        const [hStr, mStr] = value.split(":");
        let h = parseInt(hStr, 10);
        const ampmVal = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        setTimeText(`${h}:${mStr}`);
        setAmpm(ampmVal);
      } else {
        setTimeText(value);
      }
    }
  }, [value]);

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setTimeText(val);
    
    // Convert back to format
    let h = 0, m = "00";
    if (val.includes(":")) {
      const parts = val.split(":");
      h = parseInt(parts[0], 10) || 0;
      m = parts[1].slice(0, 2) || "00";
    } else {
      h = parseInt(val, 10) || 0;
    }
    
    if (h > 12) h = 12;
    onChange(`${h}:${m} ${ampm}`);
  };

  const toggleAmPm = () => {
    const nextAmPm = ampm === "AM" ? "PM" : "AM";
    setAmpm(nextAmPm);
    onChange(`${timeText || "12:00"} ${nextAmPm}`);
  };

  return (
    <div className="custom-picker-input">
      <input 
        type="text" 
        value={timeText} 
        onChange={handleTimeChange} 
        placeholder="12:00"
        style={{ border: "none", background: "transparent", outline: "none", flex: 1, color: "var(--ink)" }}
      />
      <button 
        type="button" 
        onClick={toggleAmPm}
        className="ampm-toggle"
      >
        {ampm}
      </button>
    </div>
  );
}
