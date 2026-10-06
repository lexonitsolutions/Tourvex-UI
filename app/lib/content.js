import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULTS } from "../content/defaults";

/**
 * Server-side CMS content access. Contract: Tourvex-API/docs/CMS_API.md.
 *
 * - One batched fetch (`GET /content?keys=...`), revalidated every 30 s.
 * - Per-key fallback to the bundled defaults (app/content/defaults) on ANY error, and missing fields
 *   inside a document fall back to the default value, so the site never breaks when the API is down.
 * - Preview: `proxy.js` turns `?cmsPreview=<token>` into a short-lived httpOnly cookie. With a valid
 *   token the bound document is fetched as a DRAFT (no cache, noindex, "Preview mode" pill).
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
  const response = await fetch(`${BASE}/content?${query}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(token ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS } }),
  });
  if (!response.ok) throw new Error(`content request failed (${response.status})`);
  const body = await response.json();
  return { items: body?.items || {}, preview: response.headers.get("x-robots-tag") === "noindex" };
}

async function load(keys, allowPreview) {
  const token = allowPreview ? await readPreviewToken() : null;
  let result = null;
  try {
    result = await request(keys, token);
  } catch {
    if (token) {
      // An expired or rejected token must not take the page down: show the published content.
      try {
        result = await request(keys, null);
      } catch {
        result = null;
      }
    }
  }
  const content = {};
  for (const key of keys) content[key] = normalise(key, result?.items?.[key]);
  return { content, preview: Boolean(result?.preview), fromApi: Boolean(result) };
}

const loadCached = cache((keysJoined, allowPreview) => load(keysJoined.split(","), allowPreview));

/** `{ sections, preview }` for a page document such as "home". Never throws. */
export async function getPageContent(name, { allowPreview = true } = {}) {
  const key = `page.${name}`;
  const { content, preview } = await loadCached(ALL_KEYS.join(","), allowPreview);
  return { sections: content[key]?.sections || [], preview };
}

/** `{ header, footer, seo, preview }` (the `data` of each global document). Never throws. */
export async function getGlobalContent({ allowPreview = true } = {}) {
  const { content, preview } = await loadCached(ALL_KEYS.join(","), allowPreview);
  return {
    header: content["global.header"]?.data,
    footer: content["global.footer"]?.data,
    seo: content["global.seo"]?.data,
    preview,
  };
}

/** The enabled sections of a page, in CMS order. */
export function enabledSections(sections) {
  return (sections || []).filter((section) => section.enabled !== false);
}
