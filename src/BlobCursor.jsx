import { useEffect, useRef, useState } from "react";

const configs = [
  { size: 28, innerSize: 8, speed: 0.1 },
  { size: 50, innerSize: 14, speed: 0.06 },
  { size: 36, innerSize: 10, speed: 0.08 },
];

export default function BlobCursor() {
  const layerRef = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion) return undefined;
    setShow(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (!show) return undefined;

    const layer = layerRef.current;
    if (!layer) return undefined;

    let mx = -300;
    let my = -300;
    let rafId;

    const blobs = configs.map((cfg) => {
      const outer = document.createElement("div");
      outer.style.cssText = `
        position:absolute; border-radius:50%;
        width:${cfg.size}px; height:${cfg.size}px;
        background:#fff; transform:translate3d(-300px,-300px,0) translate(-50%,-50%);
        pointer-events:none; will-change:transform;
      `;
      const inner = document.createElement("div");
      inner.style.cssText = `
        position:absolute;
        width:${cfg.innerSize}px; height:${cfg.innerSize}px;
        background:#fff; border-radius:50%;
        top:50%; left:50%; transform:translate(-50%,-50%);
      `;
      outer.appendChild(inner);
      layer.appendChild(outer);
      return { el: outer, x: -300, y: -300, speed: cfg.speed };
    });

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      mx = -300;
      my = -300;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      blobs.forEach((b) => {
        b.x = lerp(b.x, mx, b.speed);
        b.y = lerp(b.y, my, b.speed);
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) translate(-50%, -50%)`;
      });
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      blobs.forEach((b) => b.el.remove());
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
        <defs>
          <filter id="gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        ref={layerRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          filter: "url(#gooey)",
          mixBlendMode: "difference",
        }}
      />
    </>
  );
}
