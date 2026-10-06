"use client";

// Shared bits for the customer-relations pages (leads, tickets, customers, partners).

export const LEAD_STATUSES = [
  { id: "new", label: "New", tone: "info" },
  { id: "contacted", label: "Contacted", tone: "neutral" },
  { id: "qualified", label: "Qualified", tone: "warning" },
  { id: "quoted", label: "Quoted", tone: "info" },
  { id: "won", label: "Won", tone: "success" },
  { id: "lost", label: "Lost", tone: "danger" },
];
export const LEAD_STATUS = Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s]));

export const LEAD_SOURCES = [
  { id: "activity", label: "Activity" },
  { id: "holiday", label: "Holiday" },
  { id: "visa", label: "Visa" },
  { id: "cruise", label: "Cruise" },
  { id: "event", label: "Event" },
  { id: "contact", label: "Contact form" },
  { id: "b2b", label: "B2B" },
];
export const SOURCE_LABEL = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));

export const LEAD_PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
];

export const LOST_REASONS = [
  { value: "price", label: "Price too high" },
  { value: "no_response", label: "No response" },
  { value: "competitor", label: "Went to a competitor" },
  { value: "changed_plans", label: "Changed plans" },
  { value: "not_qualified", label: "Not qualified" },
  { value: "duplicate", label: "Duplicate" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];
export const LOST_REASON_LABEL = Object.fromEntries(LOST_REASONS.map((r) => [r.value, r.label]));

export const CONTACT_CHANNELS = { email: "Email", phone: "Phone call", whatsapp: "WhatsApp" };

export const TICKET_STATUSES = [
  { id: "open", label: "Open", tone: "info" },
  { id: "pending", label: "Waiting on customer", tone: "warning" },
  { id: "resolved", label: "Resolved", tone: "success" },
  { id: "closed", label: "Closed", tone: "neutral" },
];
export const TICKET_STATUS = Object.fromEntries(TICKET_STATUSES.map((s) => [s.id, s]));
export const TICKET_PRIORITIES = [
  { id: "low", label: "Low", tone: "neutral" },
  { id: "normal", label: "Normal", tone: "info" },
  { id: "high", label: "High", tone: "warning" },
  { id: "urgent", label: "Urgent", tone: "danger" },
];
export const TICKET_PRIORITY = Object.fromEntries(TICKET_PRIORITIES.map((s) => [s.id, s]));
export const TICKET_CATEGORIES = [
  { id: "booking", label: "Booking" },
  { id: "payment", label: "Payment" },
  { id: "refund", label: "Refund" },
  { id: "voucher", label: "Voucher" },
  { id: "general", label: "General" },
  { id: "complaint", label: "Complaint" },
];
export const TICKET_CATEGORY = Object.fromEntries(TICKET_CATEGORIES.map((s) => [s.id, s.label]));

/** Public site page of the catalog item a lead points at (null when unknown). */
export function catalogHref(catalog) {
  if (!catalog?.slug) return null;
  const base = { activity: "/activities", holiday: "/holidays", visa: "/visas", cruise: "/cruises", event: "/events" }[catalog.type];
  return base ? `${base}/${encodeURIComponent(catalog.slug)}` : null;
}

export const mailtoHref = (email, subject = "") => `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
export const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
/** wa.me wants digits only, in international format. A leading 00 becomes the country code; a local 0 prefix is assumed UAE (+971). */
export function whatsappHref(phone, text = "") {
  let digits = String(phone || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("0")) digits = `971${digits.slice(1)}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function followUpBadge(state) {
  if (state === "overdue") return { tone: "danger", label: "Overdue" };
  if (state === "today") return { tone: "warning", label: "Due today" };
  return null;
}

/** Local date-time input value (YYYY-MM-DDTHH:mm) for "now + hours". */
export function localInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
