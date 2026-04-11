import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { EtherealSectionBackdrop } from "./EtherealShadow.jsx";
import ConfettiBackground from "./components/ui/ConfettiBackground.jsx";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Phase 1: cards split apart (progress ~8% → 50%). */
const p1 = (p) => easeIO(clamp((p - 0.08) / 0.42, 0, 1));
/** Phase 2: flip to credential details (progress ~60% → 100%). */
const p2 = (p) => easeOut(clamp((p - 0.6) / 0.4, 0, 1));

const FLIP_STAGGER = [0, 0.11, 0.22];
/**
 * Split + reveal: outer cards slide *inward* (bottoms cluster) while rotating around bottom center (tops fan).
 * Left: positive X → toward center; right: negative X → toward center.
 */
const SPREAD_X = [78, 0, -78];
/** Keep vertical baseline level (fan pivot handles tilt). */
const SPREAD_Y = [0, 0, 0];
/** Degrees around bottom center: left CCW, right CW, center straight. */
const FAN_DEG = [-13, 0, 13];
const CARD_W = 300;
const CARD_H = 420;

/** Smooth wheel-driven motion (matches portfolio-style easing). */
const EASE_SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
const CARD_SPREAD_MS = 460;
const CARD_FLIP_MS = 540;

/** Front-phase seam glow — neutral neon white (no per-card hue). */
const SPLIT_GLOW = ["#ffffff", "#ffffff", "#ffffff"];

const NEON_BORDER = "rgba(255, 255, 255, 0.92)";
const NEON_BORDER_SOFT = "rgba(255, 255, 255, 0.38)";
const OFFWHITE = "#ececec";
const OFFWHITE_MUTED = "#a3a3a3";
const CARD_BACK_BG = "linear-gradient(168deg, #141414 0%, #0b0b0b 48%, #060606 100%)";

function certificatePanelStyle() {
  return {
    backBg: CARD_BACK_BG,
    borderNeon: NEON_BORDER,
    borderSoft: NEON_BORDER_SOFT,
    offwhite: OFFWHITE,
    offwhiteMuted: OFFWHITE_MUTED,
  };
}

/** LinkedIn “in” mark (monochrome for certificate card). */
function LogoLinkedIn({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.59c0-1.81-.03-4.14-2.52-4.14-2.53 0-2.91 1.97-2.91 4.01V23h-4V8z" />
    </svg>
  );
}

/** Infosys-style horizontal bars (simplified monochrome mark). */
function LogoInfosys({ className }) {
  return (
    <svg className={className} viewBox="0 0 108 32" fill="currentColor" aria-hidden="true">
      <rect x="0" y="5" width="72" height="3" rx="0.5" />
      <rect x="0" y="12" width="96" height="3" rx="0.5" />
      <rect x="0" y="19" width="60" height="3" rx="0.5" />
      <rect x="0" y="26" width="84" height="3" rx="0.5" />
    </svg>
  );
}

/** Monochrome cloud mark (SVG only — no photo) for the Salesforce credential card. */
function LogoSalesforceCloud({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}

function CertificateIssuerLogo({ brand }) {
  const common = "max-h-9 w-auto shrink-0 text-[#ececec]";
  switch (brand) {
    case "linkedin":
      return <LogoLinkedIn className={`${common} h-9 w-9`} />;
    case "infosys":
      return <LogoInfosys className={`${common} h-8 w-[108px]`} />;
    case "salesforce":
      return <LogoSalesforceCloud className={`${common} h-10 w-12`} />;
    default:
      return <div className="h-9 w-20 rounded-md bg-white/10" aria-hidden />;
  }
}

/** Same feel as projects carousel wheel scrub. */
const CERT_SCROLL_SENS = 0.00075;
const CERT_PIN_TOP_PX = 20;

function isCertificatesPinned(rect) {
  return rect.top <= CERT_PIN_TOP_PX && rect.bottom > CERT_PIN_TOP_PX;
}

function syncCertificatesVerticalLock(progRef, containerRef) {
  if (typeof window === "undefined") return;
  const el = containerRef?.current;
  if (!el) {
    window.__certificatesWheelLocksVertical = false;
    return;
  }
  const rect = el.getBoundingClientRect();
  const pinned = isCertificatesPinned(rect);
  const p = progRef.current;
  const next = pinned && p < 1;
  const prev = window.__certificatesWheelLocksVertical === true;
  window.__certificatesWheelLocksVertical = next;
  if (next && !prev && window.__lenis?.reset) window.__lenis.reset();
}

function crackOpacity(phase1) {
  return clamp(phase1 * 10, 0, 1) * clamp(1 - (phase1 - 0.05) * 20, 0, 1);
}

/**
 * Wheel-driven story (like Projects): when the section is pinned, vertical wheel scrubs progress
 * instead of scrolling the page — split, crack, glow, then flip. Lenis vertical scroll is blocked
 * until progress reaches 1.
 */
export function CertificatesSplitScroll({ certificates, containerRef }) {
  const progRef = useRef(0);
  const [prog, setProg] = useState(0);

  const panels = useMemo(
    () =>
      (certificates ?? []).map((c) => ({
        id: c.id,
        issuer: c.issuer,
        cardTitle: c.cardTitle,
        title: c.title,
        date: c.date,
        brand: c.brand,
        ...certificatePanelStyle(),
      })),
    [certificates]
  );

  const nPanels = panels.length;
  const stripW = CARD_W * Math.max(nPanels, 1);
  const splitPercents = useMemo(
    () => Array.from({ length: Math.max(nPanels - 1, 0) }, (_, i) => (100 * (i + 1)) / Math.max(nPanels, 1)),
    [nPanels]
  );
  const lastStagger = FLIP_STAGGER[Math.min(Math.max(nPanels - 1, 0), 2)];

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) {
          progRef.current = 0;
          setProg(0);
          syncCertificatesVerticalLock(progRef, containerRef);
        }
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const sync = () => syncCertificatesVerticalLock(progRef, containerRef);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      if (typeof window !== "undefined") window.__certificatesWheelLocksVertical = false;
    };
  }, [containerRef, prog]);

  const applyScrollDelta = useCallback(
    (deltaY) => {
      try {
        const el = containerRef?.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const p = progRef.current;
        const pinned = isCertificatesPinned(rect);

        if (rect.bottom < 0 || rect.top > window.innerHeight) return false;

        if (deltaY > 0 && p < 1) {
          if (!pinned) return false;
          const next = Math.max(0, Math.min(1, p + deltaY * CERT_SCROLL_SENS));
          progRef.current = next;
          setProg(next);
          return true;
        }

        if (p === 0 && deltaY < 0) return false;
        if (p >= 1 && deltaY > 0) return false;

        if (deltaY < 0 && p > 0) {
          if (!pinned) return false;
          const next = Math.max(0, Math.min(1, p + deltaY * CERT_SCROLL_SENS));
          progRef.current = next;
          setProg(next);
          return true;
        }

        return false;
      } finally {
        syncCertificatesVerticalLock(progRef, containerRef);
      }
    },
    [containerRef]
  );

  useEffect(() => {
    const onWheel = (e) => {
      const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const consumed = applyScrollDelta(dy);
      if (consumed) e.preventDefault();
    };

    let lastTouchY = null;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) lastTouchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 1 || lastTouchY === null) return;
      const y = e.touches[0].clientY;
      const deltaY = lastTouchY - y;
      lastTouchY = y;
      const consumed = applyScrollDelta(deltaY * 1.2);
      if (consumed) e.preventDefault();
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyScrollDelta]);

  const phase1 = p1(prog);
  const phase2 = p2(prog);

  const crackOp = crackOpacity(phase1);
  const borderGlowAlpha = lerp(0, 0.72, easeIO(clamp((phase1 - 0.12) / 0.5, 0, 1)));
  const vignetteAlpha = phase1 * 0.88;

  return (
    <section ref={containerRef} className="relative min-h-screen snap-section overflow-hidden bg-void" aria-label="Certificates">
      <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-void">
        <div className="pointer-events-none absolute inset-0 z-0">
          <EtherealSectionBackdrop />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <ConfettiBackground />
        </div>

        <div className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-violet-400 via-teal-400 to-amber-300"
            style={{
              width: `${prog * 100}%`,
              transition: `width ${CARD_SPREAD_MS}ms ${EASE_SMOOTH}`,
            }}
          />
        </div>

        <div
          className="relative z-[1] flex min-h-0 flex-1 items-center justify-center overflow-visible px-2 md:px-4"
          style={{ perspective: 1200 }}
        >
          <div
            className="relative flex scale-[0.4] items-center justify-center overflow-visible sm:scale-[0.52] md:scale-[0.68] lg:scale-[0.88] xl:scale-100"
            style={{ transformOrigin: "center center" }}
          >
            <div className="relative overflow-visible" style={{ width: stripW, height: CARD_H }}>
              {splitPercents.map((pct) => (
                <div
                  key={pct}
                  className="pointer-events-none absolute bottom-0 top-0 z-[4] w-px bg-white/35 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                  style={{
                    left: `${pct}%`,
                    opacity: prog < 0.08 ? 0 : crackOp,
                    transform: "translateX(-50%)",
                    transition: `opacity ${CARD_SPREAD_MS}ms ${EASE_SMOOTH}`,
                  }}
                />
              ))}

              <div
                className="absolute left-0 bottom-0 top-0 z-[5] flex h-full flex-row flex-nowrap items-end justify-start overflow-visible"
                role="group"
                aria-label="Certificates"
              >
                {panels.map((panel, i) => {
                  const flipProgress = clamp((phase2 - (FLIP_STAGGER[i] ?? 0)) / (1 - lastStagger), 0, 1);
                  const flipDeg = easeOut(flipProgress) * 180;
                  const flipped = flipDeg > 90;

                  const tx = lerp(0, SPREAD_X[i] ?? 0, phase1);
                  const ty = lerp(0, SPREAD_Y[i] ?? 0, phase1);
                  const sc = lerp(1, 0.93, phase1);
                  const fan = lerp(0, FAN_DEG[i] ?? 0, phase1);
                  const glowColor = SPLIT_GLOW[i % SPLIT_GLOW.length];

                  return (
                    <div
                      key={panel.id}
                      className="relative shrink-0 overflow-visible will-change-transform"
                      style={{
                        width: CARD_W,
                        height: CARD_H,
                        transformOrigin: "center bottom",
                        transform: `translateX(${tx}px) translateY(${ty}px) rotate(${fan}deg) scale(${sc})`,
                        zIndex: i === 1 ? 3 : 2,
                        transition: `transform ${CARD_SPREAD_MS}ms ${EASE_SMOOTH}`,
                      }}
                    >
                      <div
                        className="relative h-full w-full will-change-transform"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: `perspective(1100px) rotateY(${flipDeg}deg)`,
                          transition: `transform ${CARD_FLIP_MS}ms ${EASE_SMOOTH}`,
                        }}
                      >
                        <div
                          className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-950 to-black"
                          style={{
                            opacity: flipped ? 0 : 1,
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <div className="relative h-full w-full overflow-hidden">
                            <p
                              className="pointer-events-none select-none font-display font-light uppercase leading-none tracking-tight"
                              style={{
                                position: "absolute",
                                left: `${stripW / 2 - i * CARD_W}px`,
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "clamp(3.5rem, 12.5vw, 5.75rem)",
                              }}
                              aria-hidden="true"
                            >
                              <span className="cert-stroke-edge">
                                <span className="cert-stroke-edge__stroke cert-stroke-edge__stroke--top">
                                  CERTIFICATES
                                </span>
                                <span className="cert-stroke-edge__main">CERTIFICATES</span>
                                <span className="cert-stroke-edge__stroke cert-stroke-edge__stroke--bottom">
                                  CERTIFICATES
                                </span>
                              </span>
                            </p>
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80"
                            style={{
                              opacity: vignetteAlpha,
                              transition: `opacity ${CARD_SPREAD_MS}ms ${EASE_SMOOTH}`,
                            }}
                          />
                          <div
                            className="pointer-events-none absolute inset-0 rounded-2xl"
                            style={{
                              boxShadow: `inset 0 0 0 1px ${glowColor}, 0 0 26px rgba(255,255,255,0.22), 0 0 48px rgba(255,255,255,0.06)`,
                              opacity: borderGlowAlpha,
                              transition: `opacity ${CARD_SPREAD_MS}ms ${EASE_SMOOTH}`,
                            }}
                          />
                        </div>

                        <div
                          className="absolute inset-0 overflow-hidden rounded-2xl"
                          style={{
                            background: panel.backBg,
                            border: `1px solid ${panel.borderNeon}`,
                            boxShadow: `inset 0 0 0 1px ${panel.borderSoft}, 0 0 28px rgba(255,255,255,0.12), 0 0 56px rgba(255,255,255,0.04)`,
                            opacity: flipped ? 1 : 0,
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <div className="flex h-full flex-col justify-center px-7 py-8">
                            <div className="mb-5 flex min-h-[2.25rem] items-center" aria-hidden>
                              <CertificateIssuerLogo brand={panel.brand} />
                            </div>
                            <span
                              className="mb-2 font-sub text-[10px] font-medium uppercase tracking-[0.2em]"
                              style={{ color: panel.offwhite }}
                            >
                              {panel.issuer}
                            </span>
                            <h3
                              className="font-display text-2xl tracking-tight md:text-3xl"
                              style={{ color: panel.offwhite }}
                            >
                              {panel.cardTitle}
                            </h3>
                            <p
                              className="mt-2 font-sub text-xs leading-relaxed md:text-sm"
                              style={{ color: panel.offwhiteMuted }}
                            >
                              {panel.title}
                            </p>
                            <p className="mt-3 font-sub text-xs" style={{ color: panel.offwhiteMuted }}>
                              {panel.date}
                            </p>
                            <button
                              type="button"
                              className="pointer-events-auto mt-6 self-start rounded-lg border px-4 py-2 font-sub text-xs font-semibold transition-colors hover:bg-white/[0.06]"
                              style={{
                                borderColor: panel.borderNeon,
                                color: panel.offwhite,
                                boxShadow: "0 0 16px rgba(255,255,255,0.08)",
                              }}
                              onClick={() => void navigator.clipboard?.writeText?.(panel.id)}
                            >
                              Copy ID
                            </button>
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0 rounded-2xl"
                            style={{ boxShadow: `inset 0 0 0 1px ${panel.borderSoft}` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
