import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Barcode from "./Barcode.jsx";

/** Full-screen project write-up. Portalled to <body> so pinned/transformed ancestors can't trap it. */
export default function CaseStudy({ project, onClose }) {
  const [shown, setShown] = useState(project);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (project) {
      setShown(project);
      setClosing(false);
    } else if (shown) {
      setClosing(true);
      const t = window.setTimeout(() => {
        setShown(null);
        setClosing(false);
      }, 420);
      return () => window.clearTimeout(t);
    }
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!project) return;
    window.__lenis?.stop();
    document.documentElement.classList.add("is-locked");
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = panelRef.current.querySelectorAll("button, a[href]");
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
      document.documentElement.classList.remove("is-locked");
    };
  }, [project, onClose]);

  if (!shown) return null;
  const p = shown;

  return createPortal(
    <div className={`case ${closing ? "is-closing" : ""}`} onClick={onClose}>
      <div
        ref={panelRef}
        className="case__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        <button type="button" className="case__close" onClick={onClose} data-detect="close">
          Close
        </button>

        <header className="case__head">
          <h2 id="case-title" className="case__name">
            {p.name}
          </h2>
          <div className="case__label">
            <Barcode value={p.name} />
            <dl>
              <div>
                <dt>Client</dt>
                <dd>{p.client}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{p.year}</dd>
              </div>
            </dl>
          </div>
        </header>

        <p className="case__summary">{p.summary}</p>

        <div className="case__grid">
          <section>
            <h3>The problem</h3>
            <p>{p.problem}</p>
          </section>
          <section>
            <h3>What I built</h3>
            <ul className="case__built">
              {p.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Built with</h3>
            <ul className="crate__stack">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section className="case__note">
            <h3>Why it matters</h3>
            <p>{p.note}</p>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
