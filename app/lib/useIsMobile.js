"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 760px)";

function subscribe(callback) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/** True at phone widths. The server (and the hydration pass) report false, then it updates after mount. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
