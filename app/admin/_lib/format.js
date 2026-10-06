// SSR-safe formatting: fixed locale and time zone so server and client render the same text (no hydration mismatch).
const LOCALE = "en-GB";
const TZ = "Asia/Dubai";

const dateTime = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const dateOnly = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const timeOnly = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const number = new Intl.NumberFormat(LOCALE);

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTime.format(date).replace(",", "") : "-";
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateOnly.format(date) : "-";
}

export function formatTime(value) {
  const date = toDate(value);
  return date ? timeOnly.format(date) : "-";
}

export function formatNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? number.format(value) : "-";
}

export function formatMoney(value, currency = "AED") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${currency} ${new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

const amount = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Amount without the currency code ("1,234.00"). */
export function formatAmount(value) {
  return typeof value === "number" && Number.isFinite(value) ? amount.format(value) : "-";
}

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
/** "YYYY-MM-DD" of an instant in the admin time zone (Asia/Dubai). Call from event handlers, not during render. */
export function dayKey(value = new Date()) {
  const date = toDate(value);
  return date ? dayKeyFmt.format(date) : "";
}
/** Adds calendar days to a "YYYY-MM-DD" key (no time zone drift). */
export function addDaysKey(key, days) {
  const [y, m, d] = String(key).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
/** "2026-10-05" -> "05 Oct 2026". */
export function formatDayKey(key) {
  if (!key) return "";
  const [y, m, d] = String(key).slice(0, 10).split("-").map(Number);
  if (!y) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}

/** "5 min ago" style text. Call only after mount (depends on the current time) or accept a small SSR drift via suppressHydrationWarning. */
export function formatRelative(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return "-";
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(date);
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** "booking.cancel" -> "Booking cancel"; "super_admin" -> "Super admin" */
export function humanize(value) {
  const text = String(value || "").replace(/[._-]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}
