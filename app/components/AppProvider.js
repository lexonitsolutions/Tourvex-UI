"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CURRENCY_CODES } from "../lib/currencies";
import { CURRENCY_STORAGE_KEY, hasCurrencyCookie, normalizeCurrency, writeCurrencyCookie } from "../lib/currencyCookie";
import { completePendingWish } from "../lib/wishlistAuth";

export const AppContext = createContext(null);

export const CURRENCIES = CURRENCY_CODES;

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/**
 * App-wide state. Authentication is provided by Clerk; this keeps the same `useApp()` shape the rest of
 * the site already uses (`user`, `ready`, `logout`) plus `getAccessToken()` for calling our API, which
 * verifies the Clerk session token server-side.
 */
export default function AppProvider({ children, initialCurrency = "AED" }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  // The server reads the cookie and passes it down, so the first paint already matches (no flash of AED).
  const [currency, setCurrencyState] = useState(() => normalizeCurrency(initialCurrency));
  const [switching, startSwitch] = useTransition();

  const setCurrency = useCallback(
    (value) => {
      const code = normalizeCurrency(value);
      setCurrencyState(code);
      writeCurrencyCookie(code);
      try {
        window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
      // Server components re-render with the new cookie; client state (scroll, open dialogs) is preserved.
      startSwitch(() => router.refresh());
    },
    [router]
  );

  // One-time migration: visitors who chose a currency before the cookie existed keep their choice.
  useEffect(() => {
    if (hasCurrencyCookie()) return;
    try {
      const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && CURRENCIES.includes(saved) && saved !== "AED") setCurrency(saved);
    } catch {
      /* ignore */
    }
  }, [setCurrency]);

  const user = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null;
    return {
      id: clerkUser.id,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser.hasImage ? clerkUser.imageUrl : null,
    };
  }, [isSignedIn, clerkUser]);

  // A visitor who tapped a heart while signed out gets that holiday saved as soon as they sign in.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (isSignedIn && !wasSignedIn.current) completePendingWish();
    wasSignedIn.current = !!isSignedIn;
  }, [isSignedIn]);

  const logout = useCallback(() => signOut({ redirectUrl: "/" }), [signOut]);

  /** Short-lived Clerk session token for `Authorization: Bearer` calls to our API (null when signed out). */
  const getAccessToken = useCallback(() => (isSignedIn ? getToken() : Promise.resolve(null)), [isSignedIn, getToken]);

  /** Adopts the currency the server read from the cookie (see CurrencySeed). Unlike setCurrency it writes nothing and does not refresh. */
  const adoptServerCurrency = useCallback((value) => setCurrencyState(normalizeCurrency(value)), []);

  const value = useMemo(
    () => ({ user, ready: isLoaded, currency, setCurrency, adoptServerCurrency, switching, logout, getAccessToken }),
    [user, isLoaded, currency, setCurrency, adoptServerCurrency, switching, logout, getAccessToken]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
