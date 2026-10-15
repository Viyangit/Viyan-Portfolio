import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PROJECTS } from "../data.js";
import Barcode from "./Barcode.jsx";
import CaseStudy from "./CaseStudy.jsx";

const ROLLERS = 14;

/**
 * Projects ride a conveyor through a fixed inspection gate. Vertical scroll drives the belt;
 * whichever crate sits in the gate is lit and named in the readout.
 */
export default function Conveyor() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(null);
  const openerRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const crates = [...track.children];
    let current = -1;

    const mark = () => {
      const mid = window.innerWidth / 2;
      let best = 0;
      let bestD = Infinity;
      crates.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best !== current) {
        current = best;
        crates.forEach((c, i) => c.classList.toggle("is-inspected", i === best));
        setActive(best);
      }
    };

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const dist = () => track.scrollWidth - window.innerWidth;
      let skew = 0;
      let skewTarget = 0;

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${dist() * 1.15}`,
          pin: true,
          scrub: 0.7,
          snap: { snapTo: 1 / (crates.length - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.12, ease: "power2.inOut" },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            skewTarget = gsap.utils.clamp(-7, 7, self.getVelocity() / -320);
          },
        },
      });

      const tick = () => {
        const x = Number(gsap.getProperty(track, "x")) || 0;
        skewTarget *= 0.9;
        skew += (skewTarget - skew) * 0.15;
        section.style.setProperty("--belt", `${x}px`);
        section.style.setProperty("--roll", `${(-x / 22) * (180 / Math.PI)}deg`);
        section.style.setProperty("--skew", `${skew.toFixed(2)}deg`);
        mark();
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      track.addEventListener("scroll", mark, { passive: true });
      mark();
      return () => track.removeEventListener("scroll", mark);
    });

    return () => mm.revert();
  }, []);

  const p = PROJECTS[active];

  const openCase = (i, e) => {
    e.stopPropagation();
    openerRef.current = e.currentTarget.closest(".crate")?.querySelector(".crate__open") ?? null;
    setOpened(i);
  };
  const closeCase = () => {
    setOpened(null);
    openerRef.current?.focus({ preventScroll: true });
  };

  return (
    <section ref={sectionRef} id="work" className="conveyor" aria-label="Projects">
      <div className="conveyor__head">
        <h2 className="conveyor__title">Things I've shipped</h2>
        <div className="conveyor__readout" aria-live="polite">
          <span className="conveyor__count">
            {active + 1}/{PROJECTS.length}
          </span>
          <span className="conveyor__now">
            Inspecting <strong>{p.name}</strong> for {p.client}
          </span>
        </div>
      </div>

      <div className="conveyor__gate" aria-hidden="true">
        <i className="conveyor__beam" />
      </div>

      <div ref={trackRef} className="conveyor__track">
        {PROJECTS.map((proj, i) => (
          <article key={proj.name} className="crate" data-detect={proj.name.toLowerCase()}>
            <div className="crate__body" onClick={(e) => openCase(i, e)}>
              <header className="crate__top">
                <h3 className="crate__name">{proj.name}</h3>
                <div className="crate__label">
                  <Barcode value={proj.name} />
                  <span>
                    {proj.client}, {proj.year}
                  </span>
                </div>
              </header>
              <p className="crate__desc">{proj.summary}</p>
              <ul className="crate__stack" aria-label="Built with">
                {proj.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <button type="button" className="crate__open" onClick={(e) => openCase(i, e)}>
                Read the case study
              </button>
            </div>
          </article>
        ))}
      </div>

      <CaseStudy project={opened == null ? null : PROJECTS[opened]} onClose={closeCase} />

      <div className="belt" aria-hidden="true">
        <div className="belt__surface" />
        <div className="belt__rollers">
          {Array.from({ length: ROLLERS }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
