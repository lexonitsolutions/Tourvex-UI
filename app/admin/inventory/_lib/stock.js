// Shared bits for the stock / inventory screens. The contract lives in Tourvex-API/docs/STOCK_API.md.
import { addDaysKey, formatDayKey } from "../../_lib/format";

export const STOCK_API = "/admin/stock";

/** Item ids look like "activity:burj-khalifa:opt_1" and travel URL-encoded. */
export const itemApiPath = (id) => `${STOCK_API}/items/${encodeURIComponent(id)}`;
export const itemHref = (id) => `/admin/inventory/${encodeURIComponent(id)}`;

/** Route params may arrive encoded or decoded depending on the router; decode at most once and never throw. */
export function decodeId(raw) {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return "";
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export const PRODUCT_TYPES = [
  { value: "activity", label: "Activity", plural: "Activities", path: "/activities" },
  { value: "holiday", label: "Holiday", plural: "Holidays", path: "/holidays" },
  { value: "cruise", label: "Cruise", plural: "Cruises", path: "/cruises" },
  { value: "event", label: "Event", plural: "Events", path: "/events" },
  { value: "yacht", label: "Yacht", plural: "Yachts" },
  { value: "transfer", label: "Transfer", plural: "Transfers" },
  { value: "hotel", label: "Hotel", plural: "Hotels" },
  { value: "custom", label: "Custom", plural: "Custom" },
];
export const MANUAL_TYPES = PRODUCT_TYPES.filter((t) => ["yacht", "transfer", "hotel", "custom"].includes(t.value));
export const typeLabel = (type) => PRODUCT_TYPES.find((t) => t.value === type)?.label || type || "-";

/** Public site page of a catalog-backed item (null for manual items). */
export function productHref(item) {
  const path = PRODUCT_TYPES.find((t) => t.value === item?.productType)?.path;
  return path && item?.productRef ? `${path}/${encodeURIComponent(item.productRef)}` : null;
}

/** Row / day statuses. `tone` maps to StatusBadge tones. */
export const STATUS = {
  unlimited: { label: "Unlimited", tone: "info" },
  ok: { label: "OK", tone: "success" },
  low: { label: "Low stock", tone: "warning" },
  sold_out: { label: "Sold out", tone: "danger" },
  closed: { label: "Closed", tone: "neutral" },
  non_operational: { label: "Not operating", tone: "neutral" },
  past: { label: "Past", tone: "neutral" },
};
export const ITEM_STATUS_FILTER = [
  { value: "low", label: "Low stock" },
  { value: "sold_out", label: "Sold out" },
  { value: "closed", label: "Closed" },
  { value: "ok", label: "OK" },
  { value: "unlimited", label: "Unlimited" },
];
export const SORTS = [
  { value: "attention", label: "Attention first" },
  { value: "title", label: "Title" },
  { value: "type", label: "Type" },
  { value: "available", label: "Least available" },
];

export const MOVEMENT_TYPES = {
  set_default: "Default capacity set",
  set_day: "Day capacity set",
  adjust_add: "Stock added",
  adjust_remove: "Stock removed",
  close: "Date closed",
  open: "Date reopened",
  stop_sale: "Sale stopped",
  resume_sale: "Sale resumed",
  restock_auto: "Returned to stock (automatic)",
  restock_manual: "Returned to stock (manual)",
  booking_confirmed: "Booking confirmed",
  booking_cancelled: "Booking cancelled",
  alert_low: "Low stock alert",
  alert_sold_out: "Sold out alert",
  create_item: "Item created",
};
export const movementLabel = (type) => MOVEMENT_TYPES[type] || String(type || "").replace(/_/g, " ");
export const MOVEMENT_TONE = {
  adjust_add: "success", restock_auto: "success", restock_manual: "success", resume_sale: "success", open: "success",
  adjust_remove: "warning", close: "warning", stop_sale: "warning", alert_low: "warning",
  booking_cancelled: "danger", alert_sold_out: "danger",
  booking_confirmed: "info", set_default: "info", set_day: "info", create_item: "info",
};

export const WEEKDAYS = [
  { value: 1, label: "Mon" }, { value: 2, label: "Tue" }, { value: 3, label: "Wed" }, { value: 4, label: "Thu" },
  { value: 5, label: "Fri" }, { value: 6, label: "Sat" }, { value: 0, label: "Sun" },
];

export const MAX_DAYS = 93;

/* ------------------------------------------------------------------ numbers */
export const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-GB") : "-");
/** "12" or "Unlimited" for a capacity / availability value that may be null. */
export const capText = (value) => (value === null || value === undefined ? "Unlimited" : num(value));
/** Parses a non-negative whole number typed in a text field. Returns { value, error }. Empty -> value null. */
export function parseCount(text, { required = false, label = "This value" } = {}) {
  const t = String(text ?? "").trim();
  if (!t) return required ? { value: null, error: `${label} is required.` } : { value: null, error: "" };
  if (!/^\d+$/.test(t)) return { value: null, error: `${label} must be a whole number, 0 or more.` };
  const n = Number(t);
  if (n > 1_000_000) return { value: null, error: `${label} is too large.` };
  return { value: n, error: "" };
}

/* ------------------------------------------------------------------ dates (calendar days "YYYY-MM-DD", no time zone drift) */
export const monthOf = (key) => String(key).slice(0, 7);
export const monthStart = (ym) => `${ym}-01`;
export function monthEnd(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export function addMonths(ym, n) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
export function monthTitle(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
/** 0 = Monday ... 6 = Sunday for the first day of a month (calendar grid offset). */
export function mondayOffset(ym) {
  const [y, m] = ym.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
}
export const weekdayOf = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};
export function daysBetween(from, to) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000) + 1;
}
/** Number of calendar days in [from, to] that fall on one of the weekdays (all days when the list is empty). */
export function countDays(from, to, weekdays) {
  if (!from || !to || to < from) return 0;
  const total = daysBetween(from, to);
  if (!weekdays?.length || weekdays.length === 7) return total;
  let n = 0;
  for (let i = 0; i < total; i += 1) if (weekdays.includes(weekdayOf(addDaysKey(from, i)))) n += 1;
  return n;
}
export const dayNumber = (key) => Number(String(key).slice(8, 10));

/* ------------------------------------------------------------------ errors */
/**
 * Human text for a failed stock call. STOCK_BELOW_COMMITTED carries the date and the committed units (read from the error body, whatever
 * level the API puts them on); STOCK_UNAVAILABLE carries `available`.
 */
export function stockErrorText(error) {
  if (!error) return "";
  const body = error.body || {};
  const pick = (...keys) => {
    for (const k of keys) {
      for (const src of [body, body.details, body.meta, body.data]) {
        if (src && typeof src === "object" && src[k] !== undefined && src[k] !== null) return src[k];
      }
    }
    return undefined;
  };
  if (error.code === "STOCK_BELOW_COMMITTED") {
    const date = pick("date", "firstDate", "offendingDate");
    const committed = pick("committed", "committedUnits", "used", "sold_plus_held");
    const parts = [];
    if (date) parts.push(`on ${formatDayKey(String(date).slice(0, 10))}`);
    if (committed !== undefined) parts.push(`${committed} unit${Number(committed) === 1 ? " is" : "s are"} already sold or held`);
    return `Capacity cannot go below what is already committed${parts.length ? ` (${parts.join(": ")})` : ""}. ${parts.length ? "" : error.message || ""}`.trim();
  }
  if (error.code === "STOCK_UNAVAILABLE") {
    const available = pick("available");
    return available !== undefined ? `Not enough stock for that date. Only ${available} left.` : "Not enough stock for that date.";
  }
  if (error.status === 409 && !error.code) return error.message || "This conflicts with the current stock.";
  return error.message || "Something went wrong.";
}

/* ------------------------------------------------------------------ bookings */
/**
 * Stock block of an admin booking view (GET /admin/bookings/:id). Wired to `booking.stock` = { returnable, state?, held?, used?, returned? }.
 * The backend field names are not final: every read goes through here so only this function changes.
 */
export function bookingStock(booking) {
  const s = booking?.stock;
  if (!s || typeof s !== "object") return null;
  return {
    returnable: s.returnable === true,
    held: Number(s.held ?? 0) || 0,
    used: Number(s.used ?? 0) || 0,
    returned: Number(s.returned ?? 0) || 0,
    state: s.state || null,
    released: s.released ?? booking.stockReleased ?? null,
  };
}

/** The daily capacity that really applies: a saved default, else the product's own setup, else null (unlimited). */
export const effectiveDefault = (item) => (item?.defaultCapacity ?? item?.inheritedCapacity ?? null);
