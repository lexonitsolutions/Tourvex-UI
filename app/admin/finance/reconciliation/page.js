"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDateTime } from "../../_lib/format";
import { Button, DateRangeFilter, Drawer, ExportCsvButton, FilterToolbar, PageHeader, RequirePermission, StatCard, StatusBadge, Switch, fromKitColumns, useUrlParams } from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { formatDay, money } from "../../_ops/Ops";

const EMPTY = [];

export default function ReconciliationPage() {
  return (
    <RequirePermission permission="finance.reconcile">
      <Reconciliation />
    </RequirePermission>
  );
}

function Reconciliation() {
  const api = useAdminApi();
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const query = useMemo(() => ({ from: params.from, to: params.to }), [params.from, params.to]);
  const { data, error, loading, reload } = useAdminQuery("/admin/finance/reconciliation", query);
  const [day, setDay] = useState(null);
  const [onlyActive, setOnlyActive] = useState(true);
  const rows = data ? (onlyActive ? data.days.filter((d) => d.paymentsCount || d.refundsCount || d.ordersPaidCount || Math.abs(d.variance) >= 0.005) : data.days) : undefined;
  const range = data?.range;
  const totals = data?.totals;

  const columns = useMemo(() => fromKitColumns([
    { key: "date", label: "Day", primary: true, render: (d) => <button type="button" className="adm-link" onClick={() => setDay(d.date)}>{formatDay(d.date)}</button> },
    { key: "payments", label: "Payments", align: "right", render: (d) => (<span className="adm-ops-num">{money(d.payments)}<small className="adm-ops-sub">{d.paymentsCount} paid</small></span>) },
    { key: "refunds", label: "Refunds", align: "right", render: (d) => (<span className="adm-ops-num">{d.refunds ? `-${money(d.refunds)}` : money(0)}<small className="adm-ops-sub">{d.refundsCount} refunded</small></span>) },
    { key: "net", label: "Net", align: "right", render: (d) => <span className={`adm-ops-num ${d.net < 0 ? "adm-ops-neg" : ""}`}>{money(d.net)}</span> },
    { key: "ordersPaid", label: "Orders paid", align: "right", render: (d) => (<span className="adm-ops-num">{money(d.ordersPaid)}<small className="adm-ops-sub">{d.ordersPaidCount} orders</small></span>) },
    {
      key: "variance", label: "Check", align: "right",
      render: (d) => Math.abs(d.variance) < 0.005 ? <StatusBadge tone="success">Balanced</StatusBadge> : <span className="adm-ops-variance is-bad">{money(d.variance)}<small className="adm-ops-sub">bookings vs orders</small></span>,
    },
  ]), []);

  return (
    <>
      <PageHeader
        title="Daily reconciliation"
        description="Payments taken against refunds paid out, per day, checked against the orders that were paid. A day is balanced when the bookings of paid orders add up to what the orders say was paid."
        actions={can("finance.export") ? (
          <>
            <ExportCsvButton filename={`reconciliation-${range?.from || "period"}.csv`} getBlob={() => api.download("/admin/finance/reconciliation/export.csv", { query })}>Daily CSV</ExportCsvButton>
            <ExportCsvButton filename={`reconciliation-lines-${range?.from || "period"}.csv`} getBlob={() => api.download("/admin/finance/reconciliation/export.csv", { query: { ...query, view: "lines" } })}>Payment lines CSV</ExportCsvButton>
          </>
        ) : null}
      />
      <FilterToolbar>
        <DateRangeFilter label="Period" placeholder="Select period" value={{ from: params.from || range?.from, to: params.to || range?.to }} onChange={(v) => setParams({ from: v.from || "", to: v.to || "" })} />
        <Switch label="Only days with activity" checked={onlyActive} onChange={setOnlyActive} />
      </FilterToolbar>
      <div className="adm-ops-statrow">
        <StatCard label="Payments" value={totals ? money(totals.payments) : ""} hint={totals ? `${totals.paymentsCount} paid bookings` : undefined} icon="finance" tone="success" loading={loading && !data} />
        <StatCard label="Refunds" value={totals ? money(totals.refunds) : ""} hint={totals ? `${totals.refundsCount} refunds` : undefined} icon="receipt" tone="warning" loading={loading && !data} />
        <StatCard label="Net" value={totals ? money(totals.net) : ""} icon="check" loading={loading && !data} />
        <StatCard label="Variance" value={totals ? money(totals.variance) : ""} hint={totals && Math.abs(totals.variance) < 0.005 ? "Everything matches" : "Needs a look"} icon="alert" tone={totals && Math.abs(totals.variance) >= 0.005 ? "warning" : "success"} loading={loading && !data} />
      </div>
      {data?.truncated ? <p className="adm-inline-error" role="alert">This period has more than 50,000 rows; totals are partial. Choose a shorter period.</p> : null}
      <DataTable
        label="Daily reconciliation"
        storageKey="reconciliation"
        title="Daily breakdown"
        columns={columns}
        data={rows || EMPTY}
        getRowId={(d) => d.date}
        paginate={false}
        showColumnsMenu={false}
        showDensityMenu={false}
        minWidth={760}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyState={<div className="adm-empty"><p className="adm-empty__title">Nothing in this period</p><p className="adm-empty__desc">No payments or refunds were recorded. Pick a wider period or show all days.</p></div>}
      />
      <DayDrawer day={day} onClose={() => setDay(null)} />
    </>
  );
}

function DayDrawer({ day, onClose }) {
  const { data, error, loading, reload } = useAdminQuery(day ? `/admin/finance/reconciliation/${day}` : null);
  const lines = data ? [...data.payments.map((p) => ({ ...p, kind: "Payment" })), ...data.refunds.map((r) => ({ ...r, kind: "Refund" }))].sort((a, b) => new Date(a.at) - new Date(b.at)) : [];
  const columns = useMemo(() => fromKitColumns([
    { key: "kind", label: "Type", render: (l) => <StatusBadge tone={l.kind === "Refund" ? "warning" : "success"}>{l.kind}</StatusBadge> },
    { key: "reference", label: "Booking", primary: true, render: (l) => <Link className="adm-ops-link" href={`/admin/bookings/${l.reference}`}>{l.reference}</Link> },
    { key: "paymentReference", label: "Payment ref", render: (l) => <span className="adm-muted">{l.paymentReference || "-"}</span> },
    { key: "amount", label: "Amount", align: "right", render: (l) => <span className={`adm-ops-num ${l.kind === "Refund" ? "adm-ops-neg" : ""}`}>{l.kind === "Refund" ? "-" : ""}{money(l.amount)}</span> },
    { key: "at", label: "Time", render: (l) => formatDateTime(l.at) },
  ]), []);
  return (
    <Drawer open={!!day} onClose={onClose} title={day ? `Payments on ${formatDay(day)}` : ""} description="The individual payments and refunds behind this day." width={640}>
      <DataTable
        label="Payments and refunds"
        columns={columns}
        data={data ? lines : EMPTY}
        getRowId={(l) => `${l.kind}-${l.reference}-${l.at}`}
        paginate={false}
        showColumnsMenu={false}
        showDensityMenu={false}
        minWidth={0}
        maxHeight="min(60vh, 560px)"
        loading={loading}
        error={error}
        onRetry={reload}
        emptyState={<div className="adm-empty"><p className="adm-empty__title">No payments or refunds this day</p></div>}
      />
      {data && !loading ? <div style={{ marginTop: 12 }}><Button variant="ghost" onClick={onClose}>Close</Button></div> : null}
    </Drawer>
  );
}
