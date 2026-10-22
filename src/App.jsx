import Boot from "./components/Boot.jsx";
import Reticle from "./components/Reticle.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Statement from "./components/Statement.jsx";
import Ticker from "./components/Ticker.jsx";
import ProjectRing from "./components/ProjectRing.jsx";
import InternTimeline from "./components/InternTimeline.jsx";
import Paper from "./components/Paper.jsx";
import Record from "./components/Record.jsx";
import SkillFactory from "./components/SkillFactory.jsx";
import CertScanner from "./components/CertScanner.jsx";
import Contact from "./components/Contact.jsx";
import { useLayoutEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initParallax } from "./parallax.js";
import { initMotion } from "./motion.js";

export default function App() {
  // Runs after every section has set up its own scroll effects (child effects run first).
  useLayoutEffect(() => {
    const revertParallax = initParallax();
    const revertMotion = initMotion();
    ScrollTrigger.refresh();
    return () => {
      revertMotion();
      revertParallax();
    };
  }, []);

  return (
    <>
      <Boot />
      <Reticle />
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Ticker />
        <ProjectRing />
        <InternTimeline />
        <Paper />
        <Record />
        <SkillFactory />
        <CertScanner />
        <Contact />
      </main>
    </>
  );
}
