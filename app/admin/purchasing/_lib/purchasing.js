// Shared bits for the purchasing screens. The contract lives in Tourvex-API/docs/BILLING_API.md ("Purchasing" and "Margin").
import { formatDayKey, formatMoney } from "../../_lib/format";
import { MAX_DAYS, countDays, daysBetween, itemHref } from "../../inventory/_lib/stock";

export { MAX_DAYS, itemHref };

export const PURCHASING_API = "/admin/purchasing";
export const PURCHASES_PATH = `${PURCHASING_API}/purchases`;
export const SUPPLIERS_PATH = `${PURCHASING_API}/suppliers`;

export const purchaseApiPath = (id) => `${PURCHASES_PATH}/${encodeURIComponent(id)}`;
export const supplierApiPath = (id) => `${SUPPLIERS_PATH}/${encodeURIComponent(id)}`;
export const purchaseHref = (id) => `/admin/purchasing/${encodeURIComponent(id)}`;
/** New purchase, optionally with a stock item preselected (read back by the editor from ?item=). */
export const newPurchaseHref = (itemId) => (itemId ? `/admin/purchasing/new?item=${encodeURIComponent(itemId)}` : "/admin/purchasing/new");
/** Stock ledger filtered for the rows a purchase wrote (reason "Purchase PUR-..." / meta.purchaseNumber). */
export const movementsHref = (number) => `/admin/inventory/movements?purchaseNumber=${encodeURIComponent(number)}`;

export const STATUS = {
  draft: { label: "Draft", tone: "neutral" },
  received: { label: "Received", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  void: { label: "Void", tone: "danger" },
};
export const STATUS_FILTER = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "received", label: "Received" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export const CURRENCIES = ["AED", "INR", "SAR", "GBP", "EUR", "USD"].map((c) => ({ value: c, label: c }));
export const BASE_CURRENCY = "AED";

export const money = (value, currency = BASE_CURRENCY) => formatMoney(value, currency || BASE_CURRENCY);
export const plural = (n, one, many = `${one}s`) => `${Number(n).toLocaleString("en-GB")} ${n === 1 ? one : many}`;

/* ------------------------------------------------------------------ lines */

let seq = 0;
export const newKey = () => {
  seq += 1;
  return `l${seq}`;
};

export const blankLine = (patch = {}) => ({
  key: newKey(), itemId: "", title: "", variantLabel: "", productType: "", quantity: "", dateFrom: "", dateTo: "", weekdays: [], unitCost: null, taxPercent: "", ...patch,
});

const cents = (n) => Math.round((Number(n) + Number.EPSILON) * 100);
const fromCents = (c) => c / 100;
export const round2 = (n) => fromCents(cents(n));

function wholeNumber(text) {
  const t = String(text ?? "").trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}
function percent(text) {
  const t = String(text ?? "").trim();
  if (!t) return { value: 0, error: "" };
  if (!/^\d+(\.\d{1,3})?$/.test(t)) return { value: 0, error: "Enter a percentage such as 5 or 12.5." };
  const n = Number(t);
  return n > 100 ? { value: 0, error: "Tax cannot be more than 100%." } : { value: n, error: "" };
}

/** Numbers behind one line: how many dates it covers, total units and money. Never throws on half-filled lines. */
export function lineMetrics(line) {
  const { dateFrom, dateTo } = line;
  const ordered = !!dateFrom && !!dateTo && dateTo >= dateFrom;
  const span = ordered ? daysBetween(dateFrom, dateTo) : 0;
  const dates = ordered && span <= MAX_DAYS ? countDays(dateFrom, dateTo, line.weekdays) : 0;
  const quantity = wholeNumber(line.quantity) ?? 0;
  const units = quantity * dates;
  const cost = typeof line.unitCost === "number" && Number.isFinite(line.unitCost) ? line.unitCost : 0;
  const total = fromCents(Math.round(units * cost * 100));
  const tax = fromCents(Math.round((total * 100 * percent(line.taxPercent).value) / 100));
  return { span, dates, quantity, units, total, tax };
}

/** Field errors of one line ({} when valid). */
export function validateLine(line) {
  const e = {};
  if (!line.itemId) e.itemId = "Choose the stock item this line adds units to.";
  const q = wholeNumber(line.quantity);
  if (q === null || q < 1) e.quantity = "Whole number, 1 or more.";
  else if (q > 100000) e.quantity = "That is too many units per day.";
  if (!line.dateFrom) e.dateFrom = "Choose the first date.";
  if (!line.dateTo) e.dateTo = "Choose the last date.";
  if (line.dateFrom && line.dateTo) {
    if (line.dateTo < line.dateFrom) e.dateTo = "The last date is before the first date.";
    else if (daysBetween(line.dateFrom, line.dateTo) > MAX_DAYS) e.dateTo = `A line covers at most ${MAX_DAYS} days. Split it into two lines.`;
    else if (!countDays(line.dateFrom, line.dateTo, line.weekdays)) e.weekdays = "None of the chosen weekdays falls between these dates.";
  }
  if (!(typeof line.unitCost === "number" && line.unitCost > 0)) e.unitCost = "Enter a cost above 0.";
  const pct = percent(line.taxPercent);
  if (pct.error) e.taxPercent = pct.error;
  return e;
}

export function totalsOf(lines) {
  let subtotal = 0;
  let tax = 0;
  let units = 0;
  lines.forEach((l) => {
    const m = lineMetrics(l);
    subtotal += Math.round(m.total * 100);
    tax += Math.round(m.tax * 100);
    units += m.units;
  });
  return { subtotal: fromCents(subtotal), tax: fromCents(tax), total: fromCents(subtotal + tax), units };
}

/* ------------------------------------------------------------------ form <-> API */

export const emptyForm = () => ({
  supplierId: "", supplierName: "", supplierCurrency: "", supplierInvoiceNumber: "", invoiceDate: "", dueDate: "", currency: BASE_CURRENCY, notes: "", lines: [blankLine()],
});

export function fromPurchase(p) {
  return {
    supplierId: p.supplierId || "",
    supplierName: p.supplierName || "",
    supplierCurrency: "",
    supplierInvoiceNumber: p.supplierInvoiceNumber || "",
    invoiceDate: String(p.invoiceDate || "").slice(0, 10),
    dueDate: String(p.dueDate || "").slice(0, 10),
    currency: p.currency || BASE_CURRENCY,
    notes: p.notes || "",
    lines: (p.lines || []).map((l) =>
      blankLine({
        itemId: l.itemId,
        title: l.title || "",
        variantLabel: l.variantLabel || "",
        productType: l.productType || String(l.itemId || "").split(":")[0],
        quantity: String(l.quantity ?? ""),
        dateFrom: String(l.dateFrom || "").slice(0, 10),
        dateTo: String(l.dateTo || "").slice(0, 10),
        weekdays: Array.isArray(l.weekdays) ? l.weekdays : [],
        unitCost: typeof l.unitCost === "number" ? l.unitCost : null,
        taxPercent: l.taxPercent === undefined || l.taxPercent === null ? "" : String(l.taxPercent),
      })
    ),
  };
}

/** POST / PATCH body. Weekdays are omitted when none or all seven are chosen (= every day). */
export function toPayload(form) {
  return {
    supplierId: form.supplierId,
    supplierInvoiceNumber: form.supplierInvoiceNumber.trim(),
    invoiceDate: form.invoiceDate,
    ...(form.dueDate ? { dueDate: form.dueDate } : {}),
    currency: form.currency,
    notes: form.notes.trim(),
    lines: form.lines.map((l) => ({
      itemId: l.itemId,
      quantity: Number(l.quantity),
      dateFrom: l.dateFrom,
      dateTo: l.dateTo,
      ...(l.weekdays.length && l.weekdays.length < 7 ? { weekdays: [...l.weekdays].sort((a, b) => a - b) } : {}),
      unitCost: l.unitCost,
      ...(String(l.taxPercent).trim() && Number(l.taxPercent) > 0 ? { taxPercent: Number(l.taxPercent) } : {}),
    })),
  };
}

/** Header-level errors plus the per-line map. `lines` is { [lineKey]: errors }. */
export function validateForm(form) {
  const e = {};
  if (!form.supplierId) e.supplierId = "Choose a supplier.";
  if (!form.invoiceDate) e.invoiceDate = "Enter the date on the supplier's invoice.";
  if (form.dueDate && form.invoiceDate && form.dueDate < form.invoiceDate) e.dueDate = "The due date is before the invoice date.";
  const lines = {};
  form.lines.forEach((l) => {
    const le = validateLine(l);
    if (Object.keys(le).length) lines[l.key] = le;
  });
  if (!form.lines.length) e.lines = "Add at least one line.";
  return { header: e, lines, ok: !Object.keys(e).length && !Object.keys(lines).length };
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function weekdaysText(weekdays) {
  if (!weekdays?.length || weekdays.length === 7) return "every day";
  return [...weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAY_LABELS[d]).join(", ");
}
export const rangeText = (from, to) => (from === to ? formatDayKey(from) : `${formatDayKey(from)} to ${formatDayKey(to)}`);

/* ------------------------------------------------------------------ rows */

/** Units on a list row or purchase: the API's total when it sends one, else computed from the lines. */
export function purchaseUnits(p) {
  const direct = p.totalUnits ?? p.units;
  if (typeof direct === "number") return direct;
  if (Array.isArray(p.lines) && p.lines.length) return totalsOf(fromPurchase(p).lines).units;
  return null;
}

/** Received but unpaid and past its due date. */
export const isOverdue = (p, today) => p.status === "received" && !!p.dueDate && !!today && String(p.dueDate).slice(0, 10) < today;

/* ------------------------------------------------------------------ errors */

function pick(error, ...keys) {
  const body = error?.body || {};
  for (const k of keys) {
    for (const src of [body, body.details, body.meta, body.data]) {
      if (src && typeof src === "object" && src[k] !== undefined && src[k] !== null) return src[k];
    }
  }
  return undefined;
}

/** Human text for a failed purchasing call (receive / void / save / pay). */
export function purchaseErrorText(error, action = "save") {
  if (!error) return "";
  const code = error.code;
  if (code === "STOCK_BELOW_COMMITTED") {
    const date = pick(error, "date", "firstDate", "offendingDate");
    const committed = pick(error, "committed", "committedUnits");
    const where = date ? ` on ${formatDayKey(String(date).slice(0, 10))}` : "";
    const what = committed !== undefined ? `${Number(committed).toLocaleString("en-GB")} unit${Number(committed) === 1 ? " is" : "s are"} already sold or held` : "units are already sold or held";
    return action === "void"
      ? `This purchase cannot be voided: removing its units would leave stock below what is already committed${where} (${what}). Move or cancel those bookings first, or leave the purchase as it is.`
      : `Capacity cannot go below what is already committed${where} (${what}).`;
  }
  if (code === "UNLIMITED_ITEM") return "This item has no capacity limit set, so there is nothing to add stock to. Open the item in Inventory and set a default daily capacity first, then receive the purchase.";
  if (code === "STOCK_UNAVAILABLE") return error.message || "Not enough stock for that change.";
  if (code === "NOT_EDITABLE") return "This purchase can no longer be edited. Only drafts can be changed.";
  if (code === "ITEM_NOT_FOUND") return "One of the stock items no longer exists. Remove that line or pick another item.";
  if (code === "DUPLICATE_SUPPLIER_INVOICE" || (error.status === 409 && /invoice/i.test(error.message || ""))) return error.message || "This supplier already has a purchase with that invoice number.";
  if (error.status === 403) return "You do not have permission to do this.";
  return error.message || "Something went wrong.";
}
