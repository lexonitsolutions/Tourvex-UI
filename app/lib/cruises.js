import { API_BASE_URL, ApiError, apiRequest } from "./api";
import { withCurrency } from "./currencyCookie";
import { cachedRequest, withSignal } from "./clientCache";

/**
 * Cruises API client. Contract: Tourvex-API/docs/CRUISES_API.md
 * Works on the server (metadata, server components) and in the browser. Amounts are AED unless a `currency` is requested (the API converts every Money; the server passes the cookie currency explicitly, the browser reads it itself).
 */

/** @typedef {{ amount: number, currency: string }} Money */
/**
 * @typedef {Object} CruiseCard
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} coverImage
 * @property {string} cruiseLine
 * @property {string} shipName
 * @property {string} departureCity
 * @property {string} departureCountry
 * @property {string} region
 * @property {number} durationNights
 * @property {number} durationDays
 * @property {string[]} nextDepartures
 * @property {string[]} ports
 * @property {number} portCount
 * @property {Money | null} price
 * @property {string[]} tags
 */

export const CRUISE_SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "soonest", label: "Soonest departure" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "nights_asc", label: "Nights: fewest" },
  { value: "nights_desc", label: "Nights: most" },
];

/** The contract has no nights facet, so the nights filter is a fixed set of ranges mapped onto minNights/maxNights. */
export const NIGHT_RANGES = [
  { key: "1-4", label: "Up to 4 nights", minNights: 1, maxNights: 4 },
  { key: "5-7", label: "5 to 7 nights", minNights: 5, maxNights: 7 },
  { key: "8-11", label: "8 to 11 nights", minNights: 8, maxNights: 11 },
  { key: "12+", label: "12 nights or more", minNights: 12 },
];

const SORT_VALUES = new Set(CRUISE_SORTS.map((s) => s.value));

/** Normalises the URL filters (shared by the server page and the client listing so both build the same request). */
export function parseListingParams(raw = {}) {
  const one = (v) => (Array.isArray(v) ? v[0] : v) || "";
  const sort = one(raw.sort);
  const nights = one(raw.nights);
  const month = one(raw.month);
  return {
    line: one(raw.line),
    region: one(raw.region),
    month: /^\d{4}-\d{2}$/.test(month) ? month : "",
    nights: NIGHT_RANGES.some((r) => r.key === nights) ? nights : "",
    sort: SORT_VALUES.has(sort) ? sort : "popular",
  };
}

export const LISTING_PAGE_SIZE = 12;

export function listingQuery(city, p, page = 1) {
  const range = NIGHT_RANGES.find((r) => r.key === p.nights);
  return {
    city,
    line: p.line || undefined,
    region: p.region || undefined,
    month: p.month || undefined,
    minNights: range?.minNights,
    maxNights: range?.maxNights,
    sort: p.sort,
    page,
    limit: LISTING_PAGE_SIZE,
  };
}

const isServer = typeof window === "undefined";
// On the server prefer the internal API URL (same variable next.config.mjs uses for the media rewrite).
const BASE = isServer ? (process.env.API_INTERNAL_URL || API_BASE_URL).replace(/\/$/, "") : API_BASE_URL;

async function fetchJson(url, { signal, revalidate }) {
  const response = await fetch(url, {
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

/** Server: Next's data cache (`revalidate`). Browser: shared for 60 s, so repeat visits to a page don't refetch. */
function request(path, { signal, revalidate = 60, currency } = {}) {
  const url = `${BASE}${withCurrency(path, currency)}`;
  if (isServer) return fetchJson(url, { signal, revalidate });
  return withSignal(cachedRequest(url, () => fetchJson(url, {})), signal);
}

/** @returns {Promise<{ banners: any[], cities: any[], sections: any[], lines: string[], currency: string }>} */
export function getCruiseHome({ signal, currency } = {}) {
  return request("/cruises/home", { signal, currency });
}

/**
 * @param {{ q?: string, city?: string, line?: string, region?: string, month?: string, minNights?: number, maxNights?: number, sort?: string, page?: number, limit?: number }} params
 * @returns {Promise<{ items: CruiseCard[], pagination: { page: number, limit: number, total: number, pages: number }, facets: { cities: any[], lines: any[], regions: any[], months: any[] }, currency: string }>}
 */
export function listCruises(params = {}, { signal, currency } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return request(`/cruises${qs ? `?${qs}` : ""}`, { signal, currency });
}

/** @returns {Promise<{ cruise: any, related: CruiseCard[], currency: string }>} Rejects with ApiError (status 404 when unknown). */
export function getCruise(slug, { signal, currency } = {}) {
  return request(`/cruises/${encodeURIComponent(slug)}`, { signal, currency });
}

/**
 * Lead capture. `token` (Clerk bearer) is optional: when present the API links the enquiry to the user.
 * @returns {Promise<{ id: string, reference: string, status: string }>} Rejects with ApiError (400 text, 404, 429).
 */
export function submitCruiseEnquiry(slug, body, { token, signal } = {}) {
  return apiRequest(`/cruises/${encodeURIComponent(slug)}/enquiries`, { method: "POST", body, token, signal });
}

export function isNotFound(error) {
  return error instanceof ApiError && error.status === 404;
}
