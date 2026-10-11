// Live data for the header dropdowns of Holidays, Cruises and Events (Activities and Visas are built in MegaMenu.js
// from their own catalogs; Yachts reuses the activity catalog). Each builder returns the same compact shape the
// mega menu renders: { groups: [{ id, icon, label, items }], deals, ... }. The shape is deliberately small
// (names, links, one image, one line of text per item) because it is serialised into the first HTML of every page.
//
// Server only: it calls the public catalog API, cached by Next's data cache (see `revalidate` in the lib files).
// Every builder rejects when its API is unavailable; the layout turns that into `null` and the menu falls back to a
// plain "browse all" link, so a failing API can never break the header.

import { getEventHome, listEvents } from "./events";
import { listCruises } from "./cruises";
import { listHolidays } from "./holidays";

const FALLBACK_THUMB = "/images/destination-a.jpg";
/** Items shown per group; the rest is reachable through the "View all" tile. */
export const MENU_ITEM_LIMIT = 12;
/** Groups in the left column. Beyond this the list gets long and the least useful groups (smallest) are dropped. */
const MAX_GROUPS = 14;
const FETCH_LIMIT = 48;

const money = (value) => {
  if (!value || !Number.isFinite(Number(value.amount))) return "";
  return `${value.currency || "AED"} ${Number(value.amount).toLocaleString("en")}`;
};
const from = (value) => (money(value) ? `from ${money(value)}` : "");
const nights = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? `${n} night${Number(n) === 1 ? "" : "s"}` : "");
const join = (...parts) => parts.filter(Boolean).join(" · ");
// The alt text is omitted on purpose: the menu falls back to the item label, and every repeated byte ships on every page.
const image = (url) => ({ url: url || FALLBACK_THUMB });

/** "10 Oct" in the operating time zone (Dubai), or "" when there is no date. */
function shortDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });
}

/** Buckets items by one or more keys and returns the buckets largest first (ties alphabetical). */
function bucket(items, keysOf) {
  const buckets = new Map();
  for (const item of items) {
    for (const key of new Set(keysOf(item).filter(Boolean))) {
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    }
  }
  return [...buckets.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

/** Turns bucketed items into a menu group; adds a "View all" tile when the group has more than it shows. */
function makeGroup({ id, icon, label, items, toItem, viewAll }) {
  const visible = items.slice(0, MENU_ITEM_LIMIT).map(toItem);
  if (viewAll && items.length > MENU_ITEM_LIMIT) {
    visible.push({
      id: `${id}-all`,
      link: { label: viewAll.label, href: viewAll.href },
      sub: `${items.length} to explore`,
      image: visible[0]?.image || image(null),
      tone: "browse",
    });
  }
  return { id, icon, label, items: visible };
}

const withCap = (groups) => groups.slice(0, MAX_GROUPS);

/**
 * The same item appears in several groups ("Most popular", its city, its theme), so the menu stores every item once in
 * `items` and each group lists item ids. This roughly halves what is serialised into every page.
 */
function compact(groups) {
  const items = {};
  const slim = groups.map((group) => ({
    id: group.id,
    icon: group.icon,
    label: group.label,
    itemIds: group.items.map((item) => {
      items[item.id] = item;
      return item.id;
    }),
  }));
  return { items, groups: slim };
}

// ---------------------------------------------------------------- holidays

const holidayItem = (pkg) => ({
  id: `holiday-${pkg.slug}`,
  link: { label: pkg.title, href: `/holidays/${encodeURIComponent(pkg.slug)}` },
  sub: join(nights(pkg.durationNights), from(pkg.salePrice || pkg.price)),
  image: image(pkg.coverImage),
});

export function buildHolidayMenu(items) {
  const packages = (Array.isArray(items) ? items : []).filter((p) => p?.slug && p?.title);
  if (!packages.length) return null;

  const popular = makeGroup({ id: "holiday-popular", icon: "★", label: "Most popular packages", items: packages, toItem: holidayItem });
  const byDestination = bucket(packages, (p) => p.destinations || []).map(([name, group]) =>
    makeGroup({
      id: `holiday-dest-${name}`,
      icon: "◆",
      label: `Holidays in ${name}`,
      items: group,
      toItem: holidayItem,
      viewAll: { label: `View all ${name} holidays`, href: `/holidays/destination/${encodeURIComponent(name)}` },
    }),
  );
  const byTheme = bucket(packages, (p) => p.themes || []).map(([name, group]) =>
    makeGroup({ id: `holiday-theme-${name}`, icon: "✦", label: name, items: group, toItem: holidayItem }),
  );

  const featured = packages.filter((p) => p.salePrice || p.price).slice(0, 4);
  return {
    regionAriaLabel: "Holiday packages menu",
    sidebarAriaLabel: "Holiday collections",
    ...compact(withCap([popular, ...byDestination, ...byTheme])),
    trendingLabel: "Popular packages",
    trendingTagline: "Live from our holiday catalog",
    deals: featured.map((p) => {
      const sale = p.salePrice && p.price && Number(p.salePrice.amount) < Number(p.price.amount);
      return {
        id: `holiday-featured-${p.slug}`,
        link: { label: p.title, href: `/holidays/${encodeURIComponent(p.slug)}` },
        image: image(p.coverImage),
        badge: sale ? "Offer" : "Package",
        rating: sale ? "Now" : "From",
        oldPrice: sale ? money(p.price) : null,
        price: money(p.salePrice || p.price),
      };
    }),
  };
}

// ---------------------------------------------------------------- cruises

const cruiseItem = (cruise) => ({
  id: `cruise-${cruise.slug}`,
  link: { label: cruise.title, href: `/cruises/${encodeURIComponent(cruise.slug)}` },
  sub: join(nights(cruise.durationNights), cruise.cruiseLine),
  image: image(cruise.coverImage),
});

export function buildCruiseMenu(items) {
  const cruises = (Array.isArray(items) ? items : []).filter((c) => c?.slug && c?.title);
  if (!cruises.length) return null;

  const popular = makeGroup({ id: "cruise-popular", icon: "★", label: "Most popular cruises", items: cruises, toItem: cruiseItem });
  const byCity = bucket(cruises, (c) => [c.departureCity]).map(([name, group]) =>
    makeGroup({
      id: `cruise-city-${name}`,
      icon: "⚓",
      label: `Cruises from ${name}`,
      items: group,
      toItem: cruiseItem,
      viewAll: { label: `View all cruises from ${name}`, href: `/cruises/from/${encodeURIComponent(name)}` },
    }),
  );
  const byRegion = bucket(cruises, (c) => [c.region]).map(([name, group]) =>
    makeGroup({
      id: `cruise-region-${name}`,
      icon: "≈",
      label: `${name} cruises`,
      items: group,
      toItem: cruiseItem,
      viewAll: { label: `View all ${name} cruises`, href: `/cruises?region=${encodeURIComponent(name)}` },
    }),
  );
  const byLine = bucket(cruises, (c) => [c.cruiseLine]).map(([name, group]) =>
    makeGroup({
      id: `cruise-line-${name}`,
      icon: "◇",
      label: name,
      items: group,
      toItem: cruiseItem,
      viewAll: { label: `View all ${name} cruises`, href: `/cruises?line=${encodeURIComponent(name)}` },
    }),
  );

  const featured = cruises.filter((c) => c.price).slice(0, 4);
  return {
    regionAriaLabel: "Cruises menu",
    sidebarAriaLabel: "Cruise collections",
    ...compact(withCap([popular, ...byCity, ...byRegion, ...byLine])),
    trendingLabel: "Popular cruises",
    trendingTagline: "Live from our cruise catalog",
    deals: featured.map((c) => ({
      id: `cruise-featured-${c.slug}`,
      link: { label: c.title, href: `/cruises/${encodeURIComponent(c.slug)}` },
      image: image(c.coverImage),
      badge: "Cruise",
      rating: nights(c.durationNights) || "From",
      price: money(c.price),
    })),
  };
}

// ---------------------------------------------------------------- events

const eventItem = (event) => ({
  id: `event-${event.slug}`,
  link: { label: event.title, href: `/events/${encodeURIComponent(event.slug)}` },
  sub: join(shortDate(event.nextDate), event.venue || event.city),
  image: image(event.coverImage),
});

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** `soonest` and `popular` are two lists of the same events; the first one leads the menu. */
export function buildEventMenu({ soonest, popular, categories }) {
  const soon = (Array.isArray(soonest) ? soonest : []).filter((e) => e?.slug && e?.title);
  const pop = (Array.isArray(popular) ? popular : []).filter((e) => e?.slug && e?.title);
  const all = pop.length ? pop : soon;
  if (!all.length) return null;

  const slugOf = new Map((categories || []).map((c) => [c.name, c.slug]));
  const happeningSoon = soon.length
    ? makeGroup({ id: "event-soon", icon: "◷", label: "Happening soon", items: soon, toItem: eventItem, viewAll: { label: "View all upcoming events", href: "/events" } })
    : null;
  const mostPopular = makeGroup({ id: "event-popular", icon: "★", label: "Most popular events", items: all, toItem: eventItem });
  const byCategory = bucket(all, (e) => [e.category]).map(([name, group]) =>
    makeGroup({
      id: `event-category-${name}`,
      icon: "✦",
      label: name,
      items: group,
      toItem: eventItem,
      viewAll: { label: `View all ${name} events`, href: `/events/category/${encodeURIComponent(slugOf.get(name) || slugify(name))}` },
    }),
  );
  const byCity = bucket(all, (e) => [e.city]).map(([name, group]) =>
    makeGroup({
      id: `event-city-${name}`,
      icon: "◆",
      label: `Events in ${name}`,
      items: group,
      toItem: eventItem,
      viewAll: { label: `View all events in ${name}`, href: `/events/in/${encodeURIComponent(name)}` },
    }),
  );

  const featured = (soon.length ? soon : all).filter((e) => e.price).slice(0, 4);
  return {
    regionAriaLabel: "Events menu",
    sidebarAriaLabel: "Event collections",
    ...compact(withCap([happeningSoon, mostPopular, ...byCategory, ...byCity].filter(Boolean))),
    trendingLabel: "Happening soon",
    trendingTagline: "Live from our events calendar",
    deals: featured.map((e) => ({
      id: `event-featured-${e.slug}`,
      link: { label: e.title, href: `/events/${encodeURIComponent(e.slug)}` },
      image: image(e.coverImage),
      badge: e.category || "Event",
      rating: shortDate(e.nextDate) || "From",
      price: money(e.price),
    })),
  };
}

// ---------------------------------------------------------------- loaders (one catalog call each, in parallel)

const opts = { currency: "AED" };

export async function getHolidayMenu() {
  const list = await listHolidays({ limit: FETCH_LIMIT, sort: "popular" }, opts);
  return buildHolidayMenu(list?.items);
}

export async function getCruiseMenu() {
  const list = await listCruises({ limit: FETCH_LIMIT, sort: "popular" }, opts);
  return buildCruiseMenu(list?.items);
}

export async function getEventMenu() {
  const [soonest, popular, home] = await Promise.all([
    listEvents({ limit: FETCH_LIMIT, sort: "soonest" }, opts),
    listEvents({ limit: FETCH_LIMIT, sort: "popular" }, opts),
    getEventHome(opts).catch(() => null),
  ]);
  return buildEventMenu({ soonest: soonest?.items, popular: popular?.items, categories: home?.categories });
}
