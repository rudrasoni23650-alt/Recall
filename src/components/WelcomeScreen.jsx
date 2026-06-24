import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CirclesThreePlus,
  CloudSlash,
  Export,
  FileText,
  GithubLogo,
  GoogleLogo,
  Image,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  Microphone,
  ShieldCheck,
  Sparkle,
  Stack,
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

export function WelcomeScreen({ onEnter }) {
  const { scrollYProgress } = useScroll();
  const yParallaxFast = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yParallaxSlow = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const popularSpring = { type: "spring", stiffness: 140, damping: 12, mass: 1, bounce: 0.5 };
  const vp = { once: true, amount: 0.15 };
  const [authMode, setAuthMode] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [openPrinciple, setOpenPrinciple] = useState(0);

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
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="secondary-button" type="button" onClick={() => setAuthMode("signin")}>Sign in</motion.button>
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="primary-button" type="button" onClick={() => setAuthMode("create")}>Create your space</motion.button>
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

        <motion.section className="workflow-section" id="workflows" initial="hidden" whileInView="visible" viewport={vp} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          <header className="workflow-heading"><motion.span variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Memory workflows</motion.span><motion.h2 variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>One space.<br />Different kinds of thinking.</motion.h2><motion.p variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }}>Use Recall for the work already moving through your mind.</motion.p></header>
          <div className="workflow-grid">
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
              <motion.div className="workflow-media workflow-media--board" style={{ y: yParallaxSlow }}><img src={boardImage} alt="Launch research organized into a visual positioning brief" /></motion.div>
              <span>Research and decisions</span><h3>Launch narrative</h3><p>Bring interviews, market links, and evolving messaging into one source-grounded space.</p>
            </motion.article>
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
              <motion.div className="workflow-media workflow-media--notebook" style={{ y: yParallaxSlow }}><img src={heroNotebook} alt="Notebook with visual references for a personal inspiration space" /></motion.div>
              <span>Visual memory</span><h3>Inspiration that stays useful</h3><p>Keep images and fragments recognizable without turning your library into a filing project.</p>
            </motion.article>
            <motion.article variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
              <motion.div className="workflow-media workflow-media--voice" style={{ y: yParallaxSlow }}><Waveform weight="duotone" /><div><small>Interview · 02:31</small><strong>“Control matters more than technical detail.”</strong><span>3 themes · 2 useful actions</span></div></motion.div>
              <span>Conversation memory</span><h3>Interview synthesis</h3><p>Connect the exact recording to the themes, proof points, and next steps it produced.</p>
            </motion.article>
          </div>
          <motion.button className="workflow-demo-button" variants={{ hidden: { opacity: 0, y: 60, scale: 0.92, rotateX: 10 }, visible: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: popularSpring } }} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => onEnter("demo")}>Explore all workflows <ArrowRight /></motion.button>
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

  const handleGoogle = async () => {
    setLoading("google");
    setError("");
    try {
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (err) throw err;
    } catch (err) {
      setError(err.message || "Google sign-in failed. Make sure Google OAuth is enabled in Supabase.");
      setLoading("");
    }
  };

  const handleGithub = async () => {
    setLoading("github");
    setError("");
    try {
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: window.location.origin }
      });
      if (err) throw err;
    } catch (err) {
      setError(err.message || "GitHub sign-in failed. Make sure GitHub OAuth is enabled in Supabase.");
      setLoading("");
    }
  };

  const handleEmail = async (event) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setLoading("email");
    setError("");
    try {
      const { supabase } = await import("../lib/supabase.js");
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (err) throw err;
      setEmailSent(true);
      setLoading("");
    } catch (err) {
      setError(err.message || "Failed to send magic link. Please try again.");
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
        <button className="icon-button auth-close" type="button" onClick={onClose} aria-label="Close sign in"><X /></button>
        <span className="auth-mark">
          <img src={logoLightTransparent} alt="Recall Logo" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
        </span>
        <h2 id="auth-title">{mode === "create" ? "Create your memory space" : "Welcome back"}</h2>

        {emailSent ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>✉️ Check your inbox</p>
            <p style={{ opacity: 0.7 }}>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
            <button className="quiet-button" style={{ marginTop: "1.25rem" }} type="button" onClick={() => { setEmailSent(false); setEmailStep(false); }}>Use a different method</button>
          </div>
        ) : emailStep ? (
          <form onSubmit={handleEmail}>
            <label>
              Email address
              <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
            {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.5rem 0" }}>{error}</p>}
            <button className="primary-button" disabled={!!loading}>
              {loading === "email" ? "Sending magic link…" : "Send magic link"}
            </button>
            <button className="quiet-button" type="button" onClick={() => { setEmailStep(false); setError(""); }}>Back to all methods</button>
          </form>
        ) : (
          <div className="auth-methods">
            <button type="button" onClick={handleGoogle} disabled={!!loading}>
              <GoogleLogo weight="bold" />{loading === "google" ? "Connecting…" : "Continue with Google"}
            </button>
            <button type="button" onClick={handleGithub} disabled={!!loading}>
              <GithubLogo weight="bold" />{loading === "github" ? "Connecting…" : "Continue with GitHub"}
            </button>
            <button type="button" onClick={() => setEmailStep(true)} disabled={!!loading}>
              Continue with email
            </button>
            {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.5rem 0", textAlign: "center" }}>{error}</p>}
          </div>
        )}
        <small>Your data is stored securely in your personal Recall space.</small>
      </motion.section>
    </div>
  );
}
