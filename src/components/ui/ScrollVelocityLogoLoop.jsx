import { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react";
import {
  m,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

/* ─────────────────────────────────────────────
   SVG logo data
───────────────────────────────────────────── */
export const SCROLL_VELOCITY_LOGOS = [
  {
    title: "React",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <ellipse cx="12" cy="12" rx="2.05" ry="2.05" fill="#58C4DC" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#58C4DC" strokeWidth="1.2" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#58C4DC" strokeWidth="1.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#58C4DC" strokeWidth="1.2" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    title: "Next.js",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#000" />
        <path d="M7 16.5V8l9 11h-2.5L7 11v5.5z" fill="#fff" />
        <path d="M14.5 8h2v5.5L14.5 11V8z" fill="#fff" />
      </svg>
    ),
  },
  {
    title: "TypeScript",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect width="24" height="24" rx="3" fill="#3178C6" />
        <path d="M4 11.5h6.5V13H8V20H6.5v-7H4v-1.5z" fill="#fff" />
        <path d="M13.5 11.3c.7 0 1.3.15 1.8.44.5.3.88.7 1.14 1.22l-1.3.75a1.6 1.6 0 00-.58-.7 1.5 1.5 0 00-.84-.22c-.3 0-.54.06-.72.18a.57.57 0 00-.27.5c0 .2.1.37.3.5.2.13.56.27 1.07.4.6.17 1.07.34 1.42.52.35.18.62.42.8.72.2.3.3.67.3 1.1 0 .48-.13.9-.38 1.25-.25.35-.6.62-1.04.8-.44.18-.94.27-1.5.27-.76 0-1.4-.17-1.93-.5a2.8 2.8 0 01-1.1-1.37l1.34-.77c.15.37.37.66.66.86.3.2.64.3 1.03.3.35 0 .63-.07.83-.22a.7.7 0 00.3-.6c0-.22-.1-.4-.3-.54-.2-.14-.57-.28-1.1-.43-.58-.16-1.04-.33-1.38-.5a2 2 0 01-.78-.68 1.82 1.82 0 01-.27-1.02c0-.45.12-.85.36-1.18.24-.33.57-.58.99-.76.42-.18.9-.27 1.43-.27z" fill="#fff" />
      </svg>
    ),
  },
  {
    title: "Tailwind CSS",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35.98 1 2.09 2.15 4.6 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35C16.62 7.15 15.51 6 12 6zm-5 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35C8.38 16.85 9.49 18 13 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35C11.62 13.15 10.51 12 7 12z" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    title: "Vite",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M21 3L13 21l-2.5-7.5L3 11l18-8z" fill="#A855F7" />
        <path d="M13 21l-2.5-7.5L13 11l.1 10z" fill="#C084FC" opacity=".6" />
      </svg>
    ),
  },
  {
    title: "Framer",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 3h14v6H12L5 3z" fill="#E94C8B" />
        <path d="M5 9h7l7 6H5V9z" fill="#E94C8B" opacity=".7" />
        <path d="M5 15h7v6l-7-6z" fill="#E94C8B" opacity=".4" />
      </svg>
    ),
  },
  {
    title: "Node.js",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="#5FA04E" />
        <text x="7.5" y="14" fontSize="5.5" fill="#fff" fontFamily="monospace" fontWeight="700">
          JS
        </text>
      </svg>
    ),
  },
  {
    title: "GraphQL",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="4" r="1.8" fill="#E10098" />
        <circle cx="20" cy="9" r="1.8" fill="#E10098" />
        <circle cx="20" cy="15" r="1.8" fill="#E10098" />
        <circle cx="12" cy="20" r="1.8" fill="#E10098" />
        <circle cx="4" cy="15" r="1.8" fill="#E10098" />
        <circle cx="4" cy="9" r="1.8" fill="#E10098" />
        <polygon points="12,4 20,9 20,15 12,20 4,15 4,9" stroke="#E10098" strokeWidth="1.2" fill="none" />
        <circle cx="12" cy="12" r="2.2" fill="#E10098" />
      </svg>
    ),
  },
  {
    title: "Docker",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2" y="10" width="3" height="3" rx=".4" fill="#2496ED" />
        <rect x="6" y="10" width="3" height="3" rx=".4" fill="#2496ED" />
        <rect x="10" y="10" width="3" height="3" rx=".4" fill="#2496ED" />
        <rect x="10" y="6" width="3" height="3" rx=".4" fill="#2496ED" />
        <rect x="14" y="10" width="3" height="3" rx=".4" fill="#2496ED" />
        <path d="M21 11.5c-.4-.3-1.2-.4-1.8-.3-.1-.8-.6-1.5-1.4-1.9l-.5-.3-.3.5c-.3.5-.4 1.3-.1 1.9-.2.1-.6.2-.9.2H2.1c-.1.9.1 2.2.8 3.1.7.9 1.7 1.3 3 1.3 2.8 0 4.9-1.3 5.9-3.6h.5c.4 0 1.3 0 1.7-.9h.1c.3.4.9.7 1.6.7h1.5c.1 0 .2-.1.2-.2v-1.5z" fill="#2496ED" />
      </svg>
    ),
  },
  {
    title: "AWS",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 13.5c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v3z" stroke="#FF9900" strokeWidth="1.3" />
        <path d="M5 17c-1.2-.7-2-2-2-3.5v-3C3 8.5 5.2 7 8 7" stroke="#FF9900" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M19 17c1.2-.7 2-2 2-3.5v-3C21 8.5 18.8 7 16 7" stroke="#FF9900" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M9 19l-1.5 2M15 19l1.5 2M12 18.5V21" stroke="#FF9900" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const update = () => ref.current && setWidth(ref.current.offsetWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return width;
}

function VelocityRow({ text, baseVelocity = 100, numCopies = 6, fadeColor = "#000000" }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const copyRef = useRef(null);
  const copyWidth = useElementWidth(copyRef);

  const wrap = (min, max, v) => {
    const r = max - min;
    return (((v - min) % r) + r) % r + min;
  };

  /** Positive `x` (translateX) moves the row right → ticker reads left-to-right. */
  const x = useTransform(baseX, (v) => (copyWidth === 0 ? "0px" : `${wrap(0, copyWidth, v)}px`));

  const directionFactor = useRef(1);

  const onFrame = useCallback(
    (_, delta) => {
      let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
      if (velocityFactor.get() < 0) directionFactor.current = -1;
      else if (velocityFactor.get() > 0) directionFactor.current = 1;
      moveBy += directionFactor.current * moveBy * velocityFactor.get();
      baseX.set(baseX.get() + moveBy);
    },
    [baseVelocity, baseX, velocityFactor]
  );

  useAnimationFrame(onFrame);

  return (
    <div
      className="relative border-b border-white/[0.08]"
      style={{ overflow: "hidden", padding: "18px 0" }}
    >
      {["left", "right"].map((side) => (
        <div
          key={side}
          className="pointer-events-none absolute inset-y-0 z-10 w-10 sm:w-12 md:w-16"
          style={{
            [side]: 0,
            background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${fadeColor} 0%, transparent 100%)`,
          }}
        />
      ))}
      <m.div
        className="flex flex-row flex-nowrap justify-start gap-x-8 md:gap-x-10"
        style={{ x, whiteSpace: "nowrap" }}
      >
        {Array.from({ length: numCopies }, (_, i) => (
          <span
            key={i}
            ref={i === 0 ? copyRef : null}
            className="inline-block shrink-0 font-display font-medium tracking-tight text-white/85"
            style={{
              fontSize: "clamp(1.35rem, 3.8vw, 2.1rem)",
            }}
          >
            {text}&nbsp;
          </span>
        ))}
      </m.div>
    </div>
  );
}

function LogoLoopStrip({ logos, speed = 70, gap = 48, iconSize = 32, fadeColor = "#000000" }) {
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const offsetRef = useRef(0);
  const hoveredRef = useRef(false);
  const lastTRef = useRef(null);

  const items = [...logos, ...logos, ...logos];

  useEffect(() => {
    let cancelled = false;
    const tick = (ts) => {
      if (cancelled) return;
      if (!lastTRef.current) lastTRef.current = ts;
      const dt = Math.min((ts - lastTRef.current) / 1000, 0.05);
      lastTRef.current = ts;

      if (!hoveredRef.current && trackRef.current) {
        offsetRef.current += speed * dt;
        const third = trackRef.current.scrollWidth / 3;
        if (third > 0) {
          offsetRef.current = ((offsetRef.current % third) + third) % third;
          trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return (
    <div
      className="relative w-full overflow-hidden py-5"
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {["left", "right"].map((side) => (
        <div
          key={side}
          className="pointer-events-none absolute inset-y-0 z-10 w-10 sm:w-12 md:w-16"
          style={{
            [side]: 0,
            background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${fadeColor} 0%, transparent 100%)`,
          }}
        />
      ))}

      <div
        ref={trackRef}
        className="flex w-max items-center justify-start"
        style={{ willChange: "transform" }}
      >
        {items.map((logo, i) => (
          <div
            key={`${logo.title}-${i}`}
            title={logo.title}
            className="flex shrink-0 cursor-default items-center justify-center opacity-75 transition-[transform,opacity] duration-200 ease-out hover:scale-[1.18] hover:opacity-100"
            style={{
              marginRight: gap,
              width: iconSize,
              height: iconSize,
            }}
          >
            <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full">{logo.svg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScrollVelocityLogoLoop({
  text = "Built with modern React · Scroll-driven motion · Vite & Tailwind",
  velocity = 100,
  logos = SCROLL_VELOCITY_LOGOS,
  logoSpeed = 70,
  fadeColor = "#000000",
}) {
  return (
    <div className="w-full overflow-hidden text-left">
      <VelocityRow text={text} baseVelocity={velocity} fadeColor={fadeColor} />
      <LogoLoopStrip logos={logos} speed={logoSpeed} fadeColor={fadeColor} />
    </div>
  );
}
