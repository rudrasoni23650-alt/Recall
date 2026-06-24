import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CirclesThreePlus, Sparkle, X, ShieldCheck } from "@phosphor-icons/react";

const slides = [
  {
    icon: CirclesThreePlus,
    eyebrow: "Welcome to Sandbox",
    title: "Explore the Recall Demo",
    description: "This is a simulated workspace pre-loaded with example memories so you can experience how Recall organizes information in real time."
  },
  {
    icon: Sparkle,
    eyebrow: "Interactive Features",
    title: "Everything is functional",
    description: "Feel free to capture new notes, upload images, open existing memories, check connected reminders, or use 'Ask Recall' to search."
  },
  {
    icon: ShieldCheck,
    eyebrow: "Secure & Cloud-Saved",
    title: "Get your own private space",
    description: "Ready to start saving your real memories? Simply click 'Return to welcome screen' in the sidebar menu and sign in using Google or Email."
  }
];

export function DemoTourModal({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const SlideIcon = slides[currentSlide].icon;

  return (
    <div className="tour-overlay">
      <motion.div
        className="tour-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
      >
        <button className="tour-close" type="button" onClick={onClose} aria-label="Close onboarding tour">
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="tour-slide"
          >
            <div className="tour-icon">
              <SlideIcon weight="duotone" />
            </div>
            <h3>{slides[currentSlide].eyebrow}</h3>
            <h2>{slides[currentSlide].title}</h2>
            <p>{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>

        <footer className="tour-footer">
          <div className="tour-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`tour-dot ${index === currentSlide ? "is-active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                type="button"
              />
            ))}
          </div>

          <div className="tour-actions">
            {currentSlide > 0 && (
              <button className="quiet-button" type="button" onClick={handleBack} style={{ minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={16} weight="bold" /> Back
              </button>
            )}
            <button className="primary-button" type="button" onClick={handleNext} style={{ minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {currentSlide === slides.length - 1 ? "Let's explore!" : "Next"} <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
