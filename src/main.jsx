import React from "react";
import ReactDOM from "react-dom/client";
import barba from "@barba/core";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import Portfolio from "./Portfolio.jsx";
import AboutPage from "./AboutPage.jsx";
import "./index.css";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

let reactRoot = null;
let lenis = null;

function destroyLenis() {
  lenis?.destroy();
  lenis = null;
  if (typeof window !== "undefined") delete window.__lenis;
}

function initLenis() {
  destroyLenis();
  lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.12,
    /** While wheel-driven sections scrub, block Lenis from applying vertical smooth scroll. */
    prevent(node) {
      if (typeof window === "undefined") return false;
      if (!(node instanceof HTMLElement)) return false;
      if (window.__certificatesWheelLocksVertical === true) return true;
      if (window.__projectCarouselLocksVertical === true) {
        return !!node.closest("[data-projects-scroll-gate]");
      }
      return false;
    },
  });
  if (typeof window !== "undefined") window.__lenis = lenis;
}

function unmountReact() {
  reactRoot?.unmount();
  reactRoot = null;
}

function mountReact(container, namespace) {
  const el = container.querySelector("#root");
  if (!el) return;

  unmountReact();
  reactRoot = ReactDOM.createRoot(el);
  const page = namespace === "about" ? <AboutPage /> : <Portfolio />;
  reactRoot.render(<React.StrictMode>{page}</React.StrictMode>);
}

function fadeElement(el, from, to, duration) {
  if (!el) return Promise.resolve();
  return el
    .animate([{ opacity: from }, { opacity: to }], { duration, easing: EASE, fill: "both" })
    .finished.then(() => {
      el.style.opacity = "";
    });
}

barba.hooks.beforeLeave(() => {
  destroyLenis();
});

barba.hooks.afterLeave(() => {
  unmountReact();
});

barba.hooks.beforeEnter((data) => {
  const next = data.next;
  if (!next?.container) return;
  mountReact(next.container, next.namespace);
});

barba.hooks.afterEnter(() => {
  initLenis();
  lenis?.scrollTo(0, { immediate: true });
});

barba.init({
  transitions: [
    {
      name: "fade",
      leave: ({ current }) => fadeElement(current.container, 1, 0, 380),
      enter: ({ next }) => {
        const el = next.container;
        if (el) el.style.opacity = "0";
        return fadeElement(el, 0, 1, 420);
      },
    },
  ],
});
