import React from "react";
import { CustomCursor } from "./CustomCursor.jsx";
import { GlobalEtherealBackdrop } from "@/components/ui/etheral-shadow";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-void text-mist">
      <GlobalEtherealBackdrop />
      <CustomCursor />
      <header className="relative z-20 flex items-center justify-between px-6 py-8 md:px-10">
        <a
          href="/index.html"
          className="font-sub text-xs uppercase tracking-[0.25em] text-mist/55 transition-colors hover:text-white"
        >
          ← Portfolio
        </a>
        <span className="font-display text-sm text-white/90 md:text-base">About</span>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-6 pb-32 pt-12 md:px-10">
        <h1 className="font-display text-5xl tracking-tight text-white md:text-7xl">About this site</h1>
        <p className="mt-8 font-display text-lg leading-relaxed text-mist/75 md:text-xl">
          Page transitions use{" "}
          <a
            href="https://barba.js.org/"
            target="_blank"
            rel="noreferrer"
            className="text-white/90 underline decoration-white/25 underline-offset-4 hover:decoration-white/50"
          >
            Barba.js
          </a>{" "}
          for PJAX-style navigation between HTML views. Smooth scrolling is handled by{" "}
          <a
            href="https://lenis.darkroom.engineering/"
            target="_blank"
            rel="noreferrer"
            className="text-white/90 underline decoration-white/25 underline-offset-4 hover:decoration-white/50"
          >
            Lenis
          </a>
          .
        </p>
        <p className="mt-6 font-body text-sm leading-relaxed text-mist/60">
          The main portfolio lives on the home view; this route exists so Barba can run a real enter/leave
          transition without turning the whole experience into a single inert document.
        </p>
      </main>
    </div>
  );
}
