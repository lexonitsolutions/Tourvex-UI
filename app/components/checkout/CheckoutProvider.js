"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createBookingApi, errorMessage, itemKey, normalizeCart } from "../../lib/booking";
import { useApp } from "../AppProvider";

const CheckoutContext = createContext(null);

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used inside <CheckoutProvider>");
  return ctx;
}

/** Holds the one open cart for every step of /checkout so the steps share it without refetching. */
export default function CheckoutProvider({ children }) {
  const { user, ready, getAccessToken, currency } = useApp();
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);
  const [state, setState] = useState({ status: "loading", cart: null, error: "" });
  const [expired, setExpired] = useState([]);
  // Cart lines the pay/update call reported as no longer available: { [itemId]: message }.
  const [problems, setProblems] = useState({});
  const [attempt, setAttempt] = useState(0);
  // The payment step pauses the step guards while an order is being closed (the cart legitimately empties).
  const [paused, setPaused] = useState(false);

  /** Accepts a Session returned by any cart call. Items dropped by the hold expiry are remembered for a notice. */
  const apply = useCallback((session) => {
    const cart = normalizeCart(session);
    if (cart.expired.length) setExpired((prev) => [...prev, ...cart.expired]);
    setState({ status: "ready", cart, error: "" });
    return cart;
  }, []);

  const flagItems = useCallback((ids, message) => {
    if (ids.length) setProblems((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, message])) }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      return apply(await api.getCart());
    } catch (error) {
      setState((s) => (s.cart ? s : { status: "error", cart: null, error: errorMessage(error) }));
      return null;
    }
  }, [api, apply]);

  useEffect(() => {
    if (!ready || !user) return;
    refresh();
    // Re-read when the display currency changes (the indicative "about" amounts follow it).
  }, [ready, user, refresh, attempt, currency]);

  const retry = useCallback(() => {
    setState({ status: "loading", cart: null, error: "" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ ...state, api, apply, refresh, retry, expired, dismissExpired: () => setExpired([]), itemKey, paused, setPaused, problems, flagItems }),
    [state, api, apply, refresh, retry, expired, paused, problems, flagItems]
  );
  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}
