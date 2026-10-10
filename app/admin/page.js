"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminMe } from "./_lib/AdminMeProvider";
import { useAdminQuery } from "./_lib/useAdminQuery";
import { formatRelative } from "./_lib/format";
import { dayLabel, fmtAed, fmtAed2, fmtInt, fmtPct, periodText, rangeQuery, rangeSearch, serviceLabel } from "./_lib/reports";
import { Popover, PopoverContent, PopoverTrigger } from "./_ui/components/popover";
import { reveal } from "./_kit/motion";
import { AreaChart, Card, DeltaPill, ErrorState, HBars, Icon, KpiCard, RangePicker, useSpotlight, useUrlParams } from "./_kit";

const FEED_ICON = { booking: "bookings", lead: "enquiries", ticket: "tickets", cancellation: "alert" };
const STAGE_ORDER = ["new", "contacted", "qualified", "quoted", "won", "lost"];

/** Dark badge with a formula popover (shadcn Popover): what it shows and exactly how it is computed. */
function NetBadge({ net, rangeLabel }) {
  return (
    <div className="adm-badge-dark">
      <span>Net revenue · {rangeLabel}</span>
      <b>{fmtAed(net.value)}</b>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="adm-badge-dark__info" aria-label="How net revenue is calculated">
            <Icon name="help" size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="tw:w-[min(340px,82vw)] tw:rounded-2xl tw:p-4 tw:text-xs tw:leading-relaxed" aria-label="Net revenue formula">
          <b className="tw:text-(--adm-ink)">Net revenue = confirmed revenue - refunds</b>
          <p style={{ marginTop: 6 }}>
            Confirmed revenue is the <code>total</code> of bookings whose payment was confirmed in the period (dated by <code>confirmedAt</code>, Asia/Dubai days), AED only.
            Refunds are succeeded AED refunds in the ledger, dated when they were made. Bookings in another currency are excluded and counted in the note below.
          </p>
          <p style={{ marginTop: 6 }}>Compared with the immediately preceding period of the same length.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Metric({ icon, label, value, delta, kind = "pct", goodWhen = "up", hint }) {
  const amount = kind === "pts" ? delta?.deltaPts : delta?.deltaPct;
  let tone = "";
  let arrow = null;
  let text = "";
  if (delta) {
    if (delta.state === "new") { text = "new"; tone = "is-good"; arrow = "arrowUp"; }
    else if (amount == null) text = "no comparison";
    else if (amount === 0) text = "no change";
    else {
      const up = amount > 0;
      arrow = up ? "arrowUp" : "arrowDown";
      tone = (up ? "up" : "down") === goodWhen ? "is-good" : "is-bad";
      text = `${Math.abs(amount)}${kind === "pts" ? " pts" : "%"} vs previous`;
    }
  }
  return (
    <div className="adm-metric">
      <span className="adm-metric__label"><Icon name={icon} size={14} />{label}</span>
      <span className="adm-metric__value">{value}</span>
      <span className={`adm-metric__delta ${tone}`}>{arrow ? <Icon name={arrow} size={13} strokeWidth={2.2} /> : null}{text}</span>
      {hint ? <span className="adm-metric__hint">{hint}</span> : null}
    </div>
  );
}

function Tile({ className = "", index = 6, title, sub, actions, children, dark }) {
  return (
    <section className={`adm-bt adm-spot ${dark ? "adm-bt--dark" : ""} ${className}`} style={{ "--i": index }}>
      <span className="adm-spot__glow" aria-hidden="true" />
      {title ? (
        <header className="adm-bt__head">
          <div>
            <h2 className="adm-bt__title">{title}</h2>
            {sub ? <p className="adm-bt__sub">{sub}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

function IntelligencePanel({ data, intel }) {
  const m = [];
  if (intel.bookingsToday) m.push(<Metric key="bt" icon="calendar" label="Bookings today" value={fmtInt(intel.bookingsToday.value)} delta={intel.bookingsToday} hint="vs yesterday (full day)" />);
  if (intel.averageBookingValue) m.push(<Metric key="avg" icon="finance" label="Avg booking value" value={fmtAed(intel.averageBookingValue.value)} delta={intel.averageBookingValue} />);
  if (intel.leadConversion) m.push(<Metric key="lc" icon="enquiries" label="Lead conversion" value={fmtPct(intel.leadConversion.value)} delta={intel.leadConversion} kind="pts" hint={`${intel.leadConversion.numerator} won of ${intel.leadConversion.denominator} new leads`} />);
  if (intel.cancellationRate) m.push(<Metric key="cr" icon="close" label="Cancellation rate" value={fmtPct(intel.cancellationRate.value)} delta={intel.cancellationRate} kind="pts" goodWhen="down" hint={`${intel.cancellationRate.numerator} of ${intel.cancellationRate.denominator} bookings`} />);
  if (intel.refundTotal) m.push(<Metric key="rt" icon="receipt" label="Refunds" value={fmtAed(intel.refundTotal.value)} delta={intel.refundTotal} goodWhen="down" hint={`${intel.refundTotal.count} refund${intel.refundTotal.count === 1 ? "" : "s"}`} />);
  if (intel.slaCompliance) m.push(<Metric key="sla" icon="tickets" label="First-response SLA" value={fmtPct(intel.slaCompliance.value)} delta={intel.slaCompliance} kind="pts" hint={`target ${intel.slaCompliance.targetHours} h`} />);
  const net = intel.netRevenue;
  if (!m.length && !data.summary) return null;
  const sum = data.summary;
  return (
    <Tile index={8} className="adm-span-12" title="Executive intelligence" sub="Real figures for the selected period against the one before it. Rule-based text, no scoring or predictions." actions={net ? <NetBadge net={net} rangeLabel={data.range.label} /> : null}>
      {m.length ? <div className="adm-metrics" style={{ "--cols": Math.min(6, m.length) }}>{m}</div> : null}
      {sum ? (
        <div className="adm-summary">
          <span className="adm-summary__icon"><Icon name="info" size={18} /></span>
          <div>
            <p className="adm-summary__text"><strong>{sum.headline}.</strong>{sum.attention.length ? " Needs attention:" : ""}</p>
            {sum.attention.length ? (
              <div className="adm-summary__attn">
                {sum.attention.map((a) => <Link key={a.id} href={a.href} className="adm-attn"><Icon name="alert" size={13} />{a.text}<Icon name="chevronRight" size={13} /></Link>)}
              </div>
            ) : null}
            {data.notes?.excludedNonAed > 0 ? <p className="adm-summary__note">{data.notes.excludedNonAed} confirmed booking{data.notes.excludedNonAed === 1 ? "" : "s"} in another currency {data.notes.excludedNonAed === 1 ? "is" : "are"} not included in AED figures.</p> : null}
          </div>
        </div>
      ) : null}
    </Tile>
  );
}

function TrendTile({ data, search }) {
  const options = [
    data.kpis.revenue && { id: "revenue", label: "Revenue", kpi: data.kpis.revenue, money: true },
    data.kpis.bookings && { id: "bookings", label: "Bookings", kpi: data.kpis.bookings },
    data.kpis.leads && { id: "leads", label: "Leads", kpi: data.kpis.leads },
    data.kpis.customers && { id: "customers", label: "Customers", kpi: data.kpis.customers },
  ].filter(Boolean);
  const [pick, setPick] = useState(options[0]?.id);
  const current = options.find((o) => o.id === pick) || options[0];
  const labels = useMemo(() => data.range.days.map(dayLabel), [data.range.days]);
  if (!current) return null;
  const fmt = current.money ? fmtAed2 : fmtInt;
  const empty = current.kpi.series.every((v) => v === 0);
  return (
    <Tile index={9} className="adm-span-8" title="Performance trend" sub="Daily, Asia/Dubai days. Hover the chart for exact values." actions={
      <div className="adm-metric-tabs" role="group" aria-label="Metric">
        {options.map((o) => <button key={o.id} type="button" aria-pressed={o.id === current.id} onClick={() => setPick(o.id)}>{o.label}</button>)}
      </div>
    }>
      <div className="adm-chartnums">
        <b>{current.money ? fmtAed(current.kpi.value) : fmtInt(current.kpi.value)}</b>
        <DeltaPill delta={current.kpi} />
        <span>previous period: {current.money ? fmtAed(current.kpi.previous) : fmtInt(current.kpi.previous)}</span>
      </div>
      {empty ? <div className="adm-chart-empty">No {current.label.toLowerCase()} in this period yet.</div> : <AreaChart series={[{ label: current.label, data: current.kpi.series, color: "var(--adm-teal)" }]} labels={labels} format={fmt} label={`${current.label} per day`} />}
      {data.sections.includes("revenue") || data.sections.includes("bookings") ? <Link className="adm-bt__link" href={`/admin/reports${search}`}>Open reports<Icon name="chevronRight" size={14} /></Link> : null}
    </Tile>
  );
}

function FeedTile({ items, span, search }) {
  return (
    <Tile index={13} className={span} title="Recent activity" sub="Latest bookings, leads, tickets and cancellation requests" actions={null}>
      {items.length ? (
        <div className="adm-feed">
          {items.map((a) => (
            <Link key={`${a.type}-${a.id}`} href={a.href} className="adm-feed__item">
              <span className={`adm-feed__ico is-${a.type}`}><Icon name={FEED_ICON[a.type] || "dot"} size={16} /></span>
              <span style={{ minWidth: 0 }}><div className="adm-feed__t">{a.title}</div><div className="adm-feed__s">{a.subtitle}</div></span>
              <span className="adm-feed__when" suppressHydrationWarning>{formatRelative(a.at)}</span>
            </Link>
          ))}
        </div>
      ) : <div className="adm-chart-empty">Nothing has happened yet. New bookings, leads and tickets show up here.</div>}
      <span className="adm-sr">{search}</span>
    </Tile>
  );
}

export default function AdminDashboardPage() {
  const { can, user } = useAdminMe();
  const allowed = can("dashboard.read");
  const [params, setParams] = useUrlParams();
  const query = useMemo(() => rangeQuery(params), [params]);
  const { data, error, loading, reload } = useAdminQuery(allowed ? "/admin/dashboard" : null, query);
  // low stock / sold out badge; silent when the role has no stock.read or the call fails
  const stock = useAdminQuery(can("stock.read") ? "/admin/stock/summary" : null, undefined, { prefetchNext: false });
  const spot = useSpotlight();
  const search = rangeSearch(params);
  const first = (user?.name || "").split(" ")[0];
  const skeleton = loading && !data;
  const k = data?.kpis || {};
  const intel = data?.intelligence || {};
  const b = data?.breakdowns || {};

  const cards = [];
  if (skeleton) {
    ["mint", "periwinkle", "sky", "violet", "butter", "rose", "teal", "peach"].forEach((tone, i) => cards.push(<KpiCard key={tone} tone={tone} label="Loading" loading index={i} />));
  } else if (data) {
    if (k.revenue) cards.push({ key: "revenue", tone: "mint", icon: "finance", label: "Confirmed revenue", value: k.revenue.value, format: fmtAed, delta: k.revenue, series: k.revenue.series, caption: `Net ${fmtAed(k.revenue.net.value)} after refunds`, href: can("finance.read") ? "/admin/finance" : undefined });
    if (k.bookings) cards.push({ key: "bookings", tone: "periwinkle", icon: "bookings", label: "Bookings created", value: k.bookings.value, format: fmtInt, delta: k.bookings, series: k.bookings.series, caption: intel.bookingsToday ? `${fmtInt(intel.bookingsToday.value)} today` : undefined, href: "/admin/bookings" });
    if (k.customers) cards.push({ key: "customers", tone: "sky", icon: "customers", label: "New customers", value: k.customers.value, format: fmtInt, delta: k.customers, series: k.customers.series, href: "/admin/customers" });
    if (k.leads) cards.push({ key: "leads", tone: "violet", icon: "enquiries", label: "Leads & enquiries", value: k.leads.value, format: fmtInt, delta: k.leads, series: k.leads.series, caption: "created in period", href: "/admin/leads" });
    if (k.tickets) cards.push({ key: "tickets", tone: "butter", icon: "tickets", label: "Open tickets", value: k.tickets.open, format: fmtInt, delta: k.tickets.created, goodWhen: "down", series: k.tickets.created.series, caption: `${fmtInt(k.tickets.created.value)} new · ${fmtInt(k.tickets.overdue)} past SLA`, href: "/admin/tickets" });
    if (k.cancellationRequests) cards.push({ key: "cancel", tone: "rose", icon: "alert", label: "Cancellation requests", value: k.cancellationRequests.pending, format: fmtInt, delta: k.cancellationRequests.requested, goodWhen: "down", series: k.cancellationRequests.requested.series, caption: `${fmtInt(k.cancellationRequests.requested.value)} requested in period`, href: "/admin/bookings/cancellations" });
    if (k.vouchers) cards.push({ key: "vouchers", tone: "teal", icon: "vouchers", label: "Vouchers redeemed", value: k.vouchers.value, format: fmtInt, delta: k.vouchers, series: k.vouchers.series, href: "/admin/vouchers" });
    if (k.refunds) cards.push({ key: "refunds", tone: "peach", icon: "receipt", label: "Refunded", value: k.refunds.value, format: fmtAed, delta: k.refunds, goodWhen: "down", series: k.refunds.series, caption: `${fmtInt(intel.refundTotal?.count ?? 0)} refunds`, href: can("finance.read") ? "/admin/finance" : undefined });
    if (stock.data && !stock.error) {
      const low = Number(stock.data.lowStock) || 0;
      const out = Number(stock.data.soldOut) || 0;
      cards.push({ key: "stock", tone: out > 0 ? "rose" : "butter", icon: "inventory", label: "Low stock and sold out", value: low + out, format: fmtInt, caption: `${fmtInt(low)} low · ${fmtInt(out)} sold out`, goodWhen: "down", href: "/admin/inventory/alerts" });
    }
  }

  const row2 = [];
  if (data) {
    const feed = data.activity || [];
    const hasFeed = data.sections.some((s) => ["bookings", "leads", "tickets"].includes(s));
    const tiles = [];
    if (b.topActivities) tiles.push("top");
    if (b.leadPipeline) tiles.push("pipeline");
    if (hasFeed) tiles.push("feed");
    const span = tiles.length === 1 ? "adm-span-12" : tiles.length === 2 ? "adm-span-6" : "adm-span-4";
    if (b.topActivities) row2.push(
      <Tile key="top" index={11} className={span} title="Top activities" sub="By confirmed revenue, top 5" actions={<Link className="adm-bt__link" href={`/admin/reports/top-activities${search}`}>Report<Icon name="chevronRight" size={14} /></Link>}>
        <HBars data={b.topActivities.map((t) => ({ label: t.title, sub: `${t.bookings} booking${t.bookings === 1 ? "" : "s"}`, value: t.revenue }))} format={fmtAed} empty="No confirmed bookings in this period." />
      </Tile>
    );
    if (b.leadPipeline) {
      const max = Math.max(...b.leadPipeline.map((s) => s.count), 1);
      row2.push(
        <Tile key="pipe" index={12} className={span} title="Lead pipeline" sub="Leads created in the period, by current stage" actions={<Link className="adm-bt__link" href={`/admin/reports/lead-funnel${search}`}>Report<Icon name="chevronRight" size={14} /></Link>}>
          {b.leadPipeline.every((s) => s.count === 0) ? <div className="adm-chart-empty">No leads created in this period.</div> : (
            <div className="adm-funnel" ref={reveal}>
              {STAGE_ORDER.map((st) => {
                const s = b.leadPipeline.find((x) => x.stage === st) || { stage: st, count: 0 };
                return <div key={st} className={`adm-funnel__row is-${st}`}><span>{st}</span><div className="adm-funnel__bar"><i className="adm-reveal-x" style={{ width: `${s.count ? Math.max(4, (s.count / max) * 100) : 0}%` }} /></div><b>{s.count}</b></div>;
              })}
            </div>
          )}
        </Tile>
      );
    }
    if (hasFeed) row2.push(<FeedTile key="feed" items={feed} span={span} search={search} />);
  }

  if (!allowed) {
    return <Card><p className="adm-muted">Your role does not include dashboard metrics. Use the menu to open the sections you have access to.</p></Card>;
  }

  const allZero = data && Object.values(k).length > 0 && cards.every((c) => !c.value);
  return (
    <>
      <div className="adm-dashhead">
        <div>
          <span className="adm-pill-chip"><i />Command center</span>
          <h1 className="adm-dashhead__title">{first ? `Welcome back, ${first}` : "Dashboard"}</h1>
          <p className="adm-dashhead__sub">What is happening across bookings, revenue, customers and support, from live data.</p>
        </div>
        <div className="adm-dashhead__side">
          <RangePicker params={params} setParams={setParams} />
          <span className="adm-dashhead__period">{data ? `${periodText(data.range)} · vs ${periodText({ from: data.previousRange.from, to: data.previousRange.to })}` : " "}</span>
        </div>
      </div>

      {error && !data ? <ErrorState title="Could not load the dashboard" description={error.message} onRetry={reload} /> : (
        <div className={loading && data ? "adm-refreshing" : undefined} onPointerMove={spot.onPointerMove}>
          <h2 className="adm-sr">Executive KPI board</h2>
          {data && !cards.length ? <Card><p className="adm-muted">Your role can open the dashboard but none of its metric sections. Use the menu to open the pages you have access to.</p></Card> : (
            <div className="adm-kcs">
              {skeleton ? cards : cards.map(({ key, ...c }, i) => <KpiCard key={key} index={i} {...c} />)}
            </div>
          )}
          {allZero ? <p className="adm-reportnote" style={{ marginTop: 12 }}>No activity was recorded in this period yet. Numbers and charts fill in as bookings, leads and tickets arrive.</p> : null}

          {data ? (
            <div className="adm-bento">
              <IntelligencePanel data={data} intel={intel} />
              <TrendTile key={data.sections.join(",")} data={data} search={search} />
              {b.serviceTypes ? (
                <Tile index={10} className="adm-span-4" title="Revenue by service" sub="Confirmed revenue, AED">
                  <HBars data={b.serviceTypes.map((s) => ({ label: serviceLabel(s.serviceType), sub: `${s.bookings} booking${s.bookings === 1 ? "" : "s"}`, value: s.revenue }))} format={fmtAed} empty="No confirmed revenue in this period." />
                </Tile>
              ) : null}
              {row2}
            </div>
          ) : skeleton ? (
            <div className="adm-bento">
              <div className="adm-bt adm-span-12"><span className="adm-skel" style={{ height: 120 }} /></div>
              <div className="adm-bt adm-span-8"><span className="adm-skel" style={{ height: 240 }} /></div>
              <div className="adm-bt adm-span-4"><span className="adm-skel" style={{ height: 240 }} /></div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
