"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "../../components/AppProvider";
import { useAdminApi } from "./adminApi";

const AdminMeContext = createContext(null);

/**
 * Loads GET /admin/me once the Clerk session is ready and exposes it to the whole admin.
 * status: "loading" | "signed-out" | "ready" | "forbidden" (403, not staff / deactivated) | "error"
 */
export function AdminMeProvider({ children }) {
  const { user, ready } = useApp();
  const api = useAdminApi();
  const [state, setState] = useState({ status: "loading", me: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const signedIn = !!user;

  useEffect(() => {
    if (!ready || !signedIn) return undefined;
    const controller = new AbortController();
    api
      .get("/admin/me", { signal: controller.signal })
      .then((me) => setState({ status: "ready", me, error: null }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        if (error.status === 403) setState({ status: "forbidden", me: null, error });
        else setState({ status: "error", me: null, error });
      });
    return () => controller.abort();
  }, [ready, signedIn, api, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading", me: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  // Before Clerk is ready we are "loading"; a signed-out visitor is derived here rather than stored.
  const value = useMemo(() => {
    const effective = !ready ? { status: "loading", me: null, error: null } : !signedIn ? { status: "signed-out", me: null, error: null } : state;
    const permissions = new Set(effective.me?.permissions || []);
    return {
      status: effective.status,
      error: effective.error,
      me: effective.me,
      user: effective.me?.user || null,
      permissions,
      menu: effective.me?.menu || [],
      reload,
      /** UI convenience only; the API enforces every permission itself. Accepts one string or an array (any-of). */
      can: (permission) => (Array.isArray(permission) ? permission.some((p) => permissions.has(p)) : permissions.has(permission)),
    };
  }, [ready, signedIn, state, reload]);

  return <AdminMeContext.Provider value={value}>{children}</AdminMeContext.Provider>;
}

export function useAdminMe() {
  const ctx = useContext(AdminMeContext);
  if (!ctx) throw new Error("useAdminMe must be used inside <AdminMeProvider>");
  return ctx;
}

/** Shorthand: `const can = useCan(); can("staff.write")`. */
export function useCan() {
  return useAdminMe().can;
}
export { AdminMeContext }; // HARNESS-TEMP
