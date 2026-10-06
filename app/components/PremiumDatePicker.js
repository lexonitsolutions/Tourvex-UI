"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  daysInMonth,
  dubaiToday,
  formatDay,
  formatDayShort,
  formatMonthYear,
  monthOf,
  toIso,
  weekdayOf,
} from "../lib/actFormat";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const IconChevron = ({ dir = "right", ...p }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...p}
  >
    <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

/**
 * Premium travel calendar component matching Rayna/Tourvex luxury design.
 * Features:
 * - Two-column popover: Left quick presets ('Next available', 'This weekend')
 * - Full month calendar with availability status dots (Available, Sold Out, Non Operational)
 * - Bottom legend and dynamic currency indicator
 * - Keyboard accessible and outside-click dismissed
 */
export const PremiumDatePicker = memo(function PremiumDatePicker({
  value,
  currency = "AED",
  onSelect,
  onClose,
  minDate,
  className = "",
}) {
  const popoverRef = useRef(null);
  const today = useMemo(() => dubaiToday(), []);
  const effectiveMin = minDate || today;

  // Selected ISO date
  const [selectedIso, setSelectedIso] = useState(() => value || addDays(today, 3));

  // Calendar month being viewed (YYYY-MM)
  const [viewMonth, setViewMonth] = useState(() => monthOf(selectedIso));

  // Sync when prop value changes
  useEffect(() => {
    if (value) {
      setSelectedIso(value);
      setViewMonth(monthOf(value));
    }
  }, [value]);

  // Outside click handler
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Month navigation
  const canGoPrev = useMemo(() => viewMonth > monthOf(effectiveMin), [viewMonth, effectiveMin]);

  const handlePrevMonth = useCallback(() => {
    if (canGoPrev) setViewMonth((m) => addMonths(m, -1));
  }, [canGoPrev]);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => addMonths(m, 1));
  }, []);

  // Quick preset dates
  const nextAvailableIso = useMemo(() => addDays(today, 2), [today]);
  const thisWeekendIso = useMemo(() => {
    // Find next Saturday
    const d = new Date(today);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = (6 - day + 7) % 7 || 7;
    return addDays(today, diff);
  }, [today]);

  const handleSelectDate = useCallback(
    (iso) => {
      setSelectedIso(iso);
      const formatted = formatDay(iso); // e.g. "Thu, 15 Oct 2026"
      onSelect?.(formatted, iso);
    },
    [onSelect]
  );

  // Month grid computation
  const monthData = useMemo(() => {
    const totalDays = daysInMonth(viewMonth);
    const firstIso = `${viewMonth}-01`;
    const leadingEmpty = weekdayOf(firstIso); // 0 (Sun) .. 6 (Sat)
    const days = [];

    for (let day = 1; day <= totalDays; day++) {
      const iso = toIso(viewMonth, day);
      const isPast = iso < effectiveMin;
      const isSelected = iso === selectedIso;
      const isToday = iso === today;

      // Mock availability status:
      // Tuesdays are sold out, past is disabled, all else available
      let status = "available";
      const dow = new Date(iso).getDay();
      if (isPast) {
        status = "disabled";
      } else if (dow === 2) {
        status = "sold_out";
      }

      days.push({
        day,
        iso,
        isPast,
        isSelected,
        isToday,
        status,
      });
    }

    return { leadingEmpty, days };
  }, [viewMonth, effectiveMin, selectedIso, today]);

  const titleId = useId();

  return (
    <div
      ref={popoverRef}
      className={`pdp-popover ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="pdp-body">
        {/* Left Column: Quick Presets */}
        <aside className="pdp-presets-col" aria-label="Quick date options">
          <button
            type="button"
            className={`pdp-preset-btn ${selectedIso === nextAvailableIso ? "is-active" : ""}`}
            onClick={() => handleSelectDate(nextAvailableIso)}
          >
            <span className="pdp-preset-label">Next available</span>
            <span className="pdp-preset-date">{formatDayShort(nextAvailableIso)}</span>
          </button>

          <button
            type="button"
            className={`pdp-preset-btn ${selectedIso === thisWeekendIso ? "is-active" : ""}`}
            onClick={() => handleSelectDate(thisWeekendIso)}
          >
            <span className="pdp-preset-label">This weekend</span>
            <span className="pdp-preset-date">{formatDayShort(thisWeekendIso)}</span>
          </button>
        </aside>

        {/* Right Column: Month Calendar */}
        <section className="pdp-calendar-col">
          {/* Calendar Header */}
          <div className="pdp-header">
            <button
              type="button"
              className="pdp-nav-btn is-prev"
              onClick={handlePrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
            >
              <IconChevron dir="left" width="14" height="14" />
            </button>

            <h3 id={titleId} className="pdp-month-title">
              {formatMonthYear(viewMonth)}
            </h3>

            <button
              type="button"
              className="pdp-nav-btn is-next"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <IconChevron dir="right" width="14" height="14" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="pdp-weekdays-row" aria-hidden="true">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="pdp-weekday-cell">
                {wd}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="pdp-days-grid" role="grid" aria-readonly="true">
            {/* Empty slots before first day */}
            {Array.from({ length: monthData.leadingEmpty }).map((_, i) => (
              <span key={`empty-${i}`} className="pdp-day-cell is-empty" aria-hidden="true" />
            ))}

            {/* Days of month */}
            {monthData.days.map((d) => {
              const isDisabled = d.isPast || d.status === "sold_out";
              return (
                <button
                  key={d.iso}
                  type="button"
                  disabled={isDisabled}
                  className={`pdp-day-cell ${d.isSelected ? "is-selected" : ""} ${
                    d.isToday ? "is-today" : ""
                  } ${isDisabled ? "is-disabled" : ""}`}
                  onClick={() => handleSelectDate(d.iso)}
                  aria-label={`${formatDay(d.iso)}${d.isSelected ? ", selected" : ""}`}
                >
                  <span className="pdp-day-num">{d.day}</span>
                  {!d.isPast && (
                    <span
                      className={`pdp-day-dot is-${d.status}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer: Availability Legend & Currency Note */}
      <footer className="pdp-footer">
        <div className="pdp-legend-row" aria-label="Availability legend">
          <span className="pdp-legend-item">
            <i className="pdp-legend-dot is-available" aria-hidden="true" />
            Available
          </span>
          <span className="pdp-legend-item">
            <i className="pdp-legend-dot is-sold_out" aria-hidden="true" />
            Sold Out
          </span>
          <span className="pdp-legend-item">
            <i className="pdp-legend-dot is-non_operational" aria-hidden="true" />
            Non Operational
          </span>
        </div>

        <span className="pdp-currency-note">All prices are in {currency}</span>
      </footer>
    </div>
  );
});

export default PremiumDatePicker;
