import React from "react";
import UnicornScene from "unicornstudio-react";

const UNICORN_PROJECT_ID = "26LszPmqhVQ0OpPB0vJU";
const UNICORN_SDK =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.6/dist/unicornStudio.umd.js";

/** Visible wire thickness (px) around the card */
const BORDER_PX = 3;

/**
 * Unicorn Studio runs full-bleed behind the card, but a CSS mask keeps only a rounded-rect **ring**
 * visible so the effect reads as an electrified border — content sits inset on an opaque panel.
 */
const ringMaskStyle = {
  padding: BORDER_PX,
  WebkitMaskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
  WebkitMaskClip: "padding-box, border-box",
  WebkitMaskComposite: "xor",
  maskImage: "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
  maskClip: "padding-box, border-box",
  maskComposite: "exclude",
};

export function HackathonElectricBorder({ children, compact = false }) {
  const expand = BORDER_PX;
  return (
    <div className="relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
        style={ringMaskStyle}
        aria-hidden
      >
        {/* Expand past mask padding so WebGL fills the outer rounded rect; mask still clips to the ring */}
        <div
          className="pointer-events-none absolute min-h-[8rem]"
          style={{
            top: -expand,
            left: -expand,
            width: `calc(100% + ${expand * 2}px)`,
            height: `calc(100% + ${expand * 2}px)`,
          }}
        >
          <UnicornScene
            projectId={UNICORN_PROJECT_ID}
            sdkUrl={UNICORN_SDK}
            width="100%"
            height="100%"
            scale={compact ? 0.6 : 0.75}
            dpi={compact ? 1.15 : 1.35}
            lazyLoad
            altText="Decorative border animation"
            ariaLabel="Electric border"
            className="[&_canvas]:!block [&_canvas]:!h-full [&_canvas]:!min-h-full [&_canvas]:!w-full [&_canvas]:!max-w-none"
          />
        </div>
      </div>

      {/* Opaque inset panel — leaves BORDER_PX gutter where the masked unicorn ring shows */}
      <div className="relative z-[1] m-[3px] flex min-h-0 flex-1 flex-col rounded-[13px] bg-void">
        {children}
      </div>
    </div>
  );
}
