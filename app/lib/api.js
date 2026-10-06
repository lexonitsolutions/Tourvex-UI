import { cachedRequest, withSignal } from "./clientCache";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const isServer = typeof window === "undefined";
const SERVER_REVALIDATE_SECONDS = 60;

export async function apiRequest(path, { method = "GET", body, token, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    // Public GETs rendered on the server go through Next's data cache; anything signed-in or mutating never does.
    ...(isServer && method === "GET" && !token ? { next: { revalidate: SERVER_REVALIDATE_SECONDS } } : {}),
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new ApiError(message || `Request failed (${response.status})`, response.status);
  }
  return data;
}

export async function fetchAllActivities({ currency = "AED", signal } = {}) {
  const url = (page) =>
    `/catalog/activities?page=${page}&limit=100&locale=en&currency=${encodeURIComponent(currency)}`;
  const first = await apiRequest(url(1), { signal });
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.pagination.pages - 1, 0) }, (_, i) =>
      apiRequest(url(i + 2), { signal })
    )
  );
  return [first, ...rest].flatMap((page) => page.items);
}

const CATALOG_TTL_MS = 5 * 60_000;

/** Shared per currency for 5 minutes, so home, search and the listing reuse one catalog fetch. `signal` only abandons this caller's wait. */
export function getActivities(currency = "AED", { signal } = {}) {
  return withSignal(cachedRequest(`catalog:${currency}`, () => fetchAllActivities({ currency }), { ttl: CATALOG_TTL_MS }), signal);
}

export function formatPrice(amount, currency) {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
