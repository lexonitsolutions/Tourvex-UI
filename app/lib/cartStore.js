// Tiny external store for the header cart badge. Cart API calls publish the new item count here, so the badge
// updates after add / remove / modify without a reload. `null` means unknown (signed out or not loaded yet).

let count = null;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());

export const getCartCount = () => count;

export function setCartCount(next) {
  const value = next == null ? null : Math.max(0, Number(next) || 0);
  if (value === count) return;
  count = value;
  emit();
}

/** Called with any cart/session response. */
export function publishCart(session) {
  if (session && Array.isArray(session.items)) setCartCount(session.items.length);
}

export function subscribeCart(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Ask the header watcher to re-read the cart (for example after a payment finished elsewhere). */
export function requestCartRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("mk:cart-changed"));
}
