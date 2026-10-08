"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/** Warns before reload/close (beforeunload) and before in-app link navigation while `isDirty()` is true. Shared by the content and catalog editors. */
export function useLeaveGuard(isDirty, onBlocked) {
  const dirtyRef = useRef(isDirty);
  const blockedRef = useRef(onBlocked);
  useLayoutEffect(() => {
    dirtyRef.current = isDirty;
    blockedRef.current = onBlocked;
  });
  useEffect(() => {
    const beforeUnload = (e) => {
      if (!dirtyRef.current()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || !dirtyRef.current()) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      blockedRef.current(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
}
