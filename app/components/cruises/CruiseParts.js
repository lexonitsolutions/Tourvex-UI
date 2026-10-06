"use client";

import { memo } from "react";
import { formatPrice } from "../../lib/api";
import ShowcaseCard from "../ShowcaseCard";
import { IconMoon, StateMessage, CardSkeletons, plural, showFallback, FALLBACK_IMG } from "../holidays/HolidayParts";
import "../../holidays.css";
import "../../cruises.css";

export { CardSkeletons, StateMessage, plural, showFallback, FALLBACK_IMG };
export { IconCheck, IconChevron, IconX, IconPin, IconMoon, RailSection } from "../holidays/HolidayParts";

/** The API converts prices to the requested currency; always format in the currency the money itself carries. */
export const money = (m) => (m ? formatPrice(m.amount, m.currency || "AED") : null);

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

/** "2026-11-14" -> "14 Nov 2026". Explicit UTC so the server and the browser always agree. */
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? String(iso) : dateFmt.format(d);
}

export function formatWeekday(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : weekdayFmt.format(d);
}

/** "2026-11" -> "November 2026". */
export function formatMonth(ym) {
  const d = new Date(`${ym}-01T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? String(ym) : monthFmt.format(d);
}

export const nightsLabel = (n) => plural(n, "night");

export const cityHref = (name) => `/cruises/from/${encodeURIComponent(name)}`;

/* Icons ------------------------------------------------------------ */

const icon = (paths, props = {}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {paths}
  </svg>
);

export const IconShip = (p) => icon(<><path d="M3 17l2 3h14l2-3-9-3z" /><path d="M7 14V8h10v6M12 8V4" /></>, p);
export const IconCalendar = (p) => icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>, p);
export const IconInfo = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></>, p);
export const IconWave = (p) => icon(<path d="M3 9c2.2 0 2.2 2 4.5 2S9.700 9 12 9s2.200 2 4.500 2S18.800 9 21 9M3 15c2.200 0 2.200 2 4.500 2S9.700 15 12 15s2.200 2 4.500 2S18.800 15 21 15" />, p);
export const IconAnchor = (p) => icon(<><circle cx="12" cy="5" r="2" /><path d="M12 7v13M6 12H4a8 8 0 0016 0h-2M8 11h8" /></>, p);
export const IconPlane = (p) => icon(<path d="M3 13l8-2 4-7 2 1-2 7 5 2v2l-6-1-3 4-2-1 1-5-7-1z" />, p);
export const IconFilter = (p) => icon(<path d="M4 6h16M7 12h10M10 18h4" />, p);

/* Card ------------------------------------------------------------- */

export const CruiseCard = memo(function CruiseCard({ item, reveal = true }) {
  const next = item.nextDepartures?.[0];
  return (
    <ShowcaseCard
      href={`/cruises/${item.slug}`}
      title={item.title}
      image={item.coverImage}
      tag={item.tags?.[0] || item.region || undefined}
      location={item.departureCity ? `From ${item.departureCity}` : undefined}
      meta={[
        item.durationNights > 0 && { icon: <IconMoon width="14" height="14" />, text: nightsLabel(item.durationNights) },
        next && { icon: <IconCalendar width="14" height="14" />, text: `Next ${formatDate(next)}`, label: `next departure ${formatDate(next)}` },
        item.cruiseLine && { icon: <IconShip width="14" height="14" />, text: item.cruiseLine },
      ]}
      price={item.price}
      priceFallback="Fare on request"
      reveal={reveal}
    />
  );
});
