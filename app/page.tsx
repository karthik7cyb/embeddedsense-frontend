
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [board, setBoard] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [formNote, setFormNote] = useState(
    "Frontend preview only — connect this form to your existing backend diagnosis endpoint to submit real requests."
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openModal = () => {
    setMenuOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormNote(
      "Request details captured in this preview. Connect the submit handler to your backend API to run the RAG diagnosis."
    );
  };

  return (
    <>
      <header className="wrap header">
        <a className="brand" href="#home" aria-label="EmbeddedSense home">
          <svg className="chip" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="8" y="8" width="24" height="24" rx="3" />
            <path d="M14 2v6M20 2v6M26 2v6M14 32v6M20 32v6M26 32v6M2 14h6M2 20h6M2 26h6M32 14h6M32 20h6M32 26h6" />
          </svg>
          <span className="brand-name">
            Embedded<span>Sense</span>
          </span>
        </a>

        <button
          className="menu"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <nav className={menuOpen ? "nav show" : "nav"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it Works</a>
          <a href="#knowledge" onClick={() => setMenuOpen(false)}>Knowledge Base</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a
                href="/login"
                className="nav-cta"
              >
                Get Started <span className="arrow">→</span>
          </a>  
        </nav>
      </header>

      <main id="home">
        <section className="hero wrap">
          <div className="hero-art" aria-hidden="true" />

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="spark">✦</span>
              AI-Powered Hardware Diagnosis
            </div>

            <h1>
              Diagnose Hardware
              <br />
              Failures, <em>Faster.</em>
            </h1>

            <p className="lead">
              A RAG-powered technical assistant that helps engineers
              troubleshoot embedded systems using datasheets, manuals,
              and application notes.
            </p>

            <div className="actions">
             <a href="/try" className="primary">
                Try EmbeddedSense <span className="arrow">→</span>
            </a>

              <a className="secondary" href="#how">
                <span className="spark">▷</span> See How it Works
              </a>
            </div>

            <div className="proof">
              <div className="proof-item">
                <span className="proof-icon">ϟ</span>
                Instant Diagnosis
              </div>

              <div className="proof-item">
                <svg width="27" height="27" viewBox="0 0 28 28" fill="none" stroke="#efa4a5" strokeWidth="2">
                  <rect x="6" y="6" width="16" height="16" rx="2" />
                  <path d="M10 1v5m8-5v5m-8 16v5m8-5v5M1 10h5m16 0h5M1 18h5m16 0h5" />
                </svg>
                Built for Embedded Systems
              </div>
            </div>
          </div>
        </section>

        <section className="steps wrap" id="how">
          <article className="step">
            <div className="step-icon">▢</div>
            <h3>Describe the Issue</h3>
            <p>Enter board model, symptoms, voltages, or error logs.</p>
          </article>

          <article className="step">
            <div className="step-icon">▱</div>
            <h3>Retrieve Relevant Knowledge</h3>
            <p>Find information from datasheets, manuals, and technical docs.</p>
          </article>

          <article className="step">
            <div className="step-icon">✧</div>
            <h3>Get an AI Diagnosis</h3>
            <p>Receive possible causes, troubleshooting steps, and explanations.</p>
          </article>

          <article className="step">
            <div className="step-icon">▤</div>
            <h3>Verify with Sources</h3>
            <p>Review referenced documents and exact page numbers.</p>
          </article>
        </section>

        <section className="section wrap" id="features">
          <div className="section-kicker">Built for practical debugging</div>
          <h2>From symptoms to a clearer next step.</h2>
          <p className="section-intro">
            Bring your hardware observations into one workflow. EmbeddedSense
            is designed to help engineers navigate technical documentation
            and investigate faults systematically.
          </p>

          <div className="feature-grid">
            <article className="feature">
              <div className="step-icon">⌁</div>
              <h3>Context-aware troubleshooting</h3>
              <p>Describe the board, the failure conditions, and what you have measured.</p>
            </article>

            <article className="feature" id="knowledge">
              <div className="step-icon">▱</div>
              <h3>Technical knowledge retrieval</h3>
              <p>Find relevant passages across datasheets, manuals, and application notes.</p>
            </article>

            <article className="feature">
              <div className="step-icon">◎</div>
              <h3>Traceable explanations</h3>
              <p>Use cited source material to verify recommendations and investigate further.</p>
            </article>
          </div>
        </section>

        <section className="wrap" id="about">
          <div className="bottom-cta">
            <div>
              <div className="section-kicker">EmbeddedSense workspace</div>
              <h2>Ready to investigate a hardware issue?</h2>
              <p>Start with the symptoms. Work toward an evidence-backed diagnosis.</p>
            </div>

            <div className="actions">
              <a href="/try" className="primary">
                Try EmbeddedSense <span className="arrow">→</span>
              </a>
            </div>
            </div>
        </section>
      </main>

      <footer className="wrap footer">
        <span>© 2026 EmbeddedSense. Hardware diagnosis, made clearer.</span>
        <span>Designed for embedded engineers.</span>
      </footer>

      {modalOpen && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="dialog">
            <div className="dialog-head">
              <h2 id="dialog-title">Start a hardware diagnosis</h2>
              <button className="close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <p>Describe the hardware issue to prepare your diagnosis request.</p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="board">Board / component</label>
              <input
                id="board"
                placeholder="e.g. ESP32-WROOM-32"
                value={board}
                onChange={(event) => setBoard(event.target.value)}
                required
                autoFocus
              />

              <label htmlFor="symptoms">Observed symptoms</label>
              <textarea
                id="symptoms"
                placeholder="Describe what happens, when it happens, and any measurements..."
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                required
              />

              <button className="primary submit-button" type="submit">
                Prepare diagnosis <span className="arrow">→</span>
              </button>

              <p className="notice">{formNote}</p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
