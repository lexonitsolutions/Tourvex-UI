"use client";

import { memo } from "react";
import { formatPrice } from "../../lib/api";
import ShowcaseCard from "../ShowcaseCard";
import { StateMessage, CardSkeletons, plural, showFallback, FALLBACK_IMG } from "../holidays/HolidayParts";
import "../../holidays.css";
import "../../events.css";

export { CardSkeletons, StateMessage, plural, showFallback, FALLBACK_IMG };
export { IconCheck, IconChevron, IconX, IconPin, RailSection } from "../holidays/HolidayParts";

/** The API converts prices to the requested currency; always format in the currency the money itself carries. */
export const money = (m) => (m ? formatPrice(m.amount, m.currency || "AED") : null);

/* Dates -------------------------------------------------------------
   Session times are stored as ISO instants and shown exactly as stored (UTC), never in the visitor's time zone, so the
   server render and the browser always print the same text. */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parse = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "Sat 14 Nov" */
export function formatDay(iso) {
  const d = parse(iso);
  return d ? `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : "";
}

/** "7:30 PM" */
export function formatTime(iso) {
  const d = parse(iso);
  if (!d) return "";
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** "Sat 14 Nov, 7:30 PM" */
export function formatDateTime(iso) {
  const d = formatDay(iso);
  return d ? `${d}, ${formatTime(iso)}` : "";
}

/** "2026-11-14" -> "14 Nov 2026" (used for the date-range filter chips). */
export function formatDayShort(ymd) {
  const d = parse(`${ymd}T00:00:00Z`);
  return d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : String(ymd);
}

/** "2026-11" -> "November 2026". */
export function formatMonth(ym) {
  const d = parse(`${ym}-01T00:00:00Z`);
  return d ? `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}` : String(ym);
}

export function durationLabel(minutes) {
  if (!minutes || minutes < 1) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

export const cityHref = (name) => `/events/in/${encodeURIComponent(name)}`;
export const categoryHref = (slug) => `/events/category/${encodeURIComponent(slug)}`;

/* Icons ------------------------------------------------------------ */

const icon = (paths, props = {}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {paths}
  </svg>
);

export const IconTicket = (p) => icon(<><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4z" /><path d="M14 6v12" strokeDasharray="2 2.6" /></>, p);
export const IconCalendar = (p) => icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>, p);
export const IconClock = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
export const IconInfo = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></>, p);
export const IconUsers = (p) => icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 010 5.6M18 14.8c1.8.7 3 2.4 3 5.2" /></>, p);
export const IconHeadset = (p) => icon(<><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>, p);
export const IconMap = (p) => icon(<><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>, p);
export const IconStage = (p) => icon(<><path d="M3 20h18M5 20V9l7-5 7 5v11" /><path d="M9 20v-6h6v6" /></>, p);

/* Card ------------------------------------------------------------- */

export const EventCard = memo(function EventCard({ item, reveal = true }) {
  const when = item.nextDate ? formatDateTime(item.nextDate) : "";
  const duration = durationLabel(item.durationMinutes);
  return (
    <ShowcaseCard
      href={`/events/${item.slug}`}
      title={item.title}
      image={item.coverImage}
      tag={item.category || undefined}
      stock={item.stock}
      location={[item.venue, item.city].filter(Boolean).join(", ") || undefined}
      meta={[
        when && { icon: <IconCalendar width="14" height="14" />, text: when, label: `next date ${when}` },
        item.sessionCount > 1 && { icon: <IconTicket width="14" height="14" />, text: `${item.sessionCount} dates` },
        duration && { icon: <IconClock width="14" height="14" />, text: duration },
      ]}
      price={item.price}
      priceFallback="Price on request"
      reveal={reveal}
    />
  );
});
