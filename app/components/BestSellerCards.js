"use client";

import { CmsLink } from "./CmsLink";
import { fmt } from "../lib/format";
import { memo } from "react";
import { formatPrice } from "../lib/api";
import "../best-seller-cards.css";
import { StockChip } from "./StockBadge";

const FALLBACK_IMG = "/images/destination-a.jpg";

const showFallback = (e) => {
  if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
};

// Colour variants (same palette as the supplied feature card): main colour, light wash and tag background.
const VARIANTS = ["orange", "purple", "blue"];

function priceOf(item) {
  const p = item.salePrice || item.price;
  return p ? { amount: p.amount, currency: p.currency, was: item.salePrice ? item.price : null } : null;
}

const Card = memo(function Card({ item, index, copy }) {
  const price = priceOf(item);
  const tag = item.categories?.[0] || (item.destinations || [])[0] || copy.fallbackTag;
  return (
    <li className="bs" data-reveal>
      <div className={`bs-lift is-${VARIANTS[index % VARIANTS.length]}`}>
        <CmsLink className="bs-link" href={`/activities/${item.slug}`} aria-label={price ? fmt(copy.cardAriaLabel, { title: item.title, price: formatPrice(price.amount, price.currency) }) : item.title}>
          <span className="bs-wash" aria-hidden="true" />
          <span className="bs-index" aria-hidden="true">{String(index + 1).padStart(3, "0")}</span>
          <span className="bs-photo" aria-hidden="true">
            <img src={item.imageUrl || FALLBACK_IMG} alt="" loading="lazy" decoding="async" onError={showFallback} />
          </span>
          <span className="bs-panel">
            <StockChip stock={item.stock} className="bs-stock" />
            <span className="bs-tag">{tag}</span>
            <span className="bs-title">{item.title}</span>
            <span className="bs-meta">
              {price ? (
                <span className="bs-price">
                  <small>{copy.fromLabel}</small>
                  <strong>{formatPrice(price.amount, price.currency)}</strong>
                  {price.was && <s>{formatPrice(price.was.amount, price.was.currency)}</s>}
                </span>
              ) : (
                <span className="bs-price"><small>{copy.priceOnRequest}</small></span>
              )}
              <span className="bs-go" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </span>
        </CmsLink>
      </div>
    </li>
  );
});

export function BestSellerSkeletons({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => <li key={i} className="bs bs-skel" aria-hidden="true"><span /></li>);
}

/**
 * "Best-Selling Experiences" cards. `items` = activities (from the catalog API), `null` while loading.
 * Numbering is the display order (best sellers first), not an invented statistic.
 */
function BestSellerCards({ items, content }) {
  return (
    <ul className="bs-grid" role="list" aria-busy={!items}>
      {items ? items.map((item, i) => <Card key={item._id || item.slug} item={item} index={i} copy={content} />) : <BestSellerSkeletons />}
    </ul>
  );
}

export default memo(BestSellerCards);
