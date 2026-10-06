"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { formatPrice, getActivities } from "../lib/api";
import { buildCities, priceInfo, searchCatalog } from "../lib/search";
import { useApp } from "./AppProvider";
import { useMotion } from "./MotionShell";
import { StateMessage, IconChevron } from "./holidays/HolidayParts";
import ShowcaseCard, { ShowcaseSkeleton } from "./ShowcaseCard";
import "../holidays.css";
import "../activities.css";

const FALLBACK_IMG = "/images/destination-a.jpg";
const PAGE_SIZE = 12;
const DEST_LIMIT = 8;

export const ACTIVITY_SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
];
const SORT_VALUES = new Set(ACTIVITY_SORTS.map((s) => s.value));

// The data only carries whole-day durations, so the duration filter is bucketed by number of days.
const DURATIONS = [
  { key: "1", label: "1 day" },
  { key: "2-3", label: "2 to 3 days" },
  { key: "4-7", label: "4 to 7 days" },
  { key: "8+", label: "8 days or more" },
];
const durationKey = (days) => (!days ? null : days <= 1 ? "1" : days <= 3 ? "2-3" : days <= 7 ? "4-7" : "8+");

// Stable per-index style objects so memoised cards are not re-rendered by unrelated state (slider drags, sheet toggles).
const STAGGER = Array.from({ length: PAGE_SIZE }, (_, i) => ({ "--i": i }));

const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const words = (values) => values.flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
const num = (v) => {
  const n = v === "" || v == null ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function parseParams(search) {
  const sort = search.get("sort") || "";
  return {
    q: (search.get("q") || "").trim(),
    dest: words(search.getAll("destination")),
    cat: words(search.getAll("activity")),
    trip: words(search.getAll("trip")),
    dur: words(search.getAll("duration")),
    min: num(search.get("min")),
    max: num(search.get("max")),
    offer: search.get("offer") === "1",
    sort: SORT_VALUES.has(sort) ? sort : "popular",
    view: search.get("view") === "list" ? "list" : "grid",
  };
}

/** Direct text match first (title, category, city, trip type); otherwise the natural-language search used by /search. */
function matchQuery(items, cities, q) {
  const query = norm(q);
  const direct = items.filter((it) =>
    norm([it.title, ...(it.categories || []), ...(it.destinations || []), ...(it.tripTypes || [])].join(" ")).includes(query)
  );
  if (direct.length) {
    const inTitle = (it) => (norm(it.title).includes(query) ? 0 : 1);
    return direct.map((it, i) => ({ it, i })).sort((a, b) => inTitle(a.it) - inTitle(b.it) || a.i - b.i).map((x) => x.it);
  }
  return searchCatalog(items, cities, q).activities;
}

function durationText(item) {
  const d = item.durationDays;
  if (!d) return null;
  const days = `${d} ${d === 1 ? "day" : "days"}`;
  return item.durationNights ? `${days}, ${item.durationNights} ${item.durationNights === 1 ? "night" : "nights"}` : days;
}

/** One precomputed row per activity: everything the filters and the card need, so filtering never re-derives it. */
function buildRow(it) {
  const price = priceInfo(it);
  const duration = durationText(it);
  return {
    it,
    price,
    amt: price ? price.amount : null,
    saving: price?.saving || 0,
    offer: !!it.salePrice,
    dur: durationKey(it.durationDays),
    meta: duration ? [duration] : undefined,
    loc: (it.destinations || []).join(", ") || undefined,
  };
}

/** `skip` leaves one facet out, which is how each facet's counts respect only the OTHER active filters. */
function passes(r, f, skip) {
  const it = r.it;
  if (skip !== "dest" && f.dest.length && !(it.destinations || []).some((d) => f.dest.includes(d))) return false;
  if (skip !== "cat" && f.cat.length && !(it.categories || []).some((c) => f.cat.includes(c))) return false;
  if (skip !== "trip" && f.trip.length && !(it.tripTypes || []).some((t) => f.trip.includes(t))) return false;
  if (skip !== "dur" && f.dur.length && !f.dur.includes(r.dur)) return false;
  if (skip !== "offer" && f.offer && !r.offer) return false;
  if (skip !== "price" && (f.min != null || f.max != null)) {
    if (r.amt == null) return false;
    if (f.min != null && r.amt < f.min) return false;
    if (f.max != null && r.amt > f.max) return false;
  }
  return true;
}

const useMatchMedia = (query) =>
  useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );

function Select({ id, label, value, onChange, children }) {
  return (
    <div className="ac-filter">
      <label htmlFor={id}>{label}</label>
      <span className="hol-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
        <IconChevron dir="down" width="16" height="16" />
      </span>
    </div>
  );
}

/** Collapsible sidebar section. The body animates grid-template-rows 0fr/1fr and is `inert` while closed. */
function Section({ id, title, active = 0, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="ac-sec">
      <h3 className="ac-sec-h">
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)}>
          <span>{title}</span>
          {active > 0 && <span className="ac-sec-n" aria-label={`${active} selected`}>{active}</span>}
          <IconChevron dir="down" width="16" height="16" />
        </button>
      </h3>
      <div id={`${id}-body`} className={`ac-sec-body${open ? " is-open" : ""}`} inert={!open}>
        <div className="ac-sec-clip">{children}</div>
      </div>
    </section>
  );
}

function CheckList({ legend, name, options, selected, counts, onToggle, limit }) {
  const [all, setAll] = useState(false);
  const capped = limit && options.length > limit && !all;
  const shown = capped ? options.filter((o, i) => i < limit || selected.includes(o.value)) : options;
  const hidden = options.length - shown.length;
  return (
    <fieldset className="ac-fs">
      <legend className="ac-sr">{legend}</legend>
      <ul className="ac-checks">
        {shown.map((o) => {
          const n = counts.get(o.value) || 0;
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className={`ac-check${n === 0 && !on ? " is-empty" : ""}`}>
                <input type="checkbox" name={name} value={o.value} checked={on} disabled={n === 0 && !on} onChange={() => onToggle(o.value)} />
                <span className="ac-check-box" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.5 3 3 6-7" /></svg>
                </span>
                <span className="ac-check-label">{o.label}</span>
                <span className="ac-check-n">{n}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {limit && options.length > limit && (
        <button type="button" className="ac-more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          {all ? "Show less" : `Show more (${hidden})`}
        </button>
      )}
    </fieldset>
  );
}

/** Dual-handle slider plus two number inputs. Dragging stays local; the URL is written after a short pause. */
function PriceFilter({ bounds, min, max, currency, onCommit }) {
  const step = bounds.hi - bounds.lo > 400 ? 5 : 1;
  const cLo = min == null ? bounds.lo : Math.min(Math.max(min, bounds.lo), bounds.hi);
  const cHi = max == null ? bounds.hi : Math.min(Math.max(max, bounds.lo), bounds.hi);
  const key = `${cLo}|${cHi}|${bounds.lo}|${bounds.hi}`;
  const [seen, setSeen] = useState(key);
  const [drag, setDrag] = useState(null);
  const [texts, setTexts] = useState(null);
  const timer = useRef(null);
  if (seen !== key) {
    setSeen(key);
    setDrag(null);
    setTexts(null);
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const lo = drag ? drag.lo : cLo;
  const hi = drag ? drag.hi : cHi;
  const commit = (nlo, nhi) => {
    clearTimeout(timer.current);
    onCommit(nlo <= bounds.lo ? null : nlo, nhi >= bounds.hi ? null : nhi);
  };
  const slide = (which, value) => {
    const next = which === "lo" ? { lo: Math.min(value, hi), hi } : { lo, hi: Math.max(value, lo) };
    setDrag(next);
    setTexts(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next.lo, next.hi), 220);
  };
  const commitText = () => {
    if (!texts) return;
    const nlo = texts.lo === "" || num(texts.lo) == null ? lo : Math.min(Math.max(num(texts.lo), bounds.lo), bounds.hi);
    const nhi = texts.hi === "" || num(texts.hi) == null ? hi : Math.min(Math.max(num(texts.hi), bounds.lo), bounds.hi);
    const a = Math.min(nlo, nhi);
    const b = Math.max(nlo, nhi);
    setDrag({ lo: a, hi: b });
    setTexts(null);
    commit(a, b);
  };
  const onKey = (e) => e.key === "Enter" && (e.preventDefault(), commitText());
  const pct = (v) => ((v - bounds.lo) / (bounds.hi - bounds.lo || 1)) * 100;
  const dirty = min != null || max != null;
  const money = (v) => formatPrice(v, currency);

  return (
    <div className="ac-price">
      <div className="ac-range" style={{ "--a": pct(lo), "--b": pct(hi) }}>
        <span className="ac-range-track" aria-hidden="true"><span className="ac-range-fill" /></span>
        <input type="range" min={bounds.lo} max={bounds.hi} step={step} value={lo} onChange={(e) => slide("lo", Number(e.target.value))} aria-label={`Minimum price, ${currency}`} aria-valuetext={money(lo)} />
        <input type="range" min={bounds.lo} max={bounds.hi} step={step} value={hi} onChange={(e) => slide("hi", Number(e.target.value))} aria-label={`Maximum price, ${currency}`} aria-valuetext={money(hi)} />
      </div>
      <p className="ac-price-labels" aria-hidden="true"><span>{money(lo)}</span><span>{money(hi)}</span></p>
      <div className="ac-price-inputs">
        <label>
          <span>Min ({currency})</span>
          <input type="number" inputMode="decimal" min={bounds.lo} max={bounds.hi} value={texts?.lo ?? String(lo)} onChange={(e) => setTexts({ lo: e.target.value, hi: texts?.hi ?? String(hi) })} onBlur={commitText} onKeyDown={onKey} />
        </label>
        <label>
          <span>Max ({currency})</span>
          <input type="number" inputMode="decimal" min={bounds.lo} max={bounds.hi} value={texts?.hi ?? String(hi)} onChange={(e) => setTexts({ lo: texts?.lo ?? String(lo), hi: e.target.value })} onBlur={commitText} onKeyDown={onKey} />
        </label>
      </div>
      {dirty && <button type="button" className="ac-more" onClick={() => { setDrag(null); setTexts(null); commit(null, null); }}>Clear price</button>}
    </div>
  );
}

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>
);
const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
);
const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
);
const CloseIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
);

/**
 * `initial` ({ currency, items }) is the catalog rendered on the server for the visitor's currency, so the first paint has
 * real cards. Prices arrive already converted by the API; filters, sort and "load more" are client side and synced to the URL
 * (q, destination, activity, trip, duration, min, max, offer, sort, view).
 */
export default function ActivitiesListing({ initial }) {
  const { currency } = useApp();
  const { setScrollLocked } = useMotion();
  const pathname = usePathname();
  const search = useSearchParams();
  const searchKey = search.toString();
  const params = useMemo(() => parseParams(new URLSearchParams(searchKey)), [searchKey]);
  const isMobile = useMatchMedia("(max-width: 1023.98px)");

  const [fetched, setFetched] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pushedQ = useRef(params.q);
  const [text, setText] = useState(params.q);
  const [shown, setShown] = useState({ sig: "", n: PAGE_SIZE });
  const [sheet, setSheet] = useState(false);
  const sideRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);

  // Server data covers the current currency; otherwise (or when the server fetch failed) load it in the browser.
  const serverItems = initial?.currency === currency ? initial.items : null;
  useEffect(() => {
    if (serverItems) return undefined;
    let live = true;
    getActivities(currency)
      .then((items) => {
        if (!live) return;
        setFailed(false);
        setFetched({ currency, items });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [currency, serverItems, attempt]);
  const items = serverItems || (fetched?.currency === currency ? fetched.items : null);

  // External URL changes (header search, links) update the field; our own debounced writes do not.
  useEffect(() => {
    if (params.q !== pushedQ.current) {
      pushedQ.current = params.q;
      setText(params.q);
    }
  }, [params.q]);

  /** Writes straight to the live URL (never a stale closure). Arrays become comma lists; empty values are removed. */
  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([k, value]) => {
        const v = Array.isArray(value) ? value.join(",") : value === true ? "1" : value === false || value == null ? "" : String(value);
        if (v && !(k === "sort" && v === "popular") && !(k === "view" && v === "grid")) next.set(k, v);
        else next.delete(k);
      });
      const qs = next.toString();
      // Native history API (integrated with useSearchParams): no server round trip for a client-side filter change.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname]
  );

  useEffect(() => {
    const value = text.trim();
    if (value === pushedQ.current) return undefined;
    const id = setTimeout(() => {
      pushedQ.current = value;
      update({ q: value });
    }, 300);
    return () => clearTimeout(id);
  }, [text, update]);

  // Prices are re-fetched in the new currency, so old min/max numbers would mean something else: drop them.
  const lastCurrency = useRef(currency);
  useEffect(() => {
    if (lastCurrency.current === currency) return;
    lastCurrency.current = currency;
    update({ min: "", max: "" });
  }, [currency, update]);

  const cities = useMemo(() => (items ? buildCities(items) : []), [items]);
  const rowsAll = useMemo(() => (items ? items.map(buildRow) : null), [items]);
  const rowOf = useMemo(() => new Map((rowsAll || []).map((r) => [r.it, r])), [rowsAll]);

  // Facet options in a stable order (by size in the whole catalog), so the lists never reshuffle while filtering.
  const options = useMemo(() => {
    const tally = (pick) => {
      const m = new Map();
      (items || []).forEach((it) => (pick(it) || []).forEach((v) => m.set(v, (m.get(v) || 0) + 1)));
      return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => ({ value, label: value }));
    };
    return { dest: tally((it) => it.destinations), cat: tally((it) => it.categories), trip: tally((it) => it.tripTypes) };
  }, [items]);
  const durOptions = useMemo(() => DURATIONS.filter((d) => (rowsAll || []).some((r) => r.dur === d.key)), [rowsAll]);

  const bounds = useMemo(() => {
    const amounts = (rowsAll || []).map((r) => r.amt).filter((a) => a != null);
    if (!amounts.length) return null;
    const lo = Math.floor(Math.min(...amounts));
    const hi = Math.ceil(Math.max(...amounts));
    const code = (rowsAll.find((r) => r.price)?.price.currency) || currency;
    return hi > lo ? { lo, hi, code } : null;
  }, [rowsAll, currency]);

  const baseRows = useMemo(() => {
    if (!rowsAll) return null;
    return params.q ? matchQuery(items, cities, params.q).map((it) => rowOf.get(it)).filter(Boolean) : rowsAll;
  }, [rowsAll, rowOf, items, cities, params.q]);

  const counts = useMemo(() => {
    const c = { dest: new Map(), cat: new Map(), trip: new Map(), dur: new Map(), offer: 0 };
    const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
    (baseRows || []).forEach((r) => {
      if (passes(r, params, "dest")) (r.it.destinations || []).forEach((v) => bump(c.dest, v));
      if (passes(r, params, "cat")) (r.it.categories || []).forEach((v) => bump(c.cat, v));
      if (passes(r, params, "trip")) (r.it.tripTypes || []).forEach((v) => bump(c.trip, v));
      if (passes(r, params, "dur") && r.dur) bump(c.dur, r.dur);
      if (r.offer && passes(r, params, "offer")) c.offer += 1;
    });
    return c;
  }, [baseRows, params]);

  const results = useMemo(() => {
    if (!baseRows) return null;
    const list = baseRows.filter((r) => passes(r, params, null));
    const { sort } = params;
    if (sort === "price_asc" || sort === "price_desc") {
      const dir = sort === "price_asc" ? 1 : -1;
      return [...list].sort((a, b) => {
        if (a.amt == null && b.amt == null) return 0;
        if (a.amt == null) return 1; // unpriced always last
        if (b.amt == null) return -1;
        return (a.amt - b.amt) * dir;
      });
    }
    if (sort === "discount") return [...list].sort((a, b) => b.saving - a.saving);
    return list; // popular: search relevance, otherwise catalog order
  }, [baseRows, params]);

  const sig = `${params.q}|${params.dest}|${params.cat}|${params.trip}|${params.dur}|${params.min}|${params.max}|${params.offer}|${params.sort}`;
  const visible = shown.sig === sig ? shown.n : PAGE_SIZE;
  const total = results?.length ?? 0;
  const activeCount = params.dest.length + params.cat.length + params.trip.length + params.dur.length + (params.min != null || params.max != null ? 1 : 0) + (params.offer ? 1 : 0);
  const filtered = activeCount > 0 || !!params.q;

  const toggle = (key, param) => (value) =>
    update({ [param]: params[key].includes(value) ? params[key].filter((v) => v !== value) : [...params[key], value] });
  const clearAll = () => {
    setText("");
    pushedQ.current = "";
    update({ q: "", destination: "", activity: "", trip: "", duration: "", min: "", max: "", offer: "" });
  };
  const clearQuery = () => {
    setText("");
    pushedQ.current = "";
    update({ q: "" });
  };
  const commitPrice = (min, max) => update({ min: min ?? "", max: max ?? "" });

  // Bottom sheet (phones and tablets): focus moves in, Tab is trapped, Escape closes, the page behind is locked.
  const closeSheet = useCallback(() => setSheet(false), []);
  const sheetOpen = sheet && isMobile;
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const opener = openerRef.current;
    setScrollLocked(true);
    const onKey = (e) => {
      if (e.key === "Escape") return closeSheet();
      if (e.key !== "Tab" || !sideRef.current) return undefined;
      const f = [...sideRef.current.querySelectorAll("button, input, select, a[href]")].filter((el) => !el.disabled && !el.closest("[inert]") && el.offsetParent !== null);
      if (!f.length) return undefined;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      return undefined;
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      clearTimeout(t);
      setScrollLocked(false);
      document.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [sheetOpen, closeSheet, setScrollLocked]);

  const chips = [];
  if (params.q) chips.push({ id: "q", label: `"${params.q}"` });
  params.dest.forEach((v) => chips.push({ id: `d-${v}`, label: v, kind: "dest", value: v }));
  params.cat.forEach((v) => chips.push({ id: `c-${v}`, label: v, kind: "cat", value: v }));
  params.trip.forEach((v) => chips.push({ id: `t-${v}`, label: v, kind: "trip", value: v }));
  params.dur.forEach((v) => chips.push({ id: `u-${v}`, label: DURATIONS.find((d) => d.key === v)?.label || v, kind: "dur", value: v }));
  if (params.min != null || params.max != null) {
    const code = bounds?.code || currency;
    const lo = params.min != null ? formatPrice(params.min, code) : "Any";
    const hi = params.max != null ? formatPrice(params.max, code) : "Any";
    chips.push({ id: "price", label: `${lo} to ${hi}`, kind: "price" });
  }
  if (params.offer) chips.push({ id: "offer", label: "On offer", kind: "offer" });
  const removeChip = (c) => {
    if (c.id === "q") clearQuery();
    else if (c.kind === "price") commitPrice(null, null);
    else if (c.kind === "offer") update({ offer: "" });
    else toggle(c.kind, { dest: "destination", cat: "activity", trip: "trip", dur: "duration" }[c.kind])(c.value);
  };

  const subject = params.dest.length === 1 ? `Things to do in ${params.dest[0]}` : params.cat.length === 1 && !params.dest.length ? params.cat[0] : "Activities & Experiences";
  const subtitle = params.dest.length === 1 || params.cat.length === 1
    ? "Hand-picked tours, attractions and experiences, with prices shown in your currency."
    : "Desert safaris, theme parks, cruises and city tours across the UAE and beyond, with prices shown in your currency.";
  const countText = results ? `${total} ${total === 1 ? "experience" : "experiences"}${filtered ? " found" : ""}` : failed ? "" : "Finding experiences...";
  const ready = !!items;

  return (
    <div className="hol-page ac-page">
      <div className="mk-container ac-hero-wrap">
        <header className="ac-hero">
          <p className="ac-eyebrow">Karnish Activities</p>
          <h1>{subject}</h1>
          <p className="ac-sub">{subtitle}</p>
          <form className="ac-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search activities, cities or experiences"
              aria-label="Search activities"
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </header>
      </div>

      <section className="mk-container hol-list ac-list" aria-label="Activities">
        {options.cat.length > 0 && (
          <div className="ac-chips" role="group" aria-label="Quick category filter">
            <button type="button" className={`hol-chip${params.cat.length ? "" : " is-active"}`} aria-pressed={!params.cat.length} onClick={() => update({ activity: "" })}>
              All
            </button>
            {options.cat.map((c) => (
              <button key={c.value} type="button" className={`hol-chip${params.cat.includes(c.value) ? " is-active" : ""}`} aria-pressed={params.cat.includes(c.value)} onClick={() => toggle("cat", "activity")(c.value)}>
                {c.value}
              </button>
            ))}
          </div>
        )}

        <div className="ac-layout">
          <aside
            ref={sideRef}
            className={`ac-side${sheetOpen ? " is-open" : ""}`}
            aria-label="Filters"
            inert={isMobile && !sheetOpen}
          >
            <button type="button" className="ac-scrim" aria-label="Close filters" tabIndex={-1} onClick={closeSheet} />
            <div className="ac-side-panel" role={isMobile ? "dialog" : undefined} aria-modal={isMobile ? "true" : undefined} aria-labelledby="ac-side-title">
              <span className="ac-grab" aria-hidden="true" />
              <div className="ac-side-head">
                <h2 id="ac-side-title">Filters</h2>
                {activeCount > 0 && <button type="button" className="ac-linkbtn ac-side-clear" onClick={clearAll}>Clear all</button>}
                <button ref={closeRef} type="button" className="ac-close" onClick={closeSheet} aria-label="Close filters"><CloseIcon size={18} /></button>
              </div>
              <div className="ac-side-body">
                {!ready ? (
                  <div className="ac-side-skel" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
                ) : (
                  <>
                    {options.dest.length > 1 && (
                      <Section id="ac-f-dest" title="Destination" active={params.dest.length}>
                        <CheckList legend="Destination" name="destination" options={options.dest} selected={params.dest} counts={counts.dest} onToggle={toggle("dest", "destination")} limit={DEST_LIMIT} />
                      </Section>
                    )}
                    {options.cat.length > 1 && (
                      <Section id="ac-f-cat" title="Category" active={params.cat.length}>
                        <CheckList legend="Category" name="activity" options={options.cat} selected={params.cat} counts={counts.cat} onToggle={toggle("cat", "activity")} />
                      </Section>
                    )}
                    {bounds && (
                      <Section id="ac-f-price" title="Price" active={params.min != null || params.max != null ? 1 : 0}>
                        <PriceFilter bounds={bounds} min={params.min} max={params.max} currency={bounds.code} onCommit={commitPrice} />
                      </Section>
                    )}
                    {durOptions.length > 1 && (
                      <Section id="ac-f-dur" title="Duration" active={params.dur.length}>
                        <CheckList legend="Duration" name="duration" options={durOptions.map((d) => ({ value: d.key, label: d.label }))} selected={params.dur} counts={counts.dur} onToggle={toggle("dur", "duration")} />
                      </Section>
                    )}
                    {options.trip.length > 0 && (
                      <Section id="ac-f-trip" title="Trip type" active={params.trip.length} defaultOpen={false}>
                        <CheckList legend="Trip type" name="trip" options={options.trip} selected={params.trip} counts={counts.trip} onToggle={toggle("trip", "trip")} />
                      </Section>
                    )}
                    <section className="ac-sec ac-sec-flat">
                      <label className={`ac-switch${counts.offer === 0 && !params.offer ? " is-empty" : ""}`}>
                        <input type="checkbox" role="switch" checked={params.offer} disabled={counts.offer === 0 && !params.offer} onChange={(e) => update({ offer: e.target.checked })} />
                        <span className="ac-switch-label">On offer<small>{counts.offer} {counts.offer === 1 ? "activity" : "activities"} with a discount</small></span>
                        <span className="ac-switch-track" aria-hidden="true"><span /></span>
                      </label>
                    </section>
                  </>
                )}
              </div>
              <div className="ac-side-foot">
                <button type="button" className="ac-foot-clear" onClick={clearAll} disabled={!activeCount}>Clear all</button>
                <button type="button" className="mk-btn ac-apply" onClick={closeSheet}>
                  {results ? `Show ${total} ${total === 1 ? "result" : "results"}` : "Apply"}
                </button>
              </div>
            </div>
          </aside>

          <div className="ac-results">
            <div className="ac-toolbar" role="group" aria-label="Sort and view">
              <button ref={openerRef} type="button" className="ac-filter-btn" aria-haspopup="dialog" aria-expanded={sheetOpen} onClick={() => setSheet(true)}>
                <SlidersIcon />
                <span>Filters</span>
                {activeCount > 0 && <span className="ac-badge" aria-label={`${activeCount} active`}>{activeCount}</span>}
              </button>
              <p className="ac-count" aria-live="polite" aria-atomic="true">{countText}</p>
              <Select id="ac-sort" label="Sort by" value={params.sort} onChange={(v) => update({ sort: v })}>
                {ACTIVITY_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <div className="ac-view" role="group" aria-label="Layout">
                <button type="button" aria-pressed={params.view === "grid"} aria-label="Grid view" onClick={() => update({ view: "grid" })}><GridIcon /></button>
                <button type="button" aria-pressed={params.view === "list"} aria-label="List view" onClick={() => update({ view: "list" })}><ListIcon /></button>
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="ac-active" aria-label="Active filters">
                {chips.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="ac-tag" onClick={() => removeChip(c)} aria-label={`Remove filter ${c.label}`}>
                      <span>{c.label}</span>
                      <CloseIcon />
                    </button>
                  </li>
                ))}
                <li><button type="button" className="ac-linkbtn" onClick={clearAll}>Clear all</button></li>
              </ul>
            )}

            {failed && !items ? (
              <StateMessage
                title="We could not load activities"
                text="Something went wrong while fetching experiences. Please try again."
                action="Try again"
                onAction={() => {
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
              />
            ) : !results ? (
              <div className="sc-grid ac-grid" aria-busy="true"><ShowcaseSkeleton count={6} /></div>
            ) : total === 0 ? (
              <StateMessage
                title="No activities found"
                text={filtered ? "Try a different search or remove a filter to see more experiences." : "We are adding new experiences. Please check back shortly."}
                action={filtered ? "Clear filters" : undefined}
                onAction={filtered ? clearAll : undefined}
              />
            ) : (
              <>
                <div className={`sc-grid ac-grid${params.view === "list" ? " is-list" : ""}`}>
                  {results.slice(0, visible).map((r, i) => (
                    <ShowcaseCard
                      key={r.it._id || r.it.slug}
                      style={STAGGER[i % PAGE_SIZE]}
                      href={r.it.slug ? `/activities/${r.it.slug}` : `/activities?q=${encodeURIComponent(r.it.title)}`}
                      title={r.it.title}
                      image={r.it.imageUrl}
                      fallbackImage={FALLBACK_IMG}
                      tag={r.it.categories?.[0]}
                      location={r.loc}
                      meta={r.meta}
                      price={r.price}
                      priceFallback="Price on request"
                    />
                  ))}
                </div>
                {visible < total && (
                  <div className="hol-more">
                    <button type="button" className="mk-btn" onClick={() => setShown({ sig, n: visible + PAGE_SIZE })}>
                      Load more ({total - visible} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
