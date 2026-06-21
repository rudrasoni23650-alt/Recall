import { useState } from "react";
import {
  AppleLogo,
  ArrowRight,
  Check,
  CheckCircle,
  CirclesThreePlus,
  CloudSlash,
  GoogleLogo,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  Microphone,
  Sparkle,
  X,
} from "@phosphor-icons/react";

const features = [
  { number: "01", title: "Capture without friction", text: "Save a thought, link, image, file, or voice note before the moment disappears.", icon: Microphone },
  { number: "02", title: "Understand automatically", text: "Messy inputs become clear summaries, sources, related ideas, and useful next steps.", icon: Sparkle },
  { number: "03", title: "Find the half-remembered", text: "Search by meaning, not filenames. Describe the idea and Second Signal finds the trail.", icon: MagnifyingGlass },
  { number: "04", title: "Keep your context", text: "Every answer links back to the original memory, so AI never becomes a black box.", icon: LinkSimple },
];

const faqs = [
  ["Is Second Signal another notes app?", "No. Notes are one input. The product is built around returning useful context and actions from everything you capture."],
  ["Where is my information stored?", "This MVP stores demo data in your browser. The product direction is local-first, exportable, and explicit about when AI is used."],
  ["Does the demo use real AI?", "The current MVP uses a believable local simulation, designed so a real model provider can replace it later without changing the interface."],
  ["Can I bring screenshots and recordings?", "Yes. The capture flow supports files, links, images, notes, and browser voice recording where the browser permits it."],
];

export function WelcomeScreen({ onEnter }) {
  const [authMode, setAuthMode] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="welcome-shell">
      <nav className="welcome-nav" aria-label="Welcome navigation">
        <a className="brand brand--welcome" href="#top" aria-label="Second Signal home">Second Signal</a>
        <div className="welcome-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="welcome-account-actions">
          <button className="quiet-button" type="button" onClick={() => setAuthMode("signin")}>Sign in</button>
          <button className="nav-cta" type="button" onClick={() => setAuthMode("create")}>Create your space</button>
        </div>
      </nav>

      <section className="welcome-content" id="top">
        <div className="welcome-copy">
          <h1>Your thoughts, returned when they matter.</h1>
          <p>Capture notes, links, images, and voice. Second Signal organizes the mess and brings the useful parts back at the right moment.</p>
          <div className="welcome-actions">
            <button className="primary-button primary-button--large" type="button" onClick={() => onEnter("demo")}>Explore demo <ArrowRight weight="bold" /></button>
            <button className="secondary-button secondary-button--large" type="button" onClick={() => setAuthMode("create")}>Create your space</button>
          </div>
          <div className="privacy-line"><LockKey weight="duotone" /> Local-first demo. Your captures stay in this browser.</div>
        </div>

        <div className="welcome-preview" aria-label="Preview of a memory being organized">
          <div className="preview-topbar"><span>Second Signal</span><i>⌘ K</i></div>
          <div className="preview-canvas">
            <span className="preview-label">Returned to you</span>
            <h2>Launch brief — core messaging</h2>
            <p>An older idea that may help with what you’re doing today.</p>
            <div className="preview-memory">
              <div className="preview-source"><span>Saved note · May 9</span><strong>Your thoughts stay useful.</strong><small>Audience insights, message pillars, and customer language.</small></div>
              <div className="preview-summary"><Sparkle weight="fill" /><span>AI summary</span><p>Your strongest message is simple: capture without friction, then bring useful context back with clear sources.</p></div>
            </div>
            <div className="preview-step"><Check weight="bold" /> Suggested next step: add two customer proof points.</div>
          </div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Product principles"><span>Capture anything</span><i /><span>Organize nothing</span><i /><span>Recall with context</span><i /><span>Act at the right moment</span></section>

      <section className="marketing-section how-section" id="how">
        <div className="section-heading"><span>How it works</span><h2>Less filing.<br />More remembering.</h2><p>Second Signal turns a quick capture into a useful object without asking you to maintain another elaborate system.</p></div>
        <div className="how-steps">
          <article><span>01</span><div><h3>Drop it in</h3><p>Write, paste, upload, or speak. Capture stays deliberately faster than organization.</p></div></article>
          <article><span>02</span><div><h3>Let it settle</h3><p>Second Signal identifies the subject, useful sources, relationships, and possible actions.</p></div></article>
          <article><span>03</span><div><h3>Meet it again</h3><p>The right memory returns through search, reminders, related work, or your daily home.</p></div></article>
        </div>
      </section>

      <section className="marketing-section features-section" id="features">
        <div className="section-heading section-heading--split"><div><span>Core capabilities</span><h2>A memory space that earns its place.</h2></div><p>Every feature supports the same loop: capture, understand, connect, resurface, act.</p></div>
        <div className="feature-ledger">{features.map(({ number, title, text, icon: Icon }) => <article key={number}><span>{number}</span><Icon weight="duotone" /><div><h3>{title}</h3><p>{text}</p></div><ArrowRight /></article>)}</div>
      </section>

      <section className="marketing-section about-section" id="about">
        <div className="about-statement"><span>Why Second Signal</span><h2>Most tools help you save more. We want to help you lose less.</h2></div>
        <div className="about-copy"><p>Your best thinking is scattered across screenshots, voice notes, links, open tabs, and half-finished documents. The problem is rarely capture. It is finding the right fragment when it can change what happens next.</p><p>Second Signal is designed as a calm, private layer between collecting and acting.</p><div className="about-principles"><span><CloudSlash /> Local-first direction</span><span><LockKey /> Clear data control</span><span><CheckCircle /> Sources before claims</span></div></div>
      </section>

      <section className="marketing-section pricing-section" id="pricing">
        <div className="section-heading"><span>Simple pricing</span><h2>Start with your first signal.</h2><p>No artificial complexity. Choose how deeply you want your memory space to work.</p></div>
        <div className="pricing-table">
          <article><div><span>Free</span><h3>$0</h3><p>For building the habit.</p></div><ul><li><Check /> Unlimited personal notes</li><li><Check /> Local browser storage</li><li><Check /> Search and reminders</li></ul><button className="secondary-button" onClick={() => onEnter("empty")}>Create free space</button></article>
          <article className="is-featured"><div><span>Signal Plus</span><h3>$8<small>/month</small></h3><p>For a memory that works back.</p></div><ul><li><Check /> Every capture type</li><li><Check /> AI summaries and connections</li><li><Check /> Ask your complete space</li><li><Check /> Smart resurfacing</li></ul><button className="primary-button" onClick={() => setAuthMode("create")}>Start with Plus</button></article>
          <article><div><span>Signal Pro</span><h3>$16<small>/month</small></h3><p>For larger, deeper libraries.</p></div><ul><li><Check /> Everything in Plus</li><li><Check /> Advanced exports</li><li><Check /> Model and privacy controls</li><li><Check /> Priority processing</li></ul><button className="secondary-button" onClick={() => setAuthMode("create")}>Choose Pro</button></article>
        </div>
      </section>

      <section className="marketing-section faq-section" id="faq">
        <div className="section-heading"><span>Questions, answered</span><h2>Before you entrust us with a thought.</h2></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <article className={openFaq === index ? "is-open" : ""} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><span>{openFaq === index ? "−" : "+"}</span></button>{openFaq === index ? <p>{answer}</p> : null}</article>)}</div>
      </section>

      <section className="final-cta"><CirclesThreePlus weight="duotone" /><h2>Give your thoughts somewhere useful to return to.</h2><div><button className="primary-button primary-button--large" onClick={() => onEnter("demo")}>Explore the demo <ArrowRight /></button><button className="footer-text-button" onClick={() => setAuthMode("create")}>Create your space</button></div></section>

      <footer className="welcome-footer"><div><a className="brand brand--footer" href="#top">Second Signal</a><p>Your thoughts, returned when they matter.</p></div><div><strong>Product</strong><a href="#how">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div><div><strong>Company</strong><a href="#about">About</a><a href="#faq">FAQ</a><button onClick={() => setAuthMode("signin")}>Sign in</button></div><div><strong>Principles</strong><span>Local-first</span><span>Source-grounded</span><span>Exportable</span></div><p className="footer-note">© 2026 Second Signal. MVP demo.</p></footer>

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onEnter={onEnter} /> : null}
    </main>
  );
}

function AuthModal({ mode, onClose, onEnter }) {
  const [email, setEmail] = useState("");
  const [emailStep, setEmailStep] = useState(false);
  const [loading, setLoading] = useState("");
  const complete = (method) => {
    setLoading(method);
    window.setTimeout(() => onEnter(mode === "create" ? "empty" : "demo"), 650);
  };

  return <div className="overlay auth-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="icon-button auth-close" onClick={onClose} aria-label="Close sign in"><X /></button><span className="auth-mark">SS</span><h2 id="auth-title">{mode === "create" ? "Create your memory space" : "Welcome back"}</h2><p>{mode === "create" ? "Start locally. You can connect an account when the product moves beyond demo." : "Choose a method to enter your demo space."}</p>{emailStep ? <form onSubmit={(event) => { event.preventDefault(); if (email.includes("@")) complete("email"); }}><label>Email address<input autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><button className="primary-button" disabled={loading === "email"}>{loading === "email" ? "Opening your space…" : "Continue with email"}</button><button className="quiet-button" type="button" onClick={() => setEmailStep(false)}>Back to all methods</button></form> : <div className="auth-methods"><button onClick={() => complete("google")} disabled={!!loading}><GoogleLogo weight="bold" />{loading === "google" ? "Connecting…" : "Continue with Google"}</button><button onClick={() => complete("apple")} disabled={!!loading}><AppleLogo weight="fill" />{loading === "apple" ? "Connecting…" : "Continue with Apple"}</button><button onClick={() => setEmailStep(true)}>Continue with email</button></div>}<small>Demo authentication only. No credentials leave this browser.</small></section></div>;
}
