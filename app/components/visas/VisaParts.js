"use client";

import Link from "next/link";
import { memo } from "react";
import { formatPrice } from "../../lib/api";
import ShowcaseCard from "../ShowcaseCard";
import "../../holidays.css";
import "../../visas.css";

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The API converts prices to the requested currency; always format in the currency the money itself carries. */
export const money = (m) => (m ? formatPrice(m.amount, m.currency || "AED") : null);

export const KIND_LABEL = { evisa: "eVisa", embassy: "Embassy" };
export const ENTRIES_LABEL = { single: "Single entry", multiple: "Multiple entries", varies: "Entries vary" };

/** Stable soft tint per country so cards read as a family without needing photos (teal to blue range). */
export function tintFor(code = "") {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) h = (h * 31 + code.charCodeAt(i)) % 360;
  return 178 + (h % 48);
}

/* Icons ------------------------------------------------------------ */

const icon = (paths, props = {}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {paths}
  </svg>
);

export const IconChevron = ({ dir = "right", ...p }) =>
  icon(<path d={dir === "left" ? "M15 5l-7 7 7 7" : dir === "down" ? "M5 9l7 7 7-7" : "M9 5l7 7-7 7"} />, p);
export const IconCheck = (p) => icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, p);
export const IconClose = (p) => icon(<path d="M6 6l12 12M18 6L6 18" />, p);
export const IconClock = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
export const IconShield = (p) => icon(<><path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>, p);
export const IconSearch = (p) => icon(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>, p);
export const IconInfo = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></>, p);
export const IconDoc = (p) => icon(<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>, p);
export const IconRepeat = (p) => icon(<><path d="M4 12a6 6 0 016-6h8l-3-3M20 12a6 6 0 01-6 6H6l3 3" /></>, p);
export const IconCalendar = (p) => icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>, p);
export const IconArrowUpRight = (p) => icon(<path d="M7 17L17 7M8 7h9v9" />, p);
export const IconPin = (p) => icon(<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>, p);
export const IconGlobe = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>, p);

/* Flag --------------------------------------------------------------- */

const hideBroken = (e) => {
  e.currentTarget.style.visibility = "hidden";
};

/** Decorative 4:3 flag (the country name is always shown as text next to it). */
export const Flag = memo(function Flag({ code, className = "" }) {
  return (
    <span className={`vis-flag ${className}`} aria-hidden="true">
      {code && <img src={`/flags/${String(code).toLowerCase()}.svg`} alt="" width="160" height="120" decoding="async" onError={hideBroken} />}
    </span>
  );
});

/* Visa card ---------------------------------------------------------- */

/** Country flag composition (tinted gradient comes from the card, plus the country-code watermark and the flag). */
const VisaArt = memo(function VisaArt({ code }) {
  return (
    <span className="vis-card-art" aria-hidden="true">
      <span className="vis-card-mark">{String(code || "").toUpperCase()}</span>
      <Flag code={code} />
    </span>
  );
});

/** Thin wrapper over ShowcaseCard. An optional `item.image` (photo URL) replaces the flag composition. */
export const VisaCard = memo(function VisaCard({ item, reveal = true }) {
  return (
    <ShowcaseCard
      href={`/visas/${item.slug}`}
      title={item.title}
      image={typeof item.image === "string" ? item.image : undefined}
      media={<VisaArt code={item.countryCode} />}
      tint={tintFor(item.countryCode)}
      tag={KIND_LABEL[item.kind] || item.kind}
      location={item.country}
      meta={[
        item.processing && { icon: <IconClock width="14" height="14" />, text: item.processing },
        item.validity && { icon: <IconCalendar width="14" height="14" />, text: item.validity },
      ]}
      price={item.startingPrice}
      priceFallback="Fee on request"
      reveal={reveal}
    />
  );
});

export function CardSkeletons({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="vis-skel-card" aria-hidden="true">
      <div className="hol-skel vis-skel-img" />
      <div className="hol-skel hol-skel-line" />
      <div className="hol-skel hol-skel-line is-short" />
    </div>
  ));
}

export function StateMessage({ title, text, action, onAction, href, actionLabel }) {
  return (
    <div className="hol-state" role={onAction ? "alert" : "status"}>
      <div className="hol-state-art" aria-hidden="true"><IconGlobe width="30" height="30" /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {onAction && <button type="button" className="mk-btn" onClick={onAction}>{action}</button>}
      {href && <Link className="mk-btn" href={href}>{actionLabel}</Link>}
    </div>
  );
}
