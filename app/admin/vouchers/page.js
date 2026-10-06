"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import {
  Button, DateRangeFilter, DateTime, ExportCsvButton, FilterToolbar, PageHeader, RequirePermission, SearchInput, SelectFilter,
  buildChips, dateChipText, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";
import { VOUCHER_STATUS, VoucherBadge, formatDay, statusOptions } from "../_ops/Ops";

const LIMIT = 20;
const EMPTY = [];
const KEYS = ["q", "status", "sf", "st"];

export default function VouchersPage() {
  return (
    <RequirePermission permission="vouchers.read">
      <Vouchers />
    </RequirePermission>
  );
}

function Vouchers() {
  const api = useAdminApi();
  const router = useRouter();
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const filters = useMemo(
    () => ({ q: params.q, status: params.status, serviceFrom: params.sf, serviceTo: params.st, sort: params.sort || undefined }),
    [params.q, params.status, params.sf, params.st, params.sort]
  );
  const query = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit]);
  const { data, error, loading, reload } = useAdminQuery("/admin/vouchers", query);
  const active = KEYS.filter((k) => params[k]).length;
  const clear = () => setParams(Object.fromEntries(KEYS.map((k) => [k, ""])));

  const columns = useMemo(
    () => fromKitColumns([
      { key: "displayCode", label: "Code", primary: true, render: (v) => <span className="adm-ops-code">{v.displayCode}</span> },
      { key: "bookingReference", label: "Booking", render: (v) => <Link className="adm-ops-link" href={`/admin/bookings/${v.bookingId}`}>{v.bookingReference}</Link> },
      { key: "activityTitle", label: "Activity", render: (v) => (<>{v.activityTitle || "-"}<small className="adm-ops-sub">{v.customerName}</small></>) },
      { key: "serviceDay", label: "Service date", render: (v) => (<>{formatDay(v.serviceDay)}<small className="adm-ops-sub">{v.travellers != null ? `${v.travellers} ${v.travellers === 1 ? "traveller" : "travellers"}` : ""}</small></>) },
      { key: "status", label: "Status", sortable: true, render: (v) => <VoucherBadge status={v.status} /> },
      { key: "redeemedAt", label: "Redeemed", sortable: true, render: (v) => (v.redeemedAt ? (<><DateTime value={v.redeemedAt} />{v.redeemedByName ? <small className="adm-ops-sub">{v.redeemedByName}</small> : null}</>) : "-") },
      { key: "issuedAt", label: "Issued", sortable: true, hidden: true, render: (v) => <DateTime value={v.issuedAt} /> },
    ]),
    []
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);  const rowActions = useMemo(
    () =>
      fromKitActions((v) => [
        { label: "View booking", icon: "eye", onSelect: () => router.push(`/admin/bookings/${v.bookingId}`) },
        { label: "Copy code", icon: "copy", onSelect: () => navigator.clipboard?.writeText(v.displayCode) },
      ]),
    [router]
  );
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: (p) => VOUCHER_STATUS[p.status]?.label || p.status },
      { keys: ["sf", "st"], label: "Service date", text: (p) => dateChipText(p.sf, p.st) },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Vouchers"
        description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} vouchers${active ? " match these filters" : ""} · guests show the QR code, staff scan it at the gate` : "One voucher per confirmed booking. Guests show the QR code; staff scan it at the gate."}
        actions={
          <>
            {can("vouchers.validate") ? <Link href="/admin/scan" className="adm-btn adm-btn--primary"><span className="adm-btn__label">Open scanner</span></Link> : null}
            {can("vouchers.export") ? <ExportCsvButton filename="vouchers.csv" getBlob={() => api.download("/admin/vouchers/export.csv", { query: filters })} /> : null}
          </>
        }
      />
      <DataTable
        label="Vouchers"
        storageKey="vouchers"
        manual
        title="Voucher list"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(v) => v.id ?? v.displayCode}
        rowCount={data?.pagination?.total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(v) => router.push(`/admin/bookings/${v.bookingId}`)}
        rowActions={rowActions}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Code, booking, name or activity" label="Search vouchers" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={clear} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Status" allLabel="All statuses" value={params.status || ""} onChange={(status) => setParams({ status })} options={statusOptions(VOUCHER_STATUS)} />
            <DateRangeFilter label="Service date" mode="future" placeholder="Service date range" value={{ from: params.sf, to: params.st }} onChange={(v) => setParams({ sf: v.from || "", st: v.to || "" })} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No vouchers match these filters" : "No vouchers yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "A voucher is issued as soon as a booking is confirmed."}</p>
            {active ? <div className="adm-empty__action"><Button onClick={clear}>Clear filters</Button></div> : null}
          </div>
        }
      />
    </>
  );
}
