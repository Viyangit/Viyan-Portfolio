import React, { useRef, useId, useEffect } from "react";
import { animate, useMotionValue } from "framer-motion";

function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

function useShadowInstanceId() {
  const id = useId();
  const cleanId = id.replace(/:/g, "");
  return `shadowoverlay-${cleanId}`;
}

/**
 * Ethereal masked shadow background (SVG displacement + optional film noise).
 * No default title — use as a full-bleed background layer.
 */
export function EtherealShadow({
  sizing = "fill",
  color = "rgba(8, 18, 40, 0.75)",
  animation,
  noise,
  style,
  className,
}) {
  const id = useShadowInstanceId();
  const animationEnabled = Boolean(animation && animation.scale > 0);
  const feColorMatrixRef = useRef(null);
  const hueRotateMotionValue = useMotionValue(0);
  const hueRotateAnimation = useRef(null);

  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
  const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

  const maskUrl = "https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png";
  const noiseUrl = "https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png";

  useEffect(() => {
    if (!feColorMatrixRef.current || !animationEnabled) return;
    if (hueRotateAnimation.current) hueRotateAnimation.current.stop();
    hueRotateMotionValue.set(0);
    hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
      duration: Math.max(0.15, animationDuration / 25),
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      onUpdate: (value) => {
        if (feColorMatrixRef.current) {
          feColorMatrixRef.current.setAttribute("values", String(value));
        }
      },
    });
    return () => {
      if (hueRotateAnimation.current) hueRotateAnimation.current.stop();
    };
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  const bfX = animation ? mapRange(animation.scale, 0, 100, 0.001, 0.0005) : 0.008;
  const bfY = animation ? mapRange(animation.scale, 0, 100, 0.004, 0.002) : 0.012;

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -displacementScale,
          filter: animationEnabled ? `url(#${id}) blur(4px)` : "none",
        }}
      >
        {animationEnabled && (
          <svg
            style={{ position: "absolute", width: 0, height: 0 }}
            aria-hidden
          >
            <defs>
              <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  baseFrequency={`${bfX},${bfY}`}
                  seed="0"
                  type="fractalNoise"
                />
                <feColorMatrix
                  ref={feColorMatrixRef}
                  in="undulation"
                  type="hueRotate"
                  values="0"
                  result="hueShifted"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="hueShifted"
                  scale={displacementScale}
                />
              </filter>
            </defs>
          </svg>
        )}
        <div
          style={{
            backgroundColor: color,
            WebkitMaskImage: `url('${maskUrl}')`,
            maskImage: `url('${maskUrl}')`,
            maskSize: sizing === "stretch" ? "100% 100%" : "cover",
            WebkitMaskSize: sizing === "stretch" ? "100% 100%" : "cover",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {noise && noise.opacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${noiseUrl}")`,
            backgroundSize: `${noise.scale * 200}px`,
            backgroundRepeat: "repeat",
            opacity: noise.opacity / 2,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

/** Shared settings aligned with the ethereal-shadow demo (tuned for dark portfolio). */
export const ETHEREAL_DEFAULTS = {
  sizing: "fill",
  color: "rgba(6, 14, 28, 0.72)",
  animation: { scale: 100, speed: 90 },
  noise: { opacity: 0.35, scale: 1.2 },
};

/**
 * Full-bleed background for a `relative` section — place as first child, keep content in `relative z-10`.
 */
export function EtherealSectionBackdrop({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <EtherealShadow className="h-full w-full" {...ETHEREAL_DEFAULTS} />
    </div>
  );
}
