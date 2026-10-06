export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, { method = "GET", body, token, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
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

const activityCache = new Map();

/** Memoized per currency so the search page and home page share one catalog fetch per session. */
export function getActivities(currency = "AED") {
  if (!activityCache.has(currency)) {
    const request = fetchAllActivities({ currency }).catch((error) => {
      activityCache.delete(currency);
      throw error;
    });
    activityCache.set(currency, request);
  }
  return activityCache.get(currency);
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
