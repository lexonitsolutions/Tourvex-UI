"use client";

import { useEffect, useState } from "react";

/**
 * True once any of the referenced elements is within `rootMargin` of the viewport (and stays true).
 * Used to start a section's data fetch shortly before it scrolls into view instead of on page load.
 * Without IntersectionObserver the data is simply loaded straight away.
 */
export function useInView(refs, { rootMargin = "700px 0px" } = {}) {
  // No IntersectionObserver (very old browsers): treat everything as visible so data still loads.
  const [seen, setSeen] = useState(() => typeof window !== "undefined" && typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (seen) return undefined;
    const nodes = refs.map((ref) => ref.current).filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // `refs` is a fresh array each render; the elements behind it are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, rootMargin]);

  return seen;
}
