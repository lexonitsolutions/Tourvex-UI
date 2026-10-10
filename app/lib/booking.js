// API client for the activity booking flow: detail, availability, quotes, reviews, the cart/checkout and bookings.
// Contract: Tourvex-API/docs/ACTIVITY_BOOKING_API.md. Public GETs follow the selected currency (the API converts them);
// cart, checkout and booking figures are AED as charged, with an indicative `display` equivalent from the API.

import { API_BASE_URL, ApiError } from "./api";
import { withCurrency } from "./currencyCookie";
import { publishCart } from "./cartStore";

export const MAX_CART_ITEMS = 5;

/** ApiError plus the contract's machine-readable error code (DATE_UNAVAILABLE, PAX_LIMIT, ...). */
export class BookingError extends ApiError {
  constructor(message, status, code, data) {
    super(message, status);
    this.code = code || "";
    this.data = data ?? null;
  }
}

/** Codes meaning "this date/option no longer has the capacity asked for" (409 from add-to-cart, update or pay). */
export const UNAVAILABLE_CODES = ["DATE_UNAVAILABLE", "SOLD_OUT", "STOCK_UNAVAILABLE"];
export const isUnavailableError = (error) => !!error && UNAVAILABLE_CODES.includes(error.code);

/** Cart line ids named by an unavailability error, wherever the API puts them (all optional). */
export function unavailableIds(error) {
  const d = error?.data;
  const nested = d && typeof d.message === "object" && !Array.isArray(d.message) ? d.message : null;
  const out = new Set();
  [d, d?.details, nested, nested?.details].forEach((src) => {
    if (!src || typeof src !== "object") return;
    [src.itemId, src.cartItemId, ...(Array.isArray(src.itemIds) ? src.itemIds : []), ...(Array.isArray(src.items) ? src.items.map((i) => i?.id ?? i?.itemId ?? i) : [])].forEach((v) => {
      if (typeof v === "string" || typeof v === "number") out.add(String(v));
    });
  });
  return [...out];
}

/** A cart line the API itself flags as no longer bookable (flag names are optional), else "". */
export function itemProblem(item) {
  if (!item) return "";
  const status = String(item.status || item.availability?.status || "").toLowerCase();
  const flagged = item.available === false || item.unavailable === true || item.soldOut === true || ["unavailable", "sold_out", "date_unavailable"].includes(status);
  if (!flagged) return "";
  return (typeof item.unavailableReason === "string" && item.unavailableReason) || (typeof item.message === "string" && item.message) || FRIENDLY.DATE_UNAVAILABLE;
}

const FRIENDLY = {
  DATE_UNAVAILABLE: "Sorry, that date has just sold out or does not have enough tickets left. Please choose another date or fewer travellers.",
  STOCK_UNAVAILABLE: "Sorry, there are not enough tickets left for that date. Please choose another date or fewer travellers.",
  PAX_LIMIT: "That number of travellers is not allowed for this option. Please adjust adults and children.",
  CART_FULL: `Your cart is full (up to ${MAX_CART_ITEMS} activities). Remove one to add another.`,
  INVALID_PROMO: "That promo code is not valid for this order.",
  SESSION_EXPIRED: "Your cart hold has expired. Please add your activities again.",
  CART_EXPIRED: "Your cart hold has expired. Please add your activities again.",
  SOLD_OUT: "Sorry, that date has just sold out. Please choose another date.",
  CHILD_NOT_ALLOWED: "Children cannot be added to this option.",
};

const KNOWN_CODES = Object.keys(FRIENDLY);

const text = (value) => (Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : "");

function codeOf(data) {
  const nested = data && typeof data.message === "object" && !Array.isArray(data.message) ? data.message : null;
  const raw = data?.code ?? data?.errorCode ?? data?.error?.code ?? nested?.code;
  if (typeof raw === "string" && raw) return raw.toUpperCase();
  const haystack = `${text(data?.message)} ${typeof data?.error === "string" ? data.error : ""}`;
  return KNOWN_CODES.find((code) => haystack.includes(code)) || "";
}

function messageOf(data, status, code) {
  if (FRIENDLY[code]) return FRIENDLY[code];
  const nested = data && typeof data.message === "object" && !Array.isArray(data.message) ? data.message : null;
  const server = text(nested?.message) || text(data?.message);
  // Server text is only shown when it reads like a sentence (not a bare code or a generic HTTP name).
  if (server && !/^[A-Z_]+$/.test(server) && server.length < 220) return server;
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You do not have access to that.";
  if (status === 404) return "We could not find that.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  return "That did not work. Please check your details and try again.";
}

/** fetch wrapper that keeps the error code. Network failures become a BookingError with status 0. */
export async function bookingRequest(path, { method = "GET", body, token, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new BookingError("We could not reach the server. Please check your connection and try again.", 0, "NETWORK");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = codeOf(data);
    throw new BookingError(messageOf(data, response.status, code), response.status, code, data);
  }
  return data;
}

export const isNotFound = (error) => error instanceof ApiError && error.status === 404;
export const isUnauthorized = (error) => error instanceof ApiError && error.status === 401;
export const errorMessage = (error) => (error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.");

/* Public catalog (usable from server components) ------------------------------------------------ */

export const getActivity = (slug, { currency, signal } = {}) =>
  bookingRequest(withCurrency(`/catalog/activities/${encodeURIComponent(slug)}?locale=en`, currency), { signal });

/** Same destination first, topped up with the same category; the activity itself excluded. */
export async function getRelatedActivities(activity, { currency, limit = 8 } = {}) {
  const city = activity.destinations?.[0];
  const category = activity.categories?.[0];
  const query = (extra) => withCurrency(`/catalog/activities?limit=${limit + 1}&locale=en${extra}`, currency);
  const [byCity, byCategory] = await Promise.all([
    city ? bookingRequest(query(`&destination=${encodeURIComponent(city)}${category ? `&category=${encodeURIComponent(category)}` : ""}`)).catch(() => null) : null,
    category ? bookingRequest(query(`&category=${encodeURIComponent(category)}`)).catch(() => null) : null,
  ]);
  const seen = new Set([activity.slug]);
  const out = [];
  [byCity, byCategory].forEach((page) =>
    (page?.items || []).forEach((item) => {
      if (!seen.has(item.slug) && out.length < limit) {
        seen.add(item.slug);
        out.push(item);
      }
    })
  );
  return out;
}

export const getAvailability = (slug, optionId, month, { currency, signal } = {}) =>
  bookingRequest(
    withCurrency(`/catalog/activities/${encodeURIComponent(slug)}/availability?optionId=${encodeURIComponent(optionId)}&month=${encodeURIComponent(month)}`, currency),
    { signal }
  );

export const getQuote = (slug, body, { currency, signal } = {}) =>
  bookingRequest(withCurrency(`/catalog/activities/${encodeURIComponent(slug)}/quote`, currency), { method: "POST", body, signal });

export function getReviews(slug, { rating, withImages, sort = "top", page = 1, limit = 6, signal } = {}) {
  const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
  if (rating) params.set("rating", String(rating));
  if (withImages) params.set("withImages", "true");
  return bookingRequest(`/catalog/activities/${encodeURIComponent(slug)}/reviews?${params}`, { signal });
}

/* Cart helpers ---------------------------------------------------------------------------------- */

/** Stable id of a cart line whatever the API calls it. */
export const itemKey = (item) => item?.id ?? item?.itemId ?? item?._id ?? "";

/** Always an object with arrays, so UI code never needs null checks. */
export function normalizeCart(session) {
  const s = session && typeof session === "object" ? session : {};
  return {
    ...s,
    items: Array.isArray(s.items) ? s.items : [],
    expired: Array.isArray(s.expired) ? s.expired : [],
    steps: { cart: false, pickup: false, additional: false, customer: false, ...(s.steps || {}) },
  };
}

/** Authenticated API bound to the Clerk token getter from useApp(). Cart responses keep the header badge in sync. */
export function createBookingApi(getAccessToken) {
  const run = async (path, options = {}) => {
    const token = await getAccessToken();
    if (!token) throw new BookingError("Please sign in to continue.", 401, "UNAUTHENTICATED");
    return bookingRequest(withCurrency(path), { ...options, token });
  };
  const cart = async (path, options) => {
    const session = normalizeCart(await run(path, options));
    publishCart(session);
    return session;
  };
  const send = (method) => (path, body) => cart(path, { method, body });
  const patch = send("PATCH");
  return {
    getCart: (options) => cart("/checkout/cart", options),
    addItem: (body) => send("POST")("/checkout/cart/items", body),
    updateItem: (id, body) => patch(`/checkout/cart/items/${encodeURIComponent(id)}`, body),
    removeItem: (id) => send("DELETE")(`/checkout/cart/items/${encodeURIComponent(id)}`),
    setPickup: (id, body) => patch(`/checkout/cart/items/${encodeURIComponent(id)}/pickup`, body),
    setAdditional: (id, body) => patch(`/checkout/cart/items/${encodeURIComponent(id)}/additional`, body),
    setCustomer: (body) => patch("/checkout/cart/customer", body),
    applyPromo: (code) => send("POST")("/checkout/cart/promo", { code }),
    removePromo: () => send("DELETE")("/checkout/cart/promo"),
    pay: async () => {
      const result = await run("/checkout/cart/pay", { method: "POST", body: {} });
      return result;
    },
    cartStatus: (options) => run("/checkout/cart/status", options),
    sessionStatus: (id, options) => run(`/checkout/sessions/${encodeURIComponent(id)}/status`, options),
    getBookings: (options) => run("/bookings", options),
    getBooking: (id, options) => run(`/bookings/${encodeURIComponent(id)}`, options),
    /** The booking's voucher (QR as SVG path data) or null while none is issued. */
    getVoucher: (id, options) => run(`/bookings/${encodeURIComponent(id)}/voucher`, options),
    /** PDF invoice of the booking as a Blob. */
    downloadInvoice: async (id) => {
      const token = await getAccessToken();
      if (!token) throw new BookingError("Please sign in to continue.", 401, "UNAUTHENTICATED");
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(id)}/invoice.pdf`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      } catch {
        throw new BookingError("We could not reach the server. Please check your connection and try again.", 0, "NETWORK");
      }
      if (!response.ok) throw new BookingError(response.status === 404 ? "No invoice is available for this booking yet." : "We could not download the invoice. Please try again.", response.status, "");
      return response.blob();
    },
    requestCancellation: (id) => run(`/bookings/${encodeURIComponent(id)}/cancellation`, { method: "POST", body: {} }),
    postReview: (slug, body) => run(`/catalog/activities/${encodeURIComponent(slug)}/reviews`, { method: "POST", body }),
  };
}
