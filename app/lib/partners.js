import { API_BASE_URL, ApiError } from "./api";

/**
 * Partners API client. Contract: Tourvex-API/docs/PARTNERS_API.md
 * Used from server components (the strip is server-rendered and passed down as a prop). No prices, so no currency.
 */

/**
 * @typedef {Object} PartnerItem
 * @property {string} id
 * @property {string} name
 * @property {string | null} logo
 * @property {string} category
 * @property {string | null} href
 */

export const PARTNER_PLACEMENTS = ["home", "activities"];

const isServer = typeof window === "undefined";
// On the server prefer the internal API URL (same variable next.config.mjs uses for the media rewrite).
const BASE = isServer ? (process.env.API_INTERNAL_URL || API_BASE_URL).replace(/\/$/, "") : API_BASE_URL;

async function request(path, { signal, revalidate = 300 } = {}) {
  const response = await fetch(`${BASE}${path}`, {
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

/** @returns {Promise<{ title: string, subtitle: string, items: PartnerItem[] }>} */
export function getPartners(placement, { signal } = {}) {
  return request(`/partners${placement ? `?placement=${encodeURIComponent(placement)}` : ""}`, { signal });
}

/** Never throws: a failing partners call must not break the page, the section simply stays hidden. */
export async function getPartnersSafe(placement) {
  try {
    const data = await getPartners(placement);
    return data?.items?.length ? data : null;
  } catch {
    return null;
  }
}
