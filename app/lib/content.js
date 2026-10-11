import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { DEFAULTS } from "../content/defaults";

/**
 * Server-side CMS content access. Contract: Tourvex-API/docs/CMS_API.md.
 *
 * - One batched fetch (`GET /content?keys=...`), revalidated every 30 s.
 * - Per-key fallback to the bundled defaults (app/content/defaults) on ANY error, and missing fields
 *   inside a document fall back to the default value, so the site never breaks when the API is down.
 * - Published content is cached with `use cache` (see `loadPublished`), so layouts and pages that read it stay part of the
 *   prerendered static shell: it revalidates every 60 s and can be refreshed on demand with `revalidateTag("cms")`.
 * - Preview (drafts) needs the request cookie, which a cached scope cannot read, so it is a separate dynamic path
 *   (`getPreviewPageContent`). `proxy.js` does not set that cookie yet, so nothing calls it today.
 */

export const PREVIEW_COOKIE = "cms_preview";
const REVALIDATE_SECONDS = 30;
const TIMEOUT_MS = 4000;
const ALL_KEYS = ["page.home", "global.header", "global.footer", "global.seo"];

const BASE = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1").replace(/\/$/, "");

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** Fills fields missing from `value` with the default's. Lists are kept as the CMS returned them. */
export function withDefaults(value, fallback) {
  if (isObject(value) && isObject(fallback)) {
    const result = { ...value };
    for (const key of Object.keys(fallback)) result[key] = key in value ? withDefaults(value[key], fallback[key]) : fallback[key];
    return result;
  }
  return value === undefined || value === null ? fallback : value;
}

function normalise(key, item) {
  const fallback = DEFAULTS[key];
  if (isObject(item) && Array.isArray(item.sections)) {
    const byType = Object.fromEntries((fallback?.sections || []).map((section) => [section.type, section.data]));
    return {
      sections: item.sections.map((section) => ({ ...section, data: withDefaults(section.data, byType[section.type]) })),
    };
  }
  if (isObject(item) && isObject(item.data)) return { data: withDefaults(item.data, fallback?.data) };
  return fallback;
}

/** The (unverified) key a preview token is bound to, or null. The API does the real verification. */
function tokenKey(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
    return typeof payload?.k === "string" && Number(payload.e) > Date.now() ? payload.k : null;
  } catch {
    return null;
  }
}

async function readPreviewToken() {
  try {
    const store = await cookies();
    const token = store.get(PREVIEW_COOKIE)?.value;
    return token && token.length <= 512 && tokenKey(token) ? token : null;
  } catch {
    return null;
  }
}

async function request(keys, token) {
  const query = `keys=${keys.map(encodeURIComponent).join(",")}${token ? `&preview=${encodeURIComponent(token)}` : ""}`;
  const isDev = process.env.NODE_ENV === "development";
  const response = await fetch(`${BASE}/content?${query}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(token || isDev ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS } }),
  });
  if (!response.ok) throw new Error(`content request failed (${response.status})`);
  const body = await response.json();
  return { items: body?.items || {}, preview: response.headers.get("x-robots-tag") === "noindex" };
}

function build(keys, result) {
  const content = {};
  for (const key of keys) content[key] = normalise(key, result?.items?.[key]);
  return content;
}

/**
 * Published content for every CMS key, cached (shared by all visitors, no request data involved). Takes no arguments so
 * the whole set is one cache entry and one API call. `stale >= 5 min` and `expire >= 5 min` are what let a cached scope
 * be part of the prerendered shell; `revalidate` is what bounds how old a published change can be.
 */
async function loadPublished() {
  "use cache";
  const isDev = process.env.NODE_ENV === "development";
  cacheLife(isDev ? { stale: 1, revalidate: 1, expire: 5 } : { stale: 300, revalidate: 60, expire: 86400 });
  cacheTag("cms");
  let result = null;
  try {
    result = await request(ALL_KEYS, null);
  } catch {
    result = null;
  }
  return build(ALL_KEYS, result);
}

/** `{ sections }` for a page document such as "home" (published). Never throws. */
export async function getPageContent(name) {
  const content = await loadPublished();
  return { sections: content[`page.${name}`]?.sections || [] };
}

/** `{ header, footer, seo }` (the `data` of each global document, published). Never throws. */
export async function getGlobalContent() {
  const content = await loadPublished();
  return {
    header: content["global.header"]?.data,
    footer: content["global.footer"]?.data,
    seo: content["global.seo"]?.data,
  };
}

/**
 * Draft content for a preview visitor. Reads the preview cookie, so it is request-time only: call it inside a
 * `<Suspense>` boundary, never from a cached scope. Falls back to the published page when there is no valid token.
 */
export async function getPreviewPageContent(name) {
  const key = `page.${name}`;
  const token = await readPreviewToken();
  if (!token) return { ...(await getPageContent(name)), preview: false };
  let result = null;
  try {
    result = await request(ALL_KEYS, token);
  } catch {
    try {
      result = await request(ALL_KEYS, null);
    } catch {
      result = null;
    }
  }
  return { sections: build(ALL_KEYS, result)[key]?.sections || [], preview: Boolean(result?.preview) };
}

/** The enabled sections of a page, in CMS order. */
export function enabledSections(sections) {
  return (sections || []).filter((section) => section.enabled !== false);
}
