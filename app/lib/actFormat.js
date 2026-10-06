// Formatting helpers for activities and checkout. Everything date-related uses an explicit time zone
// (UTC for calendar days, Asia/Dubai for timestamps) so the server and the browser always print the same text.

import { formatPrice } from "./api";

const TZ = "Asia/Dubai";
const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayLong = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dayShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const stamp = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const todayParts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });

const asDate = (iso) => new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
const valid = (d) => !Number.isNaN(d.getTime());

export const money = (m) => (m && m.amount != null ? formatPrice(m.amount, m.currency || "AED") : null);

export const formatDay = (iso) => (iso && valid(asDate(iso)) ? day.format(asDate(iso)) : "");
export const formatDayLong = (iso) => (iso && valid(asDate(iso)) ? dayLong.format(asDate(iso)) : "");
export const formatDayShort = (iso) => (iso && valid(asDate(iso)) ? dayShort.format(asDate(iso)) : "");
export const formatMonthYear = (ym) => (valid(new Date(`${ym}-01T00:00:00Z`)) ? monthYear.format(new Date(`${ym}-01T00:00:00Z`)) : String(ym));

/** ISO timestamp -> "5 Oct 2026, 10:30" in UAE time (callers append the zone name in copy). */
export function formatStamp(iso) {
  const d = iso ? new Date(iso) : null;
  return d && valid(d) ? stamp.format(d).replace(",", " at") : "";
}

/** Today's calendar date in the UAE (browser only; never call during render on the server). */
export const dubaiToday = () => todayParts.format(new Date());

export const toIso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const monthOf = (iso) => String(iso).slice(0, 7);

export function addDays(iso, n) {
  const d = asDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(ym, n) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const weekdayOf = (iso) => asDate(iso).getUTCDay();
export const daysInMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function paxLabel(adults, children) {
  return [plural(adults, "adult"), children > 0 ? plural(children, "child", "children") : null].filter(Boolean).join(", ");
}

export const TRANSFER_LABEL = { sharing: "Shared transfer", private: "Private transfer", none: "No transfer" };

/** "about $79" style indicative equivalent; empty when the charge currency is already the display currency. */
export function aboutText(pricing) {
  const d = pricing?.display;
  if (!d?.total || !d.currency || d.currency === (pricing.currency || "AED")) return "";
  return `about ${money(d.total)}`;
}

export const DUBAI_TZ = TZ;

/** Headline price for an activity: sale price wins (list price becomes the struck-through "was"); falls back to the cheapest option. */
export function priceInfo(activity) {
  const optionPrices = (activity.options || []).map((o) => o.adultPrice).filter((p) => p && p.amount != null);
  const cheapest = optionPrices.sort((a, b) => a.amount - b.amount)[0] || null;
  const current = activity.salePrice || activity.price || cheapest;
  if (!current) return null;
  const was = activity.salePrice && activity.price && activity.price.amount > activity.salePrice.amount ? activity.price : null;
  return { current, was, save: was ? Math.round((1 - current.amount / was.amount) * 100) : 0 };
}
