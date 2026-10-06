"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import {
  DateRangeFilter, DateTime, FilterToolbar, Money, PageHeader, RequirePermission, SearchInput, SelectFilter, UserCell,
  buildChips, dateChipText, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../../_kit";
import { DataTable, DataTableColumnsMenu } from "../../_ui/data-table";
import { BOOKING_STATUS, BookingStatusBadge, dayEndIso, dayStartIso, statusOptions } from "../../_ops/Ops";

const LIMIT = 20;
const EMPTY = [];
const KEYS = ["q", "status", "cf", "ct"];

export default function OrdersPage() {
  return (
    <RequirePermission permission="bookings.read">
      <Orders />
    </RequirePermission>
  );
}

function Orders() {
  const router = useRouter();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const query = useMemo(
    () => ({ q: params.q, status: params.status, createdFrom: dayStartIso(params.cf), createdTo: dayEndIso(params.ct), sort: params.sort || undefined, page, limit }),
    [params.q, params.status, params.cf, params.ct, params.sort, page, limit]
  );
  const { data, error, loading, reload } = useAdminQuery("/admin/bookings/orders", query);
  const active = KEYS.filter((k) => params[k]).length;

  const columns = useMemo(
    () => fromKitColumns([
      { key: "orderReference", label: "Order", primary: true, render: (o) => <Link href={`/admin/bookings/orders/${o.orderReference}`} className="adm-ops-link">{o.orderReference}</Link> },
      { key: "customer", label: "Customer", render: (o) => <UserCell name={o.customerName} email={o.customerEmail} size={32} /> },
      { key: "bookings", label: "Bookings", align: "right", render: (o) => o.bookings },
      { key: "status", label: "Status", render: (o) => <BookingStatusBadge status={o.status} /> },
      { key: "total", label: "Total", align: "right", render: (o) => (<><Money value={o.total} currency={o.currency} />{o.refunded > 0 ? <small className="adm-ops-sub adm-ops-neg">refunded <Money value={o.refunded} currency={o.currency} /></small> : null}</>) },
      { key: "createdAt", label: "Created", sortable: true, render: (o) => <DateTime value={o.createdAt} /> },
    ]),
    []
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rowActions = useMemo(
    () =>
      fromKitActions((o) => [
        { label: "View order", icon: "eye", onSelect: () => router.push(`/admin/bookings/orders/${o.orderReference}`) },
        { label: "Copy reference", icon: "copy", onSelect: () => navigator.clipboard?.writeText(o.orderReference) },
      ]),
    [router]
  );
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: (p) => BOOKING_STATUS[p.status]?.label || p.status },
      { keys: ["cf", "ct"], label: "Created", text: (p) => dateChipText(p.cf, p.ct) },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} orders${active ? " match these filters" : ""} · one order is one checkout and one payment` : "One order is one checkout and one payment. It groups the bookings that were paid together."}
      />
      <DataTable
        label="Orders"
        storageKey="orders"
        manual
        title="Order list"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(o) => o.orderReference}
        rowCount={data?.pagination?.total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(o) => router.push(`/admin/bookings/orders/${o.orderReference}`)}
        rowActions={rowActions}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Order, booking, name or email" label="Search orders" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={() => setParams(Object.fromEntries(KEYS.map((k) => [k, ""])))} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Status" allLabel="All statuses" value={params.status || ""} onChange={(status) => setParams({ status })} options={statusOptions(BOOKING_STATUS)} />
            <DateRangeFilter label="Created date" value={{ from: params.cf, to: params.ct }} onChange={(v) => setParams({ cf: v.from || "", ct: v.to || "" })} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No orders match these filters" : "No orders yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "Orders appear after a customer pays at checkout."}</p>
          </div>
        }
      />
    </>
  );
}
