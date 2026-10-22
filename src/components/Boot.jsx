import { useEffect, useRef, useState } from "react";
import { isLite } from "../lite.js";

let resolveBoot;
/** Resolves when the intro loader starts leaving, so the hero can play its entrance after it. */
export const bootDone = new Promise((r) => (resolveBoot = r));

const DURATION = 1300;
const DURATION_LITE = 400; // weak devices get to the content sooner

/** Intro loader styled as a camera calibration pass over a checkerboard target. */
export default function Boot() {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [gone, setGone] = useState(reduce);
  const [leaving, setLeaving] = useState(false);
  const numRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    if (reduce) {
      resolveBoot();
      return;
    }
    window.__lenis?.stop();
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / (isLite() ? DURATION_LITE : DURATION));
      const eased = 1 - Math.pow(1 - p, 3);
      if (numRef.current) numRef.current.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        resolveBoot();
        window.__lenis?.start();
        window.setTimeout(() => setGone(true), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  if (gone) return null;

  return (
    <div className={`boot ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="boot__target">
        {Array.from({ length: 35 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${(i % 7) * 40 + Math.floor(i / 7) * 40}ms` }} />
        ))}
        <span className="boot__corner boot__corner--tl" />
        <span className="boot__corner boot__corner--br" />
      </div>
      <div className="boot__meta">
        <span>Calibrating camera</span>
        <span ref={numRef} className="boot__num">
          000
        </span>
      </div>
      <div className="boot__bar">
        <i ref={barRef} />
      </div>
    </div>
  );
}
