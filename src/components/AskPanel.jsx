import { useState, useRef, useEffect } from "react";
import { ArrowUp, FileText, Sparkle, X } from "@phosphor-icons/react";
import { motion } from "motion/react";

export function AskPanel({ memories, onSelectMemory, onClose }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState([]); // Array of { sender: 'user'|'ai', text: string, sources?: Array }
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive or asking state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const ask = () => {
    const queryText = question.trim();
    if (!queryText || asking) return;
    
    // Add user message to state
    const newMessages = [...messages, { sender: "user", text: queryText }];
    setMessages(newMessages);
    setQuestion("");
    setAsking(true);
    
    fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: queryText })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages([...newMessages, { sender: "ai", text: data.answer, sources: data.sources || [] }]);
        } else {
          setMessages([...newMessages, { sender: "ai", text: "I encountered an error querying your memories.", sources: [] }]);
        }
        setAsking(false);
      })
      .catch((err) => {
        console.error("Ask API error:", err);
        setMessages([...newMessages, { sender: "ai", text: "Connection failed. Please check your local server.", sources: [] }]);
        setAsking(false);
      });
  };

  const openSource = (memory) => {
    onClose();
    onSelectMemory(memory);
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3);
        const lines = content.split('\n');
        let language = '';
        let code = content;
        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
          language = lines[0];
          code = lines.slice(1).join('\n');
        }
        return (
          <pre key={index} className="code-block" data-language={language}>
            <code>{code}</code>
          </pre>
        );
      }
      
      const subParts = part.split(/(`[^`\n]+`)/g);
      return (
        <span key={index} style={{ whiteSpace: "pre-wrap" }}>
          {subParts.map((subPart, subIndex) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return <code key={subIndex} className="inline-code">{subPart.slice(1, -1)}</code>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div
      className="drawer-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.aside
        className="ask-panel"
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        role="dialog"
        aria-modal="true"
        aria-label="Ask Recall"
      >
        <header>
          <div>
            <Sparkle weight="fill" />
            <span>Ask Recall</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close Ask Recall">
            <X />
          </button>
        </header>
        <div className="ask-body">
          {messages.length === 0 ? (
            <div className="ask-empty">
              <Sparkle weight="duotone" />
              <h2>Ask what your memories know.</h2>
              <p>Try “What themes keep appearing in my launch research?”</p>
            </div>
          ) : (
            <div className="chat-container">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble chat-bubble--${msg.sender}`}>
                  {msg.sender === "ai" && <span className="bubble-label">Answer from your space</span>}
                  <div className="bubble-content">
                    {renderMessageText(msg.text)}
                  </div>
                  {msg.sources && msg.sources.length ? (
                    <div className="answer-sources">
                      <small>Referenced memories · select one to inspect</small>
                      <div className="sources-list">
                        {msg.sources.map((memory) => (
                          <button type="button" key={memory.id} onClick={() => openSource(memory)}>
                            <FileText /> {memory.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              
              {asking && (
                <div className="chat-bubble chat-bubble--ai ask-loading">
                  <Sparkle weight="fill" className="loading-sparkle" />
                  <div className="shimmer-line" />
                  <div className="shimmer-line shorter" />
                  <div className="shimmer-line" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <form
          className="ask-form"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your memories…"
            disabled={asking}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask();
              }
            }}
          />
          <button aria-label="Ask question" disabled={asking || !question.trim()}>
            <ArrowUp weight="bold" />
          </button>
        </form>
      </motion.aside>
    </motion.div>
  );
}
