import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import { GlobalEtherealBackdrop } from "@/components/ui/etheral-shadow";
import { DotLoader, DOT_LOADER_FRAMES } from "./DotLoader.jsx";
import { HackathonGlitchDeck } from "./HackathonGlitchDeck.jsx";
import { CertificatesSplitScroll } from "./CertificatesSplitScroll.jsx";
import StickyProjectTextCards from "./components/ui/StickyProjectTextCards.jsx";

/* -------------------------------------------------------------------------- */
/*                              Motion variants                                */
/* -------------------------------------------------------------------------- */

const heroNumberVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.35,
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const cardSlideLeft = {
  hidden: { opacity: 0, x: -120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardSlideRight = {
  hidden: { opacity: 0, x: 120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const internshipCardVariants = {
  hidden: {
    opacity: 0,
    rotateY: 88,
    x: 40,
  },
  visible: (i) => ({
    opacity: 1,
    rotateY: 0,
    x: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const contactCardVariants = {
  hidden: { opacity: 0, y: 56 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

function fragmentVisible(i) {
  const r1 = ((i * 47) % 100) / 100 - 0.5;
  const r2 = ((i * 83) % 100) / 100 - 0.5;
  const r3 = ((i * 31) % 100) / 100;
  return {
    opacity: 0,
    x: r1 * 420,
    y: r2 * 380,
    scale: 0.2 + r3 * 0.45,
    rotate: r1 * 180,
    transition: {
      duration: 0.75 + (i % 5) * 0.06,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.007,
    },
  };
}

const fragmentChild = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
  visible: (i) => fragmentVisible(i),
};

/* -------------------------------------------------------------------------- */
/*                                  Data                                       */
/* -------------------------------------------------------------------------- */

const HACKATHON_WINS = [
  {
    event: "Saveetha Engineering College",
    prize: "1ST PLACE",
    date: "State-level hackathon",
    team:
      "First-place finish competing against teams from engineering colleges across Tamil Nadu.",
    solution:
      "A SaaS platform with AI that narrows the gap between classroom learning and the job market—delivering targeted assessments, practice tests, and quizzes so individuals can prove skills employers actually care about.",
  },
  {
    event: "Smart India Hackathon (SIH)",
    prize: "COLLEGE WINNER",
    date: "Rajalakshmi Engineering College — internal round",
    team: "Internal round winner — qualified for the national-level SIH competition.",
    solution:
      "A SaaS system that unifies traditional medical coding (AYUSH, Siddha, Unani) with modern allopathic codes—mapping herbs, formulations, and classical labels to ICD-style entries and chemical formulas where relevant.",
  },
];

const HACKATHON_PARTICIPATED = [
  {
    event: "School of Design Thinking",
    date:
      "Design-focused competition — user-centric problem solving and product design methodologies.",
    solution:
      "An AI chatbot agent that answers student questions with precision—reasoning with correct order of operations (BODMAS/PEMDAS) and aligning explanations to board-of-education standards so learners get reliable, exam-ready clarity in an information-heavy world.",
  },
  {
    event: "SRM Vadapalani Hackathon",
    date:
      "Inter-college technical hackathon at SRM Institute of Science and Technology, Vadapalani campus.",
    solution:
      "A SaaS app that learns each student’s note-taking style from a single uploaded template: it infers structure, tone, and sentence patterns, then generates new notes and answers in that same voice so upcoming material feels authentically theirs.",
  },
];

/** `start` / `end` ISO dates — used to order internships chronologically in the vertical list */
const INTERNSHIPS = [
  {
    company: "Tunga Aerospace",
    role: "Junior Software Engineer",
    duration: "Feb 5 — Mar 6, 2025",
    start: "2025-02-05",
    end: "2025-03-06",
    stack: "Python · GStreamer · YOLO",
    desc:
      "RTSP streaming GUI streaming drone camera feeds to any device via IP. Built robust pipelines with GStreamer and detection hooks.",
  },
  {
    company: "Turbo Energy Pvt Ltd",
    role: "Junior Software Engineer",
    duration: "Jun 16 — Jul 2, 2025",
    start: "2025-06-16",
    end: "2025-07-02",
    stack: "SAP · ABAP concepts · ERP",
    desc: "Hands-on SAP modules and framework fundamentals in an industrial energy context.",
  },
  {
    company: "RoBridge AI",
    role: "Junior Software Developer",
    duration: "Aug 8 — Nov 8, 2025",
    start: "2025-08-08",
    end: "2025-11-08",
    stack: "React · CSS · Python · Local server",
    desc:
      "Internal audit management across categories with data integrated to a physical local server for shift audits.",
  },
  {
    company: "Sakthi Auto Pvt Ltd",
    role: "Software Developer",
    duration: "Mar 10 — May 16, 2025",
    start: "2025-03-10",
    end: "2025-05-16",
    stack: "React · CSS · Python · AI",
    desc:
      "Industrial barcode scanning with AI-assisted data capture, storage, and assisted workflows for shop-floor teams.",
  },
];

const PROJECTS = [
  {
    name: "ENVISION",
    client: "Chennai Metco Pvt Ltd",
    year: "2025",
    stack: "Python · OpenCV · JavaScript · Electron",
    desc:
      "Built a desktop metallurgy analysis platform that ingests live feeds from industrial cameras and runs computer-vision checks for production quality. The system standardizes inspection workflows, highlights surface and structural defects early, and reduces manual review time by giving operators clear visual outputs and batch-wise analysis summaries.",
    gh: "github.com/viyan/envision",
  },
  {
    name: "T-MAP",
    client: "Sakthi Auto Corp",
    year: "2025",
    stack: "HTML · CSS · JavaScript · PostgreSQL",
    desc:
      "Developed an internal audit management platform with shift-aware tracking for factory operations and compliance activities. It centralizes audit checklists, status updates, and team accountability on a Linux-hosted backend so supervisors can monitor completion progress in real time and close issues with better traceability.",
    gh: "github.com/viyan/t-map",
  },
  {
    name: "BVS",
    client: "Robridge Pvt Ltd",
    year: "2025",
    stack: "React · HTML · CSS · Python",
    desc:
      "Engineered a barcode workflow system for industrial storage that combines scanner input with AI-assisted data handling to reduce entry errors. The application supports faster item identification, cleaner inventory records, and more reliable movement tracking across warehouse-style storage environments.",
    gh: "github.com/viyan/bvs",
  },
  {
    name: "Transport App",
    client: "Rajalakshmi Engineering College",
    year: "2025",
    stack: "Python · React · JavaScript · Google Maps",
    desc:
      "Created an in-house transport coordination application for assigning cabs and monitoring driver movement in real time. The solution improves route visibility, reduces manual coordination overhead, and helps staff transportation teams manage pickups and trip progress through a single operational dashboard.",
    gh: "github.com/viyan/transport",
  },
  {
    name: "Farm Easy",
    client: "Rajalakshmi Engineering College",
    year: "2025",
    stack: "Python · React · CSS · Ollama",
    desc:
      "Designed a farmer-logistics marketplace concept that connects producers and transport workflows while adding seasonal cost forecasting support. Using generative model assistance, the platform helps users anticipate pricing fluctuations and make more informed planning decisions for crop movement and delivery timelines.",
    gh: "github.com/viyan/farm-easy",
  },
];

const SKILL_GROUPS = {
  ai: ["RAG", "Ollama", "NLP", "PyTorch", "OpenCV", "Pinecone"],
  code: ["Python", "React", "Java", "C", "GStreamer", "SQL", "PostgreSQL"],
  tools: ["Git", "SAP", "Figma"],
};

const CERTIFICATES = [
  {
    title: "Advance Algorithmic Thinking with Python",
    cardTitle: "Algorithmic Python",
    issuer: "LinkedIn Learning",
    date: "2024",
    id: "LI-ALGO-PY-XXXX",
    brand: "linkedin",
  },
  {
    title: "Java Foundation Certification",
    cardTitle: "Java Foundation",
    issuer: "Infosys Springboard",
    date: "2024",
    id: "INF-JAVA-XXXX",
    brand: "infosys",
  },
  {
    title: "Agentforce Specialist",
    cardTitle: "Agentforce",
    issuer: "Salesforce",
    date: "2025",
    id: "SF-AGENT-XXXX",
    brand: "salesforce",
  },
];

const CONTACT = {
  name: "Viyan Manokaran",
  title: "Full Stack Developer",
  phone: "+91 8248152543",
  email: "viyanmanokaran@gmail.com",
  city: "Chennai",
  linkedin: "linkedin.com/in/viyan-manokaran",
  github: "github.com/viyanmanokaran",
};

/* -------------------------------------------------------------------------- */
/*                              SVG icons                                      */
/* -------------------------------------------------------------------------- */

function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 6L8 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRobot({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="14" y="18" width="36" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
      <rect x="22" y="10" width="20" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="32" r="3" fill="currentColor" />
      <circle cx="38" cy="32" r="3" fill="currentColor" />
      <path d="M26 42h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="28" width="6" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="50" y="28" width="6" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconCode({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M22 20l-12 12 12 12M42 20l12 12-12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 16l-8 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function IconWrench({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M18 46c-4-4-4-10 0-14l14-14 8 8-14 14c-4 4-10 4-14 0z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M40 22l6-6M46 16l6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconLinkedIn({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.59c0-1.81-.03-4.14-2.52-4.14-2.53 0-2.91 1.97-2.91 4.01V23h-4V8z" />
    </svg>
  );
}

function IconGitHub({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.78.5 12.3c0 5.19 3.36 9.6 8.02 11.17.59.11.8-.26.8-.57 0-.28-.01-1.02-.02-2-3.25.71-3.94-1.39-3.94-1.39-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.21 1.79 1.21 1.04 1.8 2.74 1.28 3.41.98.11-.76.41-1.28.74-1.57-2.59-.3-5.31-1.31-5.31-5.83 0-1.29.46-2.34 1.21-3.17-.12-.3-.53-1.52.12-3.17 0 0 .99-.32 3.25 1.21a11.23 11.23 0 016.5 0c2.25-1.53 3.24-1.21 3.24-1.21.65 1.65.24 2.87.12 3.17.76.83 1.21 1.88 1.21 3.17 0 4.53-2.73 5.52-5.33 5.82.42.36.8 1.08.8 2.18 0 1.57-.02 2.84-.02 3.23 0 .31.21.69.81.57A11.37 11.37 0 0023.5 12.3C23.5 5.78 18.35.5 12 .5z" />
    </svg>
  );
}

function IconMail({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 3h4l1.5 4-2 1.5c1.2 2.4 3.6 4.8 6 6l1.5-2 4 1.5v4c0 .8-.6 1.5-1.4 1.6-8 .8-15.2-6.4-14.4-14.4C5.8 3.6 6.4 3 7.2 3H6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconDownload({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Hooks & utilities                                 */
/* -------------------------------------------------------------------------- */

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rootMargin = options.rootMargin ?? "0px";
    const stabilize = options.stabilize === true;
    const hideDelayMs = options.hideDelayMs ?? 150;
    const thresholdOpt = options.threshold ?? 0.15;
    const singleT = typeof thresholdOpt === "number" ? thresholdOpt : 0.15;

    const clearHide = () => {
      if (hideTimerRef.current != null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const thresholds = Array.isArray(thresholdOpt)
      ? thresholdOpt
      : stabilize
        ? [0, 0.02, 0.04, singleT * 0.5, singleT * 0.72, singleT, Math.min(1, singleT * 1.4), 0.2, 0.35, 0.5, 0.75, 1]
        : [singleT];

    const sorted = [...new Set(thresholds.map((t) => Math.min(1, Math.max(0, t))))].sort((a, b) => a - b);

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;

        if (stabilize) {
          const r = e.intersectionRatio;
          const enterAt = Math.max(0.04, singleT * 0.65);
          const exitBelow = Math.max(0.02, singleT * 0.38);

          if (e.isIntersecting && r >= enterAt) {
            clearHide();
            setInView(true);
          } else if (!e.isIntersecting || r < exitBelow) {
            if (hideTimerRef.current == null) {
              hideTimerRef.current = setTimeout(() => {
                hideTimerRef.current = null;
                setInView(false);
              }, hideDelayMs);
            }
          }
        } else {
          setInView(e.isIntersecting);
        }
      },
      { rootMargin, threshold: sorted.length ? sorted : [0] }
    );

    obs.observe(el);
    return () => {
      clearHide();
      obs.disconnect();
    };
  }, [options.threshold, options.rootMargin, options.stabilize, options.hideDelayMs]);

  return [ref, inView];
}

function useCounter(target, durationMs, startWhen) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!startWhen) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, startWhen]);
  return v;
}

function scrollToSection(targetRef) {
  const el = targetRef?.current;
  if (!el) return false;
  const lenis = typeof window !== "undefined" ? window.__lenis : null;
  if (lenis?.scrollTo) {
    lenis.scrollTo(el, {
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      offset: 0,
    });
    return true;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function IconCmdTab({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6h4M4 8.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function TerminalNavigator({
  heroRef,
  internshipsRef,
  hackathonsRef,
  skillsRef,
  certificatesRef,
  projectsRef,
  contactRef,
  onRequestClose,
}) {
  const [input, setInput] = useState("");
  const [pendingChoice, setPendingChoice] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const routeTo = useCallback(
    (section) => {
      const refs = {
        home: heroRef,
        internships: internshipsRef,
        hackathons: hackathonsRef,
        skills: skillsRef,
        certificates: certificatesRef,
        projects: projectsRef,
        contact: contactRef,
      };
      const ok = scrollToSection(refs[section]);
      if (!ok) return;
    },
    [heroRef, internshipsRef, hackathonsRef, skillsRef, certificatesRef, projectsRef, contactRef]
  );

  const handleCommand = useCallback(
    (rawValue) => {
      const raw = rawValue.trim();
      if (!raw) return;
      const value = raw.toLowerCase();

      if (pendingChoice === "hackathonOrCertificates") {
        if (/(hackathons?|hackathon)/.test(value)) {
          routeTo("hackathons");
        } else if (/(certificates?|certificate|certification|certifications)/.test(value)) {
          routeTo("certificates");
        } else {
          return;
        }
        setPendingChoice(null);
        return;
      }

      if (/(^|\s)(home|start|main)(\s|$)/.test(value)) {
        routeTo("home");
        return;
      }

      if (/(interships?|internships?|wokr\s*expirence|work\s*experience|experience)/.test(value)) {
        routeTo("internships");
        return;
      }

      if (/(skills?|languages?)/.test(value)) {
        routeTo("skills");
        return;
      }

      if (/(hackathons?|achievements?)/.test(value)) {
        setPendingChoice("hackathonOrCertificates");
        return;
      }

      if (/(certificates?|certifications?)/.test(value)) {
        routeTo("certificates");
        return;
      }

      if (/(projects?|portfolio|apps?|work\s*samples?)/.test(value)) {
        routeTo("projects");
        return;
      }

      if (/(contacts?|get\s*in\s*touch|reach\s*out|email|phone)/.test(value)) {
        routeTo("contact");
        return;
      }
    },
    [pendingChoice, routeTo]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleCommand(input);
      setInput("");
    },
    [handleCommand, input]
  );

  return (
    <div className="cmd-terminal-root" role="dialog" aria-label="Command Prompt navigation">
      <div className="cmd-terminal__chrome">
        <div className="cmd-terminal__tab-row">
          <div className="cmd-terminal__tab cmd-terminal__tab--active">
            <IconCmdTab className="cmd-terminal__tab-icon" />
            <span>Command Prompt</span>
          </div>
          <button type="button" className="cmd-terminal__tab-action" tabIndex={-1} aria-hidden title="New tab">
            +
          </button>
          <button type="button" className="cmd-terminal__tab-chevron" tabIndex={-1} aria-hidden>
            <span className="cmd-terminal__chevron-glyph">▾</span>
          </button>
        </div>
        <div className="cmd-terminal__window-controls">
          <span className="cmd-terminal__control-btn" aria-hidden>
            −
          </span>
          <span className="cmd-terminal__control-btn" aria-hidden>
            □
          </span>
          <button
            type="button"
            className="cmd-terminal__control-btn cmd-terminal__control-btn--close"
            onClick={() => onRequestClose?.()}
            aria-label="Close command prompt"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="cmd-terminal__body">
        <form onSubmit={onSubmit} className="cmd-terminal__form" aria-label="Terminal section navigation">
          <label className="sr-only" htmlFor="terminal-nav-input">
            Command line
          </label>
          <div className="cmd-terminal__prompt-line">
            <span className="cmd-terminal__prompt" aria-hidden="true">
              C:\Users\Acer&gt;
            </span>
            <div className="cmd-terminal__input-wrap">
              <input
                id="terminal-nav-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="cmd-terminal__input"
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  pendingChoice
                    ? "hackathons or certificates"
                    : "e.g. home · projects · contact · internships · skills"
                }
              />
              <span className="cmd-terminal__caret" aria-hidden />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sections                                       */
/* -------------------------------------------------------------------------- */

/** First ~30% of hero scroll: digits stay locked; after that, parallax / drift kicks in. */
const HERO_STATS_HOLD_END = 0.3;
const HERO_STATS_PARALLAX_END = 0.58;

function HeroStatDigit({
  index,
  scrollExplode,
  displayValue,
  label,
  showPlus,
  numberClassName = "font-display text-[clamp(6rem,24vw,14rem)] leading-none tracking-[-0.04em] text-white",
  labelClassName = "mt-4 max-w-[10rem] font-sub text-xs uppercase tracking-[0.2em] text-mist/55 md:text-sm",
}) {
  const driftX = (index - 1.5) * 140;
  const driftY = (index % 2 === 0 ? 1 : -1) * 95;
  const x = useTransform(
    scrollExplode,
    [0, HERO_STATS_HOLD_END, HERO_STATS_PARALLAX_END],
    [0, 0, driftX]
  );
  const y = useTransform(
    scrollExplode,
    [0, HERO_STATS_HOLD_END, HERO_STATS_PARALLAX_END],
    [0, 0, driftY]
  );
  const opacity = useTransform(
    scrollExplode,
    [0, HERO_STATS_HOLD_END, HERO_STATS_HOLD_END + 0.12, HERO_STATS_PARALLAX_END + 0.08],
    [1, 1, 0.55, 0]
  );
  const scale = useTransform(
    scrollExplode,
    [0, HERO_STATS_HOLD_END, HERO_STATS_PARALLAX_END - 0.02],
    [1, 1, 1.35]
  );

  return (
    <m.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={heroNumberVariants}
      style={{
        x,
        y,
        opacity,
        scale,
        willChange: "transform, opacity",
      }}
      className="flex flex-col items-center text-center"
    >
      <span className={numberClassName}>
        {showPlus ? `${displayValue}+` : displayValue}
      </span>
      <span className={labelClassName}>
        {label}
      </span>
    </m.div>
  );
}

function HeroIntro() {
  return (
    <section
      className="relative z-10 min-h-screen snap-section overflow-x-hidden bg-black"
      aria-label="Introduction"
    >
      <div className="relative flex min-h-screen flex-col items-center justify-end overflow-x-hidden px-3 pb-3 md:pb-4">
        <div className="relative isolate flex w-full max-w-[100vw] flex-col items-center">
          <h1 className="relative z-[2] -mb-[min(12vh,100px)] w-full -translate-y-[min(19vh,156px)] px-3 text-center font-display text-[clamp(2.35rem,11vw,8.75rem)] leading-[0.82] tracking-[-0.045em] text-white md:-mb-[min(15vh,128px)] md:-translate-y-[min(24vh,200px)] md:px-6 md:text-[clamp(2.75rem,12vw,9.5rem)]">
            VIYAN
            <br />
            MANOKARAN
          </h1>
          <div className="relative z-[1] -mt-[min(14vh,112px)] h-[min(56vh,600px)] w-[min(100%,680px)] overflow-hidden md:-mt-[min(17vh,136px)] md:h-[min(60vh,660px)]">
            <img
              src="/uploads/image.png"
              alt=""
              className="pointer-events-none absolute left-1/2 top-0 h-auto w-[min(92vw,620px)] max-w-[620px] origin-top select-none [transform:translateX(-50%)_scale(1.22)] md:w-[min(100%,700px)] md:max-w-[700px] md:[transform:translateX(-50%)_scale(1.28)]"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHero({ scrollExplode, startHero, inCircle = false }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!startHero) return;
    const t = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(t);
  }, [startHero]);

  const c0 = useCounter(4, 900, started);
  const c1 = useCounter(4, 900, started && c0 >= 4);
  const c2 = useCounter(5, 900, started && c1 >= 4);
  const c3 = useCounter(3, 900, started && c2 >= 5);

  const values = [c0, c1, c2, c3];
  const labels = ["Hackathons", "Projects", "Internships", "Certifications"];
  const numberClassName = inCircle
    ? "font-display text-[clamp(6rem,24vw,14rem)] leading-none tracking-[-0.04em] text-black"
    : "font-display text-[clamp(6rem,24vw,14rem)] leading-none tracking-[-0.04em] text-white";
  const labelClassName = inCircle
    ? "mt-4 max-w-[10rem] font-sub text-xs uppercase tracking-[0.2em] text-black/55 md:text-sm"
    : "mt-4 max-w-[10rem] font-sub text-xs uppercase tracking-[0.2em] text-mist/55 md:text-sm";

  return (
    <section
      className={`relative flex min-h-screen flex-col items-center overflow-hidden px-4 ${
        inCircle ? "justify-end bg-transparent pb-[18vh]" : "snap-section justify-center bg-void"
      }`}
    >
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <HeroStatDigit
            key={i}
            index={i}
            scrollExplode={scrollExplode}
            displayValue={values[i]}
            label={labels[i]}
            showPlus={i === 3}
            numberClassName={numberClassName}
            labelClassName={labelClassName}
          />
        ))}
      </div>

      {!inCircle && (
        <p className="absolute bottom-10 z-10 font-sub text-xs uppercase tracking-[0.35em] text-mist/35">
          Scroll
        </p>
      )}
    </section>
  );
}

function SectionHackathons({ containerRef }) {
  const [ref, inView] = useInView({ threshold: 0.12 });
  const setRefs = useCallback(
    (el) => {
      ref.current = el;
      if (containerRef) containerRef.current = el;
    },
    [ref, containerRef]
  );
  return (
    <section ref={setRefs} className="relative snap-section overflow-hidden px-4 py-28 md:px-10" aria-label="Hackathons">
      <div className="relative z-10 mx-auto max-w-5xl">
        <m.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-4 font-display text-5xl tracking-tight text-white md:text-7xl"
        >
          Hackathons
        </m.h2>
        <p className="mb-6 max-w-xl font-display text-base leading-relaxed text-mist/60 md:text-lg">
          Wins first — then the rooms where I shipped under pressure. Hover a card to decode the text.
        </p>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <HackathonGlitchDeck inView={inView} wins={HACKATHON_WINS} participated={HACKATHON_PARTICIPATED} />
        </m.div>
      </div>
    </section>
  );
}

/** When internships scroll progress passes this (downward), Lenis eases into the Projects section. */
const INTERNSHIPS_HANDOFF_PROGRESS = 0.86;

function InternshipTimelineCard({ job, inView, index, revealed }) {
  return (
    <m.article
      custom={index}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={internshipCardVariants}
      style={{ perspective: "1000px", willChange: "transform, opacity" }}
      className="rounded-2xl p-0"
    >
      <m.div
        animate={
          revealed
            ? { rotateX: [0, -190, -330, -460, -540], y: [0, -7, 4, -3, 0] }
            : { rotateX: [-540, -390, -250, -90, 0], y: [0, 6, -4, 2, 0] }
        }
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d", willChange: "transform", minHeight: "220px" }}
        className="relative h-full w-full"
      >
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          aria-hidden={revealed}
        />

        <div
          className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6"
          style={{
            transform: "rotateX(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          aria-hidden={!revealed}
        >
          <h3 className="font-display text-3xl text-white">{job.company}</h3>
          <p className="mt-1 font-sub text-sm text-mist">{job.role}</p>
          <p className="mt-2 font-sub text-xs uppercase tracking-wider text-mist/45">{job.duration}</p>
          <p className="mt-4 font-dm text-xs text-mist/50">{job.stack}</p>
          <p className="mt-3 font-dm text-sm leading-relaxed text-mist/75 line-clamp-3">{job.desc}</p>
        </div>
      </m.div>
    </m.article>
  );
}

function SectionInternships({ containerRef, projectsRef, introReady }) {
  const [sectionRef, inView] = useInView({ threshold: 0.1, stabilize: true, hideDelayMs: 160 });
  const setRefs = useCallback(
    (el) => {
      sectionRef.current = el;
      if (containerRef) containerRef.current = el;
    },
    [sectionRef, containerRef]
  );
  const jobsByDate = useMemo(
    () => [...INTERNSHIPS].sort((a, b) => a.start.localeCompare(b.start)),
    []
  );
  const revealThresholds = useMemo(
    () => {
      const preset = [0.13, 0.3, 0.5, 0.64];
      return jobsByDate.map((_, i) => preset[i] ?? 0.64 + (i - 3) * 0.12);
    },
    [jobsByDate]
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 72, damping: 28, mass: 0.45 });
  const lineScale = useTransform(smoothProgress, [0, 1], [0, 1]);
  const dotY = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  const prevProgressRef = useRef(0);
  const hasHandedOffRef = useRef(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const nextCount = revealThresholds.reduce((count, threshold) => count + (v >= threshold ? 1 : 0), 0);
    setRevealedCount((prev) => (prev === nextCount ? prev : nextCount));

    if (v < 0.28) hasHandedOffRef.current = false;
    if (!introReady) return;
    const prev = prevProgressRef.current;
    prevProgressRef.current = v;
    const goingDown = v > prev;
    if (!goingDown || hasHandedOffRef.current) return;
    if (v < INTERNSHIPS_HANDOFF_PROGRESS) return;
    const el = projectsRef?.current;
    const lenis = typeof window !== "undefined" ? window.__lenis : null;
    if (!el || !lenis) return;
    hasHandedOffRef.current = true;
    lenis.scrollTo(el, {
      duration: 1.12,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      offset: 0,
    });
  });

  return (
    <section
      ref={setRefs}
      className="relative snap-section overflow-hidden px-4 py-28 md:px-10"
      style={{ perspective: "1000px" }}
    >
      <div className="relative z-10 mx-auto max-w-3xl">
        <m.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 font-display text-5xl tracking-tight text-white md:text-7xl"
        >
          Internships
        </m.h2>
        <div className="relative flex gap-5 md:gap-7">
          <div className="relative w-3 shrink-0 self-stretch pt-1 pb-1 md:w-4" aria-hidden>
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12" />
            <m.div
              className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-white/70 via-white/40 to-white/15 shadow-[0_0_12px_rgba(255,255,255,0.12)]"
              style={{ scaleY: lineScale }}
            />
            <m.div
              className="pointer-events-none absolute left-1/2 z-[1] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white/95 shadow-[0_0_14px_rgba(255,255,255,0.55)]"
              style={{ top: dotY }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {jobsByDate.map((job, i) => (
              <InternshipTimelineCard
                key={job.company}
                job={job}
                index={i}
                inView={inView}
                revealed={i < revealedCount}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionProjects({ containerRef }) {
  return (
    <section
      ref={containerRef}
      data-projects-scroll-gate
      className="relative snap-section overflow-hidden bg-void pb-10 md:pb-14"
    >
      <h2 className="pointer-events-none absolute left-6 top-6 z-20 font-display text-5xl tracking-tight text-white/95 md:left-10 md:top-8 md:text-7xl">
        Projects
      </h2>
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
        <div className="relative w-full border-y border-white/10 shadow-glow-sm">
          <StickyProjectTextCards cards={PROJECTS} />
        </div>
      </div>
    </section>
  );
}

function SkillIconButton({ label, icon: Icon, active, onSelect, onWheelCapture }) {
  return (
    <m.button
      type="button"
      whileHover={{ scale: 1.05 }}
      animate={active ? { scale: 1.15 } : { scale: 1 }}
      onClick={() => onSelect()}
      onWheel={onWheelCapture}
      className={`group relative flex h-44 w-44 flex-col items-center justify-center rounded-3xl border transition-shadow md:h-52 md:w-52 ${
        active
          ? "border-white/25 bg-white/10 shadow-glow-md"
          : "border-white/15 bg-white/[0.04] hover:border-white/30 hover:shadow-glow-sm"
      }`}
    >
      <m.div
        className="text-mist"
        whileHover={{ scale: 1.3 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <Icon className="h-20 w-20 md:h-24 md:w-24" />
      </m.div>
      <span className="mt-4 font-sub text-xs uppercase tracking-[0.25em] text-mist/55">{label}</span>
    </m.button>
  );
}

function SkillGridOverlay({ category, onClose, sentinelRef }) {
  const items = SKILL_GROUPS[category];
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.35 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[80] flex origin-center flex-col items-center overflow-y-auto bg-void/75 px-4 py-24 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-20 rounded-full border border-white/20 px-4 py-2 font-sub text-sm text-mist/70 hover:border-white/40 hover:text-white"
      >
        Close
      </button>
      <h3
        className="relative z-10 mb-12 font-display text-5xl tracking-tight text-white md:text-6xl"
      >
        {category === "ai" ? "AI / ML" : category === "code" ? "Programming" : "Tools"}
      </h3>
      <div
        className="relative z-10 mx-auto grid max-w-4xl grid-cols-2 gap-4 pb-40 md:grid-cols-3"
        style={{ perspective: "1000px" }}
      >
        {items.map((name) => (
          <SkillTiltSquare key={name} name={name} />
        ))}
      </div>
      <div ref={sentinelRef} className="relative z-10 h-8 w-full shrink-0" aria-hidden />
    </m.div>
  );
}

function SkillTiltSquare({ name }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 280, damping: 22 });
  const sry = useSpring(ry, { stiffness: 280, damping: 22 });

  const move = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * 22);
    ry.set(px * 22);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <m.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", willChange: "transform" }}
      onMouseMove={move}
      onMouseLeave={leave}
      className="flex aspect-square items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent p-4 text-center font-body text-sm font-semibold text-mist shadow-lg md:text-base"
    >
      {name}
    </m.div>
  );
}

function SectionSkills({ containerRef }) {
  const [active, setActive] = useState(null);
  const sentinelRef = useRef(null);
  const wheelAccum = useRef(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!containerRef) return;
    containerRef.current = sectionRef.current;
  }, [containerRef]);

  const open = useCallback((cat) => setActive(cat), []);

  const onWheelWhileHover = useCallback((e, cat) => {
    wheelAccum.current += Math.abs(e.deltaY);
    if (wheelAccum.current > 72) {
      wheelAccum.current = 0;
      setActive(cat);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
          setActive(null);
        }
      },
      { threshold: [0, 0.45, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  return (
    <section ref={sectionRef} className="relative min-h-screen snap-section px-4 pb-32 pt-10 md:px-10 md:pb-40 md:pt-14">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-6 font-display text-5xl tracking-tight text-white md:text-7xl">
          Skills
        </h2>
        <p className="mx-auto mb-16 max-w-lg font-display text-base text-mist/55 md:text-lg">
          Hover an icon — it scales with glow. Click or scroll while hovering to dive into the stack.
        </p>
        <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:gap-20">
          <SkillIconButton
            label="AI / ML"
            icon={IconRobot}
            active={active === "ai"}
            onSelect={() => open("ai")}
            onWheelCapture={(e) => onWheelWhileHover(e, "ai")}
          />
          <SkillIconButton
            label="Programming"
            icon={IconCode}
            active={active === "code"}
            onSelect={() => open("code")}
            onWheelCapture={(e) => onWheelWhileHover(e, "code")}
          />
          <SkillIconButton
            label="Tools"
            icon={IconWrench}
            active={active === "tools"}
            onSelect={() => open("tools")}
            onWheelCapture={(e) => onWheelWhileHover(e, "tools")}
          />
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <SkillGridOverlay category={active} onClose={() => setActive(null)} sentinelRef={sentinelRef} />
        )}
      </AnimatePresence>
    </section>
  );
}

function SectionCertificates({ containerRef }) {
  return <CertificatesSplitScroll containerRef={containerRef} certificates={CERTIFICATES} />;
}

function SectionWhoAmI() {
  const whoRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const fragCount = 72;

  const { scrollYProgress } = useScroll({
    target: whoRef,
    offset: ["start center", "end end"],
  });

  useEffect(() => {
    const el = whoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setPhase((p) => (p === 0 ? 1 : p));
      },
      { threshold: 0.32 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.14) setPhase((p) => (p < 2 ? 2 : p));
  });

  const summary =
    "A B.Tech student passionate about AI systems, full-stack development, and building things that matter. I turn complex problems into clean, working solutions — from ZK-blockchain systems to RAG pipelines.";

  return (
    <section ref={whoRef} className="relative min-h-[140vh] snap-section overflow-hidden px-4 py-32 md:px-10">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {phase < 2 && (
            <m.h2
              key="title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.55 }}
              className="font-display text-6xl tracking-tight text-white md:text-8xl"
            >
              So Who Am I
            </m.h2>
          )}
        </AnimatePresence>

        <div className="relative mt-10 flex min-h-[280px] w-full items-center justify-center">
          {phase === 2 && (
            <m.div
              className="absolute inset-0 flex max-w-[280px] flex-wrap justify-center gap-[2px] self-center justify-self-center"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {Array.from({ length: fragCount }).map((_, i) => (
                <m.span
                  key={i}
                  custom={i}
                  variants={fragmentChild}
                  className="h-3 w-3 rounded-[1px] bg-white/90"
                  style={{ willChange: "transform, opacity" }}
                />
              ))}
            </m.div>
          )}

          <AnimatePresence>
            {phase === 1 && (
              <m.span
                key="qm"
                exit={{ opacity: 0, scale: 0.2 }}
                className="relative z-[1] font-display text-[clamp(6rem,25vw,14rem)] leading-none text-white"
                animate={{ scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                ?
              </m.span>
            )}
          </AnimatePresence>

          {phase === 2 && (
            <m.div
              initial={{ opacity: 0, scale: 0.15 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[2] h-48 w-48 rounded-full border-2 border-white/25 bg-gradient-to-br from-white/15 to-navy-neon/50 shadow-glow-lg"
            />
          )}
        </div>

        <AnimatePresence>
          {phase === 2 && (
            <m.div
              key="bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 max-w-2xl font-display text-lg leading-relaxed text-mist/85 md:text-xl"
            >
              {summary}
            </m.div>
          )}
        </AnimatePresence>

        {phase === 1 && (
          <p className="mt-10 font-sub text-xs uppercase tracking-[0.3em] text-mist/35">Scroll to reveal</p>
        )}
      </div>
    </section>
  );
}

function SectionContact({ contactRef }) {
  const [ref, inView] = useInView({ threshold: 0.15 });
  const setRefs = useCallback(
    (el) => {
      ref.current = el;
      if (contactRef) contactRef.current = el;
    },
    [ref, contactRef]
  );
  const items = [
    { icon: IconLinkedIn, label: "LinkedIn", value: CONTACT.linkedin },
    { icon: IconGitHub, label: "GitHub", value: CONTACT.github },
    { icon: IconMail, label: "Email", value: CONTACT.email },
    { icon: IconPhone, label: "Phone", value: CONTACT.phone },
    { icon: IconPin, label: "Location", value: CONTACT.city },
  ];

  return (
    <section ref={setRefs} className="relative snap-section overflow-hidden pb-32 pt-20 md:px-10">
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-12 text-center font-display text-5xl tracking-tight text-white md:text-7xl"
        >
          Contact
        </m.h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <m.div
              key={it.label}
              custom={i}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={contactCardVariants}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <it.icon className="mt-1 h-6 w-6 shrink-0 text-white" />
              <div>
                <p className="font-sub text-xs uppercase tracking-widest text-mist/45">{it.label}</p>
                <p className="mt-1 font-body text-sm text-mist/90 break-all">{it.value}</p>
              </div>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-10 flex justify-center"
        >
          <m.a
            href="/resume.pdf"
            download
            data-barba-prevent="all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden rounded-full border-2 border-white/30 bg-white/10 px-10 py-4 font-display text-xl tracking-wide text-white shadow-glow-sm"
          >
            <span className="relative z-10 flex items-center gap-3">
              <IconDownload className="h-6 w-6" /> Download Resume
            </span>
            <m.span
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ mixBlendMode: "soft-light" }}
            />
          </m.a>
        </m.div>
      </div>

      <div className="pointer-events-none relative z-10 mt-24 overflow-hidden border-y border-white/5 py-6 opacity-25">
        <div className="flex w-max animate-marquee font-display text-[clamp(3rem,12vw,8rem)] tracking-tight text-mist/30">
          <span className="inline-block shrink-0 pr-16">
            GET IN CONTACT · GET IN CONTACT · GET IN CONTACT · GET IN CONTACT ·
          </span>
          <span className="inline-block shrink-0 pr-16" aria-hidden>
            GET IN CONTACT · GET IN CONTACT · GET IN CONTACT · GET IN CONTACT ·
          </span>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero → next section: dome / arc wipe (SVG clip-path scroll transition)   */
/* -------------------------------------------------------------------------- */

function HeroCurtainOverlay({ heroRef, startHero }) {
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const clamped = useTransform(scrollYProgress, (v) => Math.max(0, Math.min(1, v)));
  const p = useSpring(clamped, { stiffness: 88, damping: 30, mass: 0.42 });
  const y = useTransform(p, [0, 1], ["108%", "-128%"]);
  const opacity = useTransform(p, [0, 0.05, 1], [0, 1, 1]);

  return (
    <m.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 bottom-[-95vmax] z-[24] h-[210vmax] w-[210vmax] rounded-full bg-white"
      style={{
        x: "-50%",
        y,
        opacity,
        boxShadow: "0 0 28px rgba(0,0,0,0.08)",
      }}
    >
      <div className="absolute inset-0">
        <SectionHero scrollExplode={clamped} startHero={startHero} inCircle />
      </div>
    </m.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main app                                       */
/* -------------------------------------------------------------------------- */

export default function Portfolio() {
  const heroRef = useRef(null);
  const hackathonsRef = useRef(null);
  const internshipsRef = useRef(null);
  const projectsRef = useRef(null);
  const skillsRef = useRef(null);
  const certificatesRef = useRef(null);
  const contactRef = useRef(null);
  const [introReady, setIntroReady] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const minMs = 1700;
    const t = setTimeout(() => setIntroReady(true), minMs);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!introReady) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [introReady]);

  const { scrollYProgress: heroCoverProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroLayerOpacity = useTransform(
    heroCoverProgress,
    [0, 0.55, 0.82, 1],
    [1, 1, 0.18, 0]
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-void selection:bg-white/20 selection:text-void">
        <GlobalEtherealBackdrop />

        <AnimatePresence>
          {!introReady && (
            <m.div
              key="intro-loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-void/95 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-4">
                <DotLoader
                  frames={DOT_LOADER_FRAMES}
                  className="gap-0.5"
                  duration={100}
                  isPlaying
                  dotClassName="bg-fog/25 [&.active]:bg-white h-1.5 w-1.5"
                />
                <p className="font-sub text-lg font-medium tracking-wide text-mist">coding</p>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <div className="relative z-10">
          <button
            type="button"
            className="terminal-toggle"
            onClick={() => setTerminalOpen((prev) => !prev)}
            aria-expanded={terminalOpen}
            aria-controls="terminal-nav-shell"
            aria-label={terminalOpen ? "Close terminal navigation" : "Open terminal navigation"}
          >
            <svg
              className="terminal-toggle__icon"
              viewBox="0 0 54 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="cmd-face" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a0a0a" />
                  <stop offset="72%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#1c1c1c" />
                </linearGradient>
              </defs>
              <rect x="0.5" y="0.5" width="53" height="39" rx="3.5" fill="#0d0d0d" stroke="rgba(255,255,255,0.45)" />
              <rect x="1" y="1" width="52" height="9" rx="2.5" fill="#4a4a4e" />
              <rect x="1" y="9" width="52" height="30" rx="0" fill="url(#cmd-face)" />
              <line x1="1" y1="9" x2="53" y2="9" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              <text
                x="5"
                y="27.5"
                fill="#f5f5f5"
                fontFamily="ui-monospace, Consolas, &quot;Courier New&quot;, monospace"
                fontSize="9.5"
                fontWeight="600"
                letterSpacing="0.02em"
              >
                {"C:\\>_"}
              </text>
            </svg>
          </button>

          {terminalOpen && (
            <div id="terminal-nav-shell">
              <TerminalNavigator
                heroRef={heroRef}
                internshipsRef={internshipsRef}
                hackathonsRef={hackathonsRef}
                skillsRef={skillsRef}
                certificatesRef={certificatesRef}
                projectsRef={projectsRef}
                contactRef={contactRef}
                onRequestClose={() => setTerminalOpen(false)}
              />
            </div>
          )}
          {/* ========== SECTION 1 — HERO (intro + stats) ========== */}
          <div ref={heroRef} className="relative h-[240vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <m.div style={{ opacity: heroLayerOpacity }}>
                <HeroIntro />
              </m.div>
              {introReady && <HeroCurtainOverlay heroRef={heroRef} startHero={introReady} />}
            </div>
          </div>
          <div className="transition-zone sr-only" aria-hidden>
            Hero boundary — pinned hero while dome curtain progresses with scroll.
          </div>

          {/* ========== SECTION 2 — HACKATHONS ========== */}
          <SectionHackathons containerRef={hackathonsRef} />

          {/* ========== SECTION 3 — INTERNSHIPS ========== */}
          <SectionInternships
            containerRef={internshipsRef}
            projectsRef={projectsRef}
            introReady={introReady}
          />

          {/* ========== SECTION 4 — PROJECTS (horizontal scroll) ========== */}
          <SectionProjects containerRef={projectsRef} />

          {/* ========== SECTION 5 — SKILLS ========== */}
          <SectionSkills containerRef={skillsRef} />

          {/* ========== SECTION 6 — CERTIFICATES (wheel-driven split / reveal) ========== */}
          <SectionCertificates containerRef={certificatesRef} />

          {/* ========== SECTION 7 — SO WHO AM I ========== */}
          <SectionWhoAmI />

          {/* ========== SECTION 8 — CONTACT ========== */}
          <SectionContact contactRef={contactRef} />

          <footer className="relative overflow-hidden border-t border-white/5 py-10 text-center font-sub text-xs text-mist/35">
            <p className="relative z-10">
              © {new Date().getFullYear()} {CONTACT.name} · React, Framer Motion, Barba.js & Lenis
            </p>
          </footer>
        </div>
      </div>
    </LazyMotion>
  );
}
