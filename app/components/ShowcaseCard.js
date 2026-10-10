"use client";

import Link from "next/link";
import { memo } from "react";
import { formatPrice } from "../lib/api";
import "../showcase-card.css";
import { stockInfo, stockText } from "./StockBadge";

export const SHOWCASE_FALLBACK_IMG = "/images/destination-a.jpg";

const svg = (children, size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);
const PinIcon = () => svg(<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>, 13);
const ArrowIcon = () => svg(<path d="M7 17L17 7M8 7h9v9" />, 16);
const ChevronIcon = () => svg(<path d="M9 5l7 7-7 7" />, 14);

const money = (m) => (m ? formatPrice(m.amount, m.currency || "AED") : null);

/**
 * Compact "showcase" card shared by Home, Holidays, Visas and Search. One real link per card (stretched over the whole
 * card with a pseudo-element), so interactive extras such as a wishlist heart sit above it and are never nested in the anchor.
 *
 * @param {object} props
 * @param {string} props.href - Destination of the card link.
 * @param {string} props.title - Card title (clamped to two lines).
 * @param {string} [props.image] - Photo URL. Empty or broken images fall back to `fallbackImage`.
 * @param {import("react").ReactNode} [props.media] - Custom media content shown instead of a photo (for example a flag composition).
 * @param {string} [props.fallbackImage] - Local image used when `image` is empty or fails to load.
 * @param {string} [props.tag] - Pill shown top-left of the media.
 * @param {string} [props.location] - Location line with a pin icon.
 * @param {Array<string | {icon?: import("react").ReactNode, text: string, label?: string}>} [props.meta] - Small facts under the title (two are shown on phones); `label` is the spoken form.
 * @param {{amount: number, currency?: string, was?: {amount: number, currency?: string} | null, saving?: number} | null} [props.price]
 *   Price shown as "From X". `was` is struck through and `saving` (percent, derived from `was` when omitted) is shown as a pill.
 * @param {string} [props.priceFallback] - Text shown when there is no price.
 * @param {string} [props.cta] - Footer link label.
 * @param {import("react").ReactNode} [props.topRight] - Replaces the default arrow button (for example a wishlist heart).
 * @param {boolean} [props.reveal] - Adds `data-reveal` for the scroll-reveal hook.
 * @param {number} [props.tint] - Hue (0-360) for a gradient media background (used with `media`).
 * @param {string} [props.ariaLabel] - Accessible name of the link; defaults to title, location, meta and price.
 * @param {{soldOut?: boolean, lowStock?: boolean, remaining?: number | null} | null} [props.stock] - Optional stock info: shows an "Only N left" or "Sold out" chip bottom-left of the photo.
 * @param {string} [props.className]
 * @param {import("react").CSSProperties} [props.style]
 */
export const ShowcaseCard = memo(function ShowcaseCard({
  href,
  title,
  image,
  media,
  fallbackImage = SHOWCASE_FALLBACK_IMG,
  tag,
  location,
  meta,
  price,
  priceFallback,
  cta = "Details",
  topRight,
  reveal = false,
  tint,
  ariaLabel,
  stock,
  className = "",
  style,
}) {
  const facts = (meta || []).filter(Boolean).map((m) => (typeof m === "string" ? { text: m } : m));
  const saving = price?.saving ?? (price?.was && price.was.amount > price.amount ? Math.round((1 - price.amount / price.was.amount) * 100) : 0);
  const stockNote = stockInfo(stock);
  const label =
    ariaLabel ||
    [title, stockNote && stockText(stockNote), location, ...facts.map((f) => f.label || f.text), price ? `from ${money(price)}` : priceFallback].filter(Boolean).join(", ");
  const useMedia = media != null && !image;
  const fallback = (e) => {
    if (!e.currentTarget.src.endsWith(fallbackImage)) e.currentTarget.src = fallbackImage;
  };

  return (
    <article
      className={`sc${stockNote?.kind === "sold" ? " is-soldout" : ""}${className ? ` ${className}` : ""}`}
      data-reveal={reveal ? true : undefined}
      style={tint != null ? { "--sc-h": tint, ...style } : style}
    >
      <div className="sc-lift">
        <div className="sc-media">
          <div className={`sc-visual${useMedia && tint != null ? " is-tint" : ""}`}>
            {useMedia ? (
              media
            ) : (
              <img src={image || fallbackImage} alt="" width="640" height="440" loading="lazy" decoding="async" onError={fallback} />
            )}
          </div>
          {tag && <span className="sc-tag">{tag}</span>}
          {stockNote && <span className={`stk-chip sc-stock is-${stockNote.kind}`}>{stockText(stockNote)}</span>}
          {saving > 0 && <span className="sc-save">Save {saving}%</span>}
          {topRight ? <div className="sc-top">{topRight}</div> : <span className="sc-arrow" aria-hidden="true"><ArrowIcon /></span>}
        </div>
        <div className="sc-body">
          {location && <p className="sc-loc"><PinIcon /><span>{location}</span></p>}
          <h3 className="sc-title">
            <Link className="sc-link" href={href} aria-label={label}>{title}</Link>
          </h3>
          {facts.length > 0 && (
            <ul className="sc-meta">
              {facts.map((f) => (
                <li key={f.text}>{f.icon}<span>{f.text}</span></li>
              ))}
            </ul>
          )}
          <div className="sc-foot">
            {price ? (
              <p className="sc-price">
                <small>From</small>
                <strong>{money(price)}</strong>
                {price.was && <s>{money(price.was)}</s>}
              </p>
            ) : (
              <p className="sc-price"><small>{priceFallback}</small></p>
            )}
            <span className="sc-cta" aria-hidden="true">{cta}<ChevronIcon /></span>
          </div>
        </div>
      </div>
    </article>
  );
});

/** Loading placeholder with the same footprint as a card. */
export function ShowcaseSkeleton({ count = 4, className = "" }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={`sc-skel${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="sc-skel-img" />
      <div className="sc-skel-line" />
      <div className="sc-skel-line is-short" />
    </div>
  ));
}

export default ShowcaseCard;
