// Shared bits of the tax & invoicing screens. The contract lives in Tourvex-API/docs/BILLING_API.md (section "Admin API > Tax").
import { useAdminQuery } from "../../_lib/useAdminQuery";

export const TAX_API = "/admin/tax";

/** The API answers lists as `{ items }`; tolerate a bare array too. */
export const itemsOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);

export const MODELS = [
  { value: "single", label: "Single tax (VAT / GST as one line)" },
  { value: "india_gst", label: "India GST (CGST + SGST or IGST)" },
];
export const MODEL_LABEL = { single: "Single tax", india_gst: "India GST" };
export const QR_OPTIONS = [
  { value: "none", label: "No QR code" },
  { value: "zatca", label: "ZATCA phase 1 (Saudi Arabia)" },
];
export const SERVICE_CODE_LABELS = [{ value: "SAC", label: "SAC (services)" }, { value: "HSN", label: "HSN (goods)" }];

export const EMAIL_STATUS = {
  pending: { label: "Pending", tone: "warning" },
  sent: { label: "Sent", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  skipped: { label: "Skipped", tone: "neutral" },
};

/** GST state codes (used for the place of supply and the seller's state). */
export const INDIA_STATES = [
  ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"],
  ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"], ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"],
  ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"], ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"],
  ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"], ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["38", "Ladakh"], ["97", "Other territory"],
].map(([code, name]) => ({ code, name }));
export const INDIA_STATE_OPTIONS = INDIA_STATES.map((s) => ({ value: s.code, label: `${s.code} - ${s.name}` }));
export const indiaStateName = (code) => INDIA_STATES.find((s) => s.code === code)?.name || "";

/* ------------------------------------------------------------------ data hooks */
export function useRegimes() {
  const q = useAdminQuery(`${TAX_API}/regimes`, undefined, { prefetchNext: false });
  return { ...q, items: itemsOf(q.data) };
}
export function useSellers() {
  const q = useAdminQuery(`${TAX_API}/sellers`, undefined, { prefetchNext: false });
  return { ...q, items: itemsOf(q.data) };
}
export function useCountries() {
  const q = useAdminQuery(`${TAX_API}/countries`, undefined, { prefetchNext: false });
  return { ...q, items: itemsOf(q.data) };
}

export const countryName = (countries, code, fallback) => countries.find((c) => c.code === code)?.name || fallback || code || "";
export const countryOptions = (countries) => countries.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));
/** The active regime for a country (inactive ones only when no active one exists). */
export const regimeFor = (regimes, country) => regimes.find((r) => r.country === country && r.active !== false) || regimes.find((r) => r.country === country) || null;

/* ------------------------------------------------------------------ formatting */
export function fmtPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${Number.isInteger(n) ? n : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
}
/** "5%" or "5% / 12% / 18%" (default first). */
export function ratesSummary(regime) {
  const rates = Array.isArray(regime?.rates) ? regime.rates : [];
  if (!rates.length) return "-";
  const sorted = [...rates].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  return sorted.map((r) => fmtPercent(r.percent)).join(" / ");
}

/**
 * Live preview of a document number from the regime's numbering settings, e.g. INV-2026-000001 or INV-IN26-000001.
 * Illustrative: the server owns the real counter and applies the final format.
 */
export function previewNumber(numbering, country, { credit = false, year = new Date().getFullYear(), seq = 1 } = {}) {
  const n = numbering || {};
  const prefix = String((credit ? n.creditPrefix : n.prefix) || "").trim();
  const yearText = Number(n.yearDigits) === 2 ? String(year).slice(-2) : String(year);
  const cc = n.includeCountry && country ? String(country).toUpperCase() : "";
  const digits = Math.min(8, Math.max(1, Number(n.sequenceDigits) || 6));
  return `${prefix ? `${prefix}-` : ""}${cc}${yearText}-${String(seq).padStart(digits, "0")}`;
}

/* ------------------------------------------------------------------ errors */
export function taxErrorText(error) {
  switch (error?.code) {
    case "REGIME_IN_USE":
      return "This tax regime is used by existing invoices or bookings, so it cannot be deleted. Deactivate it instead: it then stops being used for new bookings and past invoices keep their snapshot.";
    case "SELLER_IN_USE":
      return "This seller registration has already issued invoices, so it cannot be deleted. Deactivate it instead. The default registration can never be deleted: make another registration the default first.";
    case "EMAIL_NOT_CONFIGURED":
      return "Email is not configured on the server (no SMTP host is set), so the invoice could not be sent. Nothing is lost: the invoice stays pending and can be sent as soon as SMTP is configured (SMTP_HOST, SMTP_PORT, MAIL_FROM in the API environment).";
    default:
      return error?.message || "Something went wrong.";
  }
}

/**
 * Splits a 400 into messages for fields and general ones. Accepts Nest class-validator strings ("rates.0.percent must not be
 * greater than 100"), `{ path | field | property, message }` objects and `body.errors`. `known` lists the first path segments the
 * form owns; anything else (or without a path) lands in `general`.
 */
export function serverErrors(error, known = []) {
  const fields = {};
  const general = [];
  const raw = Array.isArray(error?.details) ? error.details : Array.isArray(error?.body?.errors) ? error.body.errors : null;
  if (!raw) {
    if (error?.message) general.push(error.message);
    return { fields, general };
  }
  raw.forEach((item) => {
    let path = "";
    let message = "";
    if (typeof item === "string") {
      const m = item.match(/^([A-Za-z_][\w]*(?:(?:\.|\[)[\w\]]+)*)\s+(.+)$/);
      if (m) {
        path = m[1].replace(/\[(\d+)\]/g, ".$1");
        message = m[2];
      } else {
        message = item;
      }
    } else if (item && typeof item === "object") {
      path = String(item.path ?? item.field ?? item.property ?? "").replace(/\[(\d+)\]/g, ".$1");
      message = String(item.message ?? "Invalid value");
    }
    if (!message) return;
    const text = message.charAt(0).toUpperCase() + message.slice(1) + (/[.!?]$/.test(message) ? "" : ".");
    if (path && known.includes(path.split(".")[0])) fields[path] = fields[path] ? `${fields[path]} ${text}` : text;
    else general.push(path ? `${path} ${message}` : message);
  });
  return { fields, general };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
