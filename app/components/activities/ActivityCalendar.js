"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getAvailability, errorMessage } from "../../lib/booking";
import { addDays, addMonths, dubaiToday, formatDay, formatDayLong, formatMonthYear, monthOf, money, toIso, weekdayOf, daysInMonth } from "../../lib/actFormat";
import "../../stock.css";
import { IconChevron } from "./ActivityParts";

const WEEKDAYS = [
  ["Su", "Sunday"], ["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"],
];
const STATUS_LABEL = { available: "Available", sold_out: "Sold out", non_operational: "Not operating", past: "Past date" };
const RANK = { available: 3, sold_out: 2, non_operational: 1, past: 0 };

/** One day answers for every option at once: available if any option is, else sold out, else not operating. */
function mergeMonth(responses) {
  const days = new Map();
  let next = "";
  let weekend = "";
  responses.forEach((res) => {
    (res?.days || []).forEach((d) => {
      const cur = days.get(d.date);
      const price = d.status === "available" ? d.adultPrice || null : null;
      // Tickets left (only sent when low). An option with no number has plenty, so the day shows no count.
      const left = d.status === "available" ? (typeof d.remaining === "number" ? d.remaining : Infinity) : null;
      if (!cur) {
        days.set(d.date, { status: d.status, price, left });
      } else if ((RANK[d.status] ?? -1) > (RANK[cur.status] ?? -1)) {
        cur.status = d.status;
        cur.price = price;
        cur.left = left;
      } else if (d.status === "available" && cur.status === "available") {
        cur.left = Math.max(cur.left ?? 0, left);
        if (price && (!cur.price || price.amount < cur.price.amount)) cur.price = price;
      }
    });
    if (res?.nextAvailable && (!next || res.nextAvailable < next)) next = res.nextAvailable;
    if (res?.thisWeekend && (!weekend || res.thisWeekend < weekend)) weekend = res.thisWeekend;
  });
  return { days, next, weekend };
}

/** Same day number in another month; a short month (31st -> February) lands on its last day. */
function shiftMonths(iso, n) {
  const ym = addMonths(monthOf(iso), n);
  return `${ym}-${String(Math.min(Number(iso.slice(8)), daysInMonth(ym))).padStart(2, "0")}`;
}

/**
 * Month calendar with availability dots. It is a labelled grid with a roving tab stop: arrows move by day/week,
 * Home/End jump to the week's ends, PageUp/PageDown change month. Unavailable days stay focusable (aria-disabled)
 * so keyboard users can travel across them, but they cannot be chosen.
 */
export default function ActivityCalendar({ slug, options, currency, value, onSelect, cacheRef }) {
  const uid = useId();
  const [today] = useState(() => dubaiToday());
  const [month, setMonth] = useState(() => (value ? monthOf(value) : monthOf(dubaiToday())));
  const [focus, setFocus] = useState(value || "");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const cells = useRef(new Map());
  const wantsFocus = useRef(false);
  const key = `${slug}|${currency}|${month}|${attempt}`;

  useEffect(() => {
    let live = true;
    const load = (option) => {
      const ck = `${option.id}|${month}|${currency}`;
      const hit = cacheRef?.current.get(ck);
      if (hit) return Promise.resolve(hit);
      return getAvailability(slug, option.id, month, { currency }).then((res) => {
        cacheRef?.current.set(ck, res);
        return res;
      });
    };
    Promise.all(options.map(load))
      .then((list) => live && setResult({ key, ...mergeMonth(list) }))
      .catch((error) => live && setResult({ key, error: errorMessage(error) }));
    return () => {
      live = false;
    };
  }, [key, month, currency, slug, options, cacheRef]);

  const loading = result?.key !== key;
  const merged = loading ? null : result;
  const total = daysInMonth(month);
  const lead = weekdayOf(`${month}-01`);
  const firstDay = month === monthOf(today) ? today : `${month}-01`;
  const tabDate = monthOf(focus || "") === month && focus ? focus : value && monthOf(value) === month ? value : firstDay;
  const canGoBack = month > monthOf(today);

  useEffect(() => {
    if (!wantsFocus.current) return;
    cells.current.get(focus)?.focus({ preventScroll: true });
    wantsFocus.current = false;
  }, [focus, month, loading]);

  const go = (iso) => {
    wantsFocus.current = true;
    setFocus(iso);
    if (monthOf(iso) !== month) setMonth(monthOf(iso));
  };

  const onKeyDown = (e) => {
    const from = tabDate;
    const dow = weekdayOf(from);
    const map = {
      ArrowLeft: addDays(from, -1),
      ArrowRight: addDays(from, 1),
      ArrowUp: addDays(from, -7),
      ArrowDown: addDays(from, 7),
      Home: addDays(from, -dow),
      End: addDays(from, 6 - dow),
      PageUp: shiftMonths(from, e.shiftKey ? -12 : -1),
      PageDown: shiftMonths(from, e.shiftKey ? 12 : 1),
    };
    if (!map[e.key]) return;
    e.preventDefault();
    const target = map[e.key];
    if (monthOf(target) < monthOf(today)) return;
    go(target);
  };

  const choose = (iso) => {
    if (merged?.days.get(iso)?.status === "available") onSelect(iso);
  };

  const jump = (iso) => {
    setMonth(monthOf(iso));
    onSelect(iso);
  };

  const priceCurrency = useMemo(() => {
    if (!merged) return currency;
    for (const d of merged.days.values()) if (d.price?.currency) return d.price.currency;
    return currency;
  }, [merged, currency]);

  const hasFew = !!merged && [...merged.days.values()].some((d) => d.status === "available" && Number.isFinite(d.left) && d.left > 0);
  const rows = [];
  const flat = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (flat.length % 7) flat.push(null);
  for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
  const [y, m] = month.split("-").map(Number);
  const titleId = `${uid}-title`;

  return (
    <div className="act-cal">
      <div className="act-cal-head">
        <button type="button" className="act-cal-nav" aria-label="Previous month" disabled={!canGoBack} onClick={() => { setFocus(""); setMonth(addMonths(month, -1)); }}>
          <IconChevron dir="left" width="18" height="18" />
        </button>
        <h3 id={titleId} aria-live="polite">{formatMonthYear(month)}</h3>
        <button type="button" className="act-cal-nav" aria-label="Next month" onClick={() => { setFocus(""); setMonth(addMonths(month, 1)); }}>
          <IconChevron width="18" height="18" />
        </button>
      </div>

      <div className="act-cal-grid" role="grid" aria-labelledby={titleId} aria-busy={loading} onKeyDown={onKeyDown}>
        <div className="act-cal-row" role="row">
          {WEEKDAYS.map(([short, long]) => (
            <span key={short} className="act-cal-dow" role="columnheader" aria-label={long}>{short}</span>
          ))}
        </div>
        {rows.map((row, r) => (
          <div className="act-cal-row" role="row" key={r}>
            {row.map((d, c) => {
              if (!d) return <span key={c} className="act-cal-blank" role="gridcell" aria-hidden="true" />;
              const iso = toIso(y, m, d);
              const info = merged?.days.get(iso);
              const status = info?.status || (iso < today ? "past" : "");
              const available = status === "available";
              const few = available && Number.isFinite(info?.left) ? info.left : 0;
              const label = `${formatDayLong(iso)}${status ? `, ${STATUS_LABEL[status]?.toLowerCase() || status}` : ""}${few > 0 ? `, only ${few} left` : ""}${available && info?.price ? `, from ${money(info.price)}` : ""}`;
              return (
                <span key={c} role="gridcell" aria-selected={value === iso}>
                  <button
                    type="button"
                    ref={(el) => (el ? cells.current.set(iso, el) : cells.current.delete(iso))}
                    className={`act-day is-${status || "unknown"}${value === iso ? " is-selected" : ""}${iso === today ? " is-today" : ""}`}
                    tabIndex={iso === tabDate ? 0 : -1}
                    aria-disabled={!available}
                    aria-label={label}
                    title={status === "sold_out" ? "Sold out" : few > 0 ? `Only ${few} left` : undefined}
                    data-autofocus={iso === tabDate ? "" : undefined}
                    onClick={() => choose(iso)}
                    onFocus={() => setFocus(iso)}
                  >
                    <span className="act-day-num">{d}</span>
                    {few > 0 && <span className="act-day-left" aria-hidden="true">{few}</span>}
                    <i className="act-dot" aria-hidden="true" />
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <p className="act-cal-status" role="status" aria-live="polite">
        {loading ? "Loading availability..." : ""}
      </p>
      {merged?.error && (
        <p className="act-cal-error" role="alert">
          {merged.error} <button type="button" className="act-linkbtn" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </p>
      )}

      <ul className="act-legend" aria-label="Calendar key">
        <li><i className="act-dot is-available" aria-hidden="true" />Available</li>
        <li><i className="act-dot is-sold_out" aria-hidden="true" />Sold out</li>
        {hasFew && <li><span className="act-day-left-key" aria-hidden="true">3</span>Tickets left</li>}
        <li><i className="act-dot is-non_operational" aria-hidden="true" />Non operational</li>
      </ul>

      {(merged?.next || merged?.weekend) && (
        <div className="act-shortcuts">
          {merged.next && (
            <button type="button" className="act-shortcut" onClick={() => jump(merged.next)}>
              <small>Next available</small>
              <b>{formatDay(merged.next)}</b>
            </button>
          )}
          {merged.weekend && (
            <button type="button" className="act-shortcut" onClick={() => jump(merged.weekend)}>
              <small>This weekend</small>
              <b>{formatDay(merged.weekend)}</b>
            </button>
          )}
        </div>
      )}
      <p className="act-cal-note">All prices are in {priceCurrency}.</p>
    </div>
  );
}
