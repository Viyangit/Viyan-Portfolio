import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./StickyProjectTextCards.css";

const PROJ_SCROLL_SENS = 0.0009;
const PROJ_PIN_ENTER_TOP_PX = 20;
const PROJ_PIN_EXIT_TOP_PX = 56;
const PROJ_PIN_EXIT_BOTTOM_PX = 8;
const EASE_SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)";
const CARD_TRANS_MS = 280;
const CARD_TRANS_SCRUB_MS = 95;
const SCRUB_IDLE_MS = 120;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function shouldLockProjects(rect, progress, wasLocked) {
  if (progress >= 1) return false;
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
  if (wasLocked) {
    return rect.top <= PROJ_PIN_EXIT_TOP_PX && rect.bottom > PROJ_PIN_EXIT_BOTTOM_PX;
  }
  return rect.top <= PROJ_PIN_ENTER_TOP_PX && rect.bottom > PROJ_PIN_ENTER_TOP_PX;
}

function syncProjectsVerticalLock(progRef, containerRef, lockRef) {
  if (typeof window === "undefined") return;
  const el = containerRef?.current;
  if (!el) {
    if (lockRef) lockRef.current = false;
    window.__projectCarouselLocksVertical = false;
    return;
  }
  const rect = el.getBoundingClientRect();
  const p = progRef.current;
  const lockWasActive = lockRef?.current === true;
  const next = shouldLockProjects(rect, p, lockWasActive);
  if (lockRef) lockRef.current = next;
  const globalWasActive = window.__projectCarouselLocksVertical === true;
  window.__projectCarouselLocksVertical = next;
  if (next && !globalWasActive && window.__lenis?.reset) window.__lenis.reset();
}

/** Map a global progress (0..1) to per-card transform values. */
function cardTransform(i, prog, total) {
  const segments = Math.max(total - 1, 1);
  const segLen = 1 / segments;
  const seg = Math.min(Math.floor(prog * segments + 1e-9), segments - 1);
  const t = clamp((prog - seg * segLen) / segLen, 0, 1);

  if (i < seg) {
    return { yPercent: 0, scale: 0.7, rotation: 5, opacity: 0.7 };
  }
  if (i === seg) {
    return {
      yPercent: 0,
      scale: 1 - 0.3 * t,
      rotation: 5 * t,
      opacity: 1 - 0.3 * t,
    };
  }
  if (i === seg + 1) {
    return { yPercent: 100 - 100 * t, scale: 1, rotation: 0, opacity: 1 };
  }
  return { yPercent: 100, scale: 1, rotation: 0, opacity: 1 };
}

export default function StickyProjectTextCards({ cards = [] }) {
  const containerRef = useRef(null);
  const lockRef = useRef(false);
  const scrubTimerRef = useRef(0);
  const progRef = useRef(0);
  const progRafRef = useRef(0);
  const pendingProgRef = useRef(null);
  const [prog, setProg] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const validCards = useMemo(
    () =>
      cards
        .filter((c) => c && c.name)
        .map((c) => ({
          ...c,
          year: c.year || "N/A",
          client: c.client || "N/A",
          desc: c.desc || "",
          stack: c.stack || "",
        })),
    [cards]
  );

  const total = validCards.length;

  const syncProgressState = useCallback(() => {
    if (progRafRef.current) return;
    progRafRef.current = requestAnimationFrame(() => {
      progRafRef.current = 0;
      const next = pendingProgRef.current;
      if (next == null) return;
      pendingProgRef.current = null;
      setProg((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    });
  }, []);

  const setProgress = useCallback(
    (next) => {
      progRef.current = next;
      pendingProgRef.current = next;
      syncProgressState();
    },
    [syncProgressState]
  );

  // Reset progress when leaving the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          progRef.current = 0;
          pendingProgRef.current = 0;
          setProg(0);
          syncProjectsVerticalLock(progRef, containerRef, lockRef);
        }
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keep Lenis vertical-lock flag in sync with pin state and progress.
  useEffect(() => {
    const sync = () => syncProjectsVerticalLock(progRef, containerRef, lockRef);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      if (scrubTimerRef.current) {
        clearTimeout(scrubTimerRef.current);
        scrubTimerRef.current = 0;
      }
      if (progRafRef.current) {
        cancelAnimationFrame(progRafRef.current);
        progRafRef.current = 0;
      }
      if (typeof window !== "undefined") {
        window.__projectCarouselLocksVertical = false;
      }
    };
  }, []);

  const applyScrollDelta = useCallback(
    (deltaY) => {
      try {
        const el = containerRef.current;
        if (!el || total <= 1) return false;
        const rect = el.getBoundingClientRect();
        const p = progRef.current;
        const pinned = shouldLockProjects(rect, p, lockRef.current);

        if (rect.bottom < 0 || rect.top > window.innerHeight) return false;

        if (deltaY > 0 && p < 1) {
          if (!pinned) return false;
          const next = clamp(p + deltaY * PROJ_SCROLL_SENS, 0, 1);
          setProgress(next);
          return true;
        }

        if (p === 0 && deltaY < 0) return false;
        if (p >= 1 && deltaY > 0) return false;

        if (deltaY < 0 && p > 0) {
          if (!pinned) return false;
          const next = clamp(p + deltaY * PROJ_SCROLL_SENS, 0, 1);
          setProgress(next);
          return true;
        }

        return false;
      } finally {
        syncProjectsVerticalLock(progRef, containerRef, lockRef);
      }
    },
    [setProgress, total]
  );

  // Wheel + touch listeners scoped to this section.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const consumed = applyScrollDelta(dy);
      if (!consumed) return;
      e.preventDefault();
      setIsScrubbing(true);
      if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
      scrubTimerRef.current = window.setTimeout(() => {
        scrubTimerRef.current = 0;
        setIsScrubbing(false);
      }, SCRUB_IDLE_MS);
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
      if (!consumed) return;
      e.preventDefault();
      setIsScrubbing(true);
      if (scrubTimerRef.current) clearTimeout(scrubTimerRef.current);
      scrubTimerRef.current = window.setTimeout(() => {
        scrubTimerRef.current = 0;
        setIsScrubbing(false);
      }, SCRUB_IDLE_MS);
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyScrollDelta]);

  return (
    <div
      ref={containerRef}
      className="sticky-project-cards w-full"
      data-projects-scroll-gate
    >
      <div className="sticky-project-cards__viewport">
        <div className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-violet-400 via-teal-400 to-amber-300"
            style={{
              width: `${prog * 100}%`,
              transition: `width ${isScrubbing ? CARD_TRANS_SCRUB_MS : CARD_TRANS_MS}ms ${EASE_SMOOTH}`,
            }}
          />
        </div>

        <div className="sticky-project-cards__stack">
          {validCards.map((card, i) => {
            const { yPercent, scale, rotation, opacity } = cardTransform(i, prog, total);
            return (
              <article
                key={`${card.name}-${card.year}-${i}`}
                className="sticky-project-cards__card"
                style={{
                  transform: `translateY(${yPercent}%) scale(${scale}) rotate(${rotation}deg)`,
                  opacity,
                  zIndex: i + 1,
                  transition: `transform ${isScrubbing ? CARD_TRANS_SCRUB_MS : CARD_TRANS_MS}ms ${EASE_SMOOTH}, opacity ${isScrubbing ? CARD_TRANS_SCRUB_MS : CARD_TRANS_MS}ms ${EASE_SMOOTH}`,
                }}
              >
                <p className="sticky-project-cards__meta">
                  {card.year} · {card.client}
                </p>
                <h3 className="sticky-project-cards__title">{card.name}</h3>
                <p className="sticky-project-cards__desc">{card.desc}</p>
                <p className="sticky-project-cards__stackline">{card.stack}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
