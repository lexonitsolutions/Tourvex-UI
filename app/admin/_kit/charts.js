"use client";

// Tiny dependency-free SVG charts. All are responsive (viewBox + width 100%) and have a text alternative.
import { useRef, useState } from "react";
import { reveal } from "./motion";

const W = 120;
const H = 32;

function scale(values, height, pad = 2) {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return (v) => height - pad - ((v - min) / span) * (height - pad * 2);
}

function pointsFor(values, width, height, pad) {
  const y = scale(values, height, pad);
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values.map((v, i) => [pad + i * step, y(v)]);
}

/** Smooth monotone cubic (Fritsch-Carlson) path through points: never overshoots, so a flat run stays flat. */
export function monotonePath(pts) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        t[i] = k * a * m[i];
        t[i + 1] = k * b * m[i];
      }
    }
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

let sparkSeq = 0;

/**
 * Smooth gradient-filled area sparkline. `width` may be a number (fixed) or "100%" (fluid; the viewBox stretches).
 * Props kept from the first version: data, width, height, color, label, fill. `dot` shows the latest point.
 */
export function Sparkline({ data = [], width = W, height = H, color = "var(--adm-teal)", label = "Trend", fill = true, dot = true, strokeWidth = 1.8, className = "" }) {
  const [uid] = useState(() => `adm-sg-${++sparkSeq}`);
  if (data.length < 2) return <span className="adm-muted" aria-hidden="true">-</span>;
  const vw = typeof width === "number" ? width : 160;
  const pts = pointsFor(data, vw, height, 3);
  const line = monotonePath(pts);
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  return (
    <svg ref={reveal} className={`adm-chart adm-spark adm-reveal-clip ${className}`.trim()} viewBox={`0 0 ${vw} ${height}`} width={width} height={height} preserveAspectRatio="none" role="img" aria-label={`${label}: ${data.join(", ")}`}>
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.38" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={area} fill={`url(#${uid})`} /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {dot && typeof width === "number" ? <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} /> : null}
    </svg>
  );
}

/**
 * Interactive area/line chart with a hover tooltip (pointer or keyboard-less hover; the data is also in aria-label).
 * series: [{ label, data:number[], color? }]; labels: x labels (same length); format: value formatter.
 */
export function AreaChart({ series = [], labels = [], height = 220, label = "Trend", format = (v) => String(v), area = true }) {
  const [uid] = useState(() => `adm-ag-${++sparkSeq}`);
  const [hover, setHover] = useState(null);
  const wrap = useRef(null);
  const w = 640;
  const padL = 8;
  const padR = 8;
  const padB = 24;
  const padT = 12;
  const n = Math.max(...series.map((s) => s.data.length), 0);
  if (n < 2) return <div className="adm-chart-empty">Not enough days to chart</div>;
  const max = Math.max(...series.flatMap((s) => s.data), 1);
  const ch = height - padB - padT;
  const step = (w - padL - padR) / (n - 1);
  const palette = ["var(--adm-c1)", "var(--adm-c2)", "var(--adm-c3)"];
  const y = (v) => padT + ch - (v / max) * ch;
  const ticks = [0, 0.5, 1];
  const every = Math.max(1, Math.ceil(n / 7));
  function onMove(e) {
    const rect = wrap.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(((ratio * w - padL) / (w - padL - padR)) * (n - 1)))));
  }
  const hx = hover == null ? 0 : padL + hover * step;
  return (
    <div className="adm-areachart" ref={wrap} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg ref={reveal} className="adm-chart adm-reveal-clip" viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={`${label}: ${series.map((s) => `${s.label} ${s.data.join(", ")}`).join("; ")}`}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s.label} id={`${uid}-${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={s.color || palette[si % palette.length]} stopOpacity="0.28" />
              <stop offset="1" stopColor={s.color || palette[si % palette.length]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((f) => (
          <line key={f} x1={padL} x2={w - padR} y1={padT + ch * (1 - f)} y2={padT + ch * (1 - f)} stroke="var(--adm-line)" strokeDasharray={f ? "3 4" : undefined} vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s, si) => {
          const color = s.color || palette[si % palette.length];
          const pts = s.data.map((v, i) => [padL + i * step, y(v)]);
          const line = monotonePath(pts);
          return (
            <g key={s.label}>
              {area ? <path d={`${line} L${pts[pts.length - 1][0]} ${padT + ch} L${pts[0][0]} ${padT + ch} Z`} fill={`url(#${uid}-${si})`} /> : null}
              <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
        {hover != null ? <line x1={hx} x2={hx} y1={padT} y2={padT + ch} stroke="var(--adm-line-strong)" vectorEffect="non-scaling-stroke" /> : null}
        {labels.map((l, i) => (i % every === 0 ? <text key={`${l}-${i}`} x={padL + i * step} y={height - 7} textAnchor={i === 0 ? "start" : "middle"} className="adm-chart__tick">{l}</text> : null))}
      </svg>
      {hover != null ? (
        <>
          {series.map((s, si) => (
            <i key={s.label} className="adm-areachart__dot" style={{ left: `${(hx / w) * 100}%`, top: y(s.data[hover]), background: s.color || palette[si % palette.length] }} aria-hidden="true" />
          ))}
          <div className="adm-tip" style={{ left: `${(hx / w) * 100}%` }} data-flip={hover > n * 0.6 ? "left" : "right"}>
            <b>{labels[hover]}</b>
            {series.map((s, si) => (
              <span key={s.label}><i style={{ background: s.color || palette[si % palette.length] }} />{s.label}<em>{format(s.data[hover])}</em></span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Horizontal bars with the value on the right; data: [{ label, value, sub?, href? }]. Pure CSS widths, no SVG scaling. */
export function HBars({ data = [], format = (v) => String(v), color = "var(--adm-teal)", empty = "Nothing to show" }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!data.length || max === 0) return <div className="adm-chart-empty">{empty}</div>;
  return (
    <ul className="adm-hbars" ref={reveal}>
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <span className="adm-hbars__label">{d.label}{d.sub ? <small>{d.sub}</small> : null}</span>
          <span className="adm-hbars__track"><i className="adm-reveal-x" style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color || color }} /></span>
          <b>{format(d.value)}</b>
        </li>
      ))}
    </ul>
  );
}

/** data: [{ label, value }] */
export function BarChart({ data = [], height = 180, color = "var(--adm-teal)", label = "Bar chart", format = (v) => v }) {
  const w = 480;
  const padL = 8;
  const padB = 22;
  const padT = 10;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = data.length ? (w - padL * 2) / data.length : 0;
  const ch = height - padB - padT;
  return (
    <svg ref={reveal} className="adm-chart" viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} x2={w - padL} y1={padT + ch * (1 - f)} y2={padT + ch * (1 - f)} stroke="var(--adm-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      {data.map((d, i) => {
        const bh = (d.value / max) * ch;
        const x = padL + i * bw + bw * 0.2;
        return (
          <g key={d.label}>
            <rect className="adm-reveal-y" style={{ "--i": i }} x={x} y={padT + ch - bh} width={bw * 0.6} height={bh} rx="3" fill={color}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
            <text x={x + bw * 0.3} y={height - 6} textAnchor="middle" className="adm-chart__tick">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** series: [{ label, data:number[], color? }]; labels: x tick labels */
export function LineChart({ series = [], labels = [], height = 180, label = "Line chart" }) {
  const w = 480;
  const padL = 8;
  const padB = 22;
  const padT = 10;
  const all = series.flatMap((s) => s.data);
  const max = Math.max(...all, 1);
  const n = Math.max(...series.map((s) => s.data.length), 2);
  const step = (w - padL * 2) / (n - 1);
  const ch = height - padB - padT;
  const palette = ["var(--adm-c1)", "var(--adm-c2)", "var(--adm-c3)"];
  return (
    <svg ref={reveal} className="adm-chart adm-reveal-clip" viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label={`${label}: ${series.map((s) => `${s.label} ${s.data.join(", ")}`).join("; ")}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} x2={w - padL} y1={padT + ch * (1 - f)} y2={padT + ch * (1 - f)} stroke="var(--adm-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      {series.map((s, si) => {
        const color = s.color || palette[si % palette.length];
        const pts = s.data.map((v, i) => [padL + i * step, padT + ch - (v / max) * ch]);
        const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
        return (
          <g key={s.label}>
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--adm-surface)" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                <title>{`${s.label}: ${s.data[i]}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l} x={padL + i * step} y={height - 6} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} className="adm-chart__tick">{l}</text>
      ))}
    </svg>
  );
}

/** data: [{ label, value, color? }] */
export function Donut({ data = [], size = 132, thickness = 16, label = "Breakdown", centerLabel }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const palette = ["var(--adm-c1)", "var(--adm-c2)", "var(--adm-c3)", "var(--adm-c4)", "var(--adm-c5)"];
  let offset = 0;
  return (
    <div className="adm-donut">
      <svg ref={reveal} className="adm-chart adm-reveal-sweep" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--adm-line)" strokeWidth={thickness} />
        {total > 0
          ? data.map((d, i) => {
              const len = (d.value / total) * c;
              const el = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color || palette[i % palette.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(len - 1.5, 0)} ${c - Math.max(len - 1.5, 0)}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>{`${d.label}: ${d.value}`}</title>
                </circle>
              );
              offset += len;
              return el;
            })
          : null}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="adm-donut__total">{centerLabel ?? total}</text>
      </svg>
      <ul className="adm-legend">
        {data.map((d, i) => (
          <li key={d.label}>
            <i style={{ background: d.color || palette[i % palette.length] }} aria-hidden="true" />
            <span>{d.label}</span>
            <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
