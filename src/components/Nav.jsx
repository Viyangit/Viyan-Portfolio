import { useEffect, useRef, useState } from "react";
import { PROFILE } from "../data.js";
import Decode from "./Decode.jsx";
import CommandMenu from "./CommandMenu.jsx";

const LINKS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "reading", label: "Reading" },
  { id: "record", label: "Record" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

function Clock() {
  const fmt = () =>
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: PROFILE.timeZone,
    }).format(new Date());
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt()), 10000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="nav__status">
      <i className="nav__dot" aria-hidden="true" />
      <span>Open to roles</span>
      <span className="nav__time">
        {PROFILE.city} {time} IST
      </span>
    </p>
  );
}

export default function Nav() {
  const [active, setActive] = useState(null);
  const [menu, setMenu] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));

    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (window.scrollY < window.innerHeight * 0.5) setActive(null);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenu((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (e, id) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <>
      <header className="nav">
        <div ref={barRef} className="nav__progress" aria-hidden="true" />
        <a href="#top" className="nav__mark" onClick={(e) => go(e, "top")} data-detect="home">
          VM
        </a>
        <Clock />
        <nav aria-label="Sections" className="nav__right">
          <ul className="nav__links">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={(e) => go(e, l.id)}
                  aria-current={active === l.id ? "true" : undefined}
                  data-detect={l.label.toLowerCase()}
                >
                  <Decode text={l.label} />
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="nav__cmd" onClick={() => setMenu(true)} data-detect="menu">
            <span className="nav__cmd-mobile">Menu</span>
            <kbd className="nav__cmd-key">{/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"}</kbd>
          </button>
        </nav>
      </header>
      <CommandMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}
