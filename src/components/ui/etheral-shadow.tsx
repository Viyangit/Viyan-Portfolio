"use client";

import { useRef, useId, useLayoutEffect, type CSSProperties } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import { cn } from "@/lib/utils";

/** Silhouette mask (alpha). Framer asset — swap via `maskImageUrl` with `/public` PNG if needed. */
const DEFAULT_MASK_URL =
  "https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png";

/** Tiled film grain (Framer asset — matches ethereal-shadow preset). */
const DEFAULT_NOISE_URL =
  "https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png";

export interface ResponsiveImage {
  src: string;
  alt?: string;
  srcSet?: string;
}

export interface AnimationConfig {
  preview?: boolean;
  scale: number;
  speed: number;
}

export interface NoiseConfig {
  opacity: number;
  scale: number;
}

export interface ShadowOverlayProps {
  type?: "preset" | "custom";
  presetIndex?: number;
  customImage?: ResponsiveImage;
  sizing?: "fill" | "stretch";
  color?: string;
  animation?: AnimationConfig;
  noise?: NoiseConfig;
  style?: CSSProperties;
  className?: string;
  /** Set to a string to show centered title (e.g. demo). Omit or `undefined` = no title. */
  centerTitle?: string | null;
  maskImageUrl?: string;
  noiseImageUrl?: string;
}

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
  const id = useId();
  const cleanId = id.replace(/:/g, "");
  return `shadowoverlay-${cleanId}`;
};

/**
 * Ethereal masked shadow overlay. The original Framer SVG referenced `dist` before it existed;
 * this build uses a valid filter graph (same visual intent: dual displacement + hue-rotate turbulence).
 */
export function Component({
  sizing = "fill",
  color = "rgba(128, 128, 128, 1)",
  animation,
  noise,
  style,
  className,
  centerTitle,
  maskImageUrl,
  noiseImageUrl,
}: ShadowOverlayProps) {
  const resolvedTitle = typeof centerTitle === "string" ? centerTitle : null;
  const id = useInstanceId();
  const animationEnabled = Boolean(animation && animation.scale > 0);
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(0);
  const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);

  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
  const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

  const bfX = animation ? mapRange(animation.scale, 0, 100, 0.001, 0.0005) : 0.008;
  const bfY = animation ? mapRange(animation.scale, 0, 100, 0.004, 0.002) : 0.012;

  const maskSrc = maskImageUrl ?? DEFAULT_MASK_URL;
  const noiseSrc = noiseImageUrl ?? DEFAULT_NOISE_URL;

  /**
   * Drive feColorMatrix hueRotate. useLayoutEffect + rAF: ref is set after the SVG commits
   * (useEffect often ran while feColorMatrixRef was still null, so the animation never started).
   */
  useLayoutEffect(() => {
    if (!animationEnabled) return;

    let cancelled = false;
    /** Same mapping as the reference: `animationDuration` is ~50–1000; Framer `duration` is seconds. */
    const hueDurationSec = Math.max(0.35, animationDuration / 25);

    let raf = 0;
    let attempts = 0;
    const maxAttempts = 90;

    const run = () => {
      if (cancelled) return;
      const node = feColorMatrixRef.current;
      if (!node) {
        if (attempts++ < maxAttempts) raf = requestAnimationFrame(run);
        return;
      }
      if (hueRotateAnimation.current) {
        hueRotateAnimation.current.stop();
      }
      hueRotateMotionValue.set(0);
      hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
        duration: hueDurationSec,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        onUpdate: (value: number) => {
          const el = feColorMatrixRef.current;
          if (el) el.setAttribute("values", String(value));
        },
      });
    };

    raf = requestAnimationFrame(run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (hueRotateAnimation.current) {
        hueRotateAnimation.current.stop();
        hueRotateAnimation.current = null;
      }
    };
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

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
          <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
            <defs>
              <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence
                  result="undulation"
                  numOctaves={2}
                  baseFrequency={`${bfX},${bfY}`}
                  seed="0"
                  type="turbulence"
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
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="undulation"
                  scale={displacementScale}
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        )}
        <div
          style={{
            backgroundColor: color,
            WebkitMaskImage: `url('${maskSrc}')`,
            maskImage: `url('${maskSrc}')`,
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

      {resolvedTitle ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <h1 className="relative z-20 text-center text-6xl font-bold text-foreground md:text-7xl lg:text-8xl">
            {resolvedTitle}
          </h1>
        </div>
      ) : null}

      {noise && noise.opacity > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${noiseSrc}")`,
            backgroundSize: noise.scale * 200,
            backgroundRepeat: "repeat",
            opacity: noise.opacity / 2,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}

export const EtherealShadow = Component;

/** Site-wide backdrop: same motion + grain as the reference demo. */
export const ETHEREAL_DEFAULTS = {
  sizing: "fill" as const,
  color: "rgba(128, 128, 128, 1)",
  animation: { scale: 100, speed: 90 },
  noise: { opacity: 1, scale: 1.2 },
};

/** Single full-viewport layer — use instead of many `EtherealSectionBackdrop`s. */
export function GlobalEtherealBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[1] min-h-[100dvh] overflow-hidden",
        className
      )}
      aria-hidden
    >
      <Component className="h-full min-h-[100dvh] w-full" {...ETHEREAL_DEFAULTS} />
    </div>
  );
}

export function EtherealSectionBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      aria-hidden
    >
      <Component className="h-full w-full" {...ETHEREAL_DEFAULTS} />
    </div>
  );
}
