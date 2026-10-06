// Single switch for how the site treats the operating system's "reduce motion" setting.
// Plain module (no "use client") so both the server layout and client code can read the real value.
//
// false (current product decision): full motion for everyone, like the original Karnish site. Many Windows PCs have
//   "Show animations" switched off, and honouring that made every hover transition snap instantly.
// true: the OS setting wins. Heavy JS effects switch off (see prefersReducedMotion in lib/motion.js), and the CSS
//   blocks `@media (prefers-reduced-motion: reduce) { html[data-honor-reduced-motion] ... }` (added to the <html>
//   element by app/layout.js) remove transitions and animations.
// Flip to true before launch if accessibility should win.
export const HONOR_OS_REDUCED_MOTION = false;
