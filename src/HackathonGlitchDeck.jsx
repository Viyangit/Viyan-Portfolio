import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

function useScramble(text, isActive) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef(0);
  const iterRef = useRef(0);

  const scramble = useCallback(() => {
    const totalFrames = Math.max(Math.ceil(text.length * 0.45), 6);
    iterRef.current = 0;
    const tick = () => {
      iterRef.current += 1;
      const progress = iterRef.current / totalFrames;
      const result = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (!/[a-zA-Z0-9]/.test(char)) return char;
          if (i / text.length < progress) return char;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join("");
      setDisplay(result);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [text]);

  const reset = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    if (isActive) scramble();
    else reset();
    return () => cancelAnimationFrame(frameRef.current);
  }, [isActive, scramble, reset]);

  return display;
}

/** Break solution copy into lines with at least `min` words each (short tail merged into previous line). */
function chunkSolutionMinWordsPerLine(text, min = 5) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length <= min) return words.join(" ");

  const lines = [];
  let i = 0;
  while (i < words.length) {
    const remaining = words.length - i;
    if (remaining <= min) {
      if (remaining < min && lines.length > 0) {
        lines[lines.length - 1] += ` ${words.slice(i).join(" ")}`;
      } else {
        lines.push(words.slice(i).join(" "));
      }
      break;
    }
    const nextRemainder = remaining - min;
    if (nextRemainder > 0 && nextRemainder < min) {
      lines.push(words.slice(i).join(" "));
      break;
    }
    lines.push(words.slice(i, i + min).join(" "));
    i += min;
  }
  return lines.join("\n");
}

/**
 * Stack from bottom-left along a polyline: first segment diagonal (up-right),
 * then a steeper mostly-vertical leg — matches “diagonal then straight up” spacing.
 */
const HACKATHON_CARD_W = 248;

function buildStackFromBottomLeft(n) {
  if (n <= 0) return [];
  const ax = 186;
  const ay = -134;
  const bx = 34;
  const by = -198;
  const bendInclusive = Math.max(1, Math.min(n - 1, Math.round((n - 1) * 0.45)));
  const out = [];
  for (let i = 0; i < n; i++) {
    let x;
    let y;
    if (i <= bendInclusive) {
      x = i * ax;
      y = i * ay;
    } else {
      const x0 = bendInclusive * ax;
      const y0 = bendInclusive * ay;
      const j = i - bendInclusive;
      x = x0 + j * bx;
      y = y0 + j * by;
    }
    out.push({
      x,
      y,
      z: -i * 118,
      ry: 4 + i * 2.5,
    });
  }
  return out;
}

function GlitchHackathonCard({ card, transform, stackIndex, stackCount }) {
  const [hovered, setHovered] = useState(false);
  const leaveTimerRef = useRef(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  const handleCardEnter = useCallback(() => {
    clearLeaveTimer();
    setHovered(true);
  }, [clearLeaveTimer]);

  const handleCardLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      leaveTimerRef.current = null;
    }, 140);
  }, [clearLeaveTimer]);

  const labelDisplay = useScramble(card.label, hovered);
  const tagDisplay = useScramble(card.tag, hovered);
  const descDisplay = useScramble(card.desc, hovered);
  const solutionChunked = useMemo(() => chunkSolutionMinWordsPerLine(card.solution, 5), [card.solution]);
  const solutionDisplay = useScramble(solutionChunked, hovered);

  const W = HACKATHON_CARD_W;
  const H = 318;

  const isWin = card.kind === "win";
  const zBase = (stackCount - stackIndex) * 12;
  const shortSolutionLine = card.id === "02" || card.id === "03" || card.id === "04";

  return (
    <div
      role="article"
      aria-label={card.label}
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className="absolute cursor-default overflow-visible"
      style={{
        width: W,
        height: H,
        left: 0,
        bottom: 0,
        transformOrigin: "left bottom",
        transform: `
          translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px)
          translateY(${hovered ? -26 : 0}px)
          translateZ(${hovered ? 56 : 0}px)
          rotateY(${transform.ry}deg)
          scale(${hovered ? 1.05 : 1})
        `,
        transformStyle: "preserve-3d",
        transition:
          "transform 0.42s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s ease, border-color 0.35s ease",
        zIndex: hovered ? 80 : 8 + zBase,
      }}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded border transition-[border-color,box-shadow] duration-300 ${
          hovered ? "border-white/25 shadow-[0_28px_90px_rgba(0,0,0,0.85)]" : "border-white/[0.08] shadow-[0_14px_48px_rgba(0,0,0,0.65)]"
        }`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            isWin
              ? "from-amber-950/50 via-zinc-950 to-[#07070a]"
              : "from-slate-900/70 via-zinc-950 to-[#07070a]"
          }`}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, transparent 45%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2) 0, transparent 40%)",
          }}
        />

        {hovered && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)",
              animation: "hackathon-scanlines 0.12s steps(1) infinite",
            }}
          />
        )}

        <div
          className={`absolute left-3 top-3 font-sub text-[10px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
            hovered ? "text-white/90" : "text-mist/40"
          }`}
        >
          {card.id}
        </div>

        <div
          className={`absolute inset-0 bg-gradient-to-t transition-[background] duration-500 ${
            hovered
              ? "from-black/85 via-black/35 to-transparent"
              : "from-black/55 via-black/15 to-transparent"
          }`}
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 pt-16">
          <p
            className={`font-display text-lg leading-tight tracking-tight transition-colors duration-300 md:text-xl ${
              hovered ? "text-white" : "text-mist/90"
            }`}
          >
            {hovered ? labelDisplay : card.label}
          </p>
          <p
            className={`font-sub text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
              hovered ? "text-teal-300/95" : "text-mist/50"
            }`}
          >
            {hovered ? tagDisplay : card.tag}
          </p>
          <p
            className={`font-sub text-[11px] leading-relaxed transition-colors duration-300 md:text-xs ${
              hovered ? "text-mist/75" : "text-mist/45"
            }`}
          >
            {hovered ? descDisplay : card.desc}
          </p>
        </div>
      </div>

      {/* Decrypt rail: `pointer-events-auto` while hovered so moving onto the rail does not fire card mouseleave (which restarted scramble). */}
      <div
        className={`absolute left-full top-1/2 z-[90] flex w-[min(calc(100vw-2rem),1100px)] shrink-0 items-stretch sm:w-[min(calc(100vw-2.5rem),1120px)] md:w-[min(calc(100vw-3.5rem),1180px)] ${
          hovered ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          transform: "translateY(-50%) translateZ(120px) scaleX(1.2)",
          transformOrigin: "left center",
        }}
        aria-hidden
      >
        <div
          className={`mt-[0.5em] h-[2px] shrink-0 self-center rounded-full bg-gradient-to-r from-teal-300 via-white/45 to-transparent shadow-[0_0_14px_rgba(45,212,191,0.45)] transition-[width,opacity] duration-[520ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            hovered
              ? shortSolutionLine
                ? "w-[min(44px,5.5vw)] opacity-100"
                : "w-[min(120px,14vw)] opacity-100"
              : "w-0 opacity-0"
          }`}
        />
        <div
          className={`w-full flex-1 border-l border-teal-400/30 pl-3 sm:pl-4 md:pl-5 transition-[opacity,transform] duration-400 ease-out ${
            hovered ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
          }`}
          style={{ transitionDelay: hovered ? "120ms" : "0ms", minWidth: "min(78vw, 820px)" }}
        >
          <p className="font-sub text-[9px] font-semibold uppercase tracking-[0.24em] text-teal-400/85 md:text-[10px]">
            Solution
          </p>
          <p className="mt-1 w-full max-w-none whitespace-pre-line font-sub text-[11px] leading-relaxed text-mist/75 sm:text-xs md:text-sm md:leading-relaxed">
            {hovered ? solutionDisplay : solutionChunked}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Static 3D stack from bottom-left (no mouse parallax). Scramble + lift on card hover.
 */
export function HackathonGlitchDeck({ inView, wins, participated }) {
  const cards = useMemo(() => {
    const out = [];
    let idx = 0;
    wins.forEach((h) => {
      idx += 1;
      out.push({
        id: String(idx).padStart(2, "0"),
        label: h.event,
        tag: h.prize,
        desc: `${h.date} — ${h.team}`,
        kind: "win",
        solution: h.solution ?? h.team,
      });
    });
    participated.forEach((h) => {
      idx += 1;
      out.push({
        id: String(idx).padStart(2, "0"),
        label: h.event,
        tag: "PARTICIPATED",
        desc: h.date,
        kind: "participant",
        solution: h.solution ?? h.date,
      });
    });
    return out;
  }, [wins, participated]);

  const transforms = useMemo(() => buildStackFromBottomLeft(cards.length), [cards.length]);
  const n = cards.length;

  const stackCenterOffsetX = useMemo(() => {
    if (!transforms.length) return 0;
    const maxX = Math.max(...transforms.map((t) => t.x));
    return (maxX + HACKATHON_CARD_W) / 2;
  }, [transforms]);

  return (
    <div
      className="relative mx-auto mt-4 w-full max-w-[min(100%,1100px)]"
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 88%",
      }}
    >
      <div className="relative mx-auto aspect-[5/3] w-full max-h-[min(78vh,680px)] min-h-[min(52vh,480px)] overflow-visible">
        <div
          className="relative h-full w-full overflow-visible"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(10deg) rotateY(34deg)",
            opacity: inView ? 1 : 0.35,
          }}
        >
          <div
            className="absolute bottom-[clamp(8px,3.5vh,40px)] left-1/2"
            style={{
              width: 0,
              height: 0,
              transform: `translateX(-${stackCenterOffsetX}px) translateY(56px)`,
            }}
          >
            {cards.map((card, i) => (
              <GlitchHackathonCard
                key={`${card.id}-${card.kind}-${card.label.slice(0, 24)}`}
                card={card}
                transform={transforms[i] ?? transforms[transforms.length - 1]}
                stackIndex={i}
                stackCount={n}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
