"use client";

import { useState } from "react";
import { CmsLink } from "./CmsLink";
import { useHeaderContent } from "./ContentProvider";

const FALLBACK_THUMB = "/images/destination-a.jpg";

/**
 * Full-width mega menu. Groups, items, trending cards and every label come from the CMS (global.header.megaMenu);
 * only the layout and the hover behaviour live here.
 */
export default function MegaMenu({ isOpen, onMouseEnter, onMouseLeave, onClose }) {
  const mega = useHeaderContent().megaMenu;
  const groups = mega.groups;
  const [activeCategoryId, setActiveCategoryId] = useState(groups[0]?.id);

  const activeCategory = groups.find((c) => c.id === activeCategoryId) || groups[0];

  return (
    <div
      className={`mm-overlay-panel ${isOpen ? "is-open" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="region"
      aria-label={mega.regionAriaLabel}
    >
      {/* TOP SECTION: Left Sidebar + Right 3-Column Items Grid */}
      <div className="mm-main-grid">
        {/* Left Vertical Categories with Icon, Badge & Chevrons */}
        <aside className="mm-sidebar" aria-label={mega.sidebarAriaLabel}>
          {groups.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                className={`mm-cat-btn ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => setActiveCategoryId(cat.id)}
                onFocus={() => setActiveCategoryId(cat.id)}
              >
                <span className="mm-cat-icon">{cat.icon}</span>
                <span className="mm-cat-label">{cat.label}</span>
                <span className="mm-cat-chevron-badge">›</span>
              </button>
            );
          })}
        </aside>

        {/* Right 3-Column Destination/Activity Content with Silk Transition */}
        <div className="mm-content-panel">
          <div key={activeCategory?.id} className="mm-items-grid mm-animate-fade">
            {(activeCategory?.items || []).map((item) => (
              <CmsLink
                key={item.id}
                href={item.link.href}
                className="mm-item-card"
                onClick={onClose}
              >
                <div className="mm-item-thumb-box">
                  <img
                    src={item.image.url}
                    alt={item.image.alt || item.link.label}
                    className="mm-item-thumb"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_THUMB;
                    }}
                  />
                </div>
                <div className="mm-item-meta">
                  <span className="mm-item-title" title={item.link.label}>
                    {item.link.label}
                  </span>
                  <span className="mm-item-sub">{item.sub}</span>
                </div>
              </CmsLink>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Spacious, Luxury Trending Row */}
      <div className="mm-bottom-showcase-bar">
        <div className="mm-bottom-lead">
          <div className="mm-bottom-tag">
            <span className="mm-sparkle-star">✦</span>
            <span>{mega.trendingLabel}</span>
          </div>
          <span className="mm-bottom-tagline">{mega.trendingTagline}</span>
        </div>

        <div className="mm-bottom-cards-grid">
          {mega.deals.map((deal) => {
            return (
              <CmsLink
                key={deal.id}
                href={deal.link.href}
                className="mm-deal-pill-card"
                onClick={onClose}
              >
                <div className="mm-deal-thumb-box">
                  <img
                    src={deal.image.url}
                    alt={deal.image.alt || deal.link.label}
                    className="mm-deal-pill-img"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_THUMB;
                    }}
                  />
                  {deal.badge && (
                    <span className="mm-deal-mini-badge">{deal.badge}</span>
                  )}
                </div>

                <div className="mm-deal-pill-content">
                  <span className="mm-deal-pill-title" title={deal.link.label}>
                    {deal.link.label}
                  </span>
                  <div className="mm-deal-pill-row">
                    <span className="mm-deal-pill-rating">{deal.rating}</span>
                    <span className="mm-deal-pill-dot">•</span>
                    {deal.oldPrice && (
                      <span className="mm-deal-pill-old">{deal.oldPrice}</span>
                    )}
                    <span className="mm-deal-pill-price">{deal.price}</span>
                  </div>
                </div>
              </CmsLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
