import React, { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dot = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setShow(true);
    const move = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);
    let raf;
    /** Higher = snappier (1 = locked to pointer). ~0.55 tracks fast without feeling jittery. */
    const follow = 0.55;
    const snap = 0.6;
    const loop = () => {
      let dx = target.current.x - pos.current.x;
      let dy = target.current.y - pos.current.y;
      if (Math.abs(dx) < snap && Math.abs(dy) < snap) {
        pos.current.x = target.current.x;
        pos.current.y = target.current.y;
      } else {
        pos.current.x += dx * follow;
        pos.current.y += dy * follow;
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      ref={dot}
      className="pointer-events-none fixed left-0 top-0 z-[100] h-3 w-3 rounded-full border border-white/80 bg-mist/90 mix-blend-difference md:block"
      style={{ willChange: "transform" }}
      aria-hidden
    />
  );
}
