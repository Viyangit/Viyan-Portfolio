import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

function Copy({ marked }) {
  const M = marked ? "mark" : "span";
  return (
    <>
      Four internships in 2025 taught me that AI on a shop floor gets no second chances. I've streamed{" "}
      <M>drone cameras into YOLO</M>, taught <M>OpenCV to spot defects in metal</M>, put{" "}
      <M>OpenAI with an Ollama fallback</M> behind a barcode scanner, and moved a factory's audit system{" "}
      <M>from Windows to Linux</M>. I like problems you can touch.
    </>
  );
}

/** A scan line passes down the paragraph as you scroll, turning raw outline text into processed text. */
export default function Statement() {
  const ref = useRef(null);
  const photoRef = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      el.style.setProperty("--p", "0");
      gsap.to(el, {
        "--p": 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 45%", scrub: 0.4 },
      });
      // Photo drifts inside its frame for depth.
      gsap.fromTo(
        photoRef.current,
        { yPercent: -16 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: photoRef.current.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      el.style.setProperty("--p", "1");
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="statement" aria-label="About">
      <div ref={ref} className="statement__scan">
        <p className="statement__raw" aria-hidden="true">
          <Copy />
        </p>
        <p className="statement__lit">
          <Copy marked />
        </p>
        <div className="statement__laser" aria-hidden="true" />
      </div>
      <figure className="statement__photo" data-detect="viyan, off the clock">
        <img ref={photoRef} src="/uploads/viyan-steps.webp" alt="Viyan standing on old stone steps under pine trees" loading="lazy" />
        <figcaption>Off the clock</figcaption>
      </figure>
    </section>
  );
}
