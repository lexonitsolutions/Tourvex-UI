"use client";

import { Suspense, createContext, lazy, useContext, useMemo, useState } from "react";

// Toasts are sonner (shadcn `sonner`), loaded LAZILY: sonner and the Toaster only ship the first time something is toasted, so they stay
// out of every page's first-load JS. `useToast()` keeps the old API so pages did not change:
//   const toast = useToast(); toast.success("Saved"); toast.error(message); toast.info(...); toast.dismiss(id)
const ToasterHost = lazy(() => import("./ToasterHost"));
const ToastContext = createContext(null);

// Calls made before the host has mounted wait here; the host flushes them right after its Toaster subscribed.
let impl = null;
const queue = [];
export function registerToastImpl(next) {
  impl = next;
  queue.splice(0).forEach(([kind, message, opts]) => next[kind](message, opts));
}

export function ToastProvider({ children }) {
  const [armed, setArmed] = useState(false);
  const api = useMemo(() => {
    const emit = (kind, defaultMs) => (message, opts) => {
      const o = { duration: opts?.duration ?? defaultMs };
      if (impl) return impl[kind](message, o);
      queue.push([kind, message, o]);
      setArmed(true);
      return undefined;
    };
    return {
      success: emit("success", 4500),
      error: emit("error", 7000),
      info: emit("info", 4500),
      dismiss: (id) => impl?.dismiss(id),
    };
  }, []);
  return (
    <ToastContext.Provider value={api}>
      {children}
      {armed ? (
        // display:contents host so the toaster sees the .adm-root tokens (light + dark) without painting a box
        <div className="adm-root" style={{ display: "contents" }}>
          <Suspense fallback={null}><ToasterHost /></Suspense>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
