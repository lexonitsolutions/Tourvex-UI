"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CURRENCY_CODES } from "../lib/currencies";
import { CURRENCY_STORAGE_KEY, hasCurrencyCookie, normalizeCurrency, writeCurrencyCookie } from "../lib/currencyCookie";
import { apiRequest } from "../lib/api";

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
  const [wishlist, setWishlist] = useState({ items: [], ready: false });

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

  // Wishlist records live in the API and are loaded for the current account on every device.
  useEffect(() => {
    let active = true;
    if (!isLoaded) return () => { active = false; };
    if (!isSignedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset account-owned data synchronously on sign-out
      setWishlist({ items: [], ready: true });
      return () => { active = false; };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expose loading while the authenticated account changes
    setWishlist((value) => ({ ...value, ready: false }));
    getToken().then((token) => apiRequest("/wishlist", { token })).then((data) => {
      if (active) setWishlist({ items: data.items || [], ready: true });
    }).catch(() => {
      if (active) setWishlist((value) => ({ ...value, ready: true }));
    });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, getToken]);

  const isWishlisted = useCallback((productType, productSlug) =>
    wishlist.items.some((item) => item.productType === productType && item.productSlug === productSlug), [wishlist.items]);

  const toggleWishlist = useCallback(async (productType, productSlug) => {
    if (!isSignedIn) return false;
    const token = await getToken();
    const saved = wishlist.items.some((item) => item.productType === productType && item.productSlug === productSlug);
    const data = await apiRequest(
      saved ? `/wishlist/items/${encodeURIComponent(productType)}/${encodeURIComponent(productSlug)}` : "/wishlist/items",
      { method: saved ? "DELETE" : "POST", body: saved ? undefined : { productType, productSlug }, token },
    );
    setWishlist({ items: data.items || [], ready: true });
    return !saved;
  }, [isSignedIn, getToken, wishlist.items]);

  const logout = useCallback(() => signOut({ redirectUrl: "/" }), [signOut]);

  /** Short-lived Clerk session token for `Authorization: Bearer` calls to our API (null when signed out). */
  const getAccessToken = useCallback(() => (isSignedIn ? getToken() : Promise.resolve(null)), [isSignedIn, getToken]);

  /** Adopts the currency the server read from the cookie (see CurrencySeed). Unlike setCurrency it writes nothing and does not refresh. */
  const adoptServerCurrency = useCallback((value) => setCurrencyState(normalizeCurrency(value)), []);

  const value = useMemo(
    () => ({ user, ready: isLoaded, currency, setCurrency, adoptServerCurrency, switching, logout, getAccessToken, wishlist, isWishlisted, toggleWishlist }),
    [user, isLoaded, currency, setCurrency, adoptServerCurrency, switching, logout, getAccessToken, wishlist, isWishlisted, toggleWishlist]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
