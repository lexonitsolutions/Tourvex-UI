// Saving to the wishlist requires an account. When a signed-out visitor taps a heart we remember which
// package they wanted, send them to the login page, and add it for them right after they sign in.

import { isWishlisted, toggleWishlist } from "./holidays";

const PENDING_KEY = "tourvex.pendingWish";

/** Only same-site relative paths are allowed as a post-login destination (no open redirects). */
export function safeNext(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Clerk sign-in page; Clerk sends the visitor back to `redirect_url` after signing in. */
export function loginUrlFor(path, reason) {
  const query = new URLSearchParams();
  const next = safeNext(path);
  if (next) query.set("redirect_url", next);
  if (reason) query.set("reason", reason);
  const qs = query.toString();
  return qs ? `/sign-in?${qs}` : "/sign-in";
}

export function currentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function rememberPendingWish(slug) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, slug);
  } catch {
    /* storage unavailable */
  }
}

/** Call after a successful sign-in: adds the remembered package (if any) and returns its slug. */
export function completePendingWish() {
  try {
    const slug = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (slug && !isWishlisted(slug)) toggleWishlist(slug);
    return slug;
  } catch {
    return null;
  }
}
