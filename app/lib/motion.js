"use client";

import { useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HONOR_OS_REDUCED_MOTION } from "./motionPolicy";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** See lib/motionPolicy.js: full motion by default; flip that one flag to let the OS "reduce motion" setting win. */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !HONOR_OS_REDUCED_MOTION) return false;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-triggered reveal for every `[data-reveal]` inside `ref`.
 * Elements are hidden before paint, then batched in with a stagger as they enter the viewport.
 * `watch` re-runs the effect when the rendered content changes (e.g. data finished loading).
 * `data-reveal="left|right|zoom"` selects a variant.
 */
export function useReveal(ref, watch, { enabled = true } = {}) {
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return undefined;
    const gentle = prefersReducedMotion();
    const targets = root.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    const ctx = gsap.context(() => {
      targets.forEach((el) => {
        const variant = el.dataset.reveal;
        gsap.set(el, {
          opacity: 0,
          y: gentle || variant === "left" || variant === "right" ? 0 : 56,
          x: gentle ? 0 : variant === "left" ? -60 : variant === "right" ? 60 : 0,
          scale: gentle ? 1 : variant === "zoom" ? 0.88 : 0.96,
        });
      });
      ScrollTrigger.batch(targets, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            stagger: 0.1,
            overwrite: true,
            clearProps: "transform",
          }),
      });
    }, ref);
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, enabled]);
}

const ambientHolds = new Set();

/**
 * Pause the hero's ambient loops (plane, compass, slow zoom) while something else needs the frame budget:
 * the pointer is in the header, or an overlay such as the account panel is open. Several holders can
 * overlap; the loops resume only when the last one releases.
 */
export function holdAmbient(key, on) {
  if (typeof document === "undefined") return;
  if (on) ambientHolds.add(key);
  else ambientHolds.delete(key);
  const hold = ambientHolds.size > 0;
  document.documentElement.classList.toggle("mk-menu-open", hold);
  gsap
    .getTweensOf(".mk-plane, .mk-compass")
    .filter((tween) => tween.repeat() === -1)
    .forEach((tween) => (hold ? tween.pause() : tween.resume()));
}
