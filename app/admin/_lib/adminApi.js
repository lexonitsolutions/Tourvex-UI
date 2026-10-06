"use client";

import { useMemo } from "react";
import { API_BASE_URL } from "../../lib/api";
import { useApp } from "../../components/AppProvider";

/** Error thrown by every admin API call. `code` is the API's machine code, `status` the HTTP status (0 = network). */
export class AdminApiError extends Error {
  constructor(message, { status = 0, code = null, details = null, body = null } = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.body = body; // full error body (the CMS reads `errors` / the latest draft from it)
  }
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

function toQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) qs.set(key, value.join(","));
      return;
    }
    qs.set(key, String(value));
  });
  const text = qs.toString();
  return text ? `?${text}` : "";
}

async function parse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorFrom(response, data) {
  const raw = data && typeof data === "object" ? data.message : null;
  const message = Array.isArray(raw) ? raw.map((m) => (m && typeof m === "object" ? m.message || "Invalid value" : m)).join(", ") : raw;
  return new AdminApiError(message || `Request failed (${response.status})`, {
    status: response.status,
    code: data && typeof data === "object" ? data.code || null : null,
    details: data && typeof data === "object" && Array.isArray(data.message) ? data.message : null,
    body: data && typeof data === "object" ? data : null,
  });
}

/**
 * Admin API client bound to the Clerk session. Every call attaches a fresh bearer token, maps errors to
 * AdminApiError and supports AbortSignal.
 */
export function createAdminApi(getAccessToken) {
  async function request(path, { method = "GET", query, body, signal, raw = false } = {}) {
    const token = await getAccessToken();
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}${toQuery(query)}`, {
        method,
        signal,
        cache: "no-store",
        headers: {
          Accept: raw ? "text/csv,application/json" : "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new AdminApiError("Could not reach the server. Check your connection and try again.", { status: 0 });
    }
    if (!response.ok) throw errorFrom(response, await parse(response));
    if (raw) return response.blob();
    return parse(response);
  }
  return {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body: body ?? {} }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body: body ?? {} }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body: body ?? {} }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
    /** Authenticated file download (CSV export endpoints). Resolves to a Blob. */
    download: (path, options) => request(path, { ...options, method: "GET", raw: true }),
  };
}

/** Stable client for components: `const api = useAdminApi(); api.get("/admin/staff", { query })`. */
export function useAdminApi() {
  const { getAccessToken } = useApp();
  return useMemo(() => createAdminApi(getAccessToken), [getAccessToken]);
}
