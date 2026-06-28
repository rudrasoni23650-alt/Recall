import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, TextT, PencilSimple, ArrowRight, Check } from "@phosphor-icons/react";
import { apiFetch } from "../lib/api.js";

const ONBOARDING_SLIDES = [
  {
    icon: <PencilSimple size={48} weight="duotone" color="var(--yellow)" />,
    title: "Welcome to Focus Mode",
    description: "A distraction-free writing environment where your thoughts take center stage. No sidebars, no noise."
  },
  {
    icon: <CheckCircle size={48} weight="duotone" color="var(--green)" />,
    title: "Auto-saving magic",
    description: "Everything you type is automatically saved to your memories in the background. Just write, we'll handle the rest."
  }
];

function FocusOnboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      localStorage.setItem("focusModeOnboardingSeenV2", "true");
      onComplete();
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="focus-onboarding-scrim">
      <div className="focus-onboarding-modal">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="focus-onboarding-icon">
              {slide.icon}
            </div>
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
          </motion.div>
        </AnimatePresence>
        
        <div className="focus-onboarding-actions">
          <div className="focus-onboarding-dots">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <div key={idx} className={`focus-onboarding-dot ${idx === currentSlide ? "active" : ""}`} />
            ))}
          </div>
          <button className="primary-button" onClick={nextSlide}>
            {currentSlide === ONBOARDING_SLIDES.length - 1 ? (
              <><Check weight="bold" /> Get Started</>
            ) : (
              <>Next <ArrowRight weight="bold" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FocusMode({ onClose, onSaveComplete }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [memoryId, setMemoryId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("focusModeOnboardingSeenV2") !== "true";
  });
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const saveTimeoutRef = useRef(null);

  // Auto-save logic
  useEffect(() => {
    if (!content.trim() || showOnboarding) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const payload = {
          type: "note",
          title: content.split("\n")[0].slice(0, 50) || "Focus Note",
          excerpt: content.slice(0, 200),
          body: content,
          plainText: content,
          captureSource: "focus_mode",
          processingStatus: "pending"
        };
        
        let res;
        if (memoryId) {
          res = await apiFetch(`/api/memories/${memoryId}`, {
            method: "PUT",
            body: JSON.stringify({ memory: payload })
          });
        } else {
          res = await apiFetch("/api/memories", {
            method: "POST",
            body: JSON.stringify({ memory: payload })
          });
        }
        
        if (res.success && res.memories?.length) {
          const savedMemory = res.memories[0];
          setMemoryId(savedMemory.id);
          if (onSaveComplete) onSaveComplete(savedMemory);
        }
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setSaving(false);
      }
    }, 1500); // Debounce for 1.5 seconds

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content, showOnboarding, memoryId, onSaveComplete]);

  const toggleFont = () => {
    setFontFamily(prev => prev === "sans-serif" ? "serif" : "sans-serif");
  };

  return (
    <motion.div
      className="focus-mode-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="focus-mode-header">
        <div className="focus-mode-status">
          {saving ? "Saving..." : memoryId ? <><CheckCircle weight="fill" color="var(--green)" /> Saved</> : ""}
        </div>
        <div className="focus-mode-actions">
          <button className="icon-button" onClick={toggleFont} aria-label="Toggle typography">
            <TextT weight="bold" />
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Exit focus mode">
            <X weight="bold" />
          </button>
        </div>
      </header>

      <main className="focus-mode-main">
        <textarea
          className={`focus-mode-textarea font-${fontFamily}`}
          autoFocus={!showOnboarding}
          placeholder="Start writing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
        />
      </main>

      <AnimatePresence>
        {showOnboarding && <FocusOnboarding onComplete={() => setShowOnboarding(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
