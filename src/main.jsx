import React from "react";
import { createRoot } from "react-dom/client";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.jsx";
import "./styles.css";
import "./features.css";
import "./reading.css";

gsap.registerPlugin(ScrollTrigger);

// Pinned sections are measured from the top; restoring a mid-page scroll on reload breaks the intro.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

createRoot(document.getElementById("root")).render(<App />);

// Web fonts change text metrics, so pinned sections need fresh measurements once they land.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
