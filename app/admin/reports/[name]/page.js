"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { dayLabel, fmtAed2, fmtInt, fmtPct, periodText, rangeQuery, rangeSearch, serviceLabel } from "../../_lib/reports";
import { AreaChart, EmptyState, ErrorState, ExportCsvButton, HBars, Icon, NoAccess, RangePicker, useUrlParams } from "../../_kit";
import { reportByName } from "../reportDefs";

const num = (v) => fmtInt(v);

/** Plain responsive table: columns [{ key, label, align?, render? }]. Rows stack as cards on phones (data-label). */
function ReportTable({ columns, rows, empty }) {
  if (!rows.length) return <EmptyState icon="inbox" title="No data in this period" description={empty || "Choose a wider date range."} />;
  return (
    <div className="adm-rtable__wrap">
      <table className="adm-rtable">
        <thead><tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>{columns.map((c) => <td key={c.key} data-label={c.label} style={{ textAlign: c.align }}>{c.render ? c.render(r) : r[c.key] ?? "-"}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ items }) {
  return (
    <div className="adm-reporttotals">
      {items.map((t) => (
        <div key={t.label} className={t.tone ? `adm-tone-${t.tone}` : undefined}><span>{t.label}</span><b>{t.value}</b></div>
      ))}
    </div>
  );
}

function Panel({ title, sub, children }) {
  return (
    <section className="adm-bt" style={{ "--i": 2 }}>
      <header className="adm-bt__head"><div><h2 className="adm-bt__title">{title}</h2>{sub ? <p className="adm-bt__sub">{sub}</p> : null}</div></header>
      {children}
    </section>
  );
}

const dayCols = (extra) => [{ key: "date", label: "Date", render: (r) => dayLabel(r.date) }, ...extra];

const VIEWS = {
  sales(d) {
    const labels = d.byDay.map((x) => dayLabel(x.date));
    return (
      <>
        <Totals items={[
          { label: "Confirmed revenue", value: fmtAed2(d.totals.revenue), tone: "mint" },
          { label: "Refunded", value: fmtAed2(d.totals.refunded), tone: "peach" },
          { label: "Net revenue", value: fmtAed2(d.totals.net), tone: "teal" },
          { label: "Confirmed bookings", value: num(d.totals.bookings), tone: "periwinkle" },
          { label: "Average booking", value: fmtAed2(d.totals.averageBookingValue), tone: "butter" },
        ]} />
        <Panel title="Revenue per day" sub="Confirmed revenue and refunds (AED)">
          <AreaChart series={[{ label: "Revenue", data: d.byDay.map((x) => x.revenue), color: "var(--adm-teal)" }, { label: "Refunded", data: d.byDay.map((x) => x.refunded), color: "var(--adm-amber)" }]} labels={labels} format={fmtAed2} label="Revenue and refunds per day" />
        </Panel>
        <Panel title="By service type" sub="Revenue share, AED">
          <HBars data={d.byService.map((s) => ({ label: serviceLabel(s.serviceType), sub: `${s.bookings} booking${s.bookings === 1 ? "" : "s"}`, value: s.revenue }))} format={fmtAed2} empty="No confirmed revenue in this period." />
        </Panel>
        <Panel title="Day by day" sub="Only days with confirmed bookings appear in the CSV; quiet days show here as zero">
          <ReportTable rows={d.byDay.filter((x) => x.bookings || x.refunded).reverse()} empty="No confirmed bookings or refunds in this period." columns={dayCols([
            { key: "bookings", label: "Bookings", align: "right", render: (r) => num(r.bookings) },
            { key: "revenue", label: "Revenue", align: "right", render: (r) => fmtAed2(r.revenue) },
            { key: "refunded", label: "Refunded", align: "right", render: (r) => fmtAed2(r.refunded) },
            { key: "net", label: "Net", align: "right", render: (r) => fmtAed2(r.net) },
          ])} />
        </Panel>
        {d.excludedNonAed > 0 ? <p className="adm-reportnote">{d.excludedNonAed} confirmed booking(s) in another currency were excluded from these AED figures.</p> : null}
      </>
    );
  },

  "top-activities"(d) {
    return (
      <>
        <Panel title="Revenue by activity" sub="Top 25 by confirmed revenue">
          <HBars data={d.rows.slice(0, 10).map((r) => ({ label: r.title, sub: `${r.bookings} booking${r.bookings === 1 ? "" : "s"}`, value: r.revenue }))} format={fmtAed2} empty="No confirmed bookings in this period." />
        </Panel>
        <Panel title="Ranking">
          <ReportTable rows={d.rows} empty="No confirmed bookings in this period." columns={[
            { key: "rank", label: "#", render: (r) => r.rank },
            { key: "title", label: "Activity" },
            { key: "serviceType", label: "Type", render: (r) => serviceLabel(r.serviceType) },
            { key: "bookings", label: "Bookings", align: "right", render: (r) => num(r.bookings) },
            { key: "travellers", label: "Travellers", align: "right", render: (r) => num(r.travellers) },
            { key: "revenue", label: "Revenue", align: "right", render: (r) => fmtAed2(r.revenue) },
            { key: "averageValue", label: "Avg value", align: "right", render: (r) => fmtAed2(r.averageValue) },
          ]} />
        </Panel>
      </>
    );
  },

  "lead-funnel"(d) {
    return (
      <>
        <Totals items={[
          { label: "Leads created", value: num(d.totals.leads), tone: "violet" },
          { label: "Won", value: num(d.totals.won), tone: "mint" },
          { label: "Lost", value: num(d.totals.lost), tone: "rose" },
          { label: "Conversion", value: fmtPct(d.totals.conversionRate), tone: "sky" },
        ]} />
        <p className="adm-reportnote">{d.definition}</p>
        <Panel title="Leads created per day">
          <AreaChart series={[{ label: "Leads", data: d.byDay.map((x) => x.leads), color: "var(--dsh-tint-violet-spark)" }]} labels={d.byDay.map((x) => dayLabel(x.date))} format={num} label="Leads per day" />
        </Panel>
        <Panel title="By stage"><HBars data={d.stages.map((s) => ({ label: s.stage, value: s.count }))} format={num} empty="No leads in this period." /></Panel>
        <Panel title="By source">
          <ReportTable rows={d.sources} empty="No leads in this period." columns={[
            { key: "source", label: "Source", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.source}</span> },
            { key: "leads", label: "Leads", align: "right", render: (r) => num(r.leads) },
            { key: "won", label: "Won", align: "right", render: (r) => num(r.won) },
            { key: "lost", label: "Lost", align: "right", render: (r) => num(r.lost) },
            { key: "conversionRate", label: "Conversion", align: "right", render: (r) => fmtPct(r.conversionRate) },
          ]} />
        </Panel>
        {d.lostReasons.length ? <Panel title="Why leads were lost"><HBars data={d.lostReasons.map((l) => ({ label: l.reason.replace(/_/g, " "), value: l.count }))} format={num} color="var(--dsh-tint-rose-spark)" /></Panel> : null}
      </>
    );
  },

  support(d) {
    const t = d.totals;
    return (
      <>
        <Totals items={[
          { label: "Tickets created", value: num(t.created), tone: "butter" },
          { label: "First-response SLA met", value: fmtPct(t.compliancePct), tone: "mint" },
          { label: "Avg first response", value: t.averageFirstResponseHours == null ? "-" : `${t.averageFirstResponseHours} h`, tone: "sky" },
          { label: "Missed target", value: num(t.late + t.breached), tone: "rose" },
          { label: "Still within target", value: num(t.pending), tone: "periwinkle" },
        ]} />
        <p className="adm-reportnote">{d.definition}</p>
        <Panel title="Tickets per day" sub="Created and resolved or closed">
          <AreaChart series={[{ label: "Created", data: d.byDay.map((x) => x.created), color: "var(--adm-teal)" }, { label: "Resolved / closed", data: d.byDay.map((x) => x.resolved), color: "var(--dsh-tint-mint-spark)" }]} labels={d.byDay.map((x) => dayLabel(x.date))} format={num} label="Tickets per day" />
        </Panel>
        <Panel title="By category">
          <ReportTable rows={d.byCategory} empty="No tickets in this period." columns={[
            { key: "category", label: "Category", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category}</span> },
            { key: "tickets", label: "Tickets", align: "right", render: (r) => num(r.tickets) },
            { key: "metFirstResponse", label: "Answered in target", align: "right", render: (r) => num(r.metFirstResponse) },
          ]} />
        </Panel>
      </>
    );
  },

  cancellations(d) {
    const t = d.totals;
    return (
      <>
        <Totals items={[
          { label: "Bookings created", value: num(t.created), tone: "periwinkle" },
          { label: "Cancelled or refunded", value: num(t.cancelledOrRefunded), tone: "rose" },
          { label: "Cancellation rate", value: fmtPct(t.cancellationRatePct), tone: "butter" },
          { label: "Refunded", value: fmtAed2(t.refundedAmount), tone: "peach" },
          { label: "Refunds", value: num(t.refunds), tone: "sky" },
          { label: "Requests waiting", value: num(t.pendingRequests), tone: "violet" },
        ]} />
        <p className="adm-reportnote">{d.definition}</p>
        <Panel title="Refunded per day" sub="Succeeded AED refunds">
          <AreaChart series={[{ label: "Refunded", data: d.byDay.map((x) => x.refundedAmount), color: "var(--dsh-tint-peach-spark)" }]} labels={d.byDay.map((x) => dayLabel(x.date))} format={fmtAed2} label="Refunds per day" />
        </Panel>
        <Panel title="Cancelled by service type"><HBars data={d.byServiceType.map((s) => ({ label: serviceLabel(s.serviceType), value: s.count }))} format={num} color="var(--dsh-tint-rose-spark)" empty="No cancellations in this period." /></Panel>
        <Panel title="Day by day">
          <ReportTable rows={d.byDay.filter((x) => x.cancelled || x.refunds).reverse()} empty="No cancellations or refunds in this period." columns={dayCols([
            { key: "cancelled", label: "Cancelled / refunded bookings", align: "right", render: (r) => num(r.cancelled) },
            { key: "refunds", label: "Refunds", align: "right", render: (r) => num(r.refunds) },
            { key: "refundedAmount", label: "Refunded", align: "right", render: (r) => fmtAed2(r.refundedAmount) },
          ])} />
        </Panel>
      </>
    );
  },
};

export default function ReportPage({ params: routeParams }) {
  const { name } = use(routeParams);
  const def = reportByName(name);
  if (!def) notFound();
  return <Report def={def} />;
}

function Report({ def }) {
  const { can } = useAdminMe();
  const api = useAdminApi();
  const [params, setParams] = useUrlParams();
  const query = useMemo(() => rangeQuery(params), [params]);
  const allowed = def.view.every((p) => can(p));
  const { data, error, loading, reload } = useAdminQuery(allowed ? `/admin/reports/${def.name}` : null, query);
  if (!allowed) return <NoAccess permission={def.view.filter((p) => !can(p))} />;
  const view = VIEWS[def.name];
  return (
    <>
      <div className="adm-dashhead">
        <div>
          <Link href={`/admin/reports${rangeSearch(params)}`} className="adm-backlink"><Icon name="chevronLeft" size={14} />All reports</Link>
          <h1 className="adm-dashhead__title" style={{ marginTop: 8 }}>{def.title}</h1>
          <p className="adm-dashhead__sub">{def.description}{data ? ` ${periodText(data.range)}.` : ""}</p>
        </div>
        <div className="adm-dashhead__side">
          <RangePicker params={params} setParams={setParams} />
          {can(def.csv) ? <ExportCsvButton filename={`${def.name}.csv`} getBlob={() => api.download(`/admin/reports/${def.name}/export.csv`, { query })} /> : null}
        </div>
      </div>
      {error && !data ? <ErrorState title="Could not load this report" description={error.message} onRetry={reload} /> : !data ? (
        <div className="adm-reportstack"><span className="adm-skel" style={{ height: 96, borderRadius: 18 }} /><span className="adm-skel" style={{ height: 280, borderRadius: 22 }} /></div>
      ) : (
        <div className={`adm-reportstack ${loading ? "adm-refreshing" : ""}`}>{view(data)}</div>
      )}
    </>
  );
}
