"use client"

/*
 * Chart primitives, dependency-free (plain SVG). shadcn's own <ChartContainer> wraps recharts (~90 kB gz); we deliberately do
 * not ship recharts. This keeps the same API shape for the parts that matter to theming:
 *   config = { desktop: { label: "Desktop", color: "var(--chart-1)" }, ... }
 * and exposes each series colour as `--color-<key>` on the container, so `fill="var(--color-desktop)"` works anywhere inside.
 * For richer dashboards keep using the kit's charts (app/admin/_kit/charts.js) or lazy-load recharts on that page only.
 */
import * as React from "react"
import { cn } from "@/app/admin/_ui/lib/utils"

const ChartContext = React.createContext(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("Chart parts must be used inside <ChartContainer>")
  return ctx
}

function ChartContainer({ id, className, children, config, ...props }) {
  const style = {}
  Object.entries(config || {}).forEach(([k, v], i) => {
    style[`--color-${k}`] = v.color || `var(--chart-${(i % 5) + 1})`
  })
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-slot="chart" id={id} style={style} className={cn("tw:flex tw:w-full tw:flex-col tw:gap-2 tw:text-xs", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartLegend({ className }) {
  const { config } = useChart()
  return (
    <ul data-slot="chart-legend" className={cn("tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-4", className)}>
      {Object.entries(config).map(([k, v]) => (
        <li key={k} className="tw:flex tw:items-center tw:gap-1.5 tw:text-muted-foreground">
          <span className="tw:size-2.5 tw:shrink-0 tw:rounded-[2px]" style={{ background: `var(--color-${k})` }} aria-hidden />
          {v.label}
        </li>
      ))}
    </ul>
  )
}

function ChartTooltipBox({ title, rows, className, style }) {
  return (
    <div
      role="status"
      style={style}
      className={cn("tw:pointer-events-none tw:absolute tw:z-10 tw:grid tw:min-w-32 tw:gap-1.5 tw:rounded-lg tw:border tw:bg-popover tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-popover-foreground tw:shadow-xl", className)}
    >
      <div className="tw:font-medium">{title}</div>
      {rows.map((r) => (
        <div key={r.key} className="tw:flex tw:items-center tw:justify-between tw:gap-4">
          <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-muted-foreground">
            <span className="tw:size-2 tw:rounded-[2px]" style={{ background: `var(--color-${r.key})` }} aria-hidden />
            {r.label}
          </span>
          <span className="tw:font-mono tw:font-medium tw:tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

const DEFAULT_W = 600

/** Track the rendered pixel width so SVG text stays 1:1 (no viewBox scaling of labels). */
function useWidth() {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(DEFAULT_W)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setW(Math.max(220, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}
const PAD = { l: 36, r: 8, t: 8, b: 22 }

function scaleFor(data, keys, stacked, height) {
  const max = Math.max(1, ...data.map((d) => (stacked ? keys.reduce((s, k) => s + (d[k] || 0), 0) : Math.max(...keys.map((k) => d[k] || 0)))))
  const nice = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / nice) * nice
  const innerH = height - PAD.t - PAD.b
  return { top, y: (v) => PAD.t + innerH * (1 - v / top), innerH }
}

function Axes({ data, labelKey, scale, height, W, ticks = 4 }) {
  const step = Math.max(1, Math.ceil(data.length / 8))
  return (
    <g className="tw:text-muted-foreground" fontSize="10">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (scale.top / ticks) * i
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={scale.y(v)} y2={scale.y(v)} stroke="var(--border)" strokeDasharray={i ? "3 3" : undefined} />
            <text x={PAD.l - 6} y={scale.y(v) + 3} textAnchor="end" fill="currentColor">{Math.round(v).toLocaleString()}</text>
          </g>
        )
      })}
      {data.map((d, i) => (i % step === 0 ? (
        <text key={i} x={PAD.l + ((W - PAD.l - PAD.r) * (i + 0.5)) / data.length} y={height - 6} textAnchor="middle" fill="currentColor">{d[labelKey]}</text>
      ) : null))}
    </g>
  )
}

/** Stacked/grouped bars. data: [{ label, a, b }], keys: series keys present in the ChartContainer config. */
function BarChartLite({ data, keys, labelKey = "label", height = 220, stacked = false, className }) {
  const { config } = useChart()
  const [hover, setHover] = React.useState(null)
  const [wrapRef, W] = useWidth()
  const scale = scaleFor(data, keys, stacked, height)
  const band = (W - PAD.l - PAD.r) / data.length
  const barW = Math.min(28, (band * 0.7) / (stacked ? 1 : keys.length))
  return (
    <div ref={wrapRef} className={cn("tw:relative", className)} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${height}`} width={W} role="img" aria-label="Bar chart" className="tw:block tw:w-full" height={height}>
        <Axes data={data} labelKey={labelKey} scale={scale} height={height} W={W} />
        {data.map((d, i) => {
          const cx = PAD.l + band * (i + 0.5)
          let acc = 0
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.l + band * i} y={PAD.t} width={band} height={scale.innerH} fill="transparent" />
              {keys.map((k, j) => {
                const v = d[k] || 0
                const h = scale.innerH * (v / scale.top)
                const x = stacked ? cx - barW / 2 : cx - (barW * keys.length) / 2 + j * barW
                const y = stacked ? scale.y(acc + v) : scale.y(v)
                acc += v
                return <rect key={k} x={x} y={y} width={barW - 1} height={h} rx="3" fill={`var(--color-${k})`} opacity={hover == null || hover === i ? 1 : 0.5} />
              })}
            </g>
          )
        })}
      </svg>
      {hover != null ? (
        <ChartTooltipBox
          title={data[hover][labelKey]}
          rows={keys.map((k) => ({ key: k, label: config[k]?.label || k, value: (data[hover][k] || 0).toLocaleString() }))}
          style={{ left: `${((PAD.l + band * (hover + 0.5)) / W) * 100}%`, top: 0, transform: "translateX(-50%)" }}
        />
      ) : null}
    </div>
  )
}

/** Smooth-less area/line chart with hover crosshair. */
function AreaChartLite({ data, keys, labelKey = "label", height = 220, className }) {
  const { config } = useChart()
  const [hover, setHover] = React.useState(null)
  const [wrapRef, W] = useWidth()
  const scale = scaleFor(data, keys, false, height)
  const px = (i) => PAD.l + ((W - PAD.l - PAD.r) * (i + 0.5)) / data.length
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * data.length - 0.5))))
  }
  return (
    <div ref={wrapRef} className={cn("tw:relative", className)} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${height}`} width={W} role="img" aria-label="Area chart" className="tw:block tw:w-full" height={height} onMouseMove={onMove}>
        <Axes data={data} labelKey={labelKey} scale={scale} height={height} W={W} />
        {keys.map((k) => {
          const pts = data.map((d, i) => `${px(i)},${scale.y(d[k] || 0)}`)
          const area = `M${px(0)},${scale.y(0)} L${pts.join(" L")} L${px(data.length - 1)},${scale.y(0)} Z`
          return (
            <g key={k}>
              <path d={area} fill={`var(--color-${k})`} opacity="0.16" />
              <polyline points={pts.join(" ")} fill="none" stroke={`var(--color-${k})`} strokeWidth="2" strokeLinejoin="round" />
            </g>
          )
        })}
        {hover != null ? (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={PAD.t} y2={height - PAD.b} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
            {keys.map((k) => <circle key={k} cx={px(hover)} cy={scale.y(data[hover][k] || 0)} r="4" fill="var(--card)" stroke={`var(--color-${k})`} strokeWidth="2" />)}
          </g>
        ) : null}
      </svg>
      {hover != null ? (
        <ChartTooltipBox
          title={data[hover][labelKey]}
          rows={keys.map((k) => ({ key: k, label: config[k]?.label || k, value: (data[hover][k] || 0).toLocaleString() }))}
          style={{ left: `${(px(hover) / W) * 100}%`, top: 0, transform: "translateX(-50%)" }}
        />
      ) : null}
    </div>
  )
}

export { ChartContainer, ChartLegend, ChartTooltipBox, BarChartLite, AreaChartLite }
