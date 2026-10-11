"use client";

import { memo } from "react";
import Link from "next/link";
import { formatPrice } from "../../lib/api";
import { StateMessage, CardSkeletons, plural, showFallback, IconChevron, IconPin } from "../holidays/HolidayParts";
import { StockChip } from "../StockBadge";
import "../../holidays.css";
import "../../events.css";

export const FALLBACK_IMG = "/images/event-01.jpg";
export { CardSkeletons, StateMessage, plural, showFallback };
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

export function getDateStub(iso) {
  if (!iso) return null;
  const d = parse(iso);
  if (d) {
    const monthCaps = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      day: d.getUTCDate(),
      month: monthCaps[d.getUTCMonth()],
    };
  }
  const m = String(iso).match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (m) return { day: m[1], month: m[2].toUpperCase() };
  return null;
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

export const EventCard = memo(function EventCard({ item, reveal = true, className = "", style }) {
  const detailHref = `/events/${item?.slug || ""}`;
  const when = item?.nextDate ? (formatDateTime(item.nextDate) || item.nextDate) : "";
  const duration = durationLabel(item?.durationMinutes);
  const locationText = [item?.venue, item?.city].filter(Boolean).join(", ") || item?.location || "";
  const onImgError = (e) => {
    if (e?.currentTarget && !e.currentTarget.src.endsWith(FALLBACK_IMG)) {
      e.currentTarget.src = FALLBACK_IMG;
    }
  };

  const dateStub = getDateStub(item?.nextDate);
  const catSlug = (item?.category || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <article
      className={`ev-card${className ? ` ${className}` : ""}`}
      data-reveal={reveal ? true : undefined}
      style={style}
    >
      <div className="ev-card-media">
        <Link href={detailHref} className="ev-card-img-link" tabIndex={-1} aria-hidden="true">
          <img
            src={item?.coverImage || FALLBACK_IMG}
            alt={item?.title || "Event"}
            loading="lazy"
            decoding="async"
            onError={onImgError}
          />
        </Link>
        <div className="ev-card-overlay" />

        {item?.category && (
          <span className={`ev-card-cat is-${catSlug}`}>
            {item.category}
          </span>
        )}

        {dateStub ? (
          <div className="ev-card-date-stub" title={`Date: ${dateStub.month} ${dateStub.day}`}>
            <span className="ev-card-stub-month">{dateStub.month}</span>
            <span className="ev-card-stub-day">{dateStub.day}</span>
          </div>
        ) : (
          item?.sessionCount > 1 && (
            <span className="ev-card-badge-sessions">
              <IconTicket width="12" height="12" />
              <span>{item.sessionCount} Dates</span>
            </span>
          )
        )}

        <StockChip stock={item?.stock} />
      </div>

      <div className="ev-card-body">
        {locationText && (
          <div className="ev-card-location" title={locationText}>
            <IconPin width="12" height="12" />
            <span>{locationText}</span>
          </div>
        )}

        <h3 className="ev-card-title">
          <Link href={detailHref}>{item?.title}</Link>
        </h3>

        <div className="ev-card-meta-row">
          {when && (
            <span className="ev-card-meta-item" title="Event date & time">
              <IconCalendar width="13" height="13" />
              <span>{when}</span>
            </span>
          )}
          {duration && (
            <span className="ev-card-meta-item" title="Duration">
              <IconClock width="13" height="13" />
              <span>{duration}</span>
            </span>
          )}
          {item?.sessionCount > 1 && dateStub && (
            <span className="ev-card-meta-item" title="Available dates">
              <IconTicket width="13" height="13" />
              <span>{item.sessionCount} dates</span>
            </span>
          )}
        </div>

        <div className="ev-card-footer">
          <div className="ev-card-price-col">
            <span className="ev-card-price-label">Tickets from</span>
            <strong className="ev-card-price-value">
              {item?.price ? money(item.price) : (item?.priceFallback || "Price on request")}
            </strong>
          </div>
          <Link href={detailHref} className="ev-card-cta" aria-label={`View event ${item?.title || ""}`}>
            <span>Get Tickets</span>
            <IconChevron width="14" height="14" />
          </Link>
        </div>
      </div>
    </article>
  );
});
