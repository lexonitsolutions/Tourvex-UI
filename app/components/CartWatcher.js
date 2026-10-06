"use client";

import Link from "next/link";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { createBookingApi } from "../lib/booking";
import { getCartCount, setCartCount, subscribeCart } from "../lib/cartStore";
import { useApp } from "./AppProvider";
import "../cart-badge.css";

export function useCartCount() {
  return useSyncExternalStore(subscribeCart, getCartCount, () => null);
}

/**
 * Keeps the cart item count fresh for signed-in visitors: loads it on sign-in, when the tab becomes visible again and on
 * `mk:cart-changed`. Cart API calls publish their own result immediately (see lib/cartStore.js), so add/remove show at once.
 */
export function CartWatcher() {
  const { user, ready, getAccessToken } = useApp();
  const userId = user?.id;

  const refresh = useCallback(async () => {
    try {
      await createBookingApi(getAccessToken).getCart();
    } catch {
      /* the badge simply keeps its last value */
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!ready) return undefined;
    if (!userId) {
      setCartCount(null);
      return undefined;
    }
    refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("mk:cart-changed", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("mk:cart-changed", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready, userId, refresh]);

  return null;
}

/** Header cart icon with the item-count badge; opens the cart. */
export function CartLink() {
  const count = useCartCount();
  const label = count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";
  return (
    <Link className="mk-cart" href="/checkout" aria-label={label}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 4h2l2.4 11h10.2l2-8H6.2" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      {count > 0 && <span className="mk-cart-badge" aria-hidden="true">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}
