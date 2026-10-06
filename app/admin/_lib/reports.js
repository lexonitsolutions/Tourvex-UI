// Shared helpers for the dashboard and report pages (AED only; the API already sums in AED).
const LOCALE = "en-GB";
const int = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });

export const fmtInt = (v) => (typeof v === "number" && Number.isFinite(v) ? int.format(Math.round(v)) : "-");
/** "AED 12,345" for cards (whole dirhams), compact above one million. */
export const fmtAed = (v) => (typeof v === "number" && Number.isFinite(v) ? (Math.abs(v) >= 1_000_000 ? `AED ${compact.format(v)}` : `AED ${int.format(Math.round(v))}`) : "-");
export const fmtAed2 = (v) => (typeof v === "number" && Number.isFinite(v) ? `AED ${dec.format(v)}` : "-");
export const fmtPct = (v) => (typeof v === "number" && Number.isFinite(v) ? `${v}%` : "-");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-05" -> "05 Oct" (no Date object: no time-zone surprises). */
export const dayLabel = (iso) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
export const dayLabelYear = (iso) => `${dayLabel(iso)} ${iso.slice(0, 4)}`;

export function periodText(range) {
  return range ? `${dayLabelYear(range.from)} to ${dayLabelYear(range.to)}` : "";
}

export function rangeQuery(params) {
  if (params.from || params.to) return { from: params.from, to: params.to };
  return { range: params.range || "30d" };
}

/** Keeps the selected range when moving between dashboard and report pages. */
export function rangeSearch(params) {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (!params.from && !params.to && params.range) q.set("range", params.range);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const SERVICE_LABELS = { activity: "Activities", hotel: "Hotels", flight: "Flights", visa: "Visas", transfer: "Transfers" };
export const serviceLabel = (t) => SERVICE_LABELS[t] || String(t || "").replace(/_/g, " ");
