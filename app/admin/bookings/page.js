"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import {
  DateRangeField, DateRangeFilter, DateTime, ExportCsvButton, FilterToolbar, FiltersButton, FiltersDrawer,
  Money, PageHeader, RequirePermission, SearchInput, SelectField, SelectFilter, StatusTiles, UserCell, buildChips, dateChipText,
  fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";
import { BookingStatusBadge, PAYMENT_STATUS, BOOKING_STATUS, PaymentBadge, SERVICE_TYPES, dayEndIso, dayStartIso, formatDay, paxText, statusOptions } from "../_ops/Ops";

const LIMIT = 20;
const EMPTY = [];
const FILTER_KEYS = ["q", "status", "serviceType", "activity", "paymentStatus", "cf", "ct", "sf", "st"];
const ADVANCED_KEYS = ["serviceType", "activity", "sf", "st"];
const TILES = [
  { key: "", label: "All bookings", icon: "bookings", tone: "brand" },
  { key: "pending_payment", label: "Pending payment", icon: "clock", tone: "warning" },
  { key: "confirmed", label: "Confirmed", icon: "checkCircle", tone: "success" },
  { key: "cancellation_requested", label: "Cancel requests", icon: "alert", tone: "peach" },
  { key: "cancelled", label: "Cancelled", icon: "xCircle", tone: "danger" },
  { key: "refunded", label: "Refunded", icon: "undo", tone: "info" },
  { key: "expired", label: "Expired", icon: "ban", tone: "violet" },
];

export default function BookingsPage() {
  return (
    <RequirePermission permission="bookings.read">
      <Bookings />
    </RequirePermission>
  );
}

function Bookings() {
  const api = useAdminApi();
  const router = useRouter();
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const [drawer, setDrawer] = useState(false);
  const page = Math.max(1, Number(params.page) || 1);
  const filters = useMemo(
    () => ({
      q: params.q,
      status: params.status,
      serviceType: params.serviceType,
      activity: params.activity,
      paymentStatus: params.paymentStatus,
      createdFrom: dayStartIso(params.cf),
      createdTo: dayEndIso(params.ct),
      serviceFrom: params.sf,
      serviceTo: params.st,
      sort: params.sort || undefined,
    }),
    [params.q, params.status, params.serviceType, params.activity, params.paymentStatus, params.cf, params.ct, params.sf, params.st, params.sort]
  );
  const query = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit]);
  const { data, error, loading, reload } = useAdminQuery("/admin/bookings", query);
  const summary = useAdminQuery("/admin/bookings/summary");
  const by = summary.data?.byStatus || {};
  const activities = summary.data?.activities || [];
  const allCount = Object.values(by).reduce((sum, n) => sum + n, 0);
  const active = FILTER_KEYS.filter((k) => params[k]).length;
  const advancedCount = (params.serviceType ? 1 : 0) + (params.activity ? 1 : 0) + (params.sf || params.st ? 1 : 0);
  const clear = () => setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));

  const columns = useMemo(
    () => fromKitColumns([
      {
        key: "reference", label: "Booking", sortable: true, primary: true,
        render: (b) => (
          <>
            <Link href={`/admin/bookings/${b.id}`} className="adm-ops-link">{b.reference}</Link>
            {b.orderReference ? <small className="adm-ops-sub">{b.orderReference}</small> : null}
          </>
        ),
      },
      { key: "customer", label: "Customer", render: (b) => <UserCell name={b.customerName} email={b.customerEmail} size={32} /> },
      {
        key: "title", label: "Service",
        render: (b) => (<>{b.title}<small className="adm-ops-sub">{[b.optionName, b.serviceType !== "activity" ? b.serviceType : null].filter(Boolean).join(" · ")}</small></>),
      },
      {
        key: "serviceDate", label: "Service date", sortable: true,
        render: (b) => (<>{formatDay(b.serviceDay)}<small className="adm-ops-sub">{paxText(b.adults, b.children)}</small></>),
      },
      { key: "status", label: "Status", sortable: true, render: (b) => <BookingStatusBadge status={b.status} /> },
      { key: "paymentStatus", label: "Payment", render: (b) => <PaymentBadge status={b.paymentStatus} /> },
      {
        key: "total", label: "Total", sortable: true, align: "right",
        render: (b) => (<><Money value={b.total} currency={b.currency} />{b.refundedAmount > 0 ? <small className="adm-ops-sub adm-ops-neg">refunded <Money value={b.refundedAmount} currency={b.currency} /></small> : null}</>),
      },
      { key: "createdAt", label: "Created", sortable: true, render: (b) => <DateTime value={b.createdAt} /> },
    ]),
    []
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);

  const rowActions = useMemo(
    () =>
      fromKitActions((b) => [
        { label: "View booking", icon: "eye", onSelect: () => router.push(`/admin/bookings/${b.id}`) },
        ...(b.orderReference ? [{ label: "Open order", icon: "receipt", onSelect: () => router.push(`/admin/bookings/orders/${b.orderReference}`) }] : []),
        { label: "Copy reference", icon: "copy", onSelect: () => navigator.clipboard?.writeText(b.reference) },
      ]),
    [router]
  );

  const labelOf = (map, v) => map[v]?.label || v;
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: (p) => (p.status.includes(",") ? "Selected statuses" : labelOf(BOOKING_STATUS, p.status)) },
      { keys: ["paymentStatus"], label: "Payment", text: (p) => labelOf(PAYMENT_STATUS, p.paymentStatus) },
      { keys: ["cf", "ct"], label: "Created", text: (p) => dateChipText(p.cf, p.ct) },
      { keys: ["serviceType"], label: "Service", text: (p) => SERVICE_TYPES.find((s) => s.value === p.serviceType)?.label || p.serviceType },
      { keys: ["activity"], label: "Activity", text: (p) => activities.find((a) => a.slug === p.activity)?.title || p.activity },
      { keys: ["sf", "st"], label: "Service date", text: (p) => dateChipText(p.sf, p.st) },
    ],
    setParams
  );

  const tiles = TILES.map((t) => ({ ...t, count: t.key === "" ? allCount : by[t.key] ?? 0 }));
  const total = data?.pagination?.total;

  return (
    <>
      <PageHeader
        title="Bookings"
        description={summary.data ? `${allCount.toLocaleString("en-GB")} bookings in total · ${(by.pending_payment ?? 0).toLocaleString("en-GB")} awaiting payment · ${(by.cancellation_requested ?? 0).toLocaleString("en-GB")} cancellation requests` : "Every booking across the site."}
        actions={can("bookings.export") ? <ExportCsvButton filename="bookings.csv" getBlob={() => api.download("/admin/bookings/export.csv", { query: filters })} /> : null}
      />
      <StatusTiles items={tiles} active={params.status || ""} onSelect={(status) => setParams({ status })} loading={summary.loading && !summary.data} label="Filter bookings by status" />
      <DataTable
        label="Bookings"
        storageKey="bookings"
        manual
        title="Booking list"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(b) => b.id}
        rowCount={total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
        rowActions={rowActions}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Reference, order, name or email" label="Search bookings" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={clear} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Status" allLabel="All statuses" value={params.status || ""} onChange={(status) => setParams({ status })} options={[...statusOptions(BOOKING_STATUS), ...(params.status?.includes(",") ? [{ value: params.status, label: "Selected statuses" }] : [])]} />
            <SelectFilter label="Payment" allLabel="All" value={params.paymentStatus || ""} onChange={(paymentStatus) => setParams({ paymentStatus })} options={statusOptions(PAYMENT_STATUS)} />
            <DateRangeFilter label="Created date" value={{ from: params.cf, to: params.ct }} onChange={(v) => setParams({ cf: v.from || "", ct: v.to || "" })} />
            <FiltersButton count={advancedCount} expanded={drawer} onClick={() => setDrawer(true)} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No bookings match these filters" : "No bookings yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "Bookings appear here as soon as customers check out."}</p>
          </div>
        }
      />
      <FiltersDrawer open={drawer} onClose={() => setDrawer(false)} title="More filters" description="Narrow the list by service, activity or travel date." keys={ADVANCED_KEYS} values={params} onApply={(patch) => setParams(patch)}>
        {(draft, set) => (
          <>
            <SelectField label="Service type" value={draft.serviceType} onChange={(serviceType) => set({ serviceType })} placeholder="Any service" options={SERVICE_TYPES} />
            <SelectField label="Activity" value={draft.activity} onChange={(activity) => set({ activity })} placeholder="Any activity" options={activities.map((a) => ({ value: a.slug, label: `${a.title} (${a.count})` }))} />
            <DateRangeField label="Service date" value={{ from: draft.sf, to: draft.st }} onChange={(v) => set({ sf: v.from || "", st: v.to || "" })} />
          </>
        )}
      </FiltersDrawer>
    </>
  );
}
