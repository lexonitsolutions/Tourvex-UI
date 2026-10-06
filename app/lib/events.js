import { API_BASE_URL, ApiError, apiRequest } from "./api";
import { withCurrency } from "./currencyCookie";

/**
 * Events API client. Contract: Tourvex-API/docs/EVENTS_API.md
 * Works on the server (metadata, server components) and in the browser. Amounts are AED unless a `currency` is requested (the API converts every Money; the server passes the cookie currency explicitly, the browser reads it itself).
 */

/** @typedef {{ amount: number, currency: string }} Money */
/**
 * @typedef {Object} EventCard
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} coverImage
 * @property {string} category
 * @property {string} venue
 * @property {string} city
 * @property {string} country
 * @property {string} nextDate
 * @property {number} sessionCount
 * @property {number | null} durationMinutes
 * @property {Money | null} price
 * @property {string[]} tags
 */

export const EVENT_SORTS = [
  { value: "soonest", label: "Soonest first" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const SORT_VALUES = new Set(EVENT_SORTS.map((s) => s.value));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Normalises the URL filters (shared by the server page and the client listing so both build the same request). */
export function parseListingParams(raw = {}) {
  const one = (v) => (Array.isArray(v) ? v[0] : v) || "";
  const sort = one(raw.sort);
  const from = one(raw.from);
  const to = one(raw.to);
  return {
    city: one(raw.city),
    category: one(raw.category),
    from: DAY.test(from) ? from : "",
    to: DAY.test(to) ? to : "",
    sort: SORT_VALUES.has(sort) ? sort : "soonest",
  };
}

export const LISTING_PAGE_SIZE = 12;

/**
 * `scope` is the fixed part of the page: { city } on /events/in/[city] or { category } on /events/category/[slug].
 * The other dimension comes from the URL filters.
 */
export function listingQuery(scope, p, page = 1) {
  return {
    city: scope.city || p.city || undefined,
    category: scope.category || p.category || undefined,
    from: p.from || undefined,
    to: p.to || undefined,
    sort: p.sort,
    page,
    limit: LISTING_PAGE_SIZE,
  };
}

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

/** @returns {Promise<{ banners: any[], categories: any[], cities: any[], sections: any[], currency: string }>} */
export function getEventHome({ signal, currency } = {}) {
  return request("/events/home", { signal, currency });
}

/**
 * @param {{ q?: string, city?: string, category?: string, date?: string, from?: string, to?: string, sort?: string, page?: number, limit?: number }} params
 * @returns {Promise<{ items: EventCard[], pagination: { page: number, limit: number, total: number, pages: number }, facets: { cities: any[], categories: any[], months: any[] }, currency: string }>}
 */
export function listEvents(params = {}, { signal, currency } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return request(`/events${qs ? `?${qs}` : ""}`, { signal, currency });
}

/** @returns {Promise<{ event: any, related: EventCard[], currency: string }>} Rejects with ApiError (status 404 when unknown). */
export function getEvent(slug, { signal, currency } = {}) {
  return request(`/events/${encodeURIComponent(slug)}`, { signal, currency });
}

/**
 * Lead capture. `token` (Clerk bearer) is optional: when present the API links the enquiry to the user.
 * @returns {Promise<{ id: string, reference: string, status: string }>} Rejects with ApiError (400 text, 404, 429).
 */
export function submitEventEnquiry(slug, body, { token, signal } = {}) {
  return apiRequest(`/events/${encodeURIComponent(slug)}/enquiries`, { method: "POST", body, token, signal });
}

/** Lower-case slug -> "Family". Only a fallback label when the API has not named the category. */
export const titleizeSlug = (slug) => String(slug).replace(/[-_]+/g, " ").replace(/\w/g, (c) => c.toUpperCase());

export function isNotFound(error) {
  return error instanceof ApiError && error.status === 404;
}
