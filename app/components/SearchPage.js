"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getActivities } from "../lib/api";
import { listCruises } from "../lib/cruises";
import { listEvents } from "../lib/events";
import { listHolidays } from "../lib/holidays";
import { buildCities, priceInfo, searchCatalog, trendingActivities } from "../lib/search";
import { listVisas } from "../lib/visas";
import { useApp } from "./AppProvider";
import ShowcaseCard, { ShowcaseSkeleton } from "./ShowcaseCard";
import { VisaCard } from "./visas/VisaParts";
import "../search.css";

const CRUISE_CATEGORY = "Dhow Cruise & Yacht";
const FALLBACK_IMG = "/images/destination-a.jpg";

const TABS = [
  { id: "activities", label: "Activities", placeholder: "Activities", icon: "🎡" },
  { id: "holidays", label: "Holidays", placeholder: "Holidays", icon: "🏖️" },
  { id: "visas", label: "Visas", placeholder: "Visas", icon: "🛂" },
  { id: "cruises", label: "Cruises", placeholder: "Cruises", icon: "🚢" },
  { id: "yachts", label: "Yachts", placeholder: "Yachts", icon: "⛵" },
  { id: "events", label: "Events", placeholder: "Events", icon: "🎟️" },
];

const IDEAS = [
  "Things to do in Dubai",
  "Top attractions in Abu Dhabi",
  "Best experiences in UAE for tourists",
  "Dubai activities for couples",
  "Desert safari in Dubai",
  "Theme parks in Abu Dhabi",
  "Dhow cruise dinner",
  "Water activities in Dubai",
];

const SPARK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 3l1.8 4.7L16.5 9.5l-4.7 1.8L10 16l-1.8-4.7L3.5 9.5l4.7-1.8z" fill="currentColor" />
    <path d="M18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1-2.1-.9 2.1-.9z" fill="currentColor" />
  </svg>
);

const PIN = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

const CATALOG_LOADERS = {
  activities: (currency, signal) => getActivities(currency, { signal }),
  holidays: (currency, signal) => listHolidays({ limit: 100, sort: "popular" }, { currency, signal }).then((data) => data.items || []),
  // The Visas API caps a page at 60 records; larger values are rejected with 400.
  visas: (currency, signal) => listVisas({ limit: 60 }, { currency, signal }).then((data) => data.items || []),
  cruises: (currency, signal) => listCruises({ limit: 100, sort: "popular" }, { currency, signal }).then((data) => data.items || []),
  events: (currency, signal) => listEvents({ limit: 100, sort: "soonest" }, { currency, signal }).then((data) => data.items || []),
};

function normaliseItem(item, type) {
  if (type === "activities" || type === "yachts") {
    return { ...item, href: `/activities/${item.slug}` };
  }
  if (type === "holidays") {
    return {
      ...item,
      href: `/holidays/${item.slug}`,
      imageUrl: item.coverImage,
      categories: [...(item.themes || []), item.country].filter(Boolean),
      tripTypes: item.collections || [],
    };
  }
  if (type === "visas") {
    return {
      ...item,
      href: `/visas/${item.slug}`,
      destinations: [item.country].filter(Boolean),
      categories: [item.kind, item.processing, item.validity].filter(Boolean),
      price: item.startingPrice,
    };
  }
  if (type === "cruises") {
    return {
      ...item,
      href: `/cruises/${item.slug}`,
      imageUrl: item.coverImage,
      destinations: [item.departureCity].filter(Boolean),
      categories: [item.region, item.cruiseLine, ...(item.tags || [])].filter(Boolean),
    };
  }
  return {
    ...item,
    href: `/events/${item.slug}`,
    imageUrl: item.coverImage,
    destinations: [item.city].filter(Boolean),
    categories: [item.category, item.venue, ...(item.tags || [])].filter(Boolean),
  };
}

function CatalogCard({ item, index }) {
  return (
    <ShowcaseCard
      style={{ "--i": index }}
      href={item.href}
      title={item.title}
      image={item.imageUrl}
      fallbackImage={FALLBACK_IMG}
      tag={item.categories?.[0]}
      stock={item.stock}
      location={(item.destinations || []).join(", ") || undefined}
      price={priceInfo(item)}
      priceFallback="Price on request"
    />
  );
}

function SearchResultCard({ item, index, tab }) {
  if (tab === "visas") return <VisaCard item={item} reveal={false} />;
  return <CatalogCard item={item} index={index} />;
}

function destinationHref(tab, name) {
  if (tab === "holidays") return `/holidays?destination=${encodeURIComponent(name)}`;
  if (tab === "visas") return `/visas?country=${encodeURIComponent(name)}`;
  if (tab === "cruises") return `/cruises/from/${encodeURIComponent(name)}`;
  if (tab === "events") return `/events/in/${encodeURIComponent(name)}`;
  return `/activities?destination=${encodeURIComponent(name)}`;
}

function CityRow({ city, index, tab }) {
  return (
    <Link
      className="mk-s-city"
      style={{ "--i": index }}
      href={destinationHref(tab, city.name)}
    >
      <span className="mk-s-pin">{PIN}</span>
      <span>
        <span className="mk-s-city-name">{city.name}</span>
        <span className="mk-s-city-sub">{city.country || `${city.count} experiences`}</span>
      </span>
    </Link>
  );
}

export default function SearchPage() {
  const { currency } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef(null);

  const initialTab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "activities";
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState(params.get("q") || "");
  const [catalogs, setCatalogs] = useState({});
  const [errors, setErrors] = useState({});
  const [showAllCities, setShowAllCities] = useState(false);

  useEffect(() => {
    const catalog = tab === "yachts" ? "activities" : tab;
    const cacheKey = `${currency}:${catalog}`;
    if (catalogs[cacheKey]) return undefined;
    const controller = new AbortController();
    CATALOG_LOADERS[catalog](currency, controller.signal)
      .then((data) => {
        setErrors((current) => ({ ...current, [cacheKey]: false }));
        setCatalogs((current) => ({ ...current, [cacheKey]: data }));
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError") setErrors((current) => ({ ...current, [cacheKey]: true }));
      });
    return () => controller.abort();
  }, [tab, currency, catalogs]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep the URL shareable without spamming history: replace, debounced.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams();
      if (query.trim()) next.set("q", query.trim());
      if (tab !== "activities") next.set("tab", tab);
      const qs = next.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    }, 350);
    return () => clearTimeout(id);
  }, [query, tab, router]);

  const scoped = useMemo(() => {
    const catalog = tab === "yachts" ? "activities" : tab;
    const items = catalogs[`${currency}:${catalog}`];
    if (!items) return null;
    const selected = tab === "yachts"
      ? items.filter((item) => item.categories?.includes(CRUISE_CATEGORY))
      : items;
    return selected.map((item) => normaliseItem(item, tab));
  }, [catalogs, currency, tab]);

  const error = errors[`${currency}:${tab === "yachts" ? "activities" : tab}`];

  const cities = useMemo(() => (scoped ? buildCities(scoped) : []), [scoped]);
  const trending = useMemo(() => (scoped ? trendingActivities(scoped, 9) : []), [scoped]);
  const results = useMemo(() => (scoped ? searchCatalog(scoped, cities, query) : null), [scoped, cities, query]);

  const activeTab = TABS.find((t) => t.id === tab);
  const hasQuery = query.trim().length > 0;
  const visibleCities = showAllCities ? cities : cities.slice(0, 8);
  const noInventory = scoped && scoped.length === 0;

  const goBack = () => (window.history.length > 1 ? router.back() : router.push("/"));
  const applyIdea = (text) => {
    setQuery(text);
    setTab("activities");
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="mk-search-page">
      <div className="mk-container">
        <form className="mk-s-bar" role="search" onSubmit={(e) => e.preventDefault()}>
          <button type="button" className="mk-s-back" onClick={goBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <span className="mk-s-field">
            {!hasQuery && (
              <span className="mk-s-placeholder" aria-hidden="true">
                Search for <b key={tab}>{activeTab.placeholder}</b>
              </span>
            )}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${activeTab.label}`}
              autoComplete="off"
              spellCheck="false"
            />
          </span>
          {hasQuery && (
            <button type="button" className="mk-s-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search">
              ×
            </button>
          )}
          <span className="mk-s-spark" aria-hidden="true">{SPARK}</span>
        </form>

        <div className="mk-s-ideas" role="list" aria-label="Search ideas">
          {IDEAS.map((idea) => (
            <button key={idea} role="listitem" type="button" className="mk-s-idea" onClick={() => applyIdea(idea)}>
              {idea}
              <span aria-hidden="true">{SPARK}</span>
            </button>
          ))}
        </div>

        <div className="mk-s-tabs" role="tablist" aria-label="Search category">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={t.id === tab}
              className={`mk-s-tab${t.id === tab ? " is-active" : ""}`}
              onClick={() => {
                setTab(t.id);
                setShowAllCities(false);
              }}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mk-s-note mk-s-error" role="alert">
            We could not load {activeTab.label.toLowerCase()} right now. Please try again shortly.
          </p>
        )}

        {!error && noInventory && (
          <div className="mk-s-empty">
            <h2>{activeTab.label} are coming soon</h2>
            <p>We are still adding {activeTab.label.toLowerCase()} to Karnish. Tell us what you need and our team will arrange it.</p>
            <div className="mk-s-empty-actions">
              <Link className="mk-btn" href="/contact">Talk to us</Link>
              <button type="button" className="mk-s-link" onClick={() => setTab("activities")}>Browse activities instead</button>
            </div>
          </div>
        )}

        {!error && !noInventory && hasQuery && results && (
          <div className="mk-s-results" aria-live="polite">
            {results.cities.length === 0 && results.activities.length === 0 ? (
              <div className="mk-s-empty">
                <h2>No matches for “{query.trim()}”</h2>
                <p>Try a city like Dubai or Abu Dhabi, or a style such as desert safari, theme park or cruise.</p>
              </div>
            ) : (
              <>
                {results.cities.length > 0 && (
                  <section>
                    <h2 className="mk-s-h">Destinations</h2>
                    <div className="mk-s-cities">
                      {results.cities.map((city, i) => <CityRow key={city.name} city={city} index={i} tab={tab} />)}
                    </div>
                  </section>
                )}
                {results.activities.length > 0 && (
                  <section>
                    <h2 className="mk-s-h">
                      {activeTab.label} <span className="mk-s-count">{results.activities.length}</span>
                    </h2>
                    <div className="sc-grid">
                      {results.activities.slice(0, 24).map((item, i) => <SearchResultCard key={item._id || item.id || item.slug} item={item} index={i % 12} tab={tab} />)}
                    </div>
                    {results.activities.length > 24 && (
                      <p className="mk-s-more">
                        Showing 24 of {results.activities.length}.{" "}
                        <Link className="mk-s-link" href={`/${tab === "yachts" ? "activities" : tab}?q=${encodeURIComponent(query.trim())}`}>See all results</Link>
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {!error && !noInventory && !hasQuery && (
          <>
            <section className="mk-s-section">
              <h2 className="mk-s-h">Things to do in</h2>
              {scoped ? (
                <div className="mk-s-cities">
                  {visibleCities.map((city, i) => <CityRow key={city.name} city={city} index={i} tab={tab} />)}
                </div>
              ) : (
                <div className="mk-s-cities" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => <span key={i} className="mk-s-skel mk-s-skel-city" />)}
                </div>
              )}
              {cities.length > 8 && (
                <button type="button" className="mk-s-seemore" onClick={() => setShowAllCities((v) => !v)} aria-expanded={showAllCities}>
                  {showAllCities ? "See less" : `See ${cities.length - 8} more`}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ transform: showAllCities ? "rotate(180deg)" : "none" }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </section>

            <section className="mk-s-section">
              <h2 className="mk-s-h">Trending {activeTab.label}</h2>
              <div className="sc-grid">
                {scoped
                  ? trending.map((item, i) => <SearchResultCard key={item._id || item.id || item.slug} item={item} index={i} tab={tab} />)
                  : <ShowcaseSkeleton count={8} />}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
