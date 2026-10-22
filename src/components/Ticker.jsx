import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { scrollVelocity } from "../motion.js";

const ROWS = [
  { words: ["AI engineer", "Computer vision", "LLM systems", "Federated learning", "Full stack", "Shop-floor software"] },
  {
    words: ["Python", "React", "Django", "OpenCV", "YOLO", "GStreamer", "MS SQL", "OpenAI API", "Ollama", "Electron"],
    hollow: true,
  },
];

/**
 * Two bands of words that drift sideways, after Motion's scroll-velocity marquee: scrolling speeds
 * them up, the direction follows the scroll, and fast scrolling leans the type. Each row runs
 * opposite to the other.
 */
export default function Ticker() {
  const ref = useRef(null);

  useEffect(() => {
    const rows = [...ref.current.querySelectorAll(".ticker__row")];
    const state = rows.map(() => ({ x: 0 }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(ref.current);

    let dir = 1;
    let skew = 0;
    const tick = (time, dt) => {
      if (!visible) return;
      const v = scrollVelocity();
      if (Math.abs(v) > 0.5) dir = Math.sign(v);
      const f = Math.min(dt, 50) / 16.67;
      skew += (gsap.utils.clamp(-12, 12, -v * 0.6) - skew) * 0.12 * f;
      rows.forEach((row, i) => {
        const track = row.firstElementChild;
        const half = track.scrollWidth / 2; // the words are rendered twice, so half is one loop
        const speed = (0.6 + Math.min(Math.abs(v), 60) * 0.35) * dir * (i % 2 ? -1 : 1);
        state[i].x = gsap.utils.wrap(-half, 0, state[i].x - speed * f);
        track.style.transform = `translate3d(${state[i].x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <section className="ticker" ref={ref} aria-label="What I work on">
      {ROWS.map((row, i) => (
        <div key={i} className={`ticker__row ${row.hollow ? "ticker__row--hollow" : ""}`}>
          <div className="ticker__track">
            {[0, 1].map((copy) => (
              <span key={copy} className="ticker__set" aria-hidden={copy === 1 ? true : undefined}>
                {row.words.map((w) => (
                  <span key={w} className="ticker__word">
                    {w}
                    <i aria-hidden="true">✱</i>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
