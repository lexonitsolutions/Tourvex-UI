import { API_BASE_URL, ApiError, apiRequest } from "./api";
import { resolveCurrency, withCurrency } from "./currencyCookie";

/**
 * Visas API client. Contract: Tourvex-API/docs/VISAS_API.md
 * Works on the server (metadata, server components) and in the browser. Amounts are AED unless a `currency` is requested (the API converts every Money; the server passes the cookie currency explicitly, the browser reads it itself).
 */

/** @typedef {{ amount: number, currency: string }} Money */
/** @typedef {{ id: string, slug: string, country: string, countryCode: string, title: string, kind: "evisa" | "embassy", startingPrice: Money | null, processing: string, validity: string }} VisaCard */
/**
 * @typedef {VisaCard & {
 *   summary: string, description: string, entries: "single" | "multiple" | "varies", stay: string,
 *   highlights: string[], requirements: string[], documents: string[],
 *   steps: { title: string, description: string }[], faqs: { question: string, answer: string }[],
 *   notes: string, sections: string[], isSample?: boolean, updatedAt: string
 * }} Visa
 */
/** @typedef {{ id: string, eyebrow?: string, title: string, subtitle: string, description: string, countryCode: string, ctaLabel: string, ctaHref: string }} VisaBanner */
/** @typedef {{ slug: string, title: string, subtitle: string, items: VisaCard[] }} VisaSection */
/** @typedef {{ banners: VisaBanner[], sections: VisaSection[], currency: string }} VisaHome */
/** @typedef {{ items: VisaCard[], pagination: { page: number, limit: number, total: number, pages: number }, facets: { kinds: { name: string, count: number }[] }, currency: string }} VisaList */

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

const memo = new Map();
const MEMO_MS = 60_000;

/** Browser-side memoization so the landing page and the detail page share requests. Failures are never cached. */
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

const abortError = () => Object.assign(new Error("Aborted"), { name: "AbortError" });

function withSignal(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    signal.addEventListener("abort", () => reject(abortError()), { once: true });
    promise.then(resolve, reject);
  });
}

/** @returns {Promise<VisaHome>} */
export function getVisaHome({ signal, currency } = {}) {
  if (isServer) return request("/visas/home", { signal, currency });
  const cur = resolveCurrency(currency);
  return withSignal(memoized(`home:${cur}`, () => request("/visas/home", { currency: cur })), signal);
}

/**
 * @param {{ q?: string, kind?: string, country?: string, sort?: string, page?: number, limit?: number }} params
 * @returns {Promise<VisaList>}
 */
export function listVisas(params = {}, { signal, currency } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return request(`/visas${qs ? `?${qs}` : ""}`, { signal, currency });
}

/** @returns {Promise<{ visa: Visa, related: VisaCard[], currency: string }>} Rejects with ApiError (status 404 when unknown). */
export function getVisa(slug, { signal, currency } = {}) {
  const path = `/visas/${encodeURIComponent(slug)}`;
  if (isServer) return request(path, { signal, currency });
  const cur = resolveCurrency(currency);
  return withSignal(memoized(`slug:${slug}:${cur}`, () => request(path, { currency: cur })), signal);
}

/**
 * Lead capture. `token` (Clerk bearer) is optional: when present the API links the enquiry to the user.
 * @returns {Promise<{ id: string, reference: string, status: string }>} Rejects with ApiError (400 text, 404, 429).
 */
export function submitVisaEnquiry(slug, body, { token, signal } = {}) {
  return apiRequest(`/visas/${encodeURIComponent(slug)}/enquiries`, { method: "POST", body, token, signal });
}

export function isNotFound(error) {
  return error instanceof ApiError && error.status === 404;
}
