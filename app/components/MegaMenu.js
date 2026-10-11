"use client";

import { useMemo, useState } from "react";
import { CmsLink } from "./CmsLink";
import { useActivityMenuContent, useCatalogMenus, useHeaderContent, useVisaMenuContent } from "./ContentProvider";

const FALLBACK_THUMB = "/images/destination-a.jpg";
const MENU_ITEM_LIMIT = 24;

/** Full-width menu shell shared by CMS navigation and the database-backed Activities/Visas catalogs. */
const money = (value) => {
  if (!value || !Number.isFinite(Number(value.amount))) return "Enquire";
  return `${value.currency || "AED"} ${Number(value.amount).toLocaleString("en")}`;
};

const activityId = (item) => item.id || item._id || item.slug;

const activityItem = (item, sub) => ({
  id: `activity-${activityId(item)}`,
  link: { label: item.title, href: `/activities/${encodeURIComponent(item.slug)}` },
  sub,
  image: { url: item.imageUrl || FALLBACK_THUMB, alt: item.title },
});

function activityGroups(items, field, prefix, iconFor, subFor) {
  const buckets = new Map();
  items.forEach((item) => {
    (item[field] || []).forEach((name) => {
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(item);
    });
  });

  return [...buckets.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([name, groupItems]) => {
      const filter = field === "destinations" ? "destination" : "activity";
      const visible = groupItems.slice(0, MENU_ITEM_LIMIT).map((item) => activityItem(item, subFor(item)));
      if (groupItems.length > MENU_ITEM_LIMIT) {
        visible.push({
          id: `activity-${prefix}-${name}-all`,
          link: { label: `View all ${name}`, href: `/activities?${filter}=${encodeURIComponent(name)}` },
          sub: `${groupItems.length} experiences`,
          image: { url: groupItems[0]?.imageUrl || FALLBACK_THUMB, alt: name },
          tone: "browse",
        });
      }
      return {
        id: `activity-${prefix}-${name}`,
        icon: iconFor(name),
        label: field === "destinations" ? `Best activities in ${name}` : name,
        items: visible,
      };
    });
}

function buildActivityMenu(items) {
  if (items === null) {
    return {
      regionAriaLabel: "Activities menu",
      sidebarAriaLabel: "Activity collections",
      groups: [{
        id: "activities-unavailable",
        icon: "!",
        label: "Activities unavailable",
        items: [{
          id: "activities-unavailable-message",
          link: { label: "Activities are temporarily unavailable", href: "/activities" },
          sub: "We could not load the live catalog. Please try again.",
          image: { url: FALLBACK_THUMB, alt: "Activities" },
          tone: "error",
        }],
      }],
      trendingLabel: "Live catalog unavailable",
      trendingTagline: "Please try again in a moment",
      deals: [],
    };
  }

  const safeItems = Array.isArray(items) ? items.filter((item) => item?.slug && item?.title) : [];
  if (!safeItems.length) {
    return {
      regionAriaLabel: "Activities menu",
      sidebarAriaLabel: "Activity collections",
      groups: [{
        id: "activities-empty",
        icon: "◇",
        label: "Explore activities",
        items: [{
          id: "activities-empty-link",
          link: { label: "View all activities", href: "/activities" },
          sub: "New experiences are coming soon",
          image: { url: FALLBACK_THUMB, alt: "Activities" },
        }],
      }],
      trendingLabel: "Activities",
      trendingTagline: "New experiences are coming soon",
      deals: [],
    };
  }

  const destinationIcons = (name) => name === "Dubai" ? "◆" : name === "Ras Al Khaimah" ? "△" : "◇";
  const categoryIcons = (name) => ({
    "Theme Parks": "✦",
    "City Tours": "◎",
    "Adventure Tours": "↗",
    "Water Activities": "≈",
    "Desert Safari Tours": "☀",
    "Dhow Cruise & Yacht": "⚓",
  })[name] || "✦";

  const groups = [
    ...activityGroups(safeItems, "destinations", "destination", destinationIcons, (item) => item.categories?.[0] || "Experience"),
    ...activityGroups(safeItems, "categories", "category", categoryIcons, (item) => item.destinations?.[0] || "Experience"),
  ];
  const featured = safeItems.filter((item) => item.salePrice || item.price).slice(0, 4);

  return {
    regionAriaLabel: "Activities and experiences menu",
    sidebarAriaLabel: "Activity collections",
    groups,
    trendingLabel: "Popular experiences",
    trendingTagline: "Live from our activities catalog",
    deals: featured.map((item) => {
      const current = item.salePrice || item.price;
      const hasSale = item.salePrice && item.price && Number(item.salePrice.amount) < Number(item.price.amount);
      return {
        id: `activity-featured-${activityId(item)}`,
        link: { label: item.title, href: `/activities/${encodeURIComponent(item.slug)}` },
        image: { url: item.imageUrl || FALLBACK_THUMB, alt: item.title },
        badge: hasSale ? "Offer" : "Activity",
        rating: hasSale ? "Now" : "From",
        oldPrice: hasSale ? money(item.price) : null,
        price: money(current),
      };
    }),
  };
}

/** What a tab shows when its live catalog could not be loaded: a clear way into the full listing, never an empty panel. */
const FALLBACKS = {
  holidays: { aria: "Holiday packages menu", side: "Holiday collections", label: "Holiday packages", href: "/holidays", text: "Browse all holiday packages" },
  cruises: { aria: "Cruises menu", side: "Cruise collections", label: "Cruises", href: "/cruises", text: "Browse all cruises" },
  events: { aria: "Events menu", side: "Event collections", label: "Events", href: "/events", text: "Browse all events" },
  yachts: { aria: "Yachts menu", side: "Yacht collections", label: "Yachts and dhow cruises", href: "/activities?activity=Dhow%20Cruise%20%26%20Yacht", text: "Browse all yachts and dhow cruises" },
};

function buildFallbackMenu(kind) {
  const info = FALLBACKS[kind];
  return {
    regionAriaLabel: info.aria,
    sidebarAriaLabel: info.side,
    groups: [{
      id: `${kind}-browse`,
      icon: "◇",
      label: info.label,
      items: [{
        id: `${kind}-browse-link`,
        link: { label: info.text, href: info.href },
        sub: "New listings are added regularly",
        image: { url: FALLBACK_THUMB, alt: info.label },
        tone: "browse",
      }],
    }],
    trendingLabel: info.label,
    trendingTagline: "Open the full listing",
    deals: [],
  };
}

const YACHT_CATEGORY = "Dhow Cruise & Yacht";
const YACHT_ITEM_LIMIT = 12;

/** Yachts have no catalog of their own yet: the menu shows the activities in the "Dhow Cruise & Yacht" category. */
function buildYachtMenu(items) {
  const yachts = Array.isArray(items)
    ? items.filter((item) => item?.slug && item?.title && (item.categories || []).includes(YACHT_CATEGORY))
    : [];
  if (!yachts.length) return buildFallbackMenu("yachts");

  const toItem = (item) => activityItem(item, item.destinations?.[0] || "Experience");
  const buckets = new Map();
  yachts.forEach((item) => (item.destinations || []).forEach((name) => {
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(item);
  }));
  const byDestination = [...buckets.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([name, group]) => {
      const visible = group.slice(0, YACHT_ITEM_LIMIT).map(toItem);
      if (group.length > YACHT_ITEM_LIMIT) {
        visible.push({
          id: `yacht-dest-${name}-all`,
          link: { label: `View all in ${name}`, href: `/activities?destination=${encodeURIComponent(name)}&activity=${encodeURIComponent(YACHT_CATEGORY)}` },
          sub: `${group.length} experiences`,
          image: visible[0]?.image || { url: FALLBACK_THUMB, alt: name },
          tone: "browse",
        });
      }
      return { id: `yacht-dest-${name}`, icon: "⚓", label: `Yachts & dhow cruises in ${name}`, items: visible };
    });

  const popular = { id: "yacht-popular", icon: "★", label: "Most popular yachts & cruises", items: yachts.slice(0, YACHT_ITEM_LIMIT).map(toItem) };
  const featured = yachts.filter((item) => item.salePrice || item.price).slice(0, 4);
  return {
    regionAriaLabel: "Yachts and dhow cruises menu",
    sidebarAriaLabel: "Yacht collections",
    groups: [popular, ...byDestination],
    trendingLabel: "Popular yachts & cruises",
    trendingTagline: "Live from our activities catalog",
    deals: featured.map((item) => {
      const current = item.salePrice || item.price;
      const hasSale = item.salePrice && item.price && Number(item.salePrice.amount) < Number(item.price.amount);
      return {
        id: `yacht-featured-${activityId(item)}`,
        link: { label: item.title, href: `/activities/${encodeURIComponent(item.slug)}` },
        image: { url: item.imageUrl || FALLBACK_THUMB, alt: item.title },
        badge: hasSale ? "Offer" : "Cruise",
        rating: hasSale ? "Now" : "From",
        oldPrice: hasSale ? money(item.price) : null,
        price: money(current),
      };
    }),
  };
}

function buildVisaMenu(sections) {
  const safeSections = Array.isArray(sections) ? sections.filter((section) => section?.items?.length) : [];
  const groups = safeSections.map((section) => ({
    id: `visa-${section.slug}`,
    icon: section.slug === "evisa" ? "⚡" : "◇",
    label: section.title,
    items: section.items.map((item) => ({
      id: `visa-${section.slug}-${item.id || item.slug}`,
      link: { label: item.title || item.country, href: `/visas/${encodeURIComponent(item.slug)}` },
      sub: item.country,
      image: {
        url: `/flags/${String(item.countryCode || "").toLowerCase()}.svg`,
        alt: `${item.country} flag`,
      },
    })),
  }));

  // Lead with the most popular visas across every section (first twelve distinct ones), as the other menus do.
  if (safeSections.length > 1) {
    const seen = new Set();
    const popularItems = [];
    safeSections.forEach((section) => section.items.forEach((item) => {
      const key = item.id || item.slug;
      if (!seen.has(key) && popularItems.length < 12) {
        seen.add(key);
        popularItems.push({
          id: `visa-popular-${key}`,
          link: { label: item.title || item.country, href: `/visas/${encodeURIComponent(item.slug)}` },
          sub: item.country,
          image: { url: `/flags/${String(item.countryCode || "").toLowerCase()}.svg`, alt: `${item.country} flag` },
        });
      }
    }));
    groups.unshift({ id: "visa-popular", icon: "★", label: "Popular visas", items: popularItems });
  }

  if (!groups.length) {
    groups.push({
      id: "visa-all",
      icon: "◇",
      label: "Visa services",
      items: [{
        id: "visa-all-link",
        link: { label: "View all visa services", href: "/visas" },
        sub: "Find the right visa for your trip",
        image: { url: FALLBACK_THUMB, alt: "Visa services" },
      }],
    });
  }

  const featured = safeSections.flatMap((section) => section.items).slice(0, 4);
  return {
    regionAriaLabel: "Visa services menu",
    sidebarAriaLabel: "Visa collections",
    groups,
    trendingLabel: "Visa services",
    trendingTagline: "Browse by country",
    deals: featured.map((item) => ({
      id: `visa-featured-${item.id || item.slug}`,
      link: { label: item.title || item.country, href: `/visas/${encodeURIComponent(item.slug)}` },
      image: {
        url: `/flags/${String(item.countryCode || "").toLowerCase()}.svg`,
        alt: `${item.country} flag`,
      },
      badge: item.kind === "evisa" ? "eVisa" : "Visa",
      rating: "From",
      price: money(item.startingPrice),
    })),
  };
}

export default function MegaMenu({ isOpen, menu = "default", onMouseEnter, onMouseLeave, onClose }) {
  const defaultMega = useHeaderContent().megaMenu;
  const activityItems = useActivityMenuContent();
  const visaSections = useVisaMenuContent();
  const catalogMenus = useCatalogMenus();
  const activityMega = useMemo(() => buildActivityMenu(activityItems), [activityItems]);
  const visaMega = useMemo(() => buildVisaMenu(visaSections), [visaSections]);
  const yachtMega = useMemo(() => buildYachtMenu(activityItems), [activityItems]);
  const fallbacks = useMemo(() => ({ cruises: buildFallbackMenu("cruises"), events: buildFallbackMenu("events") }), []);
  const mega =
    menu === "activities" ? activityMega
    : menu === "visas" ? visaMega
    : menu === "holidays" ? catalogMenus.holidays || defaultMega // the editorial CMS menu is the safety net
    : menu === "cruises" ? catalogMenus.cruises || fallbacks.cruises
    : menu === "events" ? catalogMenus.events || fallbacks.events
    : menu === "yachts" ? yachtMega
    : defaultMega;
  const variant = menu === "visas" ? "visa" : menu;
  const groups = mega.groups;
  const [activeCategoryId, setActiveCategoryId] = useState(groups[0]?.id);

  const activeCategory = groups.find((c) => c.id === activeCategoryId) || groups[0];
  const selectedCategoryId = activeCategory?.id;
  // Catalog menus store each item once (`mega.items`) and list ids per group; the others list the items themselves.
  const categoryItems = activeCategory?.itemIds
    ? activeCategory.itemIds.map((id) => mega.items?.[id]).filter(Boolean)
    : activeCategory?.items || [];

  return (
    <div
      className={`mm-overlay-panel is-${variant}${isOpen ? " is-open" : ""}`}
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
            const isActive = cat.id === selectedCategoryId;
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
            {categoryItems.map((item) => (
              <CmsLink
                key={item.id}
                href={item.link.href}
                className={`mm-item-card${item.tone ? ` is-${item.tone}` : ""}`}
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
      {(mega.deals || []).length > 0 && <div className="mm-bottom-showcase-bar">
        <div className="mm-bottom-lead">
          <div className="mm-bottom-tag">
            <span className="mm-sparkle-star">✦</span>
            <span>{mega.trendingLabel}</span>
          </div>
          <span className="mm-bottom-tagline">{mega.trendingTagline}</span>
        </div>

        <div className="mm-bottom-cards-grid">
          {(mega.deals || []).map((deal) => {
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
      </div>}
    </div>
  );
}
