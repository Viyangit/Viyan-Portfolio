import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROFILE } from "../data.js";
import { scrollToId } from "./Nav.jsx";

/** Ctrl/⌘ + K command menu. Also serves as the menu on small screens. */
export default function CommandMenu({ open, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [toast, setToast] = useState("");
  const inputRef = useRef(null);

  const actions = useMemo(
    () => [
      { label: "Go to work", hint: "Projects", run: () => scrollToId("work") },
      { label: "Go to experience", hint: "Internships", run: () => scrollToId("experience") },
      { label: "Go to reading", hint: "Attention Is All You Need", run: () => scrollToId("reading") },
      { label: "Go to competition record", hint: "Hackathons", run: () => scrollToId("record") },
      { label: "Go to skills", hint: "Toolbox", run: () => scrollToId("skills") },
      { label: "Go to certificates", hint: "Certified", run: () => scrollToId("certificates") },
      { label: "Go to contact", hint: "Contact", run: () => scrollToId("contact") },
      {
        label: "Copy email address",
        hint: PROFILE.email,
        keep: true,
        run: async () => {
          try {
            await navigator.clipboard.writeText(PROFILE.email);
            setToast("Email copied to clipboard");
          } catch {
            window.location.href = `mailto:${PROFILE.email}`;
          }
        },
      },
      { label: "Open LinkedIn", hint: PROFILE.linkedin, run: () => window.open(`https://${PROFILE.linkedin}`, "_blank", "noopener") },
      { label: "Open GitHub", hint: PROFILE.github, run: () => window.open(`https://${PROFILE.github}`, "_blank", "noopener") },
      { label: "Back to top", hint: "Home", run: () => scrollToId("top") },
    ],
    []
  );

  const list = actions.filter((a) => (a.label + " " + a.hint).toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    setToast("");
    window.__lenis?.stop();
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      window.__lenis?.start();
    };
  }, [open]);

  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const run = (a) => {
    if (!a) return;
    if (!a.keep) onClose();
    window.setTimeout(a.run, a.keep ? 0 : 60);
  };

  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(list.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(list[sel]);
    }
  };

  return createPortal(
    <div className="cmd" onClick={onClose}>
      <div
        className="cmd__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <input
          ref={inputRef}
          className="cmd__input"
          autoFocus
          placeholder="Type a command or section"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search commands"
          aria-controls="cmd-list"
          aria-activedescendant={list[sel] ? `cmd-${sel}` : undefined}
        />
        <ul id="cmd-list" className="cmd__list" role="listbox">
          {list.map((a, i) => (
            <li
              key={a.label}
              id={`cmd-${i}`}
              role="option"
              aria-selected={i === sel}
              className="cmd__item"
              onPointerMove={() => setSel(i)}
              onClick={() => run(a)}
            >
              <span>{a.label}</span>
              <span className="cmd__hint">{a.hint}</span>
            </li>
          ))}
          {list.length === 0 && <li className="cmd__empty">No command matches "{q}". Try "contact" or "email".</li>}
        </ul>
        <p className="cmd__foot" aria-live="polite">
          {toast || "Arrow keys to move, Enter to run, Esc to close"}
        </p>
      </div>
    </div>,
    document.body
  );
}
