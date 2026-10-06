"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { applyTheme, getMode, resolve, setMode as storeSetMode, subscribe } from "./theme-store";

const Ctx = createContext(null);

/**
 * Optional: mounts the theme store for a subtree and keeps <html data-adm-theme> in sync (system changes, other tabs).
 * `useTheme()` also works without it (it reads the same store), the provider only guarantees the DOM sync is live.
 */
export function ThemeProvider({ children }) {
  const value = useThemeStore();
  useEffect(() => {
    applyTheme(value.theme);
  }, [value.theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useThemeStore() {
  const theme = useSyncExternalStore(subscribe, getMode, () => "system");
  const resolvedTheme = useSyncExternalStore(subscribe, () => resolve(getMode()), () => "light");
  const setTheme = useCallback((m) => storeSetMode(m), []);
  return useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
}

/** -> { theme: "system"|"light"|"dark", resolvedTheme: "light"|"dark", setTheme(mode) } */
export function useTheme() {
  const ctx = useContext(Ctx);
  const own = useThemeStore();
  return ctx || own;
}

/** Mounted once by app/admin/layout.js: keeps the wrapper's data-adm-theme in sync (client navigations, OS changes, other tabs). */
export function ThemeSync() {
  const { theme } = useTheme();
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
