import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

const DEFAULT_DEPTH_RANGE = 50;

/** Spotlight must visit this many distinct projects before page scroll resumes. */
const PROJECT_SCROLL_GATE_CAP = 5;

/**
 * R3F: +X right, +Y up. One slot each: SE, E, center, NW — well separated on the XY plane.
 */
const CARD_SPREAD = 6.35;
const QUADRANT_XY = [
  { x: CARD_SPREAD * 1.05, y: -CARD_SPREAD * 0.95 }, // SE
  { x: CARD_SPREAD * 1.35, y: 0 }, // E
  { x: 0, y: 0 }, // center
  { x: -CARD_SPREAD * 1.05, y: CARD_SPREAD * 0.95 }, // NW
];

function quadrantSpatialPositions(visibleCount) {
  const out = [];
  for (let i = 0; i < visibleCount; i++) {
    const q = QUADRANT_XY[i % QUADRANT_XY.length];
    const ring = Math.floor(i / QUADRANT_XY.length);
    const nudge = ring * 1.1;
    out.push({
      x: q.x + (ring % 2 === 0 ? nudge : -nudge) * 0.25,
      y: q.y + (ring % 2 === 1 ? nudge : -nudge) * 0.25,
    });
  }
  return out;
}

/** Card DOM — used inside <Html> in the canvas (nearly opaque panel). */
function ProjectGlassCardDOM({ project, opacity }) {
  if (!project) return null;
  return (
    <div
      className="w-[min(90vw,420px)] max-w-[420px] rounded-3xl border border-white/25 bg-[#101012]/96 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-md"
      style={{
        opacity,
        pointerEvents: opacity > 0.18 ? "auto" : "none",
      }}
    >
      {project.src ? (
        <img
          src={project.src}
          alt=""
          className="mb-4 h-[7.5rem] w-full rounded-xl border border-white/10 object-cover md:h-[8.25rem]"
          draggable={false}
        />
      ) : null}
      <p className="font-sub text-[11px] uppercase tracking-[0.2em] text-white/75">{project.client}</p>
      <h3 className="mt-1 font-display text-2xl leading-tight tracking-tight text-white md:text-3xl">{project.name}</h3>
      <p className="mt-1 font-subtext text-sm text-mist/50">{project.year}</p>
      <p className="mt-3 font-body text-sm leading-relaxed text-mist/80 line-clamp-4">{project.desc}</p>
      <p className="mt-3 font-subtext text-[11px] leading-snug text-mist/70">{project.stack}</p>
      {project.gh ? (
        <a
          href={`https://${project.gh}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex font-body text-sm text-mist/70 underline decoration-mist/25 underline-offset-4 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          GitHub — {project.gh}
        </a>
      ) : null}
    </div>
  );
}

function spotlightProjectIndex(planes, depthRange) {
  let bestIdx = 0;
  let bestScore = Infinity;
  planes.forEach((plane) => {
    const n = plane.z / depthRange;
    const score = Math.abs(n - 0.42);
    if (score < bestScore) {
      bestScore = score;
      bestIdx = plane.imageIndex;
    }
  });
  return bestIdx;
}

function GalleryScene({
  projects,
  speed = 1.2,
  visibleCount = 8,
  wheelRootRef,
  stageLocked,
  requiredDistinct,
  onAllProjectsViewed,
}) {
  const [, rerender] = useReducer((x) => x + 1, 0);
  const scrollVelocityRef = useRef(0);
  const autoPlayRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const syncAccumRef = useRef(0);

  const stageLockedRef = useRef(stageLocked);
  stageLockedRef.current = stageLocked;

  const requiredRef = useRef(requiredDistinct);
  requiredRef.current = requiredDistinct;

  const onCompleteRef = useRef(onAllProjectsViewed);
  onCompleteRef.current = onAllProjectsViewed;

  const seenProjectIndicesRef = useRef(new Set());
  const lastSpotlightIndexRef = useRef(-1);
  const userHasWheeledRef = useRef(false);
  const gateNotifiedRef = useRef(false);
  const prevStageLockedRef = useRef(false);

  useEffect(() => {
    const rising = stageLocked && !prevStageLockedRef.current;
    prevStageLockedRef.current = stageLocked;
    if (!rising) return;
    seenProjectIndicesRef.current = new Set();
    lastSpotlightIndexRef.current = -1;
    userHasWheeledRef.current = false;
    gateNotifiedRef.current = false;
    autoPlayRef.current = false;
    scrollVelocityRef.current = 0;
  }, [stageLocked]);

  const spatialPositions = useMemo(() => quadrantSpatialPositions(visibleCount), [visibleCount]);

  const totalImages = projects.length;
  const depthRange = DEFAULT_DEPTH_RANGE;
  const halfRange = depthRange / 2;

  const planesData = useRef(
    Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z: visibleCount > 0 ? ((depthRange / visibleCount) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }))
  );

  const slotsRef = useRef(
    Array.from({ length: visibleCount }, (_, i) => ({
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      opacity: 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
      worldZ: 0,
    }))
  );

  useEffect(() => {
    planesData.current = Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z: visibleCount > 0 ? ((depthRange / Math.max(visibleCount, 1)) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }));
    slotsRef.current = Array.from({ length: visibleCount }, (_, i) => ({
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      opacity: 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
      worldZ: 0,
    }));
    rerender();
  }, [depthRange, spatialPositions, totalImages, visibleCount]);

  const handleWheel = useCallback(
    (event) => {
      if (!stageLockedRef.current) return;
      event.preventDefault();
      userHasWheeledRef.current = true;
      scrollVelocityRef.current += event.deltaY * 0.012 * speed;
      autoPlayRef.current = false;
      lastInteractionRef.current = Date.now();
    },
    [speed]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!stageLockedRef.current) return;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        userHasWheeledRef.current = true;
        scrollVelocityRef.current -= 2.2 * speed;
        autoPlayRef.current = false;
        lastInteractionRef.current = Date.now();
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        userHasWheeledRef.current = true;
        scrollVelocityRef.current += 2.2 * speed;
        autoPlayRef.current = false;
        lastInteractionRef.current = Date.now();
      }
    },
    [speed]
  );

  useEffect(() => {
    const root = wheelRootRef?.current;
    if (!root) return;
    root.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      root.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWheel, handleKeyDown, wheelRootRef]);

  useEffect(() => {
    const id = setInterval(() => {
      if (stageLockedRef.current) return;
      if (Date.now() - lastInteractionRef.current > 3000) autoPlayRef.current = true;
    }, 500);
    return () => clearInterval(id);
  }, []);

  const groupRefs = useRef([]);

  useFrame((_, delta) => {
    if (!stageLockedRef.current && autoPlayRef.current) {
      scrollVelocityRef.current += 0.35 * delta;
    }
    scrollVelocityRef.current *= 0.94;

    const sv = scrollVelocityRef.current;
    const imageAdvance = 1;

    planesData.current.forEach((plane, i) => {
      let newZ = plane.z + sv * delta * 10;
      let wrapsForward = 0;
      let wrapsBackward = 0;

      if (newZ >= depthRange) {
        wrapsForward = Math.floor(newZ / depthRange);
        newZ -= depthRange * wrapsForward;
      } else if (newZ < 0) {
        wrapsBackward = Math.ceil(-newZ / depthRange);
        newZ += depthRange * wrapsBackward;
      }

      if (wrapsForward > 0 && totalImages > 0) {
        plane.imageIndex = (plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
      }
      if (wrapsBackward > 0 && totalImages > 0) {
        const step = plane.imageIndex - wrapsBackward * imageAdvance;
        plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
      }

      plane.z = ((newZ % depthRange) + depthRange) % depthRange;
      plane.x = spatialPositions[i]?.x ?? 0;
      plane.y = spatialPositions[i]?.y ?? 0;

      const worldZ = plane.z - halfRange;
      const normalizedPosition = plane.z / depthRange;
      let opacity = 1;
      const fiS = 0.05;
      const fiE = 0.16;
      const foS = 0.42;
      const foE = 0.52;
      if (normalizedPosition >= fiS && normalizedPosition <= fiE) {
        opacity = (normalizedPosition - fiS) / (fiE - fiS);
      } else if (normalizedPosition < fiS) {
        opacity = 0;
      } else if (normalizedPosition >= foS && normalizedPosition <= foE) {
        opacity = 1 - (normalizedPosition - foS) / (foE - foS);
      } else if (normalizedPosition > foE) {
        opacity = 0;
      }
      opacity = Math.max(0, Math.min(1, opacity));

      const g = groupRefs.current[i];
      if (g) {
        g.position.set(plane.x, plane.y, worldZ);
        g.visible = opacity > 0.02;
      }

      const slot = slotsRef.current[i];
      slot.imageIndex = plane.imageIndex;
      slot.opacity = opacity;
      slot.x = plane.x;
      slot.y = plane.y;
      slot.worldZ = worldZ;
    });

    if (
      stageLockedRef.current &&
      userHasWheeledRef.current &&
      totalImages > 0 &&
      !gateNotifiedRef.current
    ) {
      const spot = spotlightProjectIndex(planesData.current, depthRange);
      if (spot !== lastSpotlightIndexRef.current) {
        lastSpotlightIndexRef.current = spot;
        seenProjectIndicesRef.current.add(spot);
        if (seenProjectIndicesRef.current.size >= requiredRef.current) {
          gateNotifiedRef.current = true;
          onCompleteRef.current?.();
        }
      }
    }

    syncAccumRef.current += delta;
    if (syncAccumRef.current >= 0.07) {
      syncAccumRef.current = 0;
      rerender();
    }
  });

  if (!totalImages) return null;

  const slots = slotsRef.current;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 10]} intensity={0.75} />
      {Array.from({ length: visibleCount }, (_, i) => {
        const slot = slots[i] ?? {
          imageIndex: 0,
          opacity: 0,
          x: 0,
          y: 0,
          worldZ: 0,
        };
        const project = projects[slot.imageIndex] ?? projects[0];
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
          >
            <Html
              transform
              distanceFactor={10.75}
              position={[0, 0, 0]}
              style={{ willChange: "transform" }}
              zIndexRange={[50, 0]}
            >
              <ProjectGlassCardDOM project={project} opacity={slot.opacity} />
            </Html>
          </group>
        );
      })}
    </>
  );
}

export default function Projects3DGallery({ projects, className = "", wheelRootRef }) {
  const [webglOk, setWebglOk] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [gateComplete, setGateComplete] = useState(false);

  const requiredDistinct = Math.min(PROJECT_SCROLL_GATE_CAP, projects.length);
  const stageLocked = sectionVisible && !gateComplete;

  useEffect(() => {
    const el = wheelRootRef?.current;
    if (!el) return;
    let hideTimer;
    const clearHide = () => {
      if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        const ratio = e.intersectionRatio;
        // Debounce leaving the section: Lenis + subpixel IO causes rapid
        // isIntersecting flips at the internships/projects seam (flicker).
        if (e.isIntersecting && ratio >= 0.04) {
          clearHide();
          setSectionVisible(true);
          return;
        }
        if (!hideTimer) {
          hideTimer = setTimeout(() => {
            hideTimer = null;
            setSectionVisible(false);
          }, 180);
        }
      },
      { threshold: [0, 0.01, 0.02, 0.04, 0.08, 0.12, 0.2, 0.35, 0.5, 0.75, 1] }
    );

    io.observe(el);
    return () => {
      clearHide();
      io.disconnect();
    };
  }, [wheelRootRef]);

  useEffect(() => {
    if (!sectionVisible) setGateComplete(false);
  }, [sectionVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__projectCarouselLocksVertical = stageLocked;
    return () => {
      delete window.__projectCarouselLocksVertical;
    };
  }, [stageLocked]);

  const handleAllProjectsViewed = useCallback(() => {
    setGateComplete(true);
  }, []);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk || !projects.length) {
    return (
      <div className={`flex flex-col gap-4 p-6 ${className}`}>
        <p className="font-sub text-sm text-mist/60">WebGL unavailable — project list:</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.name}
              href={`https://${p.gh}`}
              className="rounded-3xl border border-white/15 bg-white/[0.06] p-5 text-left shadow-xl backdrop-blur-md"
            >
              <p className="font-sub text-xs uppercase tracking-widest text-white/80">{p.client}</p>
              <h3 className="mt-1 font-display text-xl text-white">{p.name}</h3>
              <p className="mt-2 font-body text-sm text-mist/70">{p.desc}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full min-h-[420px] w-full ${className}`}>
      <Canvas
        className="h-full w-full touch-none"
        camera={{ position: [0, 0, 16], fov: 48, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#000000"]} />
        <Suspense fallback={null}>
          <GalleryScene
            projects={projects}
            speed={1.15}
            visibleCount={4}
            wheelRootRef={wheelRootRef}
            stageLocked={stageLocked}
            requiredDistinct={requiredDistinct}
            onAllProjectsViewed={handleAllProjectsViewed}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute left-0 right-0 top-2 z-10 text-center">
        <p className="font-sub text-[10px] uppercase tracking-[0.25em] text-mist/40">
          {stageLocked
            ? `Scroll the tunnel — visit all ${requiredDistinct} projects, then scroll to continue`
            : "Wheel · arrows · auto after idle"}
        </p>
      </div>
    </div>
  );
}
