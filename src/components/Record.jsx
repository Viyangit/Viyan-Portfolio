import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { WINS, ENTRIES } from "../data.js";

/** Hackathon results. Wins get a quality-control stamp pressed onto them as they arrive. */
export default function Record() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray(".win").forEach((win) => {
          const stamp = win.querySelector(".stamp");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: win, start: "top 62%", once: true },
          });
          tl.fromTo(
            stamp,
            { scale: 2.6, rotate: -34, opacity: 0 },
            { scale: 1, rotate: -11, opacity: 1, duration: 0.42, ease: "power4.in" }
          )
            .fromTo(win, { y: 0 }, { y: 7, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" })
            .fromTo(
              stamp.querySelector(".stamp__ink"),
              { scale: 0.6, opacity: 0.7 },
              { scale: 1.5, opacity: 0, duration: 0.6, ease: "expo.out" },
              "<"
            );

          gsap.to(stamp, {
            yPercent: -40,
            ease: "none",
            scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        gsap.from(".record__giant", {
          xPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="record" className="record" aria-labelledby="record-title">
      <p className="record__giant" aria-hidden="true">
        Hackathons
      </p>
      <h2 id="record-title" className="section-title">
        Competition record
      </h2>

      <div className="record__wins">
        {WINS.map((w) => (
          <article key={w.event} className="win" data-detect={w.stamp.toLowerCase()}>
            <div className="stamp" aria-hidden="true">
              <span className="stamp__ink" />
              <span className="stamp__text">{w.stamp}</span>
              <span className="stamp__sub">Passed</span>
            </div>
            <h3 className="win__event">{w.event}</h3>
            <p className="win__result">{w.result}</p>
            <p className="win__context">{w.context}</p>
            <p className="win__solution">{w.solution}</p>
          </article>
        ))}
      </div>

      <h3 className="record__entries-title">Also competed at</h3>
      <ul className="record__entries">
        {ENTRIES.map((e) => (
          <li key={e.event} data-detect="entry">
            <h4>{e.event}</h4>
            <p>{e.solution}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
