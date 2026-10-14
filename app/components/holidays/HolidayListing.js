"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HOLIDAY_SORTS, listHolidays } from "../../lib/holidays";
import { useDestinationWeather } from "../../lib/weather";
import { useApp } from "../AppProvider";
import { CardSkeletons, StateMessage, plural, HolidayPackageCard } from "./HolidayParts";

const PAGE_SIZE = 12;

const POPULAR_DESTINATIONS = [
  { name: "Dubai", label: "Dubai City", country: "United Arab Emirates" },
  { name: "Abu Dhabi", label: "Abu Dhabi", country: "United Arab Emirates" },
  { name: "Ras Al Khaimah", label: "Ras Al Khaimah", country: "United Arab Emirates" },
  { name: "Sharjah", label: "Sharjah", country: "United Arab Emirates" },
  { name: "Singapore", label: "Singapore", country: "Singapore" },
  { name: "Bangkok", label: "Bangkok", country: "Thailand" },
  { name: "Bali", label: "Bali", country: "Indonesia" },
];

const DEFAULT_CATEGORIES = ["All", "Family", "Culture", "Budget", "Beach", "Luxury"];

const VALID_SORTS = new Set(HOLIDAY_SORTS.map((s) => s.value));

const svgIcon = (paths, props = {}) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {paths}
  </svg>
);

const SlidersIcon = () =>
  svgIcon(
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  );

export default function HolidayListing({ name }) {
  const { currency } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const country = search.get("country") || "";
  const theme = search.get("theme") || "";
  const sortParam = search.get("sort") || "popular";
  const sort = VALID_SORTS.has(sortParam) ? sortParam : "popular";
  const countryMode = !!country && country === name;

  // Real-time live temperature for this destination
  const weather = useDestinationWeather(name);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [showDestMenu, setShowDestMenu] = useState(false);
  const [showSortBar, setShowSortBar] = useState(false);

  const destMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (destMenuRef.current && !destMenuRef.current.contains(e.target)) {
        setShowDestMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [state, setState] = useState(null);
  const [more, setMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const query = useCallback(
    (page) => ({
      destination: countryMode ? undefined : name,
      country: country || undefined,
      theme: theme && theme !== "All" ? theme : undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [name, country, countryMode, theme, sort]
  );

  const baseKey = `${name}|${country}`;
  const [baseThemes, setBaseThemes] = useState({ key: "", themes: [] });
  const key = `${JSON.stringify(query(1))}#${attempt}#${currency}`;
  const filtered = !!theme && theme !== "All";

  useEffect(() => {
    const controller = new AbortController();
    listHolidays(query(1), { signal: controller.signal, currency })
      .then((res) => {
        setMoreFailed(false);
        setState((prev) => ({
          key,
          items: res.items,
          pagination: res.pagination,
          facets: filtered && prev?.facets ? prev.facets : res.facets,
        }));
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState((prev) => ({ key, failed: true, facets: prev?.facets }));
      });
    return () => controller.abort();
  }, [key, query, filtered, currency]);

  // Extract base themes for this destination
  useEffect(() => {
    const controller = new AbortController();
    listHolidays(
      { destination: countryMode ? undefined : name, country: country || undefined, limit: 48 },
      { signal: controller.signal }
    )
      .then((res) => {
        const counts = new Map();
        res.items.forEach((it) => (it.themes || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
        const themes = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n, count]) => ({ name: n, count }));
        setBaseThemes({ key: baseKey, themes });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [baseKey, name, country, countryMode]);

  const loadMore = () => {
    if (!state?.pagination || more) return;
    setMore(true);
    setMoreFailed(false);
    listHolidays(query(state.pagination.page + 1), { currency })
      .then((res) =>
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...res.items.filter((it) => !prev.items.some((p) => p.slug === it.slug))],
          pagination: res.pagination,
        }))
      )
      .catch(() => setMoreFailed(true))
      .finally(() => setMore(false));
  };

  const update = (patch) => {
    const params = new URLSearchParams(search.toString());
    Object.entries(patch).forEach(([k, value]) => {
      if (value && !(k === "sort" && value === "popular")) params.set(k, value);
      else params.delete(k);
    });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    setSearchQuery("");
    update({ theme: "" });
  };

  const title = countryMode ? country : name;
  const displayCityLabel = name.toLowerCase().includes("city") ? name : `${name} City`;

  const settled = state?.key === key;
  const loading = !settled;
  const error = !!state?.failed && settled;
  const result = state?.pagination ? state : null;
  const total = result?.pagination.total ?? 0;
  const rawItems = result?.items || [];
  const hasMore = result && result.pagination.page < result.pagination.pages;

  // Filter items by client-side search query if provided
  const items = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.toLowerCase().trim();
    return rawItems.filter(
      (it) =>
        it.title?.toLowerCase().includes(q) ||
        it.themes?.some((t) => t.toLowerCase().includes(q)) ||
        it.destinations?.some((d) => d.toLowerCase().includes(q))
    );
  }, [rawItems, searchQuery]);

  // Combine default categories with API themes
  const categoryPills = useMemo(() => {
    const themeList = baseThemes.themes.map((t) => t.name);
    const combined = [...new Set([...DEFAULT_CATEGORIES, ...themeList])];
    return combined.slice(0, 8);
  }, [baseThemes.themes]);

  return (
    <div className="hol-page">
      {/* ── Top Header Section (Rayna/Karnish Style) ── */}
      <section className="hol-dest-head-wrap" aria-label="Destination heading">
        <div className="mk-container">
          <div className="hol-dest-top-row">
            {/* Left: Holiday Packages in City dropdown + Live Weather */}
            <div className="hol-dest-title-group">
              <span className="hol-dest-label">Holiday Packages in</span>

              <div className="hol-dest-picker" ref={destMenuRef}>
                <button
                  type="button"
                  className="hol-dest-picker-btn"
                  onClick={() => setShowDestMenu((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={showDestMenu}
                >
                  <span>{displayCityLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDestMenu && (
                  <div className="hol-dest-menu" role="menu">
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <Link
                        key={dest.name}
                        href={`/holidays/destination/${encodeURIComponent(dest.name)}${dest.country ? `?country=${encodeURIComponent(dest.country)}` : ""}`}
                        role="menuitem"
                        className={dest.name.toLowerCase() === name.toLowerCase() ? "is-active" : ""}
                        onClick={() => setShowDestMenu(false)}
                      >
                        <span>{dest.label}</span>
                        {dest.name.toLowerCase() === name.toLowerCase() && <span>✓</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Temperature Pill Badge */}
              <div
                className="hol-weather-badge"
                title={`Live weather in ${name}: ${weather.temp}°C`}
                aria-label={`Current temperature in ${name} is ${weather.temp} degrees Celsius`}
              >
                <span>{weather.temp}°</span>
                <span className="hol-weather-icon" aria-hidden="true">{weather.icon}</span>
              </div>
            </div>

            {/* Right: Search for Holidays Capsule */}
            <div className="hol-search-capsule" role="search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hol-search-sparkle" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="hol-search-input"
                placeholder="Search for Holidays"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search for Holidays"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="hol-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── Subheader Count & Filter Icon ── */}
          <div className="hol-dest-count-row">
            <h1>
              {result && !error
                ? `${items.length} ${displayCityLabel} Packages`
                : `Finding ${displayCityLabel} Packages…`}
            </h1>

            <button
              type="button"
              className="hol-filter-toggle-btn"
              onClick={() => setShowSortBar((s) => !s)}
              aria-label="Toggle sort and filters"
              aria-expanded={showSortBar}
              title="Filter and Sort"
            >
              <SlidersIcon />
            </button>
          </div>

          {/* Optional expandable sort panel */}
          {showSortBar && (
            <div className="hol-toolbar" style={{ marginTop: 12, marginBottom: 16 }}>
              <label className="hol-sort">
                <span>Sort packages by:</span>
                <span className="hol-select">
                  <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
                    {HOLIDAY_SORTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          )}

          {/* ── Category Filter Pills ── */}
          <div className="hol-category-pills" role="tablist" aria-label="Holiday categories">
            {categoryPills.map((cat) => {
              const isActive = (!theme && cat === "All") || theme === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`hol-cat-pill${isActive ? " is-active" : ""}`}
                  onClick={() => update({ theme: cat === "All" ? "" : cat })}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Package Cards Grid ── */}
      <section className="mk-container hol-list" aria-label="Holiday packages">
        {error ? (
          <StateMessage
            title="We could not load these packages"
            text="Something went wrong while fetching holidays. Please try again."
            action="Try again"
            onAction={() => setAttempt((n) => n + 1)}
          />
        ) : !result ? (
          <div className="hol-pkg-grid">
            <CardSkeletons count={6} />
          </div>
        ) : items.length === 0 && !loading ? (
          <StateMessage
            title={`No holidays found in ${title}`}
            text={
              searchQuery || filtered
                ? "Try adjusting your search or removing a filter to see more packages."
                : "There are no packages here yet. Explore our other destinations."
            }
            action={searchQuery || filtered ? "Clear filters" : undefined}
            onAction={searchQuery || filtered ? clearFilters : undefined}
            href={searchQuery || filtered ? undefined : "/holidays"}
            actionLabel="Back to holidays"
          />
        ) : (
          <>
            <div className={`hol-pkg-grid${loading ? " is-busy" : ""}`} aria-busy={loading}>
              {items.map((item, i) => (
                <HolidayPackageCard
                  key={item.slug || item.id || i}
                  item={item}
                  reveal={false}
                />
              ))}
            </div>

            {hasMore && !searchQuery && (
              <div className="hol-more" style={{ marginTop: 36 }}>
                {moreFailed && <p role="alert">Could not load more packages.</p>}
                <button type="button" className="mk-btn" onClick={loadMore} disabled={more}>
                  {more ? "Loading…" : `Load more (${total - items.length} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
