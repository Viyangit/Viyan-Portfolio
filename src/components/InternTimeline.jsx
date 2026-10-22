import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { INTERNSHIPS } from "../data.js";

const MONTH = (iso) => new Date(iso).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();
const pad = (n) => String(n).padStart(2, "0");

/** A framed photo slot. Shows the image when `src` is set, otherwise a labelled placeholder. */
function Photo({ photo, label, className }) {
  const src = photo?.src;
  return (
    <figure
      className={`per__photo ${className}${photo?.screen ? " per__photo--screen" : ""}${photo?.still ? " per__photo--still" : ""}`}
      style={photo?.ratio ? { aspectRatio: photo.ratio } : undefined}
    >
      <div className="per__photo-inner">
        {src ? (
          <img src={src} alt={photo.alt || label} loading="lazy" style={photo.focus ? { objectPosition: photo.focus } : undefined} />
        ) : (
          <div className="per__placeholder">
            <span>Photo</span>
            <b>{label}</b>
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * Internships as periods on a horizontal timeline, after Tubik's timeline scroll for Flashlights.
 * The section pins and vertical scroll slides 2025 sideways. Inside each period the layers move at
 * their own speeds: the giant month in the back drifts slowly, the photos pan inside their frames,
 * and the copy leads slightly, so the period has depth as it passes. A rail at the bottom tracks
 * progress through the year; its stops jump to each period.
 */
export default function InternTimeline() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const stRef = useRef(null);
  const jobs = [...INTERNSHIPS].sort((a, b) => a.start.localeCompare(b.start));

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const q = gsap.utils.selector(section);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.scrollWidth - section.clientWidth;
        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              fillRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
              const at = Math.round(self.progress * (jobs.length + 0.4) - 0.6);
              q(".per-rail__stop").forEach((s, i) => s.classList.toggle("is-past", i <= at));
            },
          },
        });
        stRef.current = slide.scrollTrigger;

        // Layers inside each period, tied to the horizontal slide.
        q(".per").forEach((per) => {
          const along = { trigger: per, containerAnimation: slide, start: "left right", end: "right left", scrub: true };
          const ghost = per.querySelector(".per__ghost");
          if (ghost) gsap.fromTo(ghost, { xPercent: 12 }, { xPercent: -12, ease: "none", scrollTrigger: along });
          per.querySelectorAll(".per__photo--main:not(.per__photo--screen):not(.per__photo--still) .per__photo-inner, .per__photo--inset:not(.per__photo--screen):not(.per__photo--still) .per__photo-inner").forEach((img, k) => {
            gsap.fromTo(img, { xPercent: k ? -14 : -10 }, { xPercent: k ? 14 : 10, ease: "none", scrollTrigger: along });
          });
          const lead = per.querySelector(".per__copy");
          // No drift on phones: the copy fills the width there and would slide off the edge.
          const drift = () => (section.clientWidth < 820 ? 0 : Math.min(90, section.clientWidth * 0.06));
          if (lead) gsap.fromTo(lead, { x: drift }, { x: () => -drift(), ease: "none", scrollTrigger: along });
          // Photos open with a wipe as the period comes in.
          per.querySelectorAll(".per__photo").forEach((ph, k) =>
            gsap.fromTo(
              ph,
              { clipPath: "inset(0% 0% 0% 100%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                ease: "power2.out",
                scrollTrigger: { trigger: ph, containerAnimation: slide, start: `left ${90 - k * 8}%`, end: `left ${55 - k * 8}%`, scrub: true },
              }
            )
          );
        });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // Rail stops jump to their period.
  const jump = (i) => {
    const st = stRef.current;
    const el = sectionRef.current?.querySelectorAll(".per")[i + 1];
    if (!st || !el) return;
    // Measured from the pin spacer's live position, so it stays right if anything above changed height.
    const spacer = sectionRef.current.parentElement;
    const top = spacer.getBoundingClientRect().top + window.scrollY;
    const p = el.offsetLeft / (trackRef.current.scrollWidth - sectionRef.current.clientWidth);
    const y = top + Math.min(1, p) * (st.end - st.start);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="experience" className="itx" ref={sectionRef} aria-labelledby="itx-title">
      <div className="itx__track" ref={trackRef}>
        <header className="per per--intro">
          <p className="per__kicker">Experience / Feb to Nov 2025</p>
          <h2 id="itx-title" className="per__title">
            Four
            <br />
            internships,
            <br />
            <em>one year.</em>
          </h2>
          <p className="per__lede">
            Aerospace, automotive, energy and AI: four teams, four kinds of shop floor. Scroll to move through 2025.
          </p>
          <span className="per__year" aria-hidden="true">
            2025
          </span>
        </header>

        {jobs.map((j, i) => (
          <article key={j.company} className="per" aria-labelledby={`per-${i}`}>
            <span className="per__ghost" aria-hidden="true">
              {MONTH(j.start)}
            </span>
            <div className="per__media">
              <Photo className="per__photo--main" photo={j.photos?.[0]} label={`${j.company}: main photo`} />
              <Photo className="per__photo--inset" photo={j.photos?.[1]} label={`${j.company}: detail`} />
              {j.photos?.[2] && <Photo className="per__photo--wide" photo={j.photos[2]} label={`${j.company}: screen`} />}
              {j.photos?.[3] && <Photo className="per__photo--tag" photo={j.photos[3]} label={`${j.company}: document`} />}
            </div>
            <div className="per__copy">
              <p className="per__index">
                <span>{pad(i + 1)}</span> / {pad(jobs.length)}
              </p>
              <h3 id={`per-${i}`} className="per__company">
                {j.company}
              </h3>
              <p className="per__role">
                {j.role} <span>·</span> {j.dates}
              </p>
              <p className="per__desc">{j.desc}</p>
              {j.notes?.length > 0 && (
                <dl className="per__notes">
                  {j.notes.map((n) => (
                    <div key={n.label}>
                      <dt>{n.label}</dt>
                      <dd>{n.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <ul className="per__stack" aria-label="Stack">
                {j.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
        <div className="per per--end" aria-hidden="true">
          <span>Next: on my desk</span>
        </div>
      </div>

      <nav className="per-rail" aria-label="Internships in 2025">
        <span className="per-rail__line">
          <i ref={fillRef} />
        </span>
        <ol>
          {jobs.map((j, i) => (
            <li key={j.company}>
              <button type="button" className="per-rail__stop" onClick={() => jump(i)}>
                <b>{MONTH(j.start)}</b>
                <span>{j.company}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
