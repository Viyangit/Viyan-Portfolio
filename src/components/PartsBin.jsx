import { useEffect, useRef } from "react";
import { SKILLS, SKILL_GROUPS } from "../data.js";

const GRAVITY = 2400;
const BOUNCE = 0.32;

/**
 * Skills as parts in a bin. They drop in when the bin scrolls into view, pile up,
 * and can be grabbed and thrown. Simple AABB physics, no library.
 */
export default function PartsBin() {
  const binRef = useRef(null);
  const chipRefs = useRef([]);
  const shakeRef = useRef(() => {});

  useEffect(() => {
    const bin = binRef.current;
    const els = chipRefs.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      bin.classList.add("is-static");
      return;
    }

    let W = bin.clientWidth;
    let H = bin.clientHeight;
    const bodies = els.map((el, i) => ({
      el,
      w: el.offsetWidth,
      h: el.offsetHeight,
      x: ((i * 137) % Math.max(1, W - el.offsetWidth)) | 0,
      y: -120 - i * 70,
      vx: (Math.random() - 0.5) * 200,
      vy: 0,
      r: 0,
    }));

    let drag = null;
    let started = false;
    let running = false;
    let raf;
    let last = 0;

    const step = (dt) => {
      for (const b of bodies) {
        if (drag?.body === b) {
          const nx = drag.px - drag.ox;
          const ny = drag.py - drag.oy;
          b.vx = (nx - b.x) / dt;
          b.vy = (ny - b.y) / dt;
          b.x = nx;
          b.y = ny;
          continue;
        }
        b.vy += GRAVITY * dt;
        b.vx *= 0.995;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 0) {
          b.x = 0;
          b.vx = -b.vx * BOUNCE;
        } else if (b.x + b.w > W) {
          b.x = W - b.w;
          b.vx = -b.vx * BOUNCE;
        }
        if (b.y + b.h > H) {
          b.y = H - b.h;
          b.vy = -b.vy * BOUNCE;
          b.vx *= 0.86;
          if (Math.abs(b.vy) < 30) b.vy = 0;
        }
      }

      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const c = bodies[j];
            const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
            const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
            if (ox <= 0 || oy <= 0) continue;
            const aFixed = drag?.body === a;
            const cFixed = drag?.body === c;
            const ka = aFixed ? 0 : cFixed ? 1 : 0.5;
            const kc = cFixed ? 0 : aFixed ? 1 : 0.5;
            if (ox < oy) {
              const dir = a.x < c.x ? -1 : 1;
              a.x += dir * ox * ka;
              c.x -= dir * ox * kc;
              const rv = a.vx - c.vx;
              if (rv * dir < 0) {
                const jv = (-(1 + BOUNCE) * rv) / 2;
                if (!aFixed) a.vx += jv;
                if (!cFixed) c.vx -= jv;
              }
            } else {
              const dir = a.y < c.y ? -1 : 1;
              a.y += dir * oy * ka;
              c.y -= dir * oy * kc;
              const rv = a.vy - c.vy;
              if (rv * dir < 0) {
                const jv = (-(1 + BOUNCE) * rv) / 2;
                if (!aFixed) a.vy += jv;
                if (!cFixed) c.vy -= jv;
              }
              // Resting on top of another part: let friction take the slide out.
              const upper = dir < 0 ? a : c;
              upper.vx *= 0.92;
            }
          }
        }
      }

      for (const b of bodies) {
        if (b.y + b.h > H) b.y = H - b.h;
        const tilt = Math.max(-14, Math.min(14, b.vx * 0.02));
        b.r += (tilt - b.r) * 0.2;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.r.toFixed(2)}deg)`;
      }
    };

    const loop = (now) => {
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
      last = now;
      step(dt / 2);
      step(dt / 2);
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Park the parts above the bin until it is seen.
    for (const b of bodies) b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          started = true;
          start();
        } else stop();
      },
      { threshold: 0.35 }
    );
    io.observe(bin);

    const binPoint = (e) => {
      const r = bin.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e) => {
      const idx = els.indexOf(e.target.closest(".part"));
      if (idx < 0) return;
      e.preventDefault();
      const p = binPoint(e);
      const body = bodies[idx];
      drag = { body, ox: p.x - body.x, oy: p.y - body.y, px: p.x, py: p.y, id: e.pointerId };
      body.el.classList.add("is-held");
      bin.setPointerCapture(e.pointerId);
      start();
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = binPoint(e);
      drag.px = p.x;
      drag.py = p.y;
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.body.el.classList.remove("is-held");
      drag = null;
    };
    bin.addEventListener("pointerdown", onDown);
    bin.addEventListener("pointermove", onMove);
    bin.addEventListener("pointerup", onUp);
    bin.addEventListener("pointercancel", onUp);

    const onResize = () => {
      W = bin.clientWidth;
      H = bin.clientHeight;
      for (const b of bodies) {
        b.w = b.el.offsetWidth;
        b.h = b.el.offsetHeight;
        b.x = Math.min(b.x, W - b.w);
      }
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(bin);

    shakeRef.current = () => {
      for (const b of bodies) {
        b.vy = -900 - Math.random() * 900;
        b.vx = (Math.random() - 0.5) * 1400;
      }
      if (started) start();
    };

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      bin.removeEventListener("pointerdown", onDown);
      bin.removeEventListener("pointermove", onMove);
      bin.removeEventListener("pointerup", onUp);
      bin.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section id="skills" className="partsbin" aria-labelledby="skills-title">
      <div className="partsbin__head">
        <h2 id="skills-title" className="section-title">
          What's in the toolbox
        </h2>
        <p>Grab a part and throw it. Everything here has been used on a real project.</p>
        <ul className="partsbin__legend">
          {Object.entries(SKILL_GROUPS).map(([key, label]) => (
            <li key={key} className={`legend legend--${key}`}>
              {label}
            </li>
          ))}
        </ul>
        <button type="button" className="btn-shake" onClick={() => shakeRef.current()} data-detect="shake">
          Shake the bin
        </button>
      </div>

      <div ref={binRef} className="partsbin__bin">
        <ul className="partsbin__parts" aria-label="Skills">
          {SKILLS.map((s, i) => (
            <li
              key={s.name}
              ref={(el) => (chipRefs.current[i] = el)}
              className={`part part--${s.group}`}
              data-detect={s.name.toLowerCase()}
            >
              {s.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
