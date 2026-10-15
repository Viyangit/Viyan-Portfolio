import { useEffect, useRef } from "react";

const GLYPHS = "01<>/[]{}#=+*ABCDEFXYZ";

/**
 * Text that "decodes" from noise, left to right, when its closest link or button is hovered or focused.
 * Width is locked during the effect so the layout never jumps.
 */
export default function Decode({ text }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const host = el.closest("a, button") ?? el;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf;
    const run = () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const dur = 60 + text.length * 32;
      el.style.width = `${el.offsetWidth}px`;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const solved = Math.floor(p * text.length);
        let out = text.slice(0, solved);
        for (let i = solved; i < text.length; i++) {
          out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          el.textContent = text;
          el.style.width = "";
        }
      };
      raf = requestAnimationFrame(step);
    };
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
    };
  }, [text]);

  return (
    <span ref={ref} className="decode" aria-label={text}>
      {text}
    </span>
  );
}
