import React from "react";
import { createRoot } from "react-dom/client";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.jsx";
import { initLite, isLite, onLite } from "./lite.js";
import "./styles.css";
import "./features.css";
import "./reading.css";
import "./theme.css";
import "./hero.css";
import "./ring.css";
import "./timeline.css";
import "./motion.css";
import "./factory.css";

gsap.registerPlugin(ScrollTrigger);
// iOS shows and hides its address bar while scrolling, which resizes the window; re-measuring the
// pinned sections each time makes them jump. Only real resizes (rotation, width changes) re-measure.
ScrollTrigger.config({ ignoreMobileResize: true });

// Pinned sections are measured from the top; restoring a mid-page scroll on reload breaks the intro.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
initLite();

// Smooth scrolling, except on weak devices (lite mode), where native scrolling is lighter.
if (!reduceMotion && !isLite()) {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
  onLite(() => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    window.__lenis = null;
    ScrollTrigger.refresh();
  });
}

createRoot(document.getElementById("root")).render(<App />);

// Web fonts change text metrics, so pinned sections need fresh measurements once they land.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
