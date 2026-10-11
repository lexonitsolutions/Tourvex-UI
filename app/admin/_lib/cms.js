"use client";

/*
 * Client helpers for the content editor (/admin/content). Typed by convention (see Tourvex-API/docs/CMS_API.md):
 *   Field          { name, type: text|textarea|richtext|image|link|toggle|number|select|color|list|group, label, ... }
 *   SectionSchema  { type, label, description?, icon?, fixed?, canDisable?, fields }
 *   DocumentSchema { key, label, description?, kind: "page" | "global", sections?: { allowed, default }, fields?, previewPath? }
 *   Section        { id, type, enabled, data }            (pages)  /  a flat data object (global documents)
 * Everything here is schema driven: no field of any document is known to this file.
 * "value" below always means the editable content: the sections array of a page or the data object of a global document.
 */

import { useMemo } from "react";
import { API_BASE_URL } from "../../lib/api";
import { useApp } from "../../components/AppProvider";
import { AdminApiError, useAdminApi } from "./adminApi";
import { humanize } from "./format";

/* ------------------------------------------------------------------ status */

export const STATUS = {
  published: { label: "Published", tone: "success" },
  "draft-changes": { label: "Unpublished changes", tone: "warning" },
  "never-published": { label: "Never published", tone: "neutral" },
};
export const statusMeta = (status) => STATUS[status] || { label: humanize(status || "unknown"), tone: "neutral" };

/* ------------------------------------------------------------------ ids, paths, immutable updates */

let counter = 0;
export function uid(prefix = "id") {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${String(prefix).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}-${rand}${counter.toString(36)}`;
}

export const pathKey = (path) => path.join(".");
export const parsePath = (key) => (key ? key.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p)) : []);

export function getIn(obj, path) {
  let cur = obj;
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[seg];
  }
  return cur;
}

/** Immutable set: only the objects along `path` are copied, every other branch keeps its identity (this is what lets memoised fields skip renders). */
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const base = obj === null || obj === undefined ? (typeof head === "number" ? [] : {}) : obj;
  const copy = Array.isArray(base) ? base.slice() : { ...base };
  copy[head] = setIn(base[head], rest, value);
  return copy;
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
export const sig = (v) => JSON.stringify(v ?? null);

/* ------------------------------------------------------------------ schema walking and defaults */

export function sectionSchemaFor(sectionSchemas, type) {
  return (sectionSchemas && sectionSchemas[type]) || null;
}

export function defaultValue(field) {
  switch (field.type) {
    case "image":
      return { url: "", alt: "" };
    case "video":
      return { url: "" };
    case "link":
      return { label: "", href: "" };
    case "toggle":
      return false;
    case "number":
      return typeof field.min === "number" ? field.min : 0;
    case "select":
      return field.options?.[0]?.value ?? "";
    case "color":
      return "#000000";
    case "list":
      return Array.from({ length: field.min || 0 }, () => newListItem(field));
    case "group":
      return defaultsForFields(field.fields);
    // field types registered by the catalog editor (see app/admin/catalog)
    case "money":
      return { amount: null, currency: "AED" };
    case "chips":
    case "strings":
    case "dates":
    case "gallery":
      return [];
    default:
      return "";
  }
}

export function defaultsForFields(fields = []) {
  const out = {};
  fields.forEach((f) => {
    out[f.name] = defaultValue(f);
  });
  return out;
}

/** A new repeater item: defaults for every field plus a stable id (React key, drag identity). */
export function newListItem(field) {
  return { id: uid("item"), ...defaultsForFields(field.fields) };
}

export function newSection(type, sectionSchema) {
  return { id: uid(type), type, enabled: true, data: defaultsForFields(sectionSchema?.fields) };
}

/** Deep copy of an item/group with fresh ids for it and every nested list item. */
export function cloneWithNewIds(field, value) {
  const copy = clone(value);
  const walk = (fields, obj) => {
    fields.forEach((f) => {
      if (f.type === "group" && obj?.[f.name]) walk(f.fields, obj[f.name]);
      if (f.type === "list" && Array.isArray(obj?.[f.name])) {
        obj[f.name] = obj[f.name].map((item) => {
          const next = { ...item, id: uid("item") };
          walk(f.fields, next);
          return next;
        });
      }
    });
  };
  copy.id = uid("item");
  walk(field.fields, copy);
  return copy;
}

/** Make sure every repeater item carries an id (older payloads may not) and every field has a value of the right shape. Pure; returns a new tree. */
export function withIds(fields = [], data) {
  const src = data && typeof data === "object" ? data : {};
  const out = { ...src };
  fields.forEach((f) => {
    const v = src[f.name];
    if (f.type === "list") {
      out[f.name] = (Array.isArray(v) ? v : []).map((item) => ({ ...withIds(f.fields, item), id: item?.id || uid("item") }));
    } else if (f.type === "group") {
      out[f.name] = withIds(f.fields, v);
    } else if (v === undefined) {
      out[f.name] = defaultValue(f);
    }
  });
  return out;
}

export function normalizeValue(kind, schema, sectionSchemas, raw) {
  if (kind === "page") {
    const sections = Array.isArray(raw) ? raw : [];
    return sections.map((s) => ({
      id: s.id || uid(s.type),
      type: s.type,
      enabled: s.enabled !== false,
      data: withIds(sectionSchemas?.[s.type]?.fields, s.data),
    }));
  }
  return withIds(schema?.fields, raw);
}

/** Pull the editable value out of a draft/published object from the API (`{ sections }` or `{ data }`). */
export function extractValue(kind, source) {
  if (!source) return null;
  const body = source.payload && typeof source.payload === "object" ? source.payload : source;
  if (kind === "page") return Array.isArray(body.sections) ? body.sections : null;
  return body.data && typeof body.data === "object" ? body.data : null;
}

/** Normalised view of GET /admin/content/:key. Draft falls back to published. */
export function readDocument(res) {
  const schema = res?.schema || { key: res?.key, label: res?.key, kind: res?.data ? "global" : "page" };
  const kind = schema.kind === "global" ? "global" : "page";
  const sectionSchemas = res?.sectionSchemas || {};
  const hasDraft = typeof res?.hasDraft === "boolean" ? res.hasDraft : !!res?.draft && extractValue(kind, res.draft) !== null;
  const draftValue = extractValue(kind, res?.draft);
  const publishedRaw = extractValue(kind, res?.published);
  const draftRaw = hasDraft ? draftValue : null;
  const published = publishedRaw === null ? null : normalizeValue(kind, schema, sectionSchemas, publishedRaw);
  const current = normalizeValue(kind, schema, sectionSchemas, draftRaw ?? publishedRaw ?? (kind === "page" ? [] : {}));
  return {
    key: schema.key || res?.key,
    schema,
    kind,
    sectionSchemas,
    value: current,
    published,
    hasDraft,
    version: res?.version ?? res?.published?.version ?? 0,
    draftRevision: res?.draftRevision ?? res?.draft?.draftRevision ?? null,
    hasDraft,
    status: res?.status || (hasDraft ? "draft-changes" : published ? "published" : "never-published"),
    previewPath: res?.previewPath || schema.previewPath || "/",
    draftUpdatedAt: res?.draftUpdatedAt || res?.draft?.draftUpdatedAt || res?.draft?.updatedAt || null,
    draftUpdatedBy: res?.draftUpdatedBy || res?.draft?.draftUpdatedBy || null,
    publishedAt: res?.publishedAt || res?.published?.publishedAt || null,
    publishedBy: res?.publishedBy || res?.published?.publishedBy || null,
  };
}

/** Body for PUT .../draft. */
export const toBody = (kind, value) => (kind === "page" ? { sections: value } : { data: value });

/* ------------------------------------------------------------------ links, urls, media */

/** Relative path (/...) or https only. http, javascript:, data:, protocol-relative (//host) are rejected. */
export function isSafeHref(href) {
  const h = String(href || "").trim();
  if (!h) return false;
  if (/[\u0000-\u001f\s]/.test(h)) return false;
  if (h.startsWith("//")) return false;
  if (h.startsWith("/") || h.startsWith("#")) return true;
  try {
    return new URL(h).protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidImageUrl(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  if (u.startsWith("/images/") || u.startsWith("/api/v1/media/images/")) return !/[\u0000-\u001f\s]/.test(u) && !u.includes("..");
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, "");
/** Media served by the API is relative to the API origin; /images/... belongs to the site itself. */
export function resolveMediaUrl(url) {
  const u = String(url || "");
  if (u.startsWith("/api/")) return `${API_ORIGIN}${u}`;
  return u;
}

export const UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export function checkUpload(file) {
  if (!file) return "Choose an image file.";
  if (!UPLOAD_TYPES.includes(file.type)) return "Only PNG, JPEG, WebP or AVIF images can be uploaded (SVG is not allowed).";
  if (file.size > UPLOAD_MAX_BYTES) return `This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`;
  return "";
}

export const UPLOAD_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
export const UPLOAD_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function checkVideoUpload(file) {
  if (!file) return "Choose a video file.";
  if (!UPLOAD_VIDEO_TYPES.includes(file.type) && !/\.(mp4|webm|mov|ogg)$/i.test(file.name)) {
    return "Only MP4, WebM, MOV or OGG video clips can be uploaded.";
  }
  if (file.size > UPLOAD_VIDEO_MAX_BYTES) {
    return `This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 50 MB.`;
  }
  return "";
}

export const formatBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/* ------------------------------------------------------------------ markdown subset (bold, italic, links, bullets, line breaks) */

export function parseInline(src) {
  const out = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  while (i < src.length) {
    if (src.startsWith("**", i)) {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "bold", c: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (src[i] === "*" && src[i + 1] !== "*" && src[i + 1] !== " ") {
      const end = src.indexOf("*", i + 1);
      if (end > i + 1 && src[end - 1] !== " ") {
        flush();
        out.push({ t: "italic", c: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (src[i] === "[") {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(src.slice(i));
      if (m) {
        flush();
        out.push({ t: "link", href: m[2], c: parseInline(m[1]) });
        i += m[0].length;
        continue;
      }
    }
    buf += src[i];
    i += 1;
  }
  flush();
  return out;
}

/** Blocks: { type: "p", lines: Token[][] } and { type: "ul", items: Token[][] }. */
export function parseMarkdown(text) {
  const blocks = [];
  let para = null;
  let list = null;
  const close = () => {
    para = null;
    list = null;
  };
  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((line) => {
      const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
      if (bullet) {
        if (!list) {
          list = { type: "ul", items: [] };
          blocks.push(list);
          para = null;
        }
        list.items.push(parseInline(bullet[1]));
      } else if (!line.trim()) {
        close();
      } else {
        if (!para) {
          para = { type: "p", lines: [] };
          blocks.push(para);
          list = null;
        }
        para.lines.push(parseInline(line));
      }
    });
  return blocks;
}

/** Plain-text rendering of markdown (for summaries and diffs). */
export function stripMarkdown(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

/** Toolbar ops. Each takes the textarea value + selection and returns { value, start, end } (the new selection). */
export function wrapInline(value, start, end, mark) {
  const before = value.slice(0, start);
  const sel = value.slice(start, end);
  const after = value.slice(end);
  if (sel && before.endsWith(mark) && after.startsWith(mark)) {
    return { value: before.slice(0, -mark.length) + sel + after.slice(mark.length), start: start - mark.length, end: end - mark.length };
  }
  if (sel.length > mark.length * 2 && sel.startsWith(mark) && sel.endsWith(mark)) {
    const inner = sel.slice(mark.length, -mark.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  const text = sel || "text";
  return { value: `${before}${mark}${text}${mark}${after}`, start: start + mark.length, end: start + mark.length + text.length };
}

export function insertLink(value, start, end, href) {
  const sel = value.slice(start, end) || "link text";
  const md = `[${sel}](${href})`;
  return { value: value.slice(0, start) + md + value.slice(end), start: start + 1, end: start + 1 + sel.length };
}

export function toggleBullets(value, start, end) {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  const lines = value.slice(from, to).split("\n");
  const all = lines.every((l) => /^\s*[-*]\s+/.test(l));
  const next = lines.map((l) => (all ? l.replace(/^\s*[-*]\s+/, "") : /^\s*[-*]\s+/.test(l) ? l : `- ${l}`)).join("\n");
  return { value: value.slice(0, from) + next + value.slice(to), start: from, end: from + next.length };
}

/* ------------------------------------------------------------------ client-side validation (the API stays the authority) */

const HEX = /^#[0-9a-f]{6}$/i;
function safeRegex(source) {
  try {
    return new RegExp(source);
  } catch {
    return /.*/;
  }
}

/**
 * Returns { [pathKey]: message } for a value shaped by `fields`. Messages are the same ones the form shows inline.
 * Paths are dot paths with list indexes (`items.2.title`); image/link problems land on `<path>.alt`, `<path>.href`, ...
 */
export function validateFields(fields = [], data, base = [], out = {}) {
  fields.forEach((f) => {
    const path = [...base, f.name];
    const key = pathKey(path);
    const v = data?.[f.name];
    switch (f.type) {
      case "text":
      case "textarea":
      case "richtext": {
        const s = typeof v === "string" ? v : "";
        if (f.required && !s.trim()) out[key] = "This field is required.";
        else if (f.maxLength && s.length > f.maxLength) out[key] = `Keep this under ${f.maxLength} characters (it is ${s.length}).`;
        else if (f.pattern && s.trim() && !safeRegex(f.pattern).test(s.trim())) out[key] = f.patternMessage || "This value has an invalid format.";
        break;
      }
      case "image": {
        const url = v?.url || "";
        if (!url) {
          if (f.required) out[key] = "Choose an image.";
        } else {
          if (!isValidImageUrl(url)) out[`${key}.url`] = "Use an uploaded image, a /images/ path or an https URL.";
        }
        break;
      }
      case "link": {
        const label = String(v?.label || "").trim();
        const href = String(v?.href || "").trim();
        if (!label && !href) {
          if (f.required) out[key] = "Add a label and a link.";
        } else {
          if (!label) out[`${key}.label`] = "Add a label.";
          if (!href) out[`${key}.href`] = "Add a link.";
          else if (!isSafeHref(href)) out[`${key}.href`] = "Use a path starting with / or a full https:// address.";
        }
        break;
      }
      case "number": {
        if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) out[key] = "Enter a number.";
        else if (typeof f.min === "number" && Number(v) < f.min) out[key] = `Must be at least ${f.min}.`;
        else if (typeof f.max === "number" && Number(v) > f.max) out[key] = `Must be at most ${f.max}.`;
        break;
      }
      case "select":
        if (f.options && !f.options.some((o) => String(o.value) === String(v))) out[key] = "Choose one of the options.";
        break;
      case "color":
        if (!HEX.test(String(v || ""))) out[key] = "Use a hex colour such as #0f2454.";
        break;
      case "list": {
        const items = Array.isArray(v) ? v : [];
        if (f.min && items.length < f.min) out[key] = `Add at least ${f.min} ${f.min === 1 ? "item" : "items"}.`;
        else if (f.max && items.length > f.max) out[key] = `At most ${f.max} items are allowed.`;
        items.forEach((item, i) => validateFields(f.fields, item, [...path, i], out));
        break;
      }
      case "group":
        validateFields(f.fields, v, path, out);
        break;
      default:
        break;
    }
  });
  return out;
}

/** { [sectionId | "_"]: { [pathKey]: message } } for the whole value. */
export function validateValue(kind, schema, sectionSchemas, value) {
  if (kind === "global") {
    const errs = validateFields(schema?.fields, value);
    return Object.keys(errs).length ? { _: errs } : {};
  }
  const out = {};
  (value || []).forEach((s) => {
    const errs = validateFields(sectionSchemas?.[s.type]?.fields, s.data);
    if (Object.keys(errs).length) out[s.id] = errs;
  });
  return out;
}

export const countErrors = (bySection) => Object.values(bySection || {}).reduce((n, e) => n + Object.keys(e).length, 0);

/** `{path, message}` list out of whatever shape the API used for the 400 body. */
export function extractApiErrors(error) {
  const body = error?.body;
  const candidates = [body?.errors, body?.details, Array.isArray(body?.message) ? body.message : null, error?.details];
  const list = candidates.find((c) => Array.isArray(c) && c.length && typeof c[0] === "object");
  return (list || []).filter((e) => e && typeof e.message === "string").map((e) => ({ path: String(e.path ?? e.field ?? ""), message: e.message }));
}

/**
 * Map API `{path, message}` errors onto sections/fields. Accepts `sections[2].data.title`, `sections.2.data.items.1.title`,
 * `sections.<id>.data.title`, `data.title` and `title`. Anything that cannot be placed lands in `general`.
 */
export function mapApiErrors(list, kind, value) {
  const bySection = {};
  const general = [];
  (list || []).forEach(({ path, message }) => {
    const tokens = String(path || "")
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);
    let sectionId = "_";
    let rest = tokens;
    if (kind === "page") {
      if (tokens[0] === "sections" && tokens.length > 1) {
        const ref = tokens[1];
        const section = /^\d+$/.test(ref) ? value?.[Number(ref)] : value?.find((s) => s.id === ref);
        if (!section) {
          general.push({ path, message });
          return;
        }
        sectionId = section.id;
        rest = tokens.slice(2);
      } else {
        general.push({ path, message });
        return;
      }
    }
    if (rest[0] === "data") rest = rest.slice(1);
    const key = rest.join(".");
    if (!key && kind === "page") {
      general.push({ path: sectionId, message });
      return;
    }
    bySection[sectionId] = bySection[sectionId] || {};
    bySection[sectionId][key] = bySection[sectionId][key] ? `${bySection[sectionId][key]} ${message}` : message;
  });
  return { bySection, general };
}

/* ------------------------------------------------------------------ diff (draft vs published) */

function short(text, n = 90) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Human summary of one value for diff lines and revision views. */
export function displayValue(field, v) {
  if (v === null || v === undefined || v === "") return "(empty)";
  switch (field.type) {
    case "image":
      return v.url ? `${v.url.split("/").pop()}${v.alt ? ` · alt "${short(v.alt, 40)}"` : ""}` : "(no image)";
    case "link":
      return v.label || v.href ? `${short(v.label, 40)} → ${v.href || "(no link)"}` : "(empty)";
    case "toggle":
      return v ? "On" : "Off";
    case "select":
      return field.options?.find((o) => String(o.value) === String(v))?.label || String(v);
    case "richtext":
      return short(stripMarkdown(v));
    case "list":
      return `${(v || []).length} ${(v || []).length === 1 ? "item" : "items"}`;
    case "group":
      return "(group)";
    default:
      return short(v);
  }
}

function diffFields(fields, a, b, trail, sectionLabel, out) {
  fields.forEach((f) => {
    const av = a?.[f.name];
    const bv = b?.[f.name];
    if (sig(av) === sig(bv)) return;
    const here = [...trail, f.label || f.name];
    if (f.type === "group") {
      diffFields(f.fields, av, bv, here, sectionLabel, out);
    } else if (f.type === "list") {
      const aItems = Array.isArray(av) ? av : [];
      const bItems = Array.isArray(bv) ? bv : [];
      const aById = new Map(aItems.map((item) => [item.id, item]));
      const bById = new Map(bItems.map((item) => [item.id, item]));
      const noun = f.itemLabel || "Item";
      bItems.forEach((item, i) => {
        const label = `${noun} ${i + 1}`;
        if (!aById.has(item.id)) out.push({ section: sectionLabel, label: [...here, label].join(" › "), kind: "added", to: "New item" });
        else diffFields(f.fields, aById.get(item.id), item, [...here, label], sectionLabel, out);
      });
      aItems.forEach((item, i) => {
        if (!bById.has(item.id)) out.push({ section: sectionLabel, label: [...here, `${noun} ${i + 1}`].join(" › "), kind: "removed", from: "Item removed" });
      });
      const common = (list) => list.filter((it) => aById.has(it.id) && bById.has(it.id)).map((it) => it.id);
      if (sig(common(aItems)) !== sig(common(bItems))) out.push({ section: sectionLabel, label: here.join(" › "), kind: "changed", from: "Previous order", to: "Items reordered" });
    } else {
      out.push({
        section: sectionLabel,
        label: here.join(" › "),
        kind: av === undefined || av === "" || av === null ? "added" : bv === undefined || bv === "" || bv === null ? "removed" : "changed",
        from: displayValue(f, av),
        to: displayValue(f, bv),
      });
    }
  });
}

/**
 * Field-level change list between two values (published -> draft). `before` null = never published.
 * Items: { section, label, kind: "added"|"removed"|"changed", from?, to? }.
 */
export function diffValues(doc, before, after) {
  const out = [];
  if (doc.kind === "global") {
    diffFields(doc.schema?.fields || [], before || {}, after || {}, [], null, out);
    return out;
  }
  const a = before || [];
  const b = after || [];
  const aById = new Map(a.map((s) => [s.id, s]));
  const bById = new Map(b.map((s) => [s.id, s]));
  const labelOf = (s) => doc.sectionSchemas?.[s.type]?.label || humanize(s.type);
  b.forEach((s) => {
    const label = labelOf(s);
    const prev = aById.get(s.id);
    if (!prev) {
      out.push({ section: label, label: `Section "${label}"`, kind: "added", to: "New section added" });
      return;
    }
    if (prev.enabled !== s.enabled) out.push({ section: label, label: "Visibility", kind: "changed", from: prev.enabled ? "Shown" : "Hidden", to: s.enabled ? "Shown" : "Hidden" });
    diffFields(doc.sectionSchemas?.[s.type]?.fields || [], prev.data, s.data, [], label, out);
  });
  a.forEach((s) => {
    if (!bById.has(s.id)) out.push({ section: labelOf(s), label: `Section "${labelOf(s)}"`, kind: "removed", from: "Section removed" });
  });
  const common = (list, other) => list.filter((s) => other.has(s.id)).map((s) => s.id);
  if (sig(common(a, bById)) !== sig(common(b, aById))) out.push({ section: null, label: "Section order", kind: "changed", from: "Previous order", to: "Sections reordered" });
  return out;
}

/* ------------------------------------------------------------------ local autosave (unsaved edits, keyed by document + draft revision) */

const LS_PREFIX = "adm-cms:";
const localKey = (key, rev) => `${LS_PREFIX}${key}:${rev ?? 0}`;

export function loadLocal(key, rev) {
  try {
    const raw = window.localStorage.getItem(localKey(key, rev));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.value !== undefined ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLocal(key, rev, value) {
  try {
    window.localStorage.setItem(localKey(key, rev), JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage full or unavailable: autosave is best effort */
  }
}

/** Drops every stored copy for the document (all revisions). */
export function clearLocal(key) {
  try {
    const prefix = `${LS_PREFIX}${key}:`;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ API */

const enc = encodeURIComponent;
export const listOf = (res) => (Array.isArray(res) ? res : res?.items || res?.revisions || res?.documents || []);

/** XHR upload so the dialog can show real progress (fetch has no upload progress events). */
function uploadMedia(getAccessToken, file, { onProgress, signal, endpoint = "/admin/media" } = {}) {
  return new Promise((resolve, reject) => {
    getAccessToken().then((token) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      xhr.open("POST", `${API_BASE_URL}${endpoint}`);
      xhr.setRequestHeader("Accept", "application/json");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new AdminApiError("Could not reach the server. Check your connection and try again.", { status: 0 }));
      xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* not JSON */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else {
          const raw = data?.message;
          const message = Array.isArray(raw) ? raw.join(", ") : raw;
          reject(new AdminApiError(message || `Upload failed (${xhr.status})`, { status: xhr.status, code: data?.code || null, body: data }));
        }
      };
      signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      xhr.send(form);
    }, reject);
  });
}

/** Content API bound to the Clerk session: `const cms = useCmsApi(); await cms.get("page.home")`. */
export function useCmsApi() {
  const api = useAdminApi();
  const { getAccessToken } = useApp();
  return useMemo(
    () => ({
      list: (options) => api.get("/admin/content", options),
      get: (key, options) => api.get(`/admin/content/${enc(key)}`, options),
      saveDraft: (key, kind, value, meta = {}) =>
        api.put(`/admin/content/${enc(key)}/draft`, {
          ...toBody(kind, value),
          ...(meta.version !== undefined && meta.version !== null ? { baseVersion: meta.version } : {}),
          ...(meta.draftRevision !== undefined && meta.draftRevision !== null ? { draftRevision: meta.draftRevision } : {}),
        }),
      publish: (key, note, draftRevision) =>
        api.post(`/admin/content/${enc(key)}/publish`, { ...(note ? { note } : {}), ...(draftRevision !== undefined && draftRevision !== null ? { draftRevision } : {}) }),
      discard: (key) => api.post(`/admin/content/${enc(key)}/discard`),
      revisions: (key, options) => api.get(`/admin/content/${enc(key)}/revisions`, options),
      revision: (key, version, options) => api.get(`/admin/content/${enc(key)}/revisions/${enc(version)}`, options),
      restore: (key, version) => api.post(`/admin/content/${enc(key)}/revisions/${enc(version)}/restore`),
      previewToken: (key) => api.post(`/admin/content/${enc(key)}/preview-token`),
      mediaList: (query, options) => api.get("/admin/media", { ...options, query }),
      upload: (file, options) => uploadMedia(getAccessToken, file, options),
      uploadVideo: (file, options) => uploadMedia(getAccessToken, file, { ...options, endpoint: "/admin/media/video" }),
    }),
    [api, getAccessToken]
  );
}
