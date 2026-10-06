"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * useState that persists to localStorage under `key`, SSR-safe: the server and the first client render always use
 * `initial` (no hydration mismatch); the stored value is applied in a layout effect right after hydration, before paint.
 * Writes happen only when the setter is called (never on mount), so React StrictMode's double effects cannot clobber storage.
 * Pass key = null/undefined to disable persistence. All storage access is try/caught (private mode, blocked storage).
 */
export function usePersistedState(key, initial) {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);

  useIsoLayoutEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        latest.current = JSON.parse(raw);
        setValue(latest.current);
      }
    } catch {}
  }, [key]);

  const set = useCallback(
    (next) => {
      const v = typeof next === "function" ? next(latest.current) : next;
      latest.current = v;
      setValue(v);
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {}
    },
    [key]
  );
  return [value, set];
}
