import { gsap } from "gsap";

/**
 * Site-wide scroll parallax. Each rule moves matching elements between `from` and `to`
 * while they travel through the viewport, so headings, copy and images separate into
 * layers that drift at different speeds. Only elements with no other transforms are listed.
 */
const RULES = [
  // Big headings slide sideways a little and lag behind the page.
  {
    sel: ".section-title, .conveyor__title, .contact__title",
    from: { xPercent: 5, yPercent: 30 },
    to: { xPercent: -4, yPercent: -30 },
  },
  // Supporting copy floats slightly ahead of its heading.
  {
    sel: ".partsbin__head p, .certs__head p, .reading__intro p, .contact__lede",
    from: { y: 50 },
    to: { y: -50 },
  },
  { sel: ".statement__scan", from: { y: 70 }, to: { y: -70 } },
  { sel: ".statement__photo", from: { y: -60 }, to: { y: 90 } },
  { sel: ".certs__tray", from: { y: -40 }, to: { y: 40 } },
  { sel: ".certs__bed", from: { y: 50 }, to: { y: -50 } },
  { sel: ".certs__out", from: { y: 110 }, to: { y: -90 } },
  { sel: ".record__entries li", from: { y: 60 }, to: { y: -30 }, stagger: 30 },
  { sel: ".contact__email", from: { xPercent: -6 }, to: { xPercent: 2 } },
  { sel: ".contact__links li", from: { y: 50 }, to: { y: -20 }, stagger: 18 },
];

/** Rows in a list move at slightly different speeds, which reads as depth. */
const STAGGERED = [];

export function initParallax() {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    for (const rule of RULES) {
      gsap.utils.toArray(rule.sel).forEach((el, i) => {
        const extra = rule.stagger ? i * rule.stagger : 0;
        const from = { ...rule.from };
        const to = { ...rule.to };
        if (extra) {
          if ("y" in from) from.y += extra;
          if ("y" in to) to.y -= extra / 2;
        }
        gsap.fromTo(el, from, {
          ...to,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        });
      });
    }
    for (const { sel, base, step } of STAGGERED) {
      gsap.utils.toArray(sel).forEach((el, i) => {
        const amt = base + (i % 4) * step;
        gsap.fromTo(
          el,
          { y: amt },
          { y: -amt * 0.4, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } }
        );
      });
    }
  });
  return () => mm.revert();
}
