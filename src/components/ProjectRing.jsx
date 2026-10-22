import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isLite, onLite } from "../lite.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS, INTERNSHIPS, WINS } from "../data.js";
import CaseStudy from "./CaseStudy.jsx";
import Barcode from "./Barcode.jsx";

const REPEAT = 3; // the ring phase shows every project three times; the arc keeps one of each
const TONES = ["deep", "wine", "sand", "paper", "wine", "sand"];

/** Small motif per project, so each poster reads at a glance even when it's far away. */
function Motif({ name }) {
  switch (name) {
    case "FedLearn":
      // Devices around a shared model: learning flows in, data stays on each device.
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          <circle cx="50" cy="35" r="9" />
          {[
            [16, 14],
            [84, 14],
            [16, 56],
            [84, 56],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x - 7} y={y - 6} width="14" height="12" rx="3" />
              <path d={`M${x + (x < 50 ? 7 : -7)} ${y} L${x < 50 ? 42 : 58} ${y < 35 ? 30 : 40}`} strokeDasharray="3 3" />
            </g>
          ))}
        </svg>
      );
    case "Envision":
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          <rect x="10" y="8" width="80" height="54" rx="4" />
          <path d="M22 20 h10 M22 20 v10 M78 20 h-10 M78 20 v10 M22 50 h10 M22 50 v-10 M78 50 h-10 M78 50 v-10" />
          <circle cx="50" cy="35" r="8" />
        </svg>
      );
    case "T-Map":
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          {[14, 30, 46].map((y) => (
            <g key={y}>
              <rect x="12" y={y} width="10" height="10" rx="2" />
              <path d={`M14 ${y + 5} l3 3 l5 -6`} />
              <path d={`M30 ${y + 5} h56`} />
            </g>
          ))}
        </svg>
      );
    case "BVS":
      return (
        <div className="pcard__barcode" aria-hidden="true">
          <Barcode value="BVS-ROBRIDGE" />
        </div>
      );
    case "ClaimShield Nexus":
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          <path d="M50 8 L78 18 V36 C78 50 66 60 50 64 C34 60 22 50 22 36 V18 Z" />
          <path d="M38 36 l8 8 l16 -16" />
        </svg>
      );
    case "TenantVault":
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={14 + i * 25} y="14" width="20" height="42" rx="2" />
          ))}
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={24 + i * 25} cy="35" r="3.5" />
          ))}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 70" className="pcard__motif" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M8 ${14 + i * 11} Q 50 ${6 + i * 11} 92 ${14 + i * 11}`} />
          ))}
        </svg>
      );
  }
}

/** A word stretched to fill its box: glyphs are scaled to the box's width and height. */
function FitWord({ text, className, hollow = false }) {
  return (
    <svg className={className} viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
      <text
        x="0"
        y="197"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        className={hollow ? "pring__word-text pring__word-text--hollow" : "pring__word-text"}
      >
        {text.toUpperCase()}
      </text>
    </svg>
  );
}

function CardFace({ project }) {
  return (
    <>
      <span className="pcard__client">{project.client}</span>
      <Motif name={project.name} />
      <span className="pcard__name">{project.name}</span>
      <span className="pcard__line">{project.summary}</span>
      <span className="pcard__stack">{project.stack.slice(0, 3).join(", ")}</span>
    </>
  );
}

/**
 * Projects as a 3D ring of poster cards inside a framed window, after avivashishta.com.
 * The camera sits inside the cylinder, so far cards look small and side cards loom large.
 * It drifts on its own; while the section is pinned, scrolling spins it, and it can be dragged.
 * On arrival every card circles round a diagonal ring (duplicates included); as it levels out the
 * duplicates fade and the six originals settle into the arc.
 */
export default function ProjectRing() {
  const sectionRef = useRef(null);
  const windowRef = useRef(null);
  const ringRef = useRef(null);
  const rowRef = useRef(null);

  // Phones: the flat row drifts slowly to the end and back. Touching it hands control to the
  // finger; the drift picks up again a few seconds after you let go.
  useEffect(() => {
    const row = rowRef.current;
    if (!window.matchMedia("(max-width: 820px)").matches) return undefined;
    // The ring's animation, which fades the sky and words in, doesn't run on phones.
    windowRef.current.style.setProperty("--sky", "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let dir = 1;
    let pos = 0;
    let holdUntil = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(row);
    // Snapping helps a finger swipe land on a card, but it would pull the slow drift back each
    // frame, so it is only on while the row is being touched.
    const hold = () => {
      holdUntil = performance.now() + 3500;
      row.style.scrollSnapType = "x proximity";
      pos = row.scrollLeft;
    };
    row.addEventListener("pointerdown", hold);
    row.addEventListener("touchstart", hold, { passive: true });
    row.addEventListener("scroll", () => {
      if (performance.now() < holdUntil) pos = row.scrollLeft;
    }, { passive: true });
    const tick = (time, dt) => {
      if (!visible || frozen.current || performance.now() < holdUntil) return;
      if (row.style.scrollSnapType !== "none") {
        row.style.scrollSnapType = "none";
        pos = row.scrollLeft;
      }
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 0) return;
      pos += dir * 0.45 * (Math.min(dt, 50) / 16.67);
      if (pos >= max) {
        pos = max;
        dir = -1;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      row.scrollLeft = pos;
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      row.removeEventListener("pointerdown", hold);
      row.removeEventListener("touchstart", hold);
    };
  }, []);
  const [opened, setOpened] = useState(null);
  // While a case study is open the ring holds still, so nothing flickers behind the panel.
  const frozen = useRef(false);
  frozen.current = opened !== null;
  const openerRef = useRef(null);
  const state = useRef({ spin: 0, vel: 0, scroll: 0, dragging: false, moved: 0 });
  const tiltRef = useRef(null);
  // Camera. dist = how far ahead the layout's centre sits (in arc radii); pf = perspective (in arc radii);
  // morph blends the full ring (0) into the six-card arc (1); spin turns the ring during the entrance.
  const START = { dist: 2.6, pf: 2.1, tiltX: 30, tiltZ: -17, x: 6, y: 16, sky: 0, morph: 0, spin: 0, done: 0 };
  const FINAL = { dist: 0.05, pf: 0.8, tiltX: 0, tiltZ: 0, x: 0, y: 0, sky: 1, morph: 1, spin: 300, done: 1 };
  const cam = useRef({ ...START });
  const pops = useRef(Array.from({ length: PROJECTS.length * REPEAT }, () => ({ v: 0 })));

  const cards = Array.from({ length: PROJECTS.length * REPEAT }, (_, i) => ({
    key: i,
    project: PROJECTS[i % PROJECTS.length],
    index: i % PROJECTS.length,
  }));

  // Two layouts, blended by cam.morph:
  //   ring (morph 0): every card, duplicates included, evenly round a closed circle, facing outward;
  //   arc  (morph 1): only the six originals on a front arc facing the camera; duplicates fade out.
  // Cards always face the camera on the near side, so no card backs are ever shown.
  useEffect(() => {
    const win = windowRef.current;
    const ring = ringRef.current;
    const els = [...ring.children];
    const total = els.length;
    const unique = PROJECTS.length;
    const arcStep = Math.min(32, 160 / Math.max(1, unique - 1));
    while (pops.current.length < total) pops.current.push({ v: cam.current.done ? 1 : 0 });
    let Ra = 600;
    let Rr = 600;

    const layout = () => {
      const cw = els[0].offsetWidth;
      Ra = (cw * 1.2) / ((arcStep * Math.PI) / 180);
      Rr = (total * cw * 1.08) / (2 * Math.PI);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(win);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = state.current;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(win);

    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpAngle = (a, b, t) => {
      const d = ((((b - a) % 360) + 540) % 360) - 180;
      return a + d * t;
    };
    const smooth = (t) => t * t * (3 - 2 * t);

    const phone = window.matchMedia("(max-width: 820px)").matches;
    const SWEEP_PERIOD = 34; // seconds for one full left-to-right-and-back; slow enough to read each card
    let sweepT = 0;
    const tick = (time, dt) => {
      if (!visible || frozen.current || phone) return;
      const d = Math.min(dt, 50) / 16.67;
      // Dragging pushes the arc aside; let go and it springs back to centre.
      if (!s.dragging) s.spin *= Math.pow(0.9, d);
      const c = cam.current;
      const m = smooth(Math.max(0, Math.min(1, c.morph)));
      const sway = reduce || isLite() || c.done < 1 ? 0 : Math.sin(time * 0.45) * 5;
      // Phones: no pinning; once the arc has settled, it glides left to right on its own, slowing and
      // reversing at each end, so every card passes the centre.
      let sweep = 0;
      if (phone && !reduce && c.done >= 1) {
        sweepT += Math.min(dt, 50) / 1000;
        sweep = Math.sin((sweepT / SWEEP_PERIOD) * Math.PI * 2) * ((unique - 1) / 2) * arcStep;
      }
      const arcRot = s.spin + s.scroll + (phone ? 0 : sway) + sweep;

      ring.style.transform = `translateZ(${-c.dist * Ra}px)`;
      tiltRef.current.style.transform = `translate(${c.x}%, ${c.y}%) rotateX(${-c.tiltX}deg) rotateZ(${c.tiltZ}deg)`;
      win.style.setProperty("--sky", c.sky.toFixed(3));
      win.style.perspective = `${Math.round(Ra * c.pf)}px`;

      els.forEach((el, i) => {
        const isDup = i >= unique;
        const ringAngle = (i * 360) / total + c.spin;
        const arcAngle = isDup ? ringAngle : (i - (unique - 1) / 2) * arcStep + arcRot;
        const a = lerpAngle(ringAngle, arcAngle, m);
        const z = lerp(Rr, -Ra, m);
        const pop = pops.current[i] ? pops.current[i].v : 1;
        const scale = 0.55 + 0.45 * pop;
        el.style.transform = `rotateY(${a.toFixed(2)}deg) translateZ(${z.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        const fade = isDup ? Math.max(0, 1 - c.morph * 1.8) : 1;
        el.style.opacity = String(Math.min(1, pop * 1.4) * fade);
        el.dataset.live = c.done < 1 || isDup ? "0" : "1";
        el.style.visibility = fade <= 0.01 ? "hidden" : "";
      });
    };
    gsap.ticker.add(tick);
    // Lite mode: skip the circling entrance and settle on a flatter arc that only moves when you drag.
    const offLite = onLite(() => {
      gsap.killTweensOf(cam.current);
      gsap.killTweensOf(pops.current);
      Object.assign(cam.current, FINAL, { pf: 1.6 });
      pops.current.forEach((p) => (p.v = 1));
    });

    // Drag to push the arc, springing back on release.
    let lastX = 0;
    // Capture the pointer only once it has really moved, so plain clicks still reach the cards.
    let pressed = false;
    const onDown = (e) => {
      pressed = true;
      s.moved = 0;
      lastX = e.clientX;
    };
    const onMove = (e) => {
      if (!pressed) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      s.moved += Math.abs(dx);
      if (!s.dragging) {
        if (s.moved < 6) return;
        s.dragging = true;
        win.setPointerCapture(e.pointerId);
      }
      s.spin = Math.max(-35, Math.min(35, s.spin + dx * 0.12));
    };
    const onUp = () => {
      pressed = false;
      s.dragging = false;
    };
    const onEnter = () => document.documentElement.classList.add("cursor-dark");
    const onLeave = () => document.documentElement.classList.remove("cursor-dark");
    win.addEventListener("pointerenter", onEnter);
    win.addEventListener("pointerleave", onLeave);
    win.addEventListener("pointerdown", onDown);
    win.addEventListener("pointermove", onMove);
    win.addEventListener("pointerup", onUp);
    win.addEventListener("pointercancel", onUp);

    return () => {
      offLite();
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(tick);
      win.removeEventListener("pointerenter", onEnter);
      win.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("cursor-dark");
      win.removeEventListener("pointerdown", onDown);
      win.removeEventListener("pointermove", onMove);
      win.removeEventListener("pointerup", onUp);
      win.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // Pin while in view (scrolling swings the arc), and play the entrance once as the section arrives.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Larger screens pin the section and scrolling swings the arc out and back. Phones scroll
        // straight past; the arc sweeps on its own there instead.
        if (!window.matchMedia("(max-width: 820px)").matches) {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              state.current.scroll = Math.sin(self.progress * Math.PI * 2) * 18;
            },
          });
        }
        // Entrance: all cards pop in round a diagonal ring that circles, the sky fades in, then the
        // ring rolls level while the duplicates fade and the six originals settle into the arc.
        Object.assign(cam.current, START);
        pops.current.forEach((p) => (p.v = 0));
        const intro = gsap.timeline({ paused: true });
        intro
          .to(pops.current, { v: 1, duration: 0.4, stagger: 0.055, ease: "back.out(1.7)" }, 0)
          .to(cam.current, { spin: 300, duration: 3.2, ease: "power1.out" }, 0)
          .to(cam.current, { sky: 1, duration: 0.9, ease: "power1.inOut" }, 0.8)
          .to(
            cam.current,
            { morph: 1, dist: FINAL.dist, pf: FINAL.pf, tiltX: 0, tiltZ: 0, x: 0, y: 0, duration: 1.9, ease: "power3.inOut" },
            1.7
          )
          .set(cam.current, { done: 1 });
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 70%",
          once: true,
          onEnter: () => intro.play(),
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        Object.assign(cam.current, FINAL);
        pops.current.forEach((p) => (p.v = 1));
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Browsers (Safari above all) can hit-test angled 3D cards wrongly, so a tap on a side card may
  // reach the centre one. For pointer taps, pick the visible card whose on-screen box is under the
  // pointer, nearest its middle when boxes overlap. Keyboard activation keeps the focused card.
  const cardAt = (x, y) => {
    let best = null;
    let bestD = Infinity;
    ringRef.current.querySelectorAll(".pcard").forEach((li, k) => {
      if (k >= PROJECTS.length || li.style.visibility === "hidden" || Number(li.style.opacity) < 0.5) return;
      const r = li.querySelector(".pcard__face").getBoundingClientRect();
      // A card swung behind the camera projects to a huge box; it can't be the one tapped.
      if (r.width > window.innerWidth) return;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
      const d = Math.abs(x - (r.left + r.right) / 2);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    return best;
  };

  const open = (i, e) => {
    if (state.current.moved > 6) return; // a drag, not a click
    const picked = e.detail > 0 ? cardAt(e.clientX, e.clientY) : null;
    openerRef.current = e.currentTarget;
    setOpened(picked ?? i);
  };

  const wins = WINS.find((w) => w.stamp === "1st place");

  return (
    <section ref={sectionRef} id="work" className="pring" aria-labelledby="work-title">
      <div ref={windowRef} className="pring__window" data-lenis-prevent-touch>
        <div className="pring__sky" aria-hidden="true" />
        {/* Display words framing the cards: hollow above, solid below. */}
        <FitWord className="pring__word pring__word--top" text="Selected" hollow />
        <FitWord className="pring__word pring__word--bottom" text="Projects" />
        <div ref={tiltRef} className="pring__tilt">
          <div className="pring__stage">
            <ul ref={ringRef} className="pring__ring" aria-label="Projects">
              {cards.map((c) => (
                <li key={c.key} className={`pcard pcard--${TONES[c.index]}`}>
                  <button
                    type="button"
                    className="pcard__face pcard__btn"
                    onClick={(e) => open(c.index, e)}
                    aria-label={`${c.project.name}: open case study`}
                    aria-hidden={c.key >= PROJECTS.length ? true : undefined}
                    tabIndex={c.key < PROJECTS.length ? 0 : -1}
                    data-detect={c.project.name.toLowerCase()}
                  >
                    <CardFace project={c.project} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Phones: a flat row you swipe, which glides on its own. Plain buttons, so taps always land. */}
        <ul ref={rowRef} className="pring__row" aria-label="Projects">
          {PROJECTS.map((p, i) => (
            <li key={p.name} className={`pcard pcard--flat pcard--${TONES[i % TONES.length]}`}>
              <button
                type="button"
                className="pcard__face pcard__btn"
                onClick={(e) => {
                  openerRef.current = e.currentTarget;
                  setOpened(i);
                }}
                aria-label={`${p.name}: open case study`}
                data-detect={p.name.toLowerCase()}
              >
                <CardFace project={p} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pring__foot">
        <h2 id="work-title" className="pring__lede">
          I build privacy-first AI like{" "}
          <button type="button" className="pring__ref" onClick={(e) => open(0, e)}>
            FedLearn<sup>01</sup>
          </button>
          , computer vision for{" "}
          <button type="button" className="pring__ref" onClick={(e) => open(1, e)}>
            Chennai Metco<sup>02</sup>
          </button>
          , audit systems for{" "}
          <button type="button" className="pring__ref" onClick={(e) => open(2, e)}>
            Sakthi Auto<sup>03</sup>
          </button>
          , AI barcode flows for{" "}
          <button type="button" className="pring__ref" onClick={(e) => open(3, e)}>
            RoBridge<sup>04</sup>
          </button>{" "}
          and campus tools for{" "}
          <button type="button" className="pring__ref" onClick={(e) => open(4, e)}>
            my college<sup>05</sup>
          </button>
          .
        </h2>
        <dl className="pring__stats">
          <div>
            <dt>Projects shipped</dt>
            <dd>{PROJECTS.length}</dd>
          </div>
          <div>
            <dt>Internships in 2025</dt>
            <dd>{INTERNSHIPS.length}</dd>
          </div>
          <div>
            <dt>National hackathon</dt>
            <dd>{wins ? "1st" : "—"}</dd>
          </div>
        </dl>
      </div>

      <CaseStudy
        project={opened == null ? null : PROJECTS[opened]}
        onClose={() => {
          setOpened(null);
          openerRef.current?.focus({ preventScroll: true });
        }}
      />
    </section>
  );
}
