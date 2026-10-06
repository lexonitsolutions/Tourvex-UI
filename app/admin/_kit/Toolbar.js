"use client";

import "./lists.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { Drawer } from "./overlays";
import { Button, cx } from "./primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../_ui/components/select";
import { DateRangePicker } from "../_ui/components/date-range-picker";
import { addDaysKey, dayKey, formatDayKey } from "../_lib/format";

/* ------------------------------------------------------------------ select pill + date range (shadcn Select / DateRangePicker) */

const ALL = "__all__";
const PILL = "tw:h-10 tw:w-auto tw:gap-2 tw:rounded-xl tw:border-input tw:bg-(--adm-control-bg) tw:px-3 tw:text-sm tw:font-semibold tw:text-(--adm-ink) tw:shadow-none tw:data-[size=default]:h-10";
const PILL_ACTIVE = "tw:border-(--adm-brand-line) tw:bg-(--adm-surface-selected) tw:text-(--adm-brand-ink)";

/**
 * Compact filter pill: "Label  Value v" (shadcn Select: arrow keys, typeahead, Esc, collision-aware, themed portal).
 * options: [{ value, label }]; the "all" entry (value "") is added for you.
 */
export function SelectFilter({ label, value = "", onChange, options, allLabel = "All", icon }) {
  const active = value !== "" && value != null;
  const known = options.some((o) => String(o.value) === String(value));
  return (
    <Select value={active ? String(value) : ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className={cx(PILL, active && PILL_ACTIVE)} aria-label={`${label}: ${known ? options.find((o) => String(o.value) === String(value)).label : allLabel}`}>
        {icon ? <Icon name={icon} size={15} /> : null}
        <span className="adm-sf__label">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
        {active && !known ? <SelectItem value={String(value)}>{String(value)}</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ date range */

const keyToDate = (key) => {
  if (!key) return undefined;
  const [y, m, d] = String(key).slice(0, 10).split("-").map(Number);
  return y ? new Date(y, m - 1, d) : undefined;
};
const dateToKey = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");

function presetsFor(mode) {
  const past = mode !== "future";
  const rng = (from, to) => ({ from: keyToDate(from), to: keyToDate(to) });
  return [
    { label: "Today", range: () => { const t = dayKey(); return rng(t, t); } },
    past
      ? { label: "Last 7 days", range: () => { const t = dayKey(); return rng(addDaysKey(t, -6), t); } }
      : { label: "Next 7 days", range: () => { const t = dayKey(); return rng(t, addDaysKey(t, 6)); } },
    past
      ? { label: "Last 30 days", range: () => { const t = dayKey(); return rng(addDaysKey(t, -29), t); } }
      : { label: "Next 30 days", range: () => { const t = dayKey(); return rng(t, addDaysKey(t, 29)); } },
    {
      label: "This month",
      range: () => {
        const t = dayKey();
        const [y, m] = t.split("-").map(Number);
        const first = `${y}-${String(m).padStart(2, "0")}-01`;
        const last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
        return past ? rng(first, t) : rng(t, last);
      },
    },
    { label: "Clear dates", range: () => ({ from: undefined, to: undefined }) },
  ];
}

/** Date range pill (shadcn DateRangePicker, calendar chunk loads on first open). value = { from, to } as "YYYY-MM-DD" (admin time zone). */
export function DateRangeFilter({ label = "Date range", value, onChange, mode = "past", placeholder = "Select date range" }) {
  const from = value?.from || "";
  const to = value?.to || "";
  const active = Boolean(from || to);
  const presets = presetsFor(mode);
  return (
    <DateRangePicker
      value={{ from: keyToDate(from), to: keyToDate(to) }}
      onChange={(r) => onChange({ from: dateToKey(r?.from), to: dateToKey(r?.to) })}
      placeholder={placeholder}
      presets={presets}
      numberOfMonths={1}
      aria-label={label}
      className={cx("tw:h-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-sm tw:font-semibold tw:text-(--adm-ink) tw:shadow-none", active && PILL_ACTIVE)}
    />
  );
}

/* ------------------------------------------------------------------ advanced filters drawer */

/** "Filters" button with an active-count badge. */
export function FiltersButton({ count = 0, onClick, expanded = false }) {
  return (
    <button type="button" className={cx("adm-tbtn", count > 0 && "is-active")} onClick={onClick} aria-haspopup="dialog" aria-expanded={expanded}>
      <Icon name="sliders" size={16} />
      <span className="adm-tbtn__label">Filters</span>
      {count > 0 ? <span className="adm-tbtn__badge" aria-label={`${count} active`}>{count}</span> : null}
    </button>
  );
}

/**
 * Right-side drawer for the advanced filters. `keys` are the URL params it owns; `values` is the current params object.
 * children(draft, set) renders the fields against a draft that only applies on "Apply". Reset clears every key.
 */
export function FiltersDrawer({ open, onClose, title = "Filters", description, keys, values, onApply, children }) {
  return open ? (
    <FiltersInner onClose={onClose} title={title} description={description} keys={keys} values={values} onApply={onApply}>{children}</FiltersInner>
  ) : null;
}

function FiltersInner({ onClose, title, description, keys, values, onApply, children }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(keys.map((k) => [k, values[k] || ""])));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      description={description}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={() => { onApply(Object.fromEntries(keys.map((k) => [k, ""]))); onClose(); }}>Reset</Button>
          <Button variant="primary" onClick={() => { onApply(draft); onClose(); }}>Apply filters</Button>
        </>
      }
    >
      <div className="adm-stack">{children(draft, set)}</div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ toolbar shell + chips */

/** ONE row of controls in a rounded card (wraps on narrow widths) + optional removable chips with "Clear all". */
export function FilterToolbar({ children, end, chips, onClearAll }) {
  return (
    <div className="adm-ft" role="search">
      <div className="adm-ft__row">
        <div className="adm-ft__controls">{children}</div>
        {end ? <div className="adm-ft__end">{end}</div> : null}
      </div>
      {chips?.length ? (
        <div className="adm-ft__chips" aria-label="Active filters">
          {chips.map((c) => (
            <span className="adm-fchip" key={c.key}>
              <span className="adm-fchip__k">{c.label}</span>
              <b>{c.text}</b>
              <button type="button" className="adm-fchip__x" aria-label={`Remove ${c.label} filter`} onClick={c.onRemove}><Icon name="close" size={12} strokeWidth={2.4} /></button>
            </span>
          ))}
          <button type="button" className="adm-link adm-ft__clear" onClick={onClearAll}>Clear all</button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Chips for the active URL filters. defs: [{ keys: ["cf","ct"], label: "Created", text?: (params) => string }].
 * Removing a chip clears all of its keys.
 */
export function buildChips(params, defs, setParams) {
  return defs
    .filter((d) => d.keys.some((k) => params[k]))
    .map((d) => ({
      key: d.keys.join("+"),
      label: d.label,
      text: d.text ? d.text(params) : params[d.keys[0]],
      onRemove: () => setParams(Object.fromEntries(d.keys.map((k) => [k, ""]))),
    }));
}

export const dateChipText = (from, to) => (from && to ? `${formatDayKey(from)} - ${formatDayKey(to)}` : from ? `From ${formatDayKey(from)}` : `Until ${formatDayKey(to)}`);

/** Page size from the URL (?limit=), limited to the sizes the footer offers. */
export function usePageSize(params, setParams, fallback = 20) {
  const n = Number(params.limit);
  const limit = [10, 20, 25, 50, 100].includes(n) ? n : fallback;
  const setLimit = useCallback((v) => setParams({ limit: v === fallback ? "" : v, page: "" }), [setParams, fallback]);
  return [limit, setLimit];
}

/* ------------------------------------------------------------------ status tiles */

const TONE_TINT = { success: "mint", warning: "butter", danger: "rose", info: "sky", neutral: "periwinkle", brand: "teal", violet: "violet", peach: "peach" };

/** Pointer-follow glow: one rAF-throttled handler on the container writes --mx/--my on the hovered tile (CSS does the rest). */
function useSpotlight(selector) {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return useCallback((e) => {
    if (e.pointerType === "touch") return;
    const el = e.target.closest?.(selector);
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  }, [selector]);
}

/**
 * Summary tiles that double as filters (radio group). items: [{ key, label, count, icon, tone, delta? }].
 * Pastel tint per tone; the white pill shows the tile's share of the "All" tile (key "") or an explicit `delta` number.
 */
export function StatusTiles({ items, active = "", onSelect, loading = false, label = "Filter by status" }) {
  const listRef = useRef(null);
  const onMove = useSpotlight(".adm-tile");
  const total = items.find((i) => i.key === "")?.count;
  const current = items.some((i) => i.key === active) ? active : null;
  const tabStop = current ?? items[0]?.key;

  function onKey(e) {
    const i = items.findIndex((x) => x.key === (current ?? tabStop));
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(items[next].key);
    listRef.current?.querySelectorAll('[role="radio"]')[next]?.focus();
  }

  return (
    <div className="adm-tiles" role="radiogroup" aria-label={label} ref={listRef} onKeyDown={onKey} onPointerMove={onMove}>
      {items.map((it) => {
        const on = it.key === current;
        const tint = TONE_TINT[it.tone] || it.tone || "periwinkle";
        const showShare = typeof it.delta !== "number" && it.key !== "" && total > 0 && it.count > 0;
        return (
          <button
            key={it.key || "__all"}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={it.key === tabStop ? 0 : -1}
            className={cx("adm-tile", `is-${tint}`, on && "is-on")}
            onClick={() => onSelect(it.key)}
          >
            <span className="adm-tile__top">
              <span className="adm-tile__label">{it.label}</span>
              {it.icon ? <span className="adm-tile__icon"><Icon name={it.icon} size={16} /></span> : null}
            </span>
            <span className="adm-tile__value">{loading ? <span className="adm-skel" style={{ width: 52, height: 28 }} aria-hidden="true" /> : (it.count ?? 0).toLocaleString("en-GB")}</span>
            <span className="adm-tile__foot">
              {!loading && typeof it.delta === "number" ? (
                <span className="adm-tile__pill"><Icon name={it.delta >= 0 ? "arrowUpRight" : "arrowDownRight"} size={12} strokeWidth={2.4} />{it.delta >= 0 ? "+" : ""}{it.delta}%</span>
              ) : !loading && showShare ? (
                <span className="adm-tile__pill" title="Share of all"><Icon name="arrowUpRight" size={12} strokeWidth={2.4} />{Math.round(((it.count || 0) / total) * 100)}%</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
