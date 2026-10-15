import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PROFILE } from "../data.js";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const stripeRef = useRef(null);
  const cutoutRef = useRef(null);

  // The cutout rises into frame as the section arrives.
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        cutoutRef.current,
        { yPercent: 28 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: cutoutRef.current.parentElement, start: "top bottom", end: "bottom bottom", scrub: true },
        }
      );
    });
    return () => mm.revert();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf;
    let offset = 0;
    let lastY = window.scrollY;
    const loop = () => {
      const y = window.scrollY;
      offset += 0.6 + Math.abs(y - lastY) * 0.5;
      lastY = y;
      if (stripeRef.current) stripeRef.current.style.backgroundPositionX = `${offset}px`;
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(stripeRef.current);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  const links = [
    { label: "LinkedIn", href: `https://${PROFILE.linkedin}`, text: PROFILE.linkedin },
    { label: "GitHub", href: `https://${PROFILE.github}`, text: PROFILE.github },
    { label: "Phone", href: `tel:${PROFILE.phone.replace(/\s/g, "")}`, text: PROFILE.phone },
  ];

  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div ref={stripeRef} className="hazard" aria-hidden="true" />
      <div className="contact__inner">
        <h2 id="contact-title" className="contact__title">
          End of the line.
          <br />
          Start of yours?
        </h2>
        <p className="contact__lede">
          I'm looking for roles and projects where software meets real machines. The fastest way to reach me
          is email.
        </p>

        <button type="button" className="contact__email" onClick={copy} data-detect="email">
          <span className="contact__email-text">{PROFILE.email}</span>
          <span className="contact__email-action" aria-live="polite">
            {copied ? "Copied to clipboard" : "Click to copy"}
          </span>
        </button>

        <ul className="contact__links">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" data-detect={l.label.toLowerCase()}>
                <span className="contact__link-label">{l.label}</span>
                <span className="contact__link-text">{l.text}</span>
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${PROFILE.email}`} data-detect="mail">
              <span className="contact__link-label">Email app</span>
              <span className="contact__link-text">Open a new message</span>
            </a>
          </li>
        </ul>
      </div>
      <div className="contact__cutout">
        <div className="contact__cutout-inner" ref={cutoutRef} style={{ position: "relative", height: "100%" }}>
          <img src="/uploads/viyan-cutout.webp" alt="Viyan smiling, in a yellow kurta" loading="lazy" />
          <div className="contact__cutout-target" data-detect="viyan, say hi" aria-hidden="true">
            <span>viyan 0.99</span>
          </div>
        </div>
      </div>
      <footer className="footer">
        <span>© 2026 {PROFILE.name}</span>
        <span>Built and tested in {PROFILE.city}</span>
      </footer>
    </section>
  );
}
