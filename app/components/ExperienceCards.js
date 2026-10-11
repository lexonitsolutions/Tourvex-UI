"use client";

import { CmsLink } from "./CmsLink";
import { fmt } from "../lib/format";
import { memo, useMemo } from "react";
import { formatPrice } from "../lib/api";
import "../experience-cards.css";

const FALLBACK_IMG = "/images/destination-a.jpg";

const showFallback = (e) => {
  if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
};

const Svg = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  desert: <Svg><circle cx="12" cy="8" r="3.2" /><path d="M3 20c3-5 6-5 9 0 3-5 6-5 9 0M12 2v1.5M5 5l1 1M19 5l-1 1" /></Svg>,
  park: <Svg><circle cx="12" cy="10" r="6" /><circle cx="12" cy="10" r="1.2" /><path d="M12 4v12M6 10h12M7.8 5.8l8.4 8.4M16.2 5.8l-8.4 8.4M8 21l4-5 4 5" /></Svg>,
  cruise: <Svg><path d="M3 16l2 4h14l2-4-9-3z" /><path d="M7 13V8h10v5M12 8V4" /></Svg>,
  water: <Svg><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></Svg>,
  adventure: <Svg><path d="M3 20l6-11 4 6 2-3 6 8z" /><path d="M9 9l1.5 2.2" /></Svg>,
  city: <Svg><path d="M4 21V9l5-3v15M9 21V4l6 2v15M15 21V11l5 2v8M3 21h18M12 8h.01M12 12h.01M12 16h.01" /></Svg>,
};

/** Cheapest current price among a category's activities (sale price when there is one). */
function cheapest(list) {
  let best = null;
  list.forEach((it) => {
    const p = it.salePrice || it.price;
    if (p && (best === null || p.amount < best.amount)) best = p;
  });
  return best;
}

const Card = memo(function Card({ card, count, from, copy }) {
  const stats =
    count == null
      ? copy.statsFallback
      : `${fmt(count === 1 ? copy.countOne : copy.countMany, { count })}${from ? ` ${fmt(copy.fromSuffix, { price: formatPrice(from.amount, from.currency) })}` : ""}`;

  return (
    <li className="xc">
      <CmsLink
        className="xc-link"
        href={`/activities?activity=${encodeURIComponent(card.category)}`}
        aria-label={fmt(copy.cardAriaLabel, { category: card.category, stats })}
      >
        <img
          className="xc-img"
          src={card.image.url}
          alt={card.image.alt || card.category}
          loading="lazy"
          decoding="async"
          onError={showFallback}
        />
        <span className="xc-shade" aria-hidden="true" />
        <span className="xc-body">
          <span className="xc-icon">{ICONS[card.icon]}</span>
          <h3 className="xc-title">{card.category}</h3>
          <span className="xc-stats">{stats}</span>
          <span className="xc-btn">
            <span>{copy.ctaLabel || "Explore Now"}</span>
            <span aria-hidden="true" style={{ fontSize: "15px", lineHeight: 1 }}>→</span>
          </span>
        </span>
      </CmsLink>
    </li>
  );
});

function findCategoryItems(stats, categoryName) {
  if (!categoryName) return [];
  if (stats.has(categoryName)) return stats.get(categoryName);
  const clean = categoryName.trim().toLowerCase();
  for (const [cat, list] of stats.entries()) {
    const cClean = cat.toLowerCase();
    if (cClean === clean || cClean.includes(clean) || clean.includes(cClean)) {
      return list;
    }
  }
  return [];
}

/**
 * Home page "Explore by Experience" cards: clean, modern, minimal rectangular cards (16px radius),
 * high-quality destination images, subtle dark gradient, bottom-left aligned icon, title, stats,
 * and white "Explore Now →" button.
 */
function ExperienceCards({ items, content }) {
  const stats = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) =>
      (it.categories || []).forEach((c) => {
        if (!c) return;
        const entry = map.get(c) || [];
        entry.push(it);
        map.set(c, entry);
      })
    );
    return map;
  }, [items]);

  return (
    <ul className="xc-grid" role="list">
      {content.cards.map((card) => {
        const list = findCategoryItems(stats, card.category);
        return (
          <Card
            key={card.id}
            card={card}
            count={items ? list.length : null}
            from={items ? cheapest(list) : null}
            copy={content}
          />
        );
      })}
    </ul>
  );
}

export default memo(ExperienceCards);
