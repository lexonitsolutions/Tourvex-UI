"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EVENT_SORTS, listEvents, listingQuery, parseListingParams, titleizeSlug } from "../../lib/events";
import { useApp } from "../AppProvider";
import { CardSkeletons, EventCard, IconChevron, StateMessage, plural } from "./EventParts";

function Select({ id, label, value, onChange, children }) {
  return (
    <div className="ev-filter">
      <label htmlFor={id}>{label}</label>
      <span className="hol-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} suppressHydrationWarning>{children}</select>
        <IconChevron dir="down" width="16" height="16" />
      </span>
    </div>
  );
}

/**
 * Shared by /events/in/[city] (scope = { city }) and /events/category/[slug] (scope = { category: slug }).
 * `initial` is the first page rendered on the server for the URL the visitor landed on ({ key, data }), so the first
 * paint has real cards. Later filter changes are fetched in the browser and synced to the query string.
 */
export default function EventListing({ scope, initial }) {
  const { currency } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const params = parseListingParams(Object.fromEntries(search.entries()));
  const byCity = !!scope.city;

  const baseQuery = listingQuery(scope, params, 1);
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
    listEvents(baseQuery, { signal: controller.signal, currency })
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
    listEvents(listingQuery(scope, params, state.pagination.page + 1), { currency })
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
      if (value && !(k === "sort" && value === "soonest")) next.set(k, value);
      else next.delete(k);
    });
    // Keep the range coherent: an end date before the start date would always be empty.
    const from = next.get("from");
    const to = next.get("to");
    if (from && to && to < from) {
      if ("from" in patch) next.set("to", from);
      else next.set("from", to);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = !!((byCity ? params.category : params.city) || params.from || params.to);
  const clearFilters = () => update({ city: "", category: "", from: "", to: "" });

  const settled = state?.key === key;
  const loading = !settled;
  const error = !!state?.failed && settled;
  const result = state?.pagination ? state : null;
  const total = result?.pagination.total ?? 0;
  const items = result?.items || [];
  const hasMore = result && result.pagination.page < result.pagination.pages;
  const facets = state?.facets || {};
  // Keep an active value selectable even if a later facet response no longer lists it.
  const withActive = (list, active, extra = {}) => (active && !list.some((f) => f.name === active || f.slug === active) ? [...list, { name: active, ...extra }] : list);
  const cities = withActive(facets.cities || [], params.city);
  const categories = withActive(facets.categories || [], params.category, { slug: params.category });

  const scopeName = byCity
    ? scope.city
    : (facets.categories || []).find((c) => c.slug === scope.category)?.name || titleizeSlug(scope.category);
  const heading = byCity ? `Events in ${scopeName}` : scopeName;
  const noun = byCity ? `events in ${scopeName}` : `${scopeName.toLowerCase()} events`;

  return (
    <div className="hol-page ev-page">
      <div className="hol-list-head">
        <div className="mk-container">
          <nav className="hol-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/events">Events</Link></li>
              <li aria-current="page">{byCity ? `In ${scopeName}` : scopeName}</li>
            </ol>
          </nav>
          <h1>{heading}</h1>
          <p className="hol-list-count" aria-live="polite">
            {result && !error
              ? total
                ? `${plural(total, "event")} found${filtered ? " with your filters" : ""} · Prices are indicative, per ticket, in ${currency}`
                : "No events match right now"
              : error
                ? ""
                : "Finding events..."}
          </p>
        </div>
      </div>

      <section className="mk-container hol-list" aria-label={heading}>
        <form className="ev-toolbar" role="search" aria-label="Filter and sort events" onSubmit={(e) => e.preventDefault()}>
          {byCity ? (
            <Select id="ev-category" label="Category" value={params.category} onChange={(v) => update({ category: v })}>
              <option value="">All categories</option>
              {categories.map((f) => <option key={f.slug || f.name} value={f.slug || f.name}>{f.name}</option>)}
            </Select>
          ) : (
            <Select id="ev-city" label="City" value={params.city} onChange={(v) => update({ city: v })}>
              <option value="">All cities</option>
              {cities.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </Select>
          )}
          <div className="ev-filter">
            <label htmlFor="ev-from">From date</label>
            <input id="ev-from" className="ev-date-input" type="date" value={params.from} max={params.to || undefined} onChange={(e) => update({ from: e.target.value })} suppressHydrationWarning />
          </div>
          <div className="ev-filter">
            <label htmlFor="ev-to">To date</label>
            <input id="ev-to" className="ev-date-input" type="date" value={params.to} min={params.from || undefined} onChange={(e) => update({ to: e.target.value })} suppressHydrationWarning />
          </div>
          <Select id="ev-sort" label="Sort by" value={params.sort} onChange={(v) => update({ sort: v })}>
            {EVENT_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          {filtered && (
            <button type="button" className="hol-link ev-clear" onClick={clearFilters}>Clear filters</button>
          )}
        </form>

        {error ? (
          <StateMessage
            title="We could not load these events"
            text="Something went wrong while fetching events. Please try again."
            action="Try again"
            onAction={() => {
              attemptRef.current += 1;
              setAttempt(attemptRef.current);
            }}
          />
        ) : !result ? (
          <div className="hol-grid ev-grid" aria-busy="true"><CardSkeletons count={6} /></div>
        ) : items.length === 0 && !loading ? (
          <StateMessage
            title={`No ${noun} found`}
            text={filtered ? "Try removing a filter or widening the dates to see more events." : "There are no upcoming events here yet. Explore other events."}
            action={filtered ? "Clear filters" : undefined}
            onAction={filtered ? clearFilters : undefined}
            href={filtered ? undefined : "/events"}
            actionLabel="Back to events"
          />
        ) : (
          <>
            <div className={`hol-grid ev-grid${loading ? " is-busy" : ""}`} aria-busy={loading}>
              {items.map((item, i) => (
                <div className="hol-grid-item" key={item.slug} style={{ "--i": i % 12 }}>
                  <EventCard item={item} reveal={false} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="hol-more">
                {moreFailed && <p role="alert">Could not load more events.</p>}
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
