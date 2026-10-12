"use client";

/*
 * Data layer of the catalog editor (/admin/catalog/<type>): turns an API record into form state and back, validates the form with
 * the same limits as the API DTOs and maps API validation messages onto fields.
 *
 * Form state is a flat object keyed by field name (see ../_config). Differences between form and API shape:
 *   - repeater items and gallery images carry a client-only `id` (React keys, drag identity); it never reaches the API;
 *   - list fields with `autoNumber: "day"` get their `day` from the item position;
 *   - money is { amount: number | null, currency }, sent as null when the amount is empty;
 *   - event session times are edited as "YYYY-MM-DDTHH:mm" in Dubai time (the admin time zone) and sent as ISO UTC;
 *   - departure dates are edited and sent as "YYYY-MM-DD".
 */

import { dayKey } from "../../_lib/format";
import { uid } from "../../_lib/cms";
import { IMAGE_URL_PATTERN } from "../_config/shared";

const DUBAI_OFFSET = "+04:00"; // Asia/Dubai has no daylight saving time

export const allFields = (config) => config.sections.flatMap((s) => s.fields);
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
export { same };

/* ------------------------------------------------------------------ date helpers */

const dubaiParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** ISO instant -> "YYYY-MM-DDTHH:mm" in Dubai time ("" when invalid). */
export function isoToDubaiLocal(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(dubaiParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "YYYY-MM-DDTHH:mm" (Dubai time) -> ISO UTC string, or "" when incomplete. */
export function dubaiLocalToIso(local) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(local || ""))) return "";
  const d = new Date(`${local}:00${DUBAI_OFFSET}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

const isDayKey = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());

/* ------------------------------------------------------------------ defaults and hydration */

function blank(field, { initial = true } = {}) {
  switch (field.type) {
    case "toggle":
      return false;
    case "select":
      return field.default ?? "";
    case "number":
      return null;
    case "money":
      return { amount: null, currency: "AED" };
    case "chips":
    case "strings":
    case "dates":
    case "gallery":
      return [];
    case "video":
      return { url: "" };
    case "group":
      return Object.fromEntries(field.fields.map((f) => [f.name, blank(f)]));
    case "list":
      return initial && field.min ? Array.from({ length: field.min }, () => blankItem(field)) : [];
    default:
      return "";
  }
}

export function blankItem(field) {
  return { id: uid("item"), ...Object.fromEntries(field.fields.map((f) => [f.name, f.type === "select" ? f.options?.[0]?.value ?? "" : blank(f, { initial: false })])) };
}

/** Empty form for "Add new". New items start unpublished so nothing goes live by accident. */
export function blankForm(config) {
  return Object.fromEntries(allFields(config).map((f) => [f.name, blank(f)]));
}

function hydrate(field, raw) {
  switch (field.type) {
    case "text":
    case "textarea":
    case "imageUrl":
      return typeof raw === "string" ? raw : "";
    case "number":
      return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    case "select":
      return raw ?? field.default ?? "";
    case "toggle":
      return !!raw;
    case "money":
      return raw && typeof raw.amount === "number" ? { amount: raw.amount, currency: String(raw.currency || "AED").toUpperCase() } : { amount: null, currency: "AED" };
    case "chips":
    case "strings":
      return Array.isArray(raw) ? raw.map((v) => String(v ?? "")) : [];
    case "dates":
      return [...new Set((Array.isArray(raw) ? raw : []).map((v) => String(v).slice(0, 10)).filter(isDayKey))].sort();
    case "datetime":
      return raw ? isoToDubaiLocal(raw) : "";
    case "gallery":
      return (Array.isArray(raw) ? raw : []).map((img) => ({ id: uid("img"), url: String(img?.url || ""), alt: String(img?.alt || "") }));
    case "video":
      return { url: typeof raw === "string" ? raw : String(raw?.url || "") };
    case "group": {
      const src = raw && typeof raw === "object" ? raw : {};
      return Object.fromEntries(field.fields.map((f) => [f.name, hydrate(f, src[f.name])]));
    }
    case "list": {
      let items = Array.isArray(raw) ? raw : [];
      if (field.autoNumber) items = [...items].sort((a, b) => (a?.[field.autoNumber] ?? 0) - (b?.[field.autoNumber] ?? 0));
      return items.map((item) => ({ id: uid("item"), ...Object.fromEntries(field.fields.map((f) => [f.name, hydrate(f, item?.[f.name])])) }));
    }
    default:
      return raw ?? "";
  }
}

/** API record (GET /<type>/admin/:id) -> form state. */
export function toForm(config, record) {
  return Object.fromEntries(allFields(config).map((f) => [f.name, hydrate(f, record?.[f.name])]));
}

/* ------------------------------------------------------------------ form -> API payload */

const trim = (v) => String(v ?? "").trim();

function emit(field, v, ctx) {
  switch (field.type) {
    case "text":
    case "textarea":
    case "imageUrl": {
      const s = trim(v);
      if (!s && (field.omitEmpty || (!field.required && !ctx.keepEmpty))) return undefined;
      return s;
    }
    case "number":
      if (v === null || v === undefined || v === "") return field.nullable ? (ctx.create ? undefined : null) : undefined;
      return Number(v);
    case "select":
      return v === "" ? undefined : v;
    case "toggle":
      return !!v;
    case "money": {
      if (v?.amount === null || v?.amount === undefined || v?.amount === "") return ctx.create ? undefined : null;
      return { amount: Math.round(Number(v.amount) * 100) / 100, currency: trim(v.currency).toUpperCase() };
    }
    case "chips":
    case "strings":
      return (Array.isArray(v) ? v : []).map(trim).filter(Boolean);
    case "dates":
      return [...new Set((Array.isArray(v) ? v : []).filter(isDayKey))].sort();
    case "datetime":
      return dubaiLocalToIso(v) || undefined;
    case "gallery":
      return (Array.isArray(v) ? v : []).map((img) => ({ url: trim(img.url), alt: trim(img.alt) }));
    case "video": {
      const url = trim(typeof v === "string" ? v : v?.url);
      return url ? { url } : ctx.create ? undefined : null;
    }
    case "group": {
      const out = {};
      field.fields.forEach((f) => {
        const e = emit(f, v?.[f.name], { ...ctx, keepEmpty: false, create: true });
        if (e !== undefined) out[f.name] = e;
      });
      if (field.optionalGroup && field.fields.every((f) => v?.[f.name] === null || v?.[f.name] === undefined || v?.[f.name] === "")) return ctx.create ? undefined : null;
      return out;
    }
    case "list":
      return (Array.isArray(v) ? v : []).map((item, i) => {
        const out = field.autoNumber ? { [field.autoNumber]: i + 1 } : {};
        field.fields.forEach((f) => {
          const e = emit(f, item?.[f.name], { create: true, keepEmpty: false });
          if (e !== undefined) out[f.name] = e;
        });
        return out;
      });
    default:
      return v;
  }
}

/** Form state -> API body for every field (undefined values are dropped by JSON). `create` omits empty optional values. */
export function toPayload(config, form, { create = false } = {}) {
  const out = {};
  allFields(config).forEach((f) => {
    const e = emit(f, form?.[f.name], { create, keepEmpty: !create });
    if (e !== undefined) out[f.name] = e;
  });
  return out;
}

/** PATCH body: only the fields whose payload differs from what the record had when it was loaded (`published` is always sent). */
export function toPatch(config, form, baseForm, extra = {}) {
  const now = toPayload(config, form);
  const before = toPayload(config, baseForm);
  const patch = {};
  Object.keys(now).forEach((k) => {
    if (!same(now[k], before[k])) patch[k] = now[k];
  });
  return { ...patch, ...extra };
}

/* ------------------------------------------------------------------ validation */

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function check(field, v, key, out, ctx) {
  const set = (message, k = key) => {
    out[k] = out[k] ? out[k] : message;
  };
  switch (field.type) {
    case "text":
    case "textarea": {
      const s = trim(v);
      if (field.required && !s) set("This field is required.");
      else if (field.maxLength && String(v ?? "").length > field.maxLength) set(`Keep this under ${field.maxLength} characters (it is ${String(v).length}).`);
      else if (field.pattern && s && !field.pattern.test(s)) set(field.patternMessage || "This value has an invalid format.");
      break;
    }
    case "imageUrl": {
      const s = trim(v);
      if (!s) {
        if (field.required) set("Choose an image.");
      } else if (!IMAGE_URL_PATTERN.test(s)) set("Use an uploaded image, a /path or an https:// address.");
      else if (s.length > (field.maxLength || 500)) set(`Keep the address under ${field.maxLength || 500} characters.`);
      break;
    }
    case "number": {
      const empty = v === null || v === undefined || v === "";
      if (empty) {
        if (field.required) set("Enter a number.");
      } else if (Number.isNaN(Number(v))) set("Enter a number.");
      else if (field.integer && !Number.isInteger(Number(v))) set("Enter a whole number.");
      else if (typeof field.min === "number" && Number(v) < field.min) set(`Must be at least ${field.min}.`);
      else if (typeof field.max === "number" && Number(v) > field.max) set(`Must be at most ${field.max}.`);
      break;
    }
    case "select":
      if (field.required && !field.options.some((o) => String(o.value) === String(v))) set("Choose an option.");
      break;
    case "money": {
      const amount = v?.amount;
      if (amount === null || amount === undefined || amount === "") {
        if (field.required) set("Enter an amount.", `${key}.amount`);
        break;
      }
      if (Number.isNaN(Number(amount)) || Number(amount) < 0) set("Enter an amount of 0 or more.", `${key}.amount`);
      else if (Math.round(Number(amount) * 100) / 100 !== Number(amount)) set("Use at most two decimal places.", `${key}.amount`);
      if (!/^[A-Za-z]{3}$/.test(trim(v?.currency))) set("Use a 3 letter currency code, for example AED.", `${key}.currency`);
      break;
    }
    case "chips":
    case "strings": {
      const items = Array.isArray(v) ? v : [];
      const filled = items.map(trim).filter(Boolean);
      if (field.min && filled.length < field.min) set(`Add at least ${plural(field.min, "item", "items")}.`);
      else if (field.max && filled.length > field.max) set(`At most ${field.max} items are allowed.`);
      items.forEach((item, i) => {
        if (field.itemMax && String(item).length > field.itemMax) set(`Keep this under ${field.itemMax} characters (it is ${String(item).length}).`, `${key}.${i}`);
      });
      break;
    }
    case "dates": {
      const items = Array.isArray(v) ? v : [];
      const filled = items.filter((d) => d !== "");
      if (field.max && new Set(filled).size > field.max) set(`At most ${field.max} dates are allowed.`);
      items.forEach((d, i) => {
        if (d === "") set("Pick a date or remove this row.", `${key}.${i}`);
        else if (!isDayKey(d)) set("Enter a valid date.", `${key}.${i}`);
        else if (field.noPast && !ctx.skipPast && d < ctx.today) set("This date is in the past.", `${key}.${i}`);
      });
      break;
    }
    case "datetime": {
      if (!v) {
        if (field.required) set("Pick a date and time.");
      } else if (!dubaiLocalToIso(v)) set("Enter a valid date and time.");
      else if (field.noPast && !ctx.skipPast && v.slice(0, 10) < ctx.today) set("This is in the past.");
      break;
    }
    case "gallery": {
      const items = Array.isArray(v) ? v : [];
      if (field.min && items.length < field.min) set(`Add at least ${plural(field.min, "image", "images")}.`);
      else if (field.max && items.length > field.max) set(`At most ${field.max} images are allowed.`);
      items.forEach((img, i) => {
        const url = trim(img.url);
        if (!url) set("Choose an image.", `${key}.${i}.url`);
        else if (!IMAGE_URL_PATTERN.test(url)) set("Use an uploaded image, a /path or an https:// address.", `${key}.${i}.url`);
        const alt = trim(img.alt);
        if (!alt) set("Describe the image (alt text is required).", `${key}.${i}.alt`);
        else if (alt.length > 200) set(`Keep this under 200 characters (it is ${alt.length}).`, `${key}.${i}.alt`);
      });
      break;
    }
    case "video": {
      const url = trim(typeof v === "string" ? v : v?.url);
      if (!url) {
        if (field.required) set("Choose a video.");
      } else if (!/^(https:\/\/|\/videos\/|\/api\/v1\/media\/videos\/)\S+$/.test(url)) {
        set("Use an uploaded video or an https:// address.", `${key}.url`);
      } else if (url.length > (field.maxLength || 500)) {
        set(`Keep the address under ${field.maxLength || 500} characters.`, `${key}.url`);
      }
      break;
    }
    case "group":
      if (field.optionalGroup && field.fields.every((f) => v?.[f.name] === null || v?.[f.name] === undefined || v?.[f.name] === "")) break;
      field.fields.forEach((f) => check(f, v?.[f.name], `${key}.${f.name}`, out, ctx));
      break;
    case "list": {
      const items = Array.isArray(v) ? v : [];
      if (field.min && items.length < field.min) set(`Add at least ${plural(field.min, "item", "items")}.`);
      else if (field.minIfAny && items.length && items.length < field.minIfAny) set(`Add at least ${field.minIfAny} items, or remove them all.`);
      else if (field.max && items.length > field.max) set(`At most ${field.max} items are allowed.`);
      items.forEach((item, i) => field.fields.forEach((f) => check(f, item?.[f.name], `${key}.${i}.${f.name}`, out, ctx)));
      break;
    }
    default:
      break;
  }
}

/**
 * { [pathKey]: message } for the whole form. Dates that cannot be in the past are only checked on fields the user changed
 * (compared with `baseForm`), so an old record with lapsed dates can still be saved without touching them.
 */
export function validateForm(config, form, baseForm) {
  const out = {};
  const today = dayKey();
  allFields(config).forEach((f) => check(f, form?.[f.name], f.name, out, { today, skipPast: !!baseForm && same(form?.[f.name], baseForm[f.name]) }));
  return out;
}

/* ------------------------------------------------------------------ errors by section / from the API */

export const sectionOfKey = (config, key) => {
  const name = String(key).split(".")[0];
  return config.sections.find((s) => s.fields.some((f) => f.name === name))?.id || null;
};

export function errorCountBySection(config, errors) {
  const counts = {};
  Object.keys(errors).forEach((k) => {
    const id = sectionOfKey(config, k);
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}

/** Leaf property names (url, alt, type, ...) that belong to exactly one top-level field: used for messages that omit the full path. */
function leafOwners(config) {
  const owners = new Map();
  const add = (leaf, owner) => owners.set(leaf, owners.has(leaf) && owners.get(leaf) !== owner ? null : owner);
  allFields(config).forEach((f) => {
    if (f.type === "gallery") ["url", "alt"].forEach((l) => add(l, f.name));
    if (f.type === "list" || f.type === "group") f.fields.forEach((s) => add(s.name, f.name));
  });
  return owners;
}

/** API 400/409 -> { fieldErrors: { [pathKey]: message }, general: string[] }. Messages start with the property path ("itinerary.0.title should not be empty"). */
export function mapServerErrors(config, error) {
  const names = new Set(allFields(config).map((f) => f.name));
  const owners = leafOwners(config);
  const raw = Array.isArray(error?.details) ? error.details : error?.body && typeof error.body.message === "string" ? [error.body.message] : [error?.message || "Request failed."];
  const fieldErrors = {};
  const general = [];
  const add = (key, message) => {
    fieldErrors[key] = fieldErrors[key] ? `${fieldErrors[key]} ${message}` : message;
  };
  raw.forEach((entry) => {
    const msg = typeof entry === "string" ? entry : entry?.message || "";
    if (!msg) return;
    const space = msg.indexOf(" ");
    const head = (space > 0 ? msg.slice(0, space) : msg).replace(/\[(\d+)\]/g, ".$1");
    const rest = space > 0 ? msg.slice(space + 1) : msg;
    const first = head.split(".")[0];
    if (/^property$/.test(head)) {
      general.push(msg);
    } else if (names.has(first)) {
      add(head, rest);
    } else if (owners.get(first)) {
      add(owners.get(first), msg);
    } else if (error?.status === 409 && names.has("slug")) {
      add("slug", msg);
    } else general.push(msg);
  });
  return { fieldErrors, general };
}

/* ------------------------------------------------------------------ misc */

export const recordId = (r) => r?.id || r?._id || "";

/** Duplicate: payload of an existing record as a new unpublished item (past dates are dropped, the API rejects them). */
export function duplicatePayload(config, record, slugSuffix) {
  const form = toForm(config, record);
  const today = dayKey();
  allFields(config).forEach((f) => {
    if (f.type === "dates" && f.noPast) form[f.name] = form[f.name].filter((d) => d >= today);
    if (f.type === "list") {
      const dated = f.fields.find((s) => s.type === "datetime" && s.noPast);
      if (dated) form[f.name] = form[f.name].filter((item) => !item[dated.name] || item[dated.name].slice(0, 10) >= today);
    }
  });
  const payload = toPayload(config, form, { create: true });
  const base = String(record.slug || "").slice(0, 80 - slugSuffix.length);
  return { ...payload, title: `${String(payload.title || "").slice(0, 190)} (copy)`, slug: `${base}${slugSuffix}`, published: false };
}

/** Creates an unpublished copy of record `id`; tries "-copy", "-copy-2", "-copy-3" when the slug is taken (409). Resolves with the created record. */
export async function duplicateRecord(api, config, id) {
  const record = await api.get(`/${config.type}/admin/${id}`);
  for (const suffix of ["-copy", "-copy-2", "-copy-3"]) {
    try {
      return await api.post(`/${config.type}`, duplicatePayload(config, record, suffix));
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  }
  throw new Error("Could not find a free slug for the copy. Rename the original slug and try again.");
}
