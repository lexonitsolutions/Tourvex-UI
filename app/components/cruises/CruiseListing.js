"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CRUISE_SORTS, NIGHT_RANGES, listCruises, listingQuery, parseListingParams } from "../../lib/cruises";
import { useApp } from "../AppProvider";
import { CardSkeletons, CruiseCard, IconChevron, StateMessage, formatMonth, plural } from "./CruiseParts";

function Select({ id, label, value, onChange, children }) {
  return (
    <div className="cr-filter">
      <label htmlFor={id}>{label}</label>
      <span className="hol-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
        <IconChevron dir="down" width="16" height="16" />
      </span>
    </div>
  );
}

/**
 * `initial` is the first page rendered on the server for the URL the visitor landed on ({ key, data }), so the first
 * paint has real cards. Later filter changes are fetched in the browser and synced to the query string.
 */
export default function CruiseListing({ city, initial }) {
  const { currency } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const params = parseListingParams(Object.fromEntries(search.entries()));

  const baseQuery = listingQuery(city, params, 1);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const key = `${JSON.stringify(baseQuery)}#${currency}#${attempt}`;
  const initialKey = initial?.data ? `${initial.key}#0` : null;

  const [state, setState] = useState(() =>
    initial?.data ? { key: initialKey, items: initial.data.items, pagination: initial.data.pagination, facets: initial.data.facets } : null
  );
  const [more, setMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);

  useEffect(() => {
    if (state?.key === key) return undefined; // already have this exact page (server render or earlier fetch)
    const controller = new AbortController();
    listCruises(baseQuery, { signal: controller.signal, currency })
      .then((res) => {
        setMoreFailed(false);
        setState({ key, items: res.items, pagination: res.pagination, facets: res.facets });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState((prev) => ({ key, failed: true, facets: prev?.facets }));
      });
    return () => controller.abort();
    // `baseQuery` is derived from `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = () => {
    if (!state?.pagination || more) return;
    setMore(true);
    setMoreFailed(false);
    const forKey = state.key;
    listCruises(listingQuery(city, params, state.pagination.page + 1), { currency })
      .then((res) =>
        setState((prev) =>
          prev?.key !== forKey
            ? prev
            : {
                ...prev,
                items: [...prev.items, ...res.items.filter((it) => !prev.items.some((p) => p.slug === it.slug))],
                pagination: res.pagination,
              }
        )
      )
      .catch(() => setMoreFailed(true))
      .finally(() => setMore(false));
  };

  const update = (patch) => {
    const next = new URLSearchParams(search.toString());
    Object.entries(patch).forEach(([k, value]) => {
      if (value && !(k === "sort" && value === "popular")) next.set(k, value);
      else next.delete(k);
    });
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = !!(params.line || params.region || params.month || params.nights);
  const clearFilters = () => update({ line: "", region: "", month: "", nights: "" });

  const settled = state?.key === key;
  const loading = !settled;
  const error = !!state?.failed && settled;
  const result = state?.pagination ? state : null;
  const total = result?.pagination.total ?? 0;
  const items = result?.items || [];
  const hasMore = result && result.pagination.page < result.pagination.pages;
  const facets = state?.facets || {};
  // Keep an active value selectable even if a later facet response no longer lists it.
  const withActive = (list, active) => (active && !list.some((f) => f.name === active) ? [...list, { name: active }] : list);
  const lines = withActive(facets.lines || [], params.line);
  const regions = withActive(facets.regions || [], params.region);
  const months = withActive(facets.months || [], params.month);

  return (
    <div className="hol-page cr-page">
      <div className="hol-list-head">
        <div className="mk-container">
          <nav className="hol-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/cruises">Cruises</Link></li>
              <li aria-current="page">From {city}</li>
            </ol>
          </nav>
          <h1>Cruises from {city}</h1>
          <p className="hol-list-count" aria-live="polite">
            {result && !error
              ? total
                ? `${plural(total, "cruise")} found${filtered ? " with your filters" : ""} · Fares are indicative, per person, in ${currency}`
                : "No cruises match right now"
              : error
                ? ""
                : "Finding cruises..."}
          </p>
        </div>
      </div>

      <section className="mk-container hol-list" aria-label={`Cruises from ${city}`}>
        <form className="cr-toolbar" role="search" aria-label="Filter and sort cruises" onSubmit={(e) => e.preventDefault()}>
          <Select id="cr-line" label="Cruise line" value={params.line} onChange={(v) => update({ line: v })}>
            <option value="">All lines</option>
            {lines.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </Select>
          <Select id="cr-region" label="Region" value={params.region} onChange={(v) => update({ region: v })}>
            <option value="">All regions</option>
            {regions.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </Select>
          <Select id="cr-month" label="Departure month" value={params.month} onChange={(v) => update({ month: v })}>
            <option value="">Any month</option>
            {months.map((f) => <option key={f.name} value={f.name}>{formatMonth(f.name)}</option>)}
          </Select>
          <Select id="cr-nights" label="Nights" value={params.nights} onChange={(v) => update({ nights: v })}>
            <option value="">Any length</option>
            {NIGHT_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </Select>
          <Select id="cr-sort" label="Sort by" value={params.sort} onChange={(v) => update({ sort: v })}>
            {CRUISE_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          {filtered && (
            <button type="button" className="hol-link cr-clear" onClick={clearFilters}>Clear filters</button>
          )}
        </form>

        {error ? (
          <StateMessage
            title="We could not load these cruises"
            text="Something went wrong while fetching cruises. Please try again."
            action="Try again"
            onAction={() => {
              attemptRef.current += 1;
              setAttempt(attemptRef.current);
            }}
          />
        ) : !result ? (
          <div className="hol-grid cr-grid" aria-busy="true"><CardSkeletons count={6} /></div>
        ) : items.length === 0 && !loading ? (
          <StateMessage
            title={`No cruises found from ${city}`}
            text={filtered ? "Try removing a filter to see more sailings." : "There are no upcoming sailings from here yet. Explore other departure cities."}
            action={filtered ? "Clear filters" : undefined}
            onAction={filtered ? clearFilters : undefined}
            href={filtered ? undefined : "/cruises"}
            actionLabel="Back to cruises"
          />
        ) : (
          <>
            <div className={`hol-grid cr-grid${loading ? " is-busy" : ""}`} aria-busy={loading}>
              {items.map((item, i) => (
                <div className="hol-grid-item" key={item.slug} style={{ "--i": i % 12 }}>
                  <CruiseCard item={item} reveal={false} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="hol-more">
                {moreFailed && <p role="alert">Could not load more cruises.</p>}
                <button type="button" className="mk-btn" onClick={loadMore} disabled={more}>
                  {more ? "Loading..." : `Load more (${total - items.length} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
