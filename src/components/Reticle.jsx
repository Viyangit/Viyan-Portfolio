import { useEffect, useRef } from "react";

/** Stable fake confidence per label, so the same element always reads the same score. */
function confidence(label) {
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (0.88 + (h % 12) / 100).toFixed(2);
}

/**
 * Cursor as a detection reticle: idles as a small crosshair, and snaps a labelled
 * bounding box onto any element marked with data-detect.
 */
export default function Reticle() {
  const boxRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const box = boxRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    const root = document.documentElement;
    root.classList.add("has-reticle");

    let mx = -100;
    let my = -100;
    let target = null;
    let visible = false;
    const cur = { x: -100, y: -100, w: 22, h: 22 };

    const setTarget = (el) => {
      if (el === target) return;
      target = el;
      box.classList.toggle("is-locked", !!el);
      if (el) {
        const name = el.dataset.detect;
        label.textContent = `${name} ${confidence(name)}`;
      }
    };

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        box.style.opacity = "";
        dot.style.opacity = "";
      }
      setTarget(e.target.closest?.("[data-detect]") ?? null);
    };
    const onLeave = () => {
      visible = false;
      box.style.opacity = "0";
      dot.style.opacity = "0";
      setTarget(null);
    };
    const onDown = () => box.classList.add("is-pressed");
    const onUp = () => box.classList.remove("is-pressed");

    let raf;
    const tick = () => {
      let tx, ty, tw, th;
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        const pad = 6;
        tx = r.left - pad;
        ty = r.top - pad;
        tw = r.width + pad * 2;
        th = r.height + pad * 2;
      } else {
        tw = th = 22;
        tx = mx - 11;
        ty = my - 11;
      }
      const k = target ? 0.24 : 0.4;
      cur.x += (tx - cur.x) * k;
      cur.y += (ty - cur.y) * k;
      cur.w += (tw - cur.w) * k;
      cur.h += (th - cur.h) * k;
      box.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      box.style.width = `${cur.w}px`;
      box.style.height = `${cur.h}px`;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-reticle");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={boxRef} className="reticle" style={{ opacity: 0 }} aria-hidden="true">
        <i className="reticle__corner reticle__corner--tl" />
        <i className="reticle__corner reticle__corner--tr" />
        <i className="reticle__corner reticle__corner--bl" />
        <i className="reticle__corner reticle__corner--br" />
        <span ref={labelRef} className="reticle__label" />
      </div>
      <div ref={dotRef} className="reticle-dot" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  );
}
