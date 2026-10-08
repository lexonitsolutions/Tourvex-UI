"use client";

import { useEffect, useMemo, useState } from "react";
import { AppContext, useApp } from "../components/AppProvider";

/**
 * LOCAL DEVELOPMENT ONLY. Lets the admin be used and tested on a developer machine without a Clerk login.
 *
 * It applies only when ALL of these hold: this is a development build (NODE_ENV=development), the page is served from localhost,
 * there is no real Clerk session, and the visitor has not switched it off. It then presents a local administrator and sends a fixed
 * development token, which the API accepts only in development with DEV_AUTH_ENABLED=true, from this machine (see Tourvex-API
 * src/auth/dev-auth.ts). In a production build this component renders its children untouched.
 *
 * Switch off: use the "Use real sign-in" button on the badge (or set localStorage tourvex.devAuth to "off"); switch back on with
 * /admin?devauth=on. Only the admin is wrapped, so the public site is never affected.
 */
const DEV_TOKEN = "dev-local-admin";
const STORAGE_KEY = "tourvex.devAuth";
const DEV_USER = { id: "dev-local-admin", name: "Local Developer", email: "dev.admin@tourvex.local", firstName: "Local", lastName: "Developer", isDevSession: true };
const IS_DEV_BUILD = process.env.NODE_ENV === "development";

function readEnabled() {
  try {
    const host = window.location.hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("devauth") === "on") window.localStorage.removeItem(STORAGE_KEY);
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return false;
  }
}

export default function DevAdminSession({ children }) {
  const app = useApp();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!IS_DEV_BUILD) return;
    // Decided after mount (the server cannot know the host), so server and first client render stay identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(readEnabled());
  }, []);

  const active = IS_DEV_BUILD && enabled && app.ready && !app.user;
  const value = useMemo(
    () => (active ? { ...app, user: DEV_USER, getAccessToken: () => Promise.resolve(DEV_TOKEN), logout: () => undefined } : app),
    [active, app]
  );

  if (!IS_DEV_BUILD) return children;
  return (
    <AppContext.Provider value={value}>
      {children}
      {active ? (
        <button
          type="button"
          className="adm-dev-session"
          title="You are signed in as a local development administrator. Click to use the real Clerk sign-in instead."
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, "off");
            } catch {
              /* ignore */
            }
            window.location.reload();
          }}
        >
          <span aria-hidden="true" /> Local dev session · Use real sign-in
        </button>
      ) : null}
    </AppContext.Provider>
  );
}
