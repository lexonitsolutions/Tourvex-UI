"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice, getActivities } from "../lib/api";
import { holdAmbient } from "../lib/motion";
import { buildCities, priceInfo, searchCatalog, trendingActivities } from "../lib/search";
import { useApp } from "./AppProvider";
import { useMotion } from "./MotionShell";

const FALLBACK_IMG = "/images/destination-a.jpg";
const IDEAS = ["Things to do in Dubai", "Desert safari in Dubai", "Theme parks in Abu Dhabi", "Dhow cruise dinner"];

const Spark = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 3.5l1.7 4.6 4.6 1.7-4.6 1.7L10 16.1l-1.7-4.6L3.7 9.8l4.6-1.7z" />
    <path d="M17.5 13l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" />
  </svg>
);

const showFallback = (e) => {
  if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
};

const Row = memo(function Row({ item, onNavigate }) {
  const price = priceInfo(item);
  return (
    <Link className="mk-sq-row" href={`/activities/${item.slug}`} onClick={onNavigate}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt="" width="56" height="56" loading="lazy" decoding="async" onError={showFallback} />
      <span className="mk-sq-row-text">
        <strong>{item.title}</strong>
        <span>{[item.destinations?.join(", "), price && `from ${formatPrice(price.amount, price.currency)}`].filter(Boolean).join(" · ")}</span>
      </span>
    </Link>
  );
});

const Skeletons = ({ count }) => Array.from({ length: count }, (_, i) => <span key={i} className="mk-sq-skel is-row" aria-hidden="true" />);

/**
 * Quick search card that grows out of the round button in the mobile tab bar (same pattern as the account card).
 * Built hidden once; opening is a class toggle. Full results live on /search.
 */
export default function MobileSearchCard({ open, onClose }) {
  const { currency } = useApp();
  const { setScrollLocked } = useMotion();
  const router = useRouter();
  const [host, setHost] = useState(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const loadedFor = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.querySelector(".mk"));
  }, []);

  // The catalog is fetched the first time the card opens (and again when the currency changes).
  useEffect(() => {
    if (!open || loadedFor.current === currency) return undefined;
    let live = true;
    loadedFor.current = currency;
    getActivities(currency)
      .then((data) => {
        if (!live) return;
        setError(false);
        setItems(data);
      })
      .catch(() => {
        if (!live) return;
        loadedFor.current = null;
        setError(true);
      });
    return () => {
      live = false;
    };
  }, [open, currency]);

  useEffect(() => {
    if (!open) return undefined;
    setScrollLocked(true);
    holdAmbient("search-card", true);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const focusTimer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 420);
    // Keep the card above the on-screen keyboard.
    const vv = window.visualViewport;
    const fit = () => {
      if (vv) panelRef.current?.style.setProperty("--mk-vvh", `${Math.round(vv.height)}px`);
    };
    fit();
    vv?.addEventListener("resize", fit);
    return () => {
      clearTimeout(focusTimer);
      setScrollLocked(false);
      holdAmbient("search-card", false);
      document.removeEventListener("keydown", onKey);
      vv?.removeEventListener("resize", fit);
    };
  }, [open, onClose, setScrollLocked]);

  const cities = useMemo(() => (items ? buildCities(items) : []), [items]);
  const results = useMemo(() => (items && query.trim() ? searchCatalog(items, cities, query) : null), [items, cities, query]);
  const trending = useMemo(() => (items ? trendingActivities(items, 4) : []), [items]);

  if (!host) return null;

  const hasQuery = query.trim().length > 0;
  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    onClose();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };
  const cityLink = (city) => (
    <Link key={city.name} className="mk-sq-city" href={`/activities?destination=${encodeURIComponent(city.name)}`} onClick={onClose}>{city.name}</Link>
  );

  return createPortal(
    <div className={`mk-sq${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="mk-sq-scrim" aria-label="Close search" tabIndex={-1} onClick={onClose} />
      <section ref={panelRef} className="mk-sq-panel" role="dialog" aria-modal="true" aria-label="Search">
        <form className="mk-sq-bar" role="search" onSubmit={submit}>
          <span className="mk-sq-spark" aria-hidden="true"><Spark size={20} /></span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities, cities, experiences"
            aria-label="Search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck="false"
          />
          {hasQuery && (
            <button type="button" className="mk-sq-clear" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>×</button>
          )}
          <button type="button" className="mk-sq-cancel" onClick={onClose}>Cancel</button>
        </form>

        <div className="mk-sq-scroll" data-lenis-prevent>
          {error && <p className="mk-sq-note" role="alert">We could not load experiences right now.</p>}

          {!hasQuery && (
            <>
              <div className="mk-sq-ideas">
                {IDEAS.map((idea) => (
                  <button key={idea} type="button" className="mk-sq-idea" onClick={() => { setQuery(idea); inputRef.current?.focus({ preventScroll: true }); }}>
                    {idea}
                  </button>
                ))}
              </div>
              {!error && (
                <>
                  <h2 className="mk-sq-h">Things to do in</h2>
                  <div className="mk-sq-cities">
                    {items ? cities.slice(0, 8).map(cityLink) : Array.from({ length: 5 }, (_, i) => <span key={i} className="mk-sq-skel" aria-hidden="true" />)}
                  </div>
                  <h2 className="mk-sq-h">Trending</h2>
                  <div className="mk-sq-list">
                    {items ? trending.map((item) => <Row key={item._id || item.slug} item={item} onNavigate={onClose} />) : <Skeletons count={3} />}
                  </div>
                </>
              )}
            </>
          )}

          {hasQuery && !error && !results && <div className="mk-sq-list"><Skeletons count={3} /></div>}

          {hasQuery && results && (
            <div aria-live="polite">
              {results.cities.length === 0 && results.activities.length === 0 ? (
                <p className="mk-sq-note">No matches for “{query.trim()}”. Try a city like Dubai or a style such as desert safari.</p>
              ) : (
                <>
                  {results.cities.length > 0 && (
                    <>
                      <h2 className="mk-sq-h">Destinations</h2>
                      <div className="mk-sq-cities">{results.cities.slice(0, 6).map(cityLink)}</div>
                    </>
                  )}
                  {results.activities.length > 0 && (
                    <>
                      <h2 className="mk-sq-h">Activities</h2>
                      <div className="mk-sq-list">
                        {results.activities.slice(0, 5).map((item) => <Row key={item._id || item.slug} item={item} onNavigate={onClose} />)}
                      </div>
                    </>
                  )}
                  <button type="button" className="mk-sq-all" onClick={submit}>See all results</button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>,
    host
  );
}
