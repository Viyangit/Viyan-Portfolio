import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { PROFILE } from "../data.js";
import { bootDone } from "./Boot.jsx";

const PHOTO = "/uploads/viyan-sunset.webp";

// Positions are percentages of the photo frame.
const DETECTIONS = [
  { label: "person", conf: "0.99", x: 2, y: 19.5, w: 88, h: 80 },
  { label: "face", conf: "0.98", x: 46, y: 27, w: 28, h: 22 },
  { label: "sunglasses", conf: "0.94", x: 50.5, y: 33, w: 25.5, h: 6 },
];

/** Sobel edge map of the photo, painted in safety yellow on a transparent canvas. */
function buildEdgeMap(img) {
  const W = 420;
  const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const src = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    g[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
  }
  const out = ctx.createImageData(W, H);
  const o = out.data;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = -g[i - W - 1] - 2 * g[i - 1] - g[i + W - 1] + g[i - W + 1] + 2 * g[i + 1] + g[i + W + 1];
      const gy = -g[i - W - 1] - 2 * g[i - W] - g[i - W + 1] + g[i + W - 1] + 2 * g[i + W] + g[i + W + 1];
      const m = Math.hypot(gx, gy);
      if (m > 70) {
        o[i * 4] = 255;
        o[i * 4 + 1] = 208;
        o[i * 4 + 2] = 0;
        o[i * 4 + 3] = Math.min(255, (m - 70) * 2.2);
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

function EdgeLens({ frameRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let edges = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let pointer = null;
    const lens = { x: 0.5, y: 0.35 };
    let running = false;
    let raf;
    let t0 = performance.now();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = frame.clientWidth;
      h = frame.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    const draw = (now) => {
      if (!edges) return;
      const t = (now - t0) / 1000;
      const target = pointer ?? {
        x: 0.5 + Math.sin(t * 0.55) * 0.22,
        y: 0.42 + Math.sin(t * 0.8 + 1.2) * 0.2,
      };
      const k = pointer ? 0.2 : 0.06;
      lens.x += (target.x - lens.x) * k;
      lens.y += (target.y - lens.y) * k;

      const r = Math.max(70, Math.min(w, h) * 0.24);
      const cx = lens.x * w;
      const cy = lens.y * h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(12, 20, 70, 0.94)";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      // Match the photo's object-fit: cover crop.
      const scale = Math.max(w / edges.width, h / edges.height);
      const dw = edges.width * scale;
      const dh = edges.height * scale;
      ctx.drawImage(edges, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.restore();

      ctx.strokeStyle = "#FFD000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let a = 0; a < 4; a++) {
        const ang = (a * Math.PI) / 2;
        ctx.moveTo(cx + Math.cos(ang) * (r - 10), cy + Math.sin(ang) * (r - 10));
        ctx.lineTo(cx + Math.cos(ang) * (r + 10), cy + Math.sin(ang) * (r + 10));
      }
      ctx.stroke();
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "#FFD000";
      ctx.fillText("sobel edge map", cx - r + 4, cy + r + 18);
    };

    const loop = (now) => {
      draw(now);
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const img = new Image();
    img.src = PHOTO;
    img.onload = () => {
      edges = buildEdgeMap(img);
      resize();
      if (reduce) draw(performance.now());
    };

    const onMove = (e) => {
      const r = frame.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      if (reduce) draw(performance.now());
    };
    const onLeave = () => {
      pointer = null;
      t0 = performance.now() - 2000;
    };
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerdown", onMove);
    frame.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduce) start();
      else stop();
    });
    io.observe(frame);
    const ro = new ResizeObserver(resize);
    ro.observe(frame);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerdown", onMove);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, [frameRef]);

  return <canvas ref={canvasRef} className="hero__lens" aria-hidden="true" />;
}

function FrameCounter() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    const id = setInterval(() => {
      n = (n + 1) % 1000000;
      if (ref.current) ref.current.textContent = String(n).padStart(6, "0");
    }, 1000 / 24);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref}>000000</span>;
}

export default function Hero() {
  const rootRef = useRef(null);
  const frameRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        bootDone.then(() => tl.play());
        tl.from(".hero__frame", { clipPath: "inset(50% 0% 50% 0%)", duration: 1.1, ease: "expo.inOut" })
          .from(".hero__name-line > span", { yPercent: 105, duration: 1.1, stagger: 0.08 }, "-=0.55")
          .from(".hero__box", { scale: 1.6, opacity: 0, duration: 0.5, stagger: 0.18, ease: "back.out(2)" }, "-=0.6")
          .from(".hero__intro, .hero__meta", { opacity: 0, duration: 0.8 }, "-=0.4");

        gsap.to(".hero__name", {
          yPercent: -38,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero__frame", {
          yPercent: 12,
          scale: 0.94,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
        });
        // fromTo: the load timeline has already zeroed opacity, so a plain .to() would record 0 as its start.
        gsap.fromTo(".hero__intro", { yPercent: 0, opacity: 1 }, {
          yPercent: -80,
          opacity: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "60% top", scrub: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="top" className="hero" aria-label="Introduction">
      <p className="hero__intro">
        I'm an AI engineer who ships to factory floors: vision models that inspect metal, LLM-assisted
        barcode systems that track stock, and audit tools that keep every shift accountable.
      </p>

      <div ref={frameRef} className="hero__frame" data-detect="viyan">
        <img src={PHOTO} alt="Viyan Manokaran in a black shirt and sunglasses, smiling against a sunset" className="hero__photo" />
        {DETECTIONS.map((d) => (
          <div
            key={d.label}
            className="hero__box"
            style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}
            aria-hidden="true"
          >
            <span>
              {d.label} {d.conf}
            </span>
          </div>
        ))}
        <EdgeLens frameRef={frameRef} />
        <div className="hero__hud" aria-hidden="true">
          <span>cam 01</span>
          <span>
            frame <FrameCounter />
          </span>
        </div>
        <p className="hero__hint">Move across the photo to see what the camera sees</p>
      </div>

      <h1 className="hero__name">
        <span className="hero__name-line">
          <span>Viyan</span>
        </span>
        <span className="hero__name-line">
          <span>Manokaran</span>
        </span>
      </h1>

      <p className="hero__meta">
        {PROFILE.role} in {PROFILE.city}
      </p>
    </section>
  );
}
