"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatMoney } from "../_lib/format";
import { BarChart, Button, Card, DateRangeField, EmptyState, ErrorState, PageHeader, RequirePermission, StatCard, useUrlParams } from "../_kit";
import { humanize } from "../_lib/format";
import { money } from "../_ops/Ops";
import { reveal } from "../_kit/motion";

export default function FinancePage() {
  return (
    <RequirePermission permission="finance.read">
      <Overview />
    </RequirePermission>
  );
}

const iso = (date) => date.toISOString().slice(0, 10);

/** Quick ranges relative to today in UAE time (computed on click, never during render). */
function presetRange(days) {
  const today = new Date(Date.now() + 4 * 3_600_000);
  const from = new Date(today.getTime() - (days - 1) * 86_400_000);
  return { from: iso(from), to: iso(today) };
}

/** At most 31 bars: longer ranges are bucketed so the chart stays readable. */
function bucketDays(days) {
  const size = Math.max(1, Math.ceil(days.length / 31));
  const out = [];
  for (let i = 0; i < days.length; i += size) {
    const slice = days.slice(i, i + size);
    out.push({
      label: `${slice[0].date.slice(8)}/${slice[0].date.slice(5, 7)}`,
      collected: slice.reduce((s, d) => s + d.collected, 0),
      refunded: slice.reduce((s, d) => s + d.refunded, 0),
      net: slice.reduce((s, d) => s + d.net, 0),
    });
  }
  return { rows: out, size };
}

function Overview() {
  const [params, setParams] = useUrlParams();
  const query = useMemo(() => ({ from: params.from, to: params.to }), [params.from, params.to]);
  const { data, error, loading, reload } = useAdminQuery("/admin/finance/overview", query);
  const bucketed = useMemo(() => (data ? bucketDays(data.byDay) : null), [data]);
  const maxType = Math.max(...(data?.byServiceType || []).map((t) => t.collected), 1);

  return (
    <>
      <PageHeader title="Finance" description="Money in and out, from real payments and refunds. Amounts are in AED, days are Asia/Dubai calendar days." actions={<Link href="/admin/finance/reconciliation" className="adm-btn adm-btn--secondary"><span className="adm-btn__label">Daily reconciliation</span></Link>} />
      <div className="adm-ops-rangebar">
        <DateRangeField label="Period" value={{ from: params.from || data?.range.from, to: params.to || data?.range.to }} onChange={(v) => setParams({ from: v.from || "", to: v.to || "" })} />
        <Button size="sm" onClick={() => setParams(presetRange(7))}>Last 7 days</Button>
        <Button size="sm" onClick={() => setParams(presetRange(30))}>Last 30 days</Button>
        <Button size="sm" onClick={() => setParams(presetRange(90))}>Last 90 days</Button>
      </div>
      {error && !data ? <ErrorState title="Could not load the overview" description={error.message} onRetry={reload} /> : (
        <>
          <div className="adm-ops-statrow">
            <StatCard label="Collected" value={data ? money(data.collected) : ""} hint={data ? `${data.paymentsCount} payments` : undefined} icon="finance" tone="success" loading={loading && !data} />
            <StatCard label="Refunded" value={data ? money(data.refunded) : ""} hint={data ? `${data.refundsCount} refunds` : undefined} icon="receipt" tone="warning" loading={loading && !data} />
            <StatCard label="Net" value={data ? money(data.net) : ""} hint="Collected minus refunded" icon="check" loading={loading && !data} />
            <StatCard label="Outstanding" value={data ? money(data.outstanding.amount) : ""} hint={data ? `${data.outstanding.count} unpaid bookings on hold` : undefined} icon="calendar" tone="info" loading={loading && !data} href="/admin/bookings?status=pending_payment" />
          </div>
          {data?.truncated ? <p className="adm-inline-error" role="alert">This period has more than 50,000 rows; totals are partial. Choose a shorter period.</p> : null}
          {data?.excludedNonAed ? <p className="adm-muted">{data.excludedNonAed} payment(s) in another currency are not included in these AED totals.</p> : null}
          <div className="adm-ops-grid2">
            <Card title="By day (net)">
              {bucketed ? (
                bucketed.rows.some((r) => r.collected || r.refunded) ? (
                  <>
                    <BarChart data={bucketed.rows.map((r, i) => ({ label: i % Math.ceil(bucketed.rows.length / 8) === 0 ? r.label : "​".repeat(i + 1), value: Math.max(0, r.net) }))} label="Net revenue" format={(v) => formatMoney(v)} />
                    {bucketed.size > 1 ? <p className="adm-muted">Each bar covers {bucketed.size} days.</p> : null}
                  </>
                ) : <EmptyState icon="finance" title="No payments in this period" description="Pick a wider period to see activity." />
              ) : null}
            </Card>
            <Card title="By service type">
              {data?.byServiceType.length ? (
                <div className="adm-ops-bars" ref={reveal}>
                  {data.byServiceType.map((t) => (
                    <div className="adm-ops-bar" key={t.serviceType}>
                      <span>{humanize(t.serviceType)}</span>
                      <span className="adm-ops-bar__track"><i className="adm-ops-bar__fill adm-reveal-x" style={{ transform: `scaleX(${Math.max(0.02, t.collected / maxType)})` }} /></span>
                      <span className="adm-ops-num">{money(t.collected)} <small className="adm-muted">({t.count})</small></span>
                    </div>
                  ))}
                </div>
              ) : <p className="adm-muted">No payments in this period.</p>}
              {data ? <p className="adm-muted" style={{ marginTop: 12 }}>Taxes &amp; fees collected: {money(data.taxCollected)} · Discounts given: {money(data.discounts)}</p> : null}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
