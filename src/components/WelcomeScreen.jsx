import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Check,
  CirclesThreePlus,
  CloudSlash,
  Export,
  FileText,
  Gear,
  GithubLogo,
  GoogleLogo,
  House,
  Image,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  Microphone,
  ShieldCheck,
  SignOut,
  Sparkle,
  Stack,
  User,
  Waveform,
  X,
} from "@phosphor-icons/react";
import boardImage from "../assets/privacy-positioning-board.png";
import memoryDeskEditorial from "../assets/memory-desk-editorial.png";
import heroNotebook from "../assets/second-signal-notebook-hero.png";
import heroNotebookAnimation from "../assets/hero-notebook-animation.mp4";
import logoLightTransparent from "../assets/logo-light-alpha.png";

const capabilities = [
  { number: "01", title: "Capture in any form", text: "Save notes, links, images, files, and voice before the useful part disappears.", icon: Microphone },
  { number: "02", title: "Understand quietly", text: "Recall creates a useful title, summary, source trail, and related context without more filing.", icon: Sparkle },
  { number: "03", title: "Find by meaning", text: "Search for the idea you half remember instead of guessing where you saved it.", icon: MagnifyingGlass },
  { number: "04", title: "Keep every source", text: "Answers and reminders lead back to the memory they came from, so context never becomes a black box.", icon: LinkSimple },
];

const principles = [
  ["Local-first direction", "The MVP keeps your captures in this browser. The product direction is explicit storage control rather than invisible syncing."],
  ["Sources before claims", "Summaries, answers, and actions preserve a clear route back to the original note, link, file, or recording."],
  ["Useful without upkeep", "Automatic relationships and resurfacing reduce the need for folders, naming rules, and a system you must constantly maintain."],
  ["Portable by design", "Your memory space should remain exportable and understandable outside Recall."],
];

const faqs = [
  ["Is Recall another notes app?", "No. Notes are one input. Recall is a private memory space for everything you want to keep, connect, and understand."],
  ["Where is my information stored?", "This MVP stores demo data in your browser. The product direction is local-first, exportable, and explicit about when AI is used."],
  ["Does the demo use real AI?", "The current MVP uses a local simulation, designed so a real model provider can replace it later without changing the interface."],
  ["Can I bring screenshots and recordings?", "Yes. Capture supports files, links, images, notes, reminders, and browser voice recording where the browser permits it."],
];

export function WelcomeScreen({ session, onEnter, onNavigateToApp }) {
  const { scrollYProgress } = useScroll();
  const yParallaxFast = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yParallaxSlow = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const popularSpring = { type: "spring", stiffness: 140, damping: 12, mass: 1, bounce: 0.5 };
  const vp = { once: true, amount: 0.15 };
  const [authMode, setAuthMode] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [openPrinciple, setOpenPrinciple] = useState(0);
  const [welcomeDropdownOpen, setWelcomeDropdownOpen] = useState(false);

  const initials = session?.name 
    ? session.name.slice(0, 2).toUpperCase() 
    : session?.user?.email 
      ? session.user.email.slice(0, 2).toUpperCase() 
      : "DU";

  // Close dropdown on click outside using element.closest() traversing
  useEffect(() => {
    if (!welcomeDropdownOpen) return;
    const handleClickOutside = (event) => {
      const isInside = event.target.closest(".welcome-profile-dropdown") || event.target.closest(".welcome-account-actions");
      if (!isInside) {
        setWelcomeDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [welcomeDropdownOpen]);

  // Listen for App.jsx to signal that anonymous auth failed → open real auth modal
  useEffect(() => {
    const handler = (e) => setAuthMode(e.detail?.mode || "create");
    window.addEventListener("recall:open-auth", handler);
    return () => window.removeEventListener("recall:open-auth", handler);
  }, []);

  return (
    <main className="welcome-shell">
      <div className="welcome-frame">
        <section className="welcome-hero hero-full-bg" id="top">
          <div 
            className="hero-background-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              overflow: "hidden"
            }}
          >
            <video
              src={heroNotebookAnimation}
              poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              style={{
                backgroundImage: `url(${heroNotebook})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
              className="hero-background-video"
              autoPlay
              muted
              playsInline
              aria-hidden="true"
            />
          </div>
          <nav className="welcome-nav" aria-label="Welcome navigation">
            <a className="brand brand--welcome" href="#top" aria-label="Recall home"><img src={logoLightTransparent} alt="Recall Logo" className="brand-logo" /> Recall</a>
            <div className="welcome-links">
              <a href="#about">About</a>
              <a href="#features">Features</a>
              <a href="#privacy">Privacy</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="welcome-account-actions">
              {session ? (
                <div style={{ position: "relative" }}>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={() => setWelcomeDropdownOpen(!welcomeDropdownOpen)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.15)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.35)",
                      fontSize: "13px",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)"
                    }}
                  >
                    {initials}
                  </motion.button>
                  {welcomeDropdownOpen && (
                    <div className="welcome-profile-dropdown">
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", marginBottom: "4px" }}>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--petrol)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {session.name || session.user?.email || "Demo User"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--muted)" }}>
                          {session.isDemo ? "Local Sandbox Demo" : "Cloud Account"}
                        </p>
                      </div>

                      <span className="welcome-dropdown-section-title" style={{ borderTop: "none", marginTop: 0 }}>Workspace</span>
                      
                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("home")}
                      >
                        <House size={16} weight="duotone" />
                        <span>Enter Workspace</span>
                      </button>
                      
                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("memories")}
                      >
                        <Stack size={16} weight="duotone" />
                        <span>Memory Library</span>
                      </button>
                      
                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("spaces")}
                      >
                        <CirclesThreePlus size={16} weight="duotone" />
                        <span>Spaces</span>
                      </button>

                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("reminders")}
                      >
                        <Bell size={16} weight="duotone" />
                        <span>Reminders</span>
                      </button>

                      <span className="welcome-dropdown-section-title">Settings</span>
                      
                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("profile")}
                      >
                        <User size={16} weight="duotone" />
                        <span>Profile & Theme</span>
                      </button>

                      <button 
                        className="welcome-dropdown-item"
                        onClick={() => onNavigateToApp("account")}
                      >
                        <Gear size={16} weight="duotone" />
                        <span>Account Settings</span>
                      </button>

                      <span className="welcome-dropdown-section-title">Actions</span>

                      <button 
                        className="welcome-dropdown-item welcome-dropdown-item--danger"
                        onClick={async () => {
                          const { supabase } = await import("../lib/supabase.js");
                          await supabase.auth.signOut();
                          window.location.reload();
                        }}
                      >
                        <SignOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="secondary-button" type="button" onClick={() => setAuthMode("signin")}>Sign in</motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="primary-button" type="button" onClick={() => setAuthMode("create")}>Create your space</motion.button>
                </>
              )}
            </div>
          </nav>

          <motion.div className="hero-content hero-content--left" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            <div className="hero-statement">
                <motion.h1 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>A private space for everything worth remembering.</motion.h1>
                <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Notes, links, images, recordings, and useful fragments can live together without becoming another system to maintain.</motion.p>
                <motion.div className="hero-actions" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="primary-button" type="button" onClick={() => onEnter("demo")}>Explore the demo <ArrowRight weight="bold" /></motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="secondary-button" type="button" onClick={() => setAuthMode("create")}>Create yours</motion.button>
                </motion.div>
              
            </div>
          </motion.div>
        </section>

        <motion.section className="proof-band" aria-label="Recall product facts" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><FileText weight="duotone" /><span><strong>Five capture formats</strong><small>Notes, links, files, images, voice</small></span></motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><LinkSimple weight="duotone" /><span><strong>Source-linked answers</strong><small>Every insight keeps its trail</small></span></motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><CloudSlash weight="duotone" /><span><strong>Local-first MVP</strong><small>Your demo stays in this browser</small></span></motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><Export weight="duotone" /><span><strong>Portable by design</strong><small>Your memory should remain yours</small></span></motion.div>
        </motion.section>

        <motion.section className="welcome-story" id="about" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <div className="story-copy">
            <motion.span variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>About Recall</motion.span>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>A second space.<br />Not a second job.</motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Your useful context is already scattered across notes, screenshots, recordings, links, and unfinished documents. Recall gives those fragments one calm place to collect, connect, and become understandable.</motion.p>
            <motion.a href="#features" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>See how it works <ArrowRight /></motion.a>
          </div>
          <motion.div className="story-visual" style={{ y: yParallaxFast }} variants={{ hidden: { opacity: 0, scale: 0.85, rotateZ: 2 }, visible: { opacity: 1, scale: 1, rotateZ: 0, transition: popularSpring } }}>
            <img src={memoryDeskEditorial} alt="Connected notes, recordings, images, and source documents arranged as an organized memory desk" />
            <div className="story-memory-note"><Sparkle weight="fill" /><span><strong>Understood automatically</strong><small>Summary, sources, and a useful next step</small></span></div>
            <div className="story-source-note"><ShieldCheck weight="duotone" /> Original sources kept</div>
          </motion.div>
        </motion.section>

        <motion.section className="welcome-metrics" aria-label="Product principles in numbers" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <header className="metrics-intro">
            <motion.span variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>One memory system</motion.span>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Different inputs.<br />One clear trail.</motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Recall keeps every format connected to its original context, so useful details stay understandable when they return.</motion.p>
          </header>
          <div className="metric-grid">
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.05, y: -10, rotateZ: -1 }} whileTap={{ scale: 0.95 }}>
              <small>Capture</small>
              <strong>5</strong>
              <h3>Ways to save</h3>
              <p>Notes, links, images, files, and voice all belong in the same space.</p>
            </motion.article>
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.05, y: -10, rotateZ: 1 }} whileTap={{ scale: 0.95 }}>
              <small>Connect</small>
              <strong>1</strong>
              <h3>Memory space</h3>
              <p>No parallel filing systems or maintenance rituals to keep everything useful.</p>
            </motion.article>
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.05, y: -10, rotateZ: -1 }} whileTap={{ scale: 0.95 }}>
              <small>Trace</small>
              <strong>100%</strong>
              <h3>Source-linked</h3>
              <p>Every summary, answer, and reminder keeps a route back to its origin.</p>
            </motion.article>
          </div>
        </motion.section>

        <motion.section className="capabilities-section" id="features" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <header className="reference-section-heading">
            <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><span>What it does</span><h2>Built to hold more<br />than notes.</h2></motion.div>
            <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Recall supports the whole memory loop: save quickly, understand quietly, find naturally, and act with the original context close by.</motion.p>
          </header>
          <div className="capability-grid">
            {capabilities.map(({ number, title, text, icon: Icon }, index) => (
              <motion.article className={index === 1 ? "is-emphasized" : ""} key={number} variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.03, y: -8, rotateZ: index % 2 === 0 ? 2 : -2, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.97 }}>
                <div><span>{number}</span><Icon weight="duotone" /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#workflows"><span><ArrowRight /></span> See the workflow</a>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section className="privacy-section" id="privacy" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div className="privacy-visual" variants={{ hidden: { opacity: 0, y: 100, scale: 0.85, rotateZ: 2 }, visible: { opacity: 1, y: 0, scale: 1, rotateZ: 0, transition: popularSpring } }}>
            <img src={heroNotebook} alt="Recall notebook representing a private personal memory space" />
            <span><LockKey weight="duotone" /> Private by direction</span>
          </motion.div>
          <div className="privacy-copy">
            <motion.span variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Why Recall</motion.span>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Quietly intelligent.<br />Clearly accountable.</motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>AI should make a memory space easier to understand, not harder to trust.</motion.p>
            <motion.div className="principle-list" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>
              {principles.map(([title, description], index) => (
                <article className={openPrinciple === index ? "is-open" : ""} key={title}>
                  <button type="button" onClick={() => setOpenPrinciple(openPrinciple === index ? -1 : index)} aria-expanded={openPrinciple === index}>
                    <span>{title}</span><span>{openPrinciple === index ? "−" : "+"}</span>
                  </button>
                  {openPrinciple === index ? <p>{description}</p> : null}
                </article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section className="hiw-section" id="workflows" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}>
          <header className="workflow-heading">
            <motion.span variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: popularSpring } }}>How it works</motion.span>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: popularSpring } }}>From a thought<br />to something lasting.</motion.h2>
            <motion.p variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: popularSpring } }}>Recall turns scattered input into a connected memory — quietly, without extra work from you.</motion.p>
          </header>

          <div className="hiw-steps">
            {[
              { n: "01", icon: Microphone, label: "Capture", title: "Save it before it fades", body: "Drop in a note, paste a link, upload an image, record your voice, or set a reminder. Any format, any moment — Recall takes it as-is." },
              { n: "02", icon: Sparkle, label: "Understand", title: "Recall reads it so you don't have to", body: "The AI creates a clean title, a two-sentence summary, and surfaces the action buried inside — no tagging, no filing, no prompt needed." },
              { n: "03", icon: MagnifyingGlass, label: "Find", title: "Search by meaning, not keywords", body: "Ask a half-remembered question in plain language. Recall finds the memory that matches the idea, not just the exact words you used." },
              { n: "04", icon: LinkSimple, label: "Act", title: "Every answer leads somewhere real", body: "Reminders, summaries, and AI answers each carry a clickable trail back to the source memory — so context is never a black box." },
            ].map(({ n, icon: Icon, label, title, body }, i, arr) => (
              <motion.div
                key={n}
                className="hiw-step"
                variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: popularSpring } }}
              >
                <div className="hiw-step-left">
                  <span className="hiw-step-number">{n}</span>
                  {i < arr.length - 1 && <div className="hiw-connector" />}
                </div>
                <div className="hiw-step-body">
                  <div className="hiw-step-icon"><Icon weight="duotone" /></div>
                  <span className="hiw-step-label">{label}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            className="workflow-demo-button"
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: popularSpring } }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => onEnter("demo")}
          >
            Try it yourself <ArrowRight />
          </motion.button>
        </motion.section>

        <motion.section className="pricing-section pricing-section--reference" id="pricing" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <header className="reference-section-heading">
            <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><span>Simple pricing</span><h2>Start with one<br />private space.</h2></motion.div>
            <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Choose how deeply you want Recall to understand and connect what you keep.</motion.p>
          </header>
          <div className="pricing-table">
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.04, y: -10 }} whileTap={{ scale: 0.96 }}><div><span>Free</span><h3>$0</h3><p>For starting the habit.</p></div><ul><li><Check /> Personal notes and links</li><li><Check /> Local browser storage</li><li><Check /> Search and reminders</li></ul><motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="secondary-button" onClick={() => onEnter("empty")}>Create free space</motion.button></motion.article>
            <motion.article className="is-featured" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.06, y: -15, boxShadow: "0px 24px 48px rgba(0,0,0,0.2)" }} whileTap={{ scale: 0.96 }}><div><span>Signal Plus</span><h3>$8<small>/month</small></h3><p>For a memory that connects itself.</p></div><ul><li><Check /> Every capture format</li><li><Check /> Summaries and relationships</li><li><Check /> Ask your complete space</li><li><Check /> Smart resurfacing</li></ul><motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="primary-button" onClick={() => setAuthMode("create")}>Start with Plus</motion.button></motion.article>
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.04, y: -10 }} whileTap={{ scale: 0.96 }}><div><span>Signal Pro</span><h3>$16<small>/month</small></h3><p>For larger, deeper libraries.</p></div><ul><li><Check /> Everything in Plus</li><li><Check /> Advanced exports</li><li><Check /> Model and privacy controls</li><li><Check /> Priority processing</li></ul><motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="secondary-button" onClick={() => setAuthMode("create")}>Choose Pro</motion.button></motion.article>
          </div>
        </motion.section>

        <motion.section className="faq-section faq-section--reference" id="faq" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div className="section-heading" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><span>Questions, answered</span><h2>Before you trust it with a memory.</h2></motion.div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <motion.article className={openFaq === index ? "is-open" : ""} variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ x: 5 }} key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><span>{openFaq === index ? "−" : "+"}</span></button>{openFaq === index ? <p>{answer}</p> : null}</motion.article>)}</div>
        </motion.section>

        <motion.section className="final-cta final-cta--reference" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><img src={logoLightTransparent} alt="Recall Logo" className="final-cta-logo" /></motion.div>
          <motion.h2 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Make room for everything you do not want to lose.</motion.h2>
          <motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Start a private second space for the notes, images, links, and conversations worth keeping close.</motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}><motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="primary-button primary-button--large" type="button" onClick={() => setAuthMode("create")}>Create your space <ArrowRight /></motion.button><motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="footer-text-button" type="button" onClick={() => onEnter("demo")}>Explore the demo</motion.button></motion.div>
        </motion.section>
      </div>

      <footer className="app-footer welcome-footer"><div><a className="brand brand--footer" href="#top"><img src={logoLightTransparent} alt="Recall Logo" className="brand-logo" /> Recall</a><p>Your private space for everything worth remembering.</p></div><div><strong>Product</strong><a href="#features">Features</a><a href="#workflows">Workflows</a><a href="#pricing">Pricing</a></div><div><strong>Company</strong><a href="#about">About</a><a href="#faq">FAQ</a><button onClick={() => setAuthMode("signin")}>Sign in</button></div><div><strong>Principles</strong><span>Local-first</span><span>Source-grounded</span><span>Exportable</span></div><p className="footer-note">© 2026 Recall. MVP demo.</p></footer>

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onEnter={onEnter} /> : null}
    </main>
  );
}

function AuthModal({ mode, onClose, onEnter }) {
  const [email, setEmail] = useState("");
  const [emailStep, setEmailStep] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const queueFirstRunProfile = () => {
    if (mode === "create") localStorage.setItem("recall-first-run-profile-pending", "true");
  };

  const clearFirstRunProfile = () => {
    if (mode === "create") localStorage.removeItem("recall-first-run-profile-pending");
  };

  const handleGoogle = async () => {
    setLoading("google");
    setError("");
    try {
      queueFirstRunProfile();
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (err) throw err;
    } catch (err) {
      clearFirstRunProfile();
      setError(err.message || "Google sign-in failed. Check the Google provider in Supabase Auth.");
      setLoading("");
    }
  };

  const handleGithub = async () => {
    setLoading("github");
    setError("");
    try {
      queueFirstRunProfile();
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: window.location.origin }
      });
      if (err) throw err;
    } catch (err) {
      clearFirstRunProfile();
      setError(err.message || "GitHub sign-in failed. Enable and configure the GitHub provider in Supabase Auth.");
      setLoading("");
    }
  };

  const handleEmail = async (event) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setLoading("email");
    setError("");
    try {
      queueFirstRunProfile();
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (err) throw err;
      setEmailSent(true);
      setLoading("");
    } catch (err) {
      clearFirstRunProfile();
      setError(err.message || "Failed to send magic link. Check email auth in Supabase.");
      setLoading("");
    }
  };

  return (
    <div className="overlay auth-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section
        initial={{ scale: 0.94, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in"><X /></button>
        <div className="auth-modal-inner">
          <span className="auth-mark">
            <img src={logoLightTransparent} alt="Recall Logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
          </span>
          <h2 id="auth-title">{mode === "create" ? "Create your memory space" : "Welcome back"}</h2>
          <p className="auth-modal-subtitle">
            {mode === "create"
              ? "Your private, AI-assisted second memory."
              : "Sign in to continue to your space."}
          </p>

          {emailSent ? (
            <div className="auth-sent-state">
              <div className="auth-sent-icon">
                <Check weight="bold" />
              </div>
              <h3>Check your inbox</h3>
              <p>We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
              <button className="quiet-button" style={{ width: "100%", borderRadius: "12px", color: "var(--muted)", fontSize: "13px" }} type="button" onClick={() => { setEmailSent(false); setEmailStep(false); }}>
                Use a different method
              </button>
            </div>
          ) : emailStep ? (
            <form onSubmit={handleEmail}>
              <label>
                Email address
                <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </label>
              {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0" }}>{error}</p>}
              <button className="primary-button" disabled={!!loading}>
                {loading === "email" ? "Sending magic link…" : "Send magic link"}
              </button>
              <button className="quiet-button" type="button" onClick={() => { setEmailStep(false); setError(""); }}>Back to all methods</button>
            </form>
          ) : (
            <>
              <div className="auth-methods">
                <button type="button" className="auth-btn-google" onClick={handleGoogle} disabled={!!loading}>
                  <GoogleLogo weight="bold" />{loading === "google" ? "Connecting…" : "Continue with Google"}
                </button>
                <button type="button" className="auth-btn-github" onClick={handleGithub} disabled={!!loading}>
                  <GithubLogo weight="bold" />{loading === "github" ? "Connecting…" : "Continue with GitHub"}
                </button>
              </div>
              <div className="auth-divider">or</div>
              <div className="auth-methods" style={{ marginBottom: 0 }}>
                <button type="button" className="auth-btn-email" onClick={() => setEmailStep(true)} disabled={!!loading}>
                  Continue with email
                </button>
              </div>
              {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.75rem 0 0", textAlign: "center" }}>{error}</p>}
            </>
          )}

          <small>Your data is stored securely in your personal Recall space.</small>
        </div>
      </motion.section>
    </div>
  );
}
