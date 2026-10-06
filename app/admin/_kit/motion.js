"use client";

// Scroll-reveal for charts: a ref callback that marks an element data-reveal="pending" (CSS hides it) and flips it to "in" the
// first time it is on screen (CSS plays the draw-in once). One shared IntersectionObserver, no state, no effects.
// Elements hidden with clip-path / mask report themselves as not intersecting, so those are watched through their parent.
// Nothing is hidden when reduced motion is honoured (html[data-honor-reduced-motion] + the OS setting) or IO is missing.
let io = null;
const targets = new Map(); // watched element -> elements to reveal

function reduced() {
  return document.documentElement.hasAttribute("data-honor-reduced-motion") && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function reveal(el) {
  if (!el) return undefined;
  if (typeof IntersectionObserver === "undefined" || reduced()) return undefined;
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        targets.get(e.target)?.forEach((node) => node.setAttribute("data-reveal", "in"));
        targets.delete(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
  }
  const watch = el.matches(".adm-reveal-clip, .adm-reveal-sweep") && el.parentElement ? el.parentElement : el;
  el.setAttribute("data-reveal", "pending");
  if (!targets.has(watch)) targets.set(watch, new Set());
  targets.get(watch).add(el);
  io.observe(watch);
  return () => {
    targets.get(watch)?.delete(el);
    if (!targets.get(watch)?.size) {
      targets.delete(watch);
      io?.unobserve(watch);
    }
  };
}
