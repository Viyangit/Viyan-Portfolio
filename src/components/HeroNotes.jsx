import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { bootDone } from "./Boot.jsx";

/**
 * Hand-drawn notes around the hero, each with a small pen arrow: a short, gently bowed line
 * from the note toward Viyan with an open arrowhead, inked in the note's own colour.
 */

// Copy: who Viyan is and what he's best at. Positions are % of the hero; `tone` follows the band.
export const NOTES = [
  { id: "vision", x: 3.5, y: 12, tone: "light", text: ["Best at computer vision:", "OpenCV + YOLO that inspect metal"] },
  { id: "who", x: 76, y: 12, tone: "light", text: ["AI engineer from Chennai,", "shipping to real factory floors"] },
  { id: "llm", x: 3.5, y: 80, tone: "dark", text: ["LLM systems that don't go down:", "OpenAI with an Ollama fallback"] },
  { id: "record", x: 81.5, y: 85.5, tone: "dark", text: ["1st place, national hackathon.", "4 internships in 2025"] },
];

/*
 * Arrows, measured from the real layout so they point at Viyan at any screen size.
 * at   = the point on him each arrow aims for (fractions of the figure box): head for the top
 *        notes, shoulders for the bottom ones.
 * side = which side of the hero the note sits on; the arrow leaves from the note's inner edge.
 * y    = vertical centre of the note, as a fraction of the hero height (clear of the name).
 * bow  = which way the line curves: 1 bulges up, -1 bulges down.
 */
const ARROWS = [
  { id: "vision", at: [0.47, 0.3], side: "left", y: 0.15, bow: 1 },
  { id: "who", at: [0.72, 0.31], side: "right", y: 0.15, bow: 1 },
  { id: "llm", at: [0.14, 0.82], side: "left", y: 0.865, bow: -1 },
  { id: "record", at: [0.84, 0.8], side: "right", y: 0.865, bow: -1 },
];

const TIP_GAP = 16;

/** Places a note in its corner and returns the arrow tip that touches it. */
function placeNote(note, arrow, W, H) {
  const gutter = Math.max(48, W * 0.035);
  const w = note.offsetWidth;
  const h = note.offsetHeight;
  const top = H * arrow.y - h / 2;
  const left = arrow.side === "left" ? gutter : W - gutter - w;
  note.style.left = `${left}px`;
  note.style.top = `${top}px`;
  const tipX = arrow.side === "left" ? left + w + TIP_GAP : left - TIP_GAP;
  return [tipX, top + h * 0.55];
}

const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/**
 * A short pen arrow from `s` (beside the note) toward `target` (on Viyan): a quadratic curve
 * bowed to one side, then an open head of two short strokes along the curve's final direction.
 */
function buildArrow(s, target, arrow, W) {
  const len = Math.max(64, Math.min(120, W * 0.06));
  const dx = target[0] - s[0];
  const dy = target[1] - s[1];
  const d = Math.hypot(dx, dy) || 1;
  const u = [dx / d, dy / d];
  const e = [s[0] + u[0] * len, s[1] + u[1] * len];
  // Perpendicular that points "up" on screen, flipped for arrows that bulge downward.
  let n = [-u[1], u[0]];
  if (n[1] > 0) n = [-n[0], -n[1]];
  const bow = len * 0.28 * arrow.bow;
  const c = [(s[0] + e[0]) / 2 + n[0] * bow, (s[1] + e[1]) / 2 + n[1] * bow];

  // Head: along the tangent at the end (from the control point to the end).
  const tx = e[0] - c[0];
  const ty = e[1] - c[1];
  const tl = Math.hypot(tx, ty) || 1;
  const back = [-tx / tl, -ty / tl];
  const hl = Math.max(9, len * 0.13);
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const w1 = rot(back, 0.5);
  const w2 = rot(back, -0.5);
  const h1 = [e[0] + w1[0] * hl, e[1] + w1[1] * hl];
  const h2 = [e[0] + w2[0] * hl, e[1] + w2[1] * hl];

  return {
    line: `M${f(s)} Q${f(c)} ${f(e)}`,
    head: `M${f(h1)} L${f(e)} L${f(h2)}`,
  };
}

/** The arrows layer. Renders nothing until the hero has been measured. */
export function HeroInk({ stageRef }) {
  const [geo, setGeo] = useState(null);
  const svgRef = useRef(null);
  const drawn = useRef(false);

  useEffect(() => {
    const stage = stageRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) gsap.set(stage.querySelectorAll(".hero__note"), { opacity: 0 });

    // Without arrows, notes go back to their default corner positions.
    const resetNotes = () =>
      NOTES.forEach((n) => {
        const el = stage.querySelector(`[data-note="${n.id}"]`);
        el.style.left = `${n.x}%`;
        el.style.top = `${n.y}%`;
      });

    const measure = () => {
      if (window.matchMedia("(max-width: 820px)").matches) {
        setGeo(null);
        resetNotes();
        return;
      }
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      // On tall, near-square windows Viyan fills the width and the lower arrows would land on him.
      // Keep the notes there, drop the arrows.
      if (W / H < 1.3) {
        setGeo(null);
        resetNotes();
        gsap.set(stage.querySelectorAll(".hero__note"), { opacity: 1, delay: 2.6 });
        return;
      }
      // Offsets ignore transforms, so arrows aim where Viyan and the notes rest, not mid-animation.
      const fig = stage.querySelector(".hero__figure");
      const arrows = ARROWS.map((a) => {
        const note = stage.querySelector(`[data-note="${a.id}"]`);
        const target = [fig.offsetLeft + fig.offsetWidth * a.at[0], fig.offsetTop + fig.offsetHeight * a.at[1]];
        const tone = NOTES.find((n) => n.id === a.id).tone;
        return { id: a.id, tone, ...buildArrow(placeNote(note, a, W, H), target, a, W) };
      });
      setGeo({ w: W, h: H, arrows });
    };

    let cancelled = false;
    Promise.all([document.fonts?.ready, bootDone]).then(() => !cancelled && measure());
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(measure, 120);
    });
    ro.observe(stage);
    return () => {
      cancelled = true;
      ro.disconnect();
      clearTimeout(t);
    };
  }, [stageRef]);

  // Reveal: each note fades in, then its arrow is drawn out toward Viyan and the head flicks on.
  useLayoutEffect(() => {
    if (!geo) return;
    const stage = stageRef.current;
    const svg = svgRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parts = svg.querySelectorAll(".hero__arrow path");
    if (drawn.current || reduce) {
      gsap.set(parts, { strokeDashoffset: 0 });
      gsap.set(stage.querySelectorAll(".hero__note"), { opacity: 1 });
      return;
    }
    drawn.current = true;
    gsap.set(parts, { strokeDashoffset: 1 });

    const tl = gsap.timeline({ delay: 2.4 });
    geo.arrows.forEach((a, i) => {
      const at = i * 0.3;
      tl.to(stage.querySelector(`[data-note="${a.id}"]`), { opacity: 1, duration: 0.45, ease: "power2.out" }, at)
        .to(svg.querySelector(`[data-line="${a.id}"]`), { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, at + 0.2)
        .to(svg.querySelector(`[data-head="${a.id}"]`), { strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }, ">-0.05");
    });
    return () => tl.progress(1).kill();
  }, [geo, stageRef]);

  return (
    <svg
      ref={svgRef}
      className="hero__ink"
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : "0 0 1 1"}
      aria-hidden="true"
    >
      <defs>
        {/* A hint of wobble, so the lines read as pen rather than vector. */}
        <filter id="ink-rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="2.5" />
        </filter>
      </defs>
      {geo?.arrows.map((a) => (
        <g key={a.id} className={`hero__arrow hero__arrow--${a.tone}`} filter="url(#ink-rough)">
          <path d={a.line} data-line={a.id} pathLength="1" />
          <path d={a.head} data-head={a.id} pathLength="1" />
        </g>
      ))}
    </svg>
  );
}

export function NoteList() {
  return (
    <ul className="hero__notes" aria-label="About Viyan">
      {NOTES.map((n) => (
        <li
          key={n.id}
          className={`hero__note hero__note--${n.tone}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          data-note={n.id}
        >
          {n.text.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </li>
      ))}
    </ul>
  );
}
