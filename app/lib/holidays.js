import { API_BASE_URL, ApiError, apiRequest } from "./api";
import { resolveCurrency, withCurrency } from "./currencyCookie";

/**
 * Holidays API client. Contract: Tourvex-API/docs/HOLIDAYS_API.md
 * Works on the server (metadata, server components) and in the browser. Amounts are AED unless a `currency` is requested (the API converts every Money; the server passes the cookie currency explicitly, the browser reads it itself).
 */

/** @typedef {{ amount: number, currency: string }} Money */
/**
 * @typedef {Object} PackageCard
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} coverImage
 * @property {string[]} destinations
 * @property {string} country
 * @property {number} durationNights
 * @property {number} durationDays
 * @property {Money | null} price
 * @property {Money | null} salePrice
 * @property {{ average: number, count: number } | null} rating
 * @property {string[]} themes
 */
/**
 * @typedef {PackageCard & {
 *   summary: string, description: string, images: { url: string, alt: string }[],
 *   highlights: string[], inclusions: string[], exclusions: string[],
 *   itinerary: { day: number, title: string, description: string }[],
 *   collections: string[], isSample?: boolean, updatedAt: string
 * }} HolidayPackage
 */
/** @typedef {{ id: string, eyebrow?: string, title: string, subtitle: string, description: string, image: string, ctaLabel: string, ctaHref: string }} HolidayBanner */
/** @typedef {{ name: string, country: string, count: number, image: string, startingFrom: Money | null }} HolidayCity */
/** @typedef {{ name: string, count: number, image: string, cities: string[] }} HolidayCountry */
/** @typedef {{ slug: string, title: string, subtitle: string, items: PackageCard[] }} HolidayCollection */
/** @typedef {{ banners: HolidayBanner[], cities: HolidayCity[], countries: HolidayCountry[], collections: HolidayCollection[], currency: string }} HolidayHome */
/** @typedef {{ items: PackageCard[], pagination: { page: number, limit: number, total: number, pages: number }, facets: { destinations: {name: string, count: number}[], countries: {name: string, count: number}[], themes: {name: string, count: number}[] }, currency: string }} HolidayList */

export const HOLIDAY_SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "nights_asc", label: "Duration: shortest" },
  { value: "nights_desc", label: "Duration: longest" },
  { value: "newest", label: "Newest" },
];

const isServer = typeof window === "undefined";
// On the server prefer the internal API URL (same variable next.config.mjs uses for the media rewrite).
const BASE = isServer ? (process.env.API_INTERNAL_URL || API_BASE_URL).replace(/\/$/, "") : API_BASE_URL;

async function request(path, { signal, revalidate = 60, currency } = {}) {
  const response = await fetch(`${BASE}${withCurrency(path, currency)}`, {
    signal,
    headers: { Accept: "application/json" },
    ...(isServer ? { next: { revalidate } } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new ApiError(message || `Request failed (${response.status})`, response.status);
  }
  return data;
}

const abortError = () => Object.assign(new Error("Aborted"), { name: "AbortError" });

/** Lets a consumer abandon a shared (memoized) request without cancelling it for everyone else. */
function withSignal(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    signal.addEventListener("abort", () => reject(abortError()), { once: true });
    promise.then(resolve, reject);
  });
}

const memo = new Map();
const MEMO_MS = 60_000;

/** Browser-side memoization so landing, recently-viewed and similar rails share requests. Failures are never cached. */
function memoized(key, load) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.promise;
  const promise = load().catch((error) => {
    memo.delete(key);
    throw error;
  });
  memo.set(key, { at: Date.now(), promise });
  return promise;
}

/** @returns {Promise<HolidayHome>} */
export function getHolidayHome({ signal, currency } = {}) {
  if (isServer) return request("/holidays/home", { signal, currency });
  const cur = resolveCurrency(currency);
  return withSignal(memoized(`home:${cur}`, () => request("/holidays/home", { currency: cur })), signal);
}

/**
 * @param {{ q?: string, destination?: string, country?: string, theme?: string, collection?: string, minNights?: number|string, maxNights?: number|string, sort?: string, page?: number, limit?: number }} params
 * @returns {Promise<HolidayList>}
 */
export function listHolidays(params = {}, { signal, currency } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return request(`/holidays${qs ? `?${qs}` : ""}`, { signal, currency });
}

/** @returns {Promise<{ package: HolidayPackage, related: PackageCard[], currency: string }>} Rejects with ApiError (status 404 when unknown). */
export function getHoliday(slug, { signal, currency } = {}) {
  const path = `/holidays/${encodeURIComponent(slug)}`;
  if (isServer) return request(path, { signal, currency });
  const cur = resolveCurrency(currency);
  return withSignal(memoized(`slug:${slug}:${cur}`, () => request(path, { currency: cur })), signal);
}

export function isNotFound(error) {
  return error instanceof ApiError && error.status === 404;
}

/* ------------------------------------------------------------------ */
/* Wishlist + recently viewed (localStorage, browser only)             */
/* ------------------------------------------------------------------ */

const WISHLIST_KEY = "tourvex.wishlistHoliday";
const RECENT_KEY = "tourvex.recentHoliday";
const RECENT_MAX = 8;
const wishlistListeners = new Set();

function readSlugs(key) {
  if (isServer) return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeSlugs(key, slugs) {
  try {
    window.localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    /* storage unavailable */
  }
}

/** Number of saved holidays (used by the account panel). */
export function wishlistCount() {
  return readSlugs(WISHLIST_KEY).length;
}

export function isWishlisted(slug) {
  return readSlugs(WISHLIST_KEY).includes(slug);
}

export function toggleWishlist(slug) {
  const list = readSlugs(WISHLIST_KEY);
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list];
  writeSlugs(WISHLIST_KEY, next);
  wishlistListeners.forEach((fn) => fn());
  return next.includes(slug);
}

/** useSyncExternalStore subscription: fires on local toggles and on changes from other tabs. */
export function subscribeWishlist(callback) {
  wishlistListeners.add(callback);
  const onStorage = (e) => e.key === WISHLIST_KEY && callback();
  window.addEventListener("storage", onStorage);
  return () => {
    wishlistListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function getRecentHolidaySlugs() {
  return readSlugs(RECENT_KEY).slice(0, RECENT_MAX);
}

export function recordRecentHoliday(slug) {
  if (!slug) return;
  writeSlugs(RECENT_KEY, [slug, ...readSlugs(RECENT_KEY).filter((s) => s !== slug)].slice(0, RECENT_MAX));
}

/**
 * Submit an instant holiday booking enquiry. Posts to the API (POST /holidays/:slug/enquiries), which stores it and
 * creates the CRM lead. `token` (Clerk bearer) is optional: when present the API links the enquiry to the user.
 * Body fields (see docs/HOLIDAYS_API.md): fullName, email, phone (6-20 chars: digits, + - and spaces), consent: true,
 * and optionally travelers (1-20), travelDate (ISO), totalAmount (max 2 decimals), currency, message, nationality,
 * adults, children, marketingOptOut.
 * @returns {Promise<{ id: string, reference: string, status: string }>} Rejects with ApiError (400 text, 404, 429).
 */
export function submitHolidayEnquiry(slug, body, { token, signal } = {}) {
  return apiRequest(`/holidays/${encodeURIComponent(slug)}/enquiries`, { method: "POST", body, token, signal });
}

