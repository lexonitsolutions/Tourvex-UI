"use client";

import { useMemo } from "react";
import { Button } from "../../_kit";
import { formatDayKey } from "../../_lib/format";
import { STATUS, addMonths, capText, dayNumber, mondayOffset, monthEnd, monthStart, monthTitle, num } from "../_lib/stock";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellText(day) {
  switch (day.status) {
    case "closed": return "Closed";
    case "sold_out": return "Sold out";
    case "non_operational": return "Off";
    case "unlimited": return "∞";
    default:
      return (
        <>
          {num(day.available)}
          {day.capacity !== null && day.capacity !== undefined ? <small>/{num(day.capacity)}</small> : null}
        </>
      );
  }
}

function describe(day) {
  const parts = [`${formatDayKey(day.date)}: ${STATUS[day.status]?.label || day.status}`];
  if (day.status !== "closed" && day.status !== "non_operational") {
    parts.push(day.capacity === null || day.capacity === undefined ? "unlimited capacity" : `${num(day.available)} available of ${capText(day.capacity)}`);
  }
  parts.push(`sold ${num(day.sold)}`, `held ${num(day.held)}`);
  if (day.note) parts.push(`note: ${day.note}`);
  return parts.join(", ");
}

/** Month grid(s) of per-day stock. Each cell is a button: colour = status, text = available/capacity, tooltip = sold and held. */
export default function StockCalendar({ ym, span, days, loading, selection, anchor, onPick }) {
  const byDate = useMemo(() => new Map((days || []).map((d) => [d.date, d])), [days]);
  const months = Array.from({ length: span }, (_, i) => addMonths(ym, i));
  const inSel = (date) => selection && date >= selection.from && date <= selection.to;
  return (
    <div className={`inv-cal${loading ? " is-loading" : ""}`} aria-busy={loading || undefined}>
      {months.map((m) => {
        const first = monthStart(m);
        const last = Number(monthEnd(m).slice(8, 10));
        return (
          <section key={m} className="inv-cal__month" aria-label={monthTitle(m)}>
            {span > 1 ? <h3 className="inv-cal__monthname">{monthTitle(m)}</h3> : null}
            <div className="inv-cal__grid">
              {DOW.map((d) => <div key={d} className="inv-cal__dow" aria-hidden="true">{d}</div>)}
              {Array.from({ length: mondayOffset(m) }, (_, i) => <div key={`g${i}`} className="inv-cal__gap" aria-hidden="true" />)}
              {Array.from({ length: last }, (_, i) => {
                const date = `${first.slice(0, 8)}${String(i + 1).padStart(2, "0")}`;
                const day = byDate.get(date);
                if (!day) {
                  return (
                    <div key={date} className="inv-day is-empty" aria-hidden="true" style={{ cursor: "default" }}>
                      <span className="inv-day__n">{dayNumber(date)}</span>
                    </div>
                  );
                }
                const label = describe(day);
                return (
                  <button
                    key={date}
                    type="button"
                    className={`inv-day is-${day.status}${inSel(date) ? " is-selected" : ""}${anchor === date ? " is-anchor" : ""}`}
                    title={label}
                    aria-label={label}
                    aria-pressed={inSel(date) || undefined}
                    onClick={(e) => onPick(date, e)}
                  >
                    <span className="inv-day__n">{dayNumber(date)}</span>
                    <span className="inv-day__v">{cellText(day)}</span>
                    {day.note ? <span className="inv-day__note" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <ul className="inv-legend" aria-label="Legend">
        <li><i className="is-ok" />Available</li>
        <li><i className="is-low" />Low stock</li>
        <li><i className="is-sold_out" />Sold out</li>
        <li><i className="is-closed" />Closed</li>
        <li><i className="is-unlimited" />Unlimited</li>
      </ul>
    </div>
  );
}

/** Previous / next / today / 1-3 month controls above the grid. */
export function CalendarNav({ ym, span, onMonth, onToday, onSpan, rangeMode, onRangeMode, canWrite }) {
  const title = span > 1 ? `${monthTitle(ym)} to ${monthTitle(addMonths(ym, span - 1))}` : monthTitle(ym);
  return (
    <div className="inv-cal__nav">
      <Button icon="chevronLeft" aria-label="Previous month" onClick={() => onMonth(-1)} />
      <Button icon="chevronRight" aria-label="Next month" onClick={() => onMonth(1)} />
      <h2 className="inv-cal__title" aria-live="polite">{title}</h2>
      <Button size="sm" onClick={onToday}>Today</Button>
      <span className="inv-cal__spacer" />
      <div className="inv-seg" role="group" aria-label="Months shown">
        <button type="button" aria-pressed={span === 1} onClick={() => onSpan(1)}>1 month</button>
        <button type="button" aria-pressed={span === 3} onClick={() => onSpan(3)}>3 months</button>
      </div>
      {canWrite ? (
        <div className="inv-seg" role="group" aria-label="Selection">
          <button type="button" aria-pressed={rangeMode} onClick={() => onRangeMode(!rangeMode)}>Select range</button>
        </div>
      ) : null}
    </div>
  );
}
