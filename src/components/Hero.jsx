import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { bootDone } from "./Boot.jsx";
import { HeroInk, NoteList } from "./HeroNotes.jsx";

const CUTOUT = "/uploads/viyan-black-shirt-cut.webp";

/**
 * Split hero after the wine/sand reference: wine band with the first name in sand,
 * sand band with the surname in wine, and Viyan standing across the seam.
 * The hero is sticky, so the next section slides up over it while its layers drift apart.
 */
export default function Hero() {
  const rootRef = useRef(null);
  // Where Viyan rests in the hero, as a share of his own height pushed down from the layout position.
  const REST = 18;
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
        bootDone.then(() => tl.play());
        tl.from(".hero__band--top", { scaleY: 0, transformOrigin: "50% 0%", duration: 1.1, ease: "expo.inOut" })
          .from(".hero__first > span", { yPercent: 105, duration: 1.2 }, "-=0.45")
          .from(".hero__last > span", { yPercent: -105, duration: 1.2 }, "<0.08")
          .fromTo(".hero__figure", { yPercent: REST + 18, opacity: 0 }, { yPercent: REST, opacity: 1, duration: 1.4 }, "<0.1")
          .from(".hero__line", { opacity: 0, y: 12, duration: 0.9, stagger: 0.08 }, "-=0.9");


        // As the page scrolls over the hero, each layer leaves at its own speed.
        const out = { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(".hero__first", { yPercent: -45, ease: "none", scrollTrigger: out });
        gsap.to(".hero__last", { yPercent: 55, ease: "none", scrollTrigger: out });
        // Explicit start values, so scrolling back to the top returns Viyan to exactly where the intro left him.
        gsap.fromTo(".hero__figure", { yPercent: REST, scale: 1 }, { yPercent: REST + 10, scale: 0.94, ease: "none", immediateRender: false, scrollTrigger: out });
        gsap.to(".hero__band--top", { yPercent: -18, ease: "none", scrollTrigger: out });
        // Notes and arrows lift away first, before the names split.
        gsap.to(".hero__ink, .hero__notes", {
          yPercent: -12,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top top", end: "35% top", scrub: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // A gentle pointer drift: names and figure shift by different amounts.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const root = rootRef.current;
    const layers = [...root.querySelectorAll("[data-depth]")].map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
    const cur = { x: 0, y: 0 };
    const goal = { x: 0, y: 0 };
    let raf;
    let running = false;
    const loop = () => {
      cur.x += (goal.x - cur.x) * 0.05;
      cur.y += (goal.y - cur.y) * 0.05;
      for (const { el, d } of layers) el.style.translate = `${(cur.x * d).toFixed(2)}px ${(cur.y * d * 0.5).toFixed(2)}px`;
      if (Math.abs(goal.x - cur.x) > 0.005 || Math.abs(goal.y - cur.y) > 0.005) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      goal.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      goal.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    root.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={rootRef} id="top" className="hero" aria-label="Introduction">
      <div ref={stageRef} className="hero__stage">
        <div className="hero__band hero__band--top" aria-hidden="true" />
        <div className="hero__band hero__band--bottom" aria-hidden="true" />

        <h1 className="hero__name">
          <span className="hero__first" data-depth="-10">
            <span>Viyan</span>
          </span>
          <span className="hero__last" data-depth="14">
            <span>Manokaran</span>
          </span>
        </h1>

        {/* Arrows: each starts behind Viyan, then loops over the name to its note. */}
        <HeroInk stageRef={stageRef} />

        <figure className="hero__figure" data-depth="6">
          <img src={CUTOUT} alt="Viyan Manokaran in a black shirt and sunglasses, smiling" />
        </figure>
        <NoteList />

        <p className="hero__line hero__line--scroll" aria-hidden="true">
          Scroll
        </p>
      </div>
    </section>
  );
}
