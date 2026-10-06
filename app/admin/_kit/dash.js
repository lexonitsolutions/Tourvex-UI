"use client";

// Command-center building blocks: pastel KPI card, delta pill, count-up, pointer spotlight, date-range picker.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { Sparkline } from "./charts";
import { Button, cx } from "./primitives";
import { Input } from "../_ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "../_ui/components/popover";

/** True when the visitor asked for reduced motion AND the site honours it (html[data-honor-reduced-motion]). */
function motionReduced() {
  if (typeof document === "undefined" || typeof window === "undefined") return true;
  return document.documentElement.hasAttribute("data-honor-reduced-motion") && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animated number: server and first client render show the final value (no mismatch, no flash for reduced motion);
 * once in view it counts up with requestAnimationFrame text updates only (no layout/paint of anything else).
 */
export function CountUp({ value, format = (v) => String(v), duration = 900 }) {
  const ref = useRef(null);
  const done = useRef(false);
  const last = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof value !== "number") return undefined;
    const text = node.firstChild;
    if (!text) return undefined;
    if (done.current) {
      text.nodeValue = format(value);
      last.current = value;
      return undefined;
    }
    if (motionReduced() || typeof IntersectionObserver === "undefined") {
      done.current = true;
      return undefined;
    }
    let raf = 0;
    let started = false;
    const run = () => {
      started = true;
      const from = 0;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        text.nodeValue = format(from + (value - from) * eased);
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          text.nodeValue = format(value);
          done.current = true;
        }
      };
      text.nodeValue = format(0);
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !started) {
        io.disconnect();
        run();
      }
    }, { threshold: 0.3 });
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (started && !done.current) text.nodeValue = format(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span ref={ref} className="adm-countup">{typeof value === "number" ? format(value) : "-"}</span>;
}

/**
 * Pointer-follow spotlight for a grid of cards (event delegation, one rAF-throttled handler). It only writes the
 * --mx/--my custom properties of the hovered `.adm-spot` element; the glow layer moves with transform/opacity.
 */
export function useSpotlight() {
  const frame = useRef(0);
  const pending = useRef(null);
  const onPointerMove = useCallback((event) => {
    if (event.pointerType === "touch") return;
    const card = event.target.closest?.(".adm-spot");
    if (!card) return;
    pending.current = { card, x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const p = pending.current;
      if (!p) return;
      const rect = p.card.getBoundingClientRect();
      p.card.style.setProperty("--mx", `${(p.x - rect.left).toFixed(0)}px`);
      p.card.style.setProperty("--my", `${(p.y - rect.top).toFixed(0)}px`);
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { onPointerMove };
}

/** Delta pill. `delta` is a compare block ({deltaPct|deltaPts, state}); goodWhen decides green vs red. */
export function DeltaPill({ delta, goodWhen = "up", kind = "pct", label }) {
  if (!delta) return null;
  const { state } = delta;
  const amount = kind === "pts" ? delta.deltaPts : delta.deltaPct;
  let text;
  let tone = "neutral";
  let icon = null;
  if (state === "new") {
    text = "new";
    tone = "good";
    icon = "arrowUp";
  } else if (state === "none" || amount == null) {
    text = "-";
  } else if (state === "flat" || amount === 0) {
    text = kind === "pts" ? "0 pts" : "0%";
  } else {
    const up = amount > 0;
    icon = up ? "trendUp" : "trendDown";
    tone = (up ? "up" : "down") === goodWhen ? "good" : "bad";
    text = `${up ? "+" : "-"}${Math.abs(amount).toFixed(Math.abs(amount) < 10 ? 1 : 0).replace(/\.0$/, "")}${kind === "pts" ? " pts" : "%"}`;
  }
  const full = label || (state === "new" ? "No activity in the previous period" : "Change against the previous period");
  return (
    <span className={cx("adm-delta", `is-${tone}`)} title={full}>
      {icon ? <Icon name={icon} size={14} strokeWidth={2.2} /> : null}
      <span>{text}</span>
      <span className="adm-sr">{full}</span>
    </span>
  );
}

/**
 * Pastel KPI card. tone: mint | butter | peach | rose | periwinkle | sky | violet | teal.
 * value: number (counts up) formatted by `format`; series: faint decorative area behind the value.
 */
export function KpiCard({ label, value, format, delta, goodWhen = "up", deltaKind = "pct", series, tone = "mint", icon, href, caption, loading, index = 0 }) {
  const body = (
    <>
      <span className="adm-kc__glow" aria-hidden="true" />
      {series && series.length > 1 && !loading ? <Sparkline className="adm-kc__spark" data={series} width="100%" height={72} dot={false} color="var(--kpi-spark)" strokeWidth={1.6} label={`${label} trend`} /> : null}
      <div className="adm-kc__top">
        <span className="adm-kc__label">{label}</span>
        {icon ? <span className="adm-kc__icon"><Icon name={icon} size={16} /></span> : null}
      </div>
      <div className="adm-kc__bottom">
        <div className="adm-kc__main">
          <div className="adm-kc__value">
            {loading ? <span className="adm-skel" style={{ width: 96, height: 30 }} aria-hidden="true" /> : <CountUp value={value} format={format} />}
          </div>
          {caption && !loading ? <div className="adm-kc__caption">{caption}</div> : null}
        </div>
        {loading ? null : <DeltaPill delta={delta} goodWhen={goodWhen} kind={deltaKind} />}
      </div>
    </>
  );
  const props = { className: cx("adm-kc adm-spot", `adm-tone-${tone}`, href && "is-link"), style: { "--i": index } };
  return href ? <Link href={href} {...props}>{body}</Link> : <div {...props}>{body}</div>;
}

const PRESETS = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "ytd", label: "YTD" },
];

/** Date-range control synced to the URL (range=7d|30d|90d|ytd or from/to). `params`/`setParams` come from useUrlParams(). Custom range = shadcn Popover. */
export function RangePicker({ params, setParams }) {
  const custom = Boolean(params.from || params.to);
  const active = custom ? "custom" : PRESETS.some((p) => p.id === params.range) ? params.range : "30d";
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(params.from || "");
  const [to, setTo] = useState(params.to || "");
  const tooLong = from && to && (new Date(to) - new Date(from)) / 86_400_000 >= 366;
  const invalid = !from || !to || from > to || tooLong;
  return (
    <div className="adm-rangepick">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="adm-rseg" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="adm-rseg__btn" aria-pressed={active === p.id} onClick={() => { setOpen(false); setParams({ range: p.id === "30d" ? "" : p.id, from: "", to: "" }); }}>{p.label}</button>
          ))}
          <PopoverTrigger asChild>
            <button type="button" className="adm-rseg__btn" aria-pressed={active === "custom"}>
              <Icon name="calendar" size={14} />Custom
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent align="end" className="tw:grid tw:w-64 tw:gap-3 tw:rounded-2xl">
          <label className="tw:grid tw:gap-1 tw:text-xs tw:font-semibold tw:text-muted-foreground">From<Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="tw:h-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-sm" /></label>
          <label className="tw:grid tw:gap-1 tw:text-xs tw:font-semibold tw:text-muted-foreground">To<Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="tw:h-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-sm" /></label>
          {tooLong ? <p className="adm-field__error" role="alert">At most 366 days.</p> : null}
          <Button variant="primary" size="sm" disabled={invalid} onClick={() => { setParams({ range: "", from, to }); setOpen(false); }}>Apply</Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
