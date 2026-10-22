import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Site-wide motion layer, after the patterns in Motion's examples and Framer-built portfolios:
 * headings that rise line by line out of a mask, a photo that opens with a clip-path wipe, and
 * buttons that lean toward the cursor. Everything runs on GSAP's ticker, which also drives Lenis,
 * so scroll and animation share one clock.
 */

// Headings: each line slides up out of its own mask as the heading enters, and back down if you
// scroll back above it. Words are staggered a touch inside each line so the line reads as typed.
const HEADINGS = ".section-title, .contact__title";

// Photos and other framed images that open with a wipe.
const WIPES = ".statement__photo";

// Things you press, which lean toward the cursor when it comes near.
const MAGNETIC = ".nav__links a, .nav__cmd, .contact__email, .reading__tab, .btn-shake, .contact__links a";

export function initMotion() {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const splits = gsap.utils.toArray(HEADINGS).map((el) =>
      SplitText.create(el, {
        type: "lines,words",
        mask: "lines",
        linesClass: "split-line", // masks get "split-line-mask"
        autoSplit: true, // re-split when fonts load or the width changes
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 4,
            duration: 0.95,
            ease: "expo.out",
            stagger: 0.045,
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
          }),
      })
    );

    gsap.utils.toArray(WIPES).forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.3,
          ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
    });

    return () => splits.forEach((s) => s.revert());
  });

  // Magnetic pull only makes sense with a mouse.
  mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
    const offs = gsap.utils.toArray(MAGNETIC).map((el) => {
      const strength = el.offsetWidth > 160 ? 0.18 : 0.35;
      const toX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const toY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        toX((e.clientX - (r.left + r.width / 2)) * strength);
        toY((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: true });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { x: 0, y: 0 });
      };
    });
    return () => offs.forEach((off) => off());
  });

  return () => mm.revert();
}

/** Lenis' current velocity (px per frame), or 0 without Lenis. */
export const scrollVelocity = () => (window.__lenis ? window.__lenis.velocity : 0);
