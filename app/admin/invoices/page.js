"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import {
  DateRangeFilter, DateTime, ExportCsvButton, FilterToolbar, Money, PageHeader, RequirePermission, SearchInput, SelectFilter,
  StatusBadge, UserCell, buildChips, dateChipText, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";
import { INVOICE_STATUS, InvoiceBadge, dayEndIso, dayStartIso, statusOptions, useFileDownload } from "../_ops/Ops";

const LIMIT = 20;
const EMPTY = [];
const KEYS = ["q", "status", "kind", "cf", "ct"];
const KINDS = [{ value: "invoice", label: "Invoices" }, { value: "credit_note", label: "Credit notes" }];

export default function InvoicesPage() {
  return (
    <RequirePermission permission="invoices.read">
      <Invoices />
    </RequirePermission>
  );
}

function Invoices() {
  const api = useAdminApi();
  const router = useRouter();
  const { can } = useAdminMe();
  const { download } = useFileDownload();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const filters = useMemo(
    () => ({ q: params.q, status: params.status, kind: params.kind, from: dayStartIso(params.cf), to: dayEndIso(params.ct), sort: params.sort || undefined }),
    [params.q, params.status, params.kind, params.cf, params.ct, params.sort]
  );
  const query = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit]);
  const { data, error, loading, reload } = useAdminQuery("/admin/invoices", query);
  const active = KEYS.filter((k) => params[k]).length;
  const clear = () => setParams(Object.fromEntries(KEYS.map((k) => [k, ""])));

  const columns = useMemo(
    () => fromKitColumns([
      { key: "invoiceNumber", label: "Number", sortable: true, primary: true, render: (i) => <Link className="adm-ops-link" href={`/admin/invoices/${i.id}`}>{i.invoiceNumber}</Link> },
      { key: "kind", label: "Type", render: (i) => (i.kind === "credit_note" ? <StatusBadge tone="warning">Credit note</StatusBadge> : <StatusBadge tone="brand">Invoice</StatusBadge>) },
      { key: "customer", label: "Customer", render: (i) => <UserCell name={i.customerName} email={i.customerEmail} size={32} /> },
      { key: "bookingReference", label: "Booking", render: (i) => (i.bookingReference ? <Link className="adm-ops-link" href={`/admin/bookings/${i.bookingId}`}>{i.bookingReference}</Link> : "-") },
      { key: "status", label: "Status", sortable: true, render: (i) => <InvoiceBadge status={i.status} /> },
      { key: "total", label: "Total", sortable: true, align: "right", render: (i) => <Money value={i.total} currency={i.currency} negative={i.kind === "credit_note"} /> },
      { key: "createdAt", label: "Issued", sortable: true, render: (i) => <DateTime value={i.issuedAt} /> },
    ]),
    []
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);  const rowActions = useMemo(
    () =>
      fromKitActions((i) => [
        { label: "View invoice", icon: "eye", onSelect: () => router.push(`/admin/invoices/${i.id}`) },
        { label: "Download PDF", icon: "download", onSelect: () => download(`/admin/invoices/${i.id}/pdf`, `${i.invoiceNumber}.pdf`) },
        { label: "Copy number", icon: "copy", onSelect: () => navigator.clipboard?.writeText(i.invoiceNumber) },
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router]
  );
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["kind"], label: "Type", text: (p) => KINDS.find((k) => k.value === p.kind)?.label || p.kind },
      { keys: ["status"], label: "Status", text: (p) => INVOICE_STATUS[p.status]?.label || p.status },
      { keys: ["cf", "ct"], label: "Issued", text: (p) => dateChipText(p.cf, p.ct) },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Invoices"
        description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} invoices and credit notes${active ? " match these filters" : ""} · numbers run in sequence per year` : "Invoices for paid bookings and the credit notes issued for refunds."}
        actions={can("invoices.export") ? <ExportCsvButton filename="invoices.csv" getBlob={() => api.download("/admin/invoices/export.csv", { query: filters })} /> : null}
      />
      <DataTable
        label="Invoices"
        storageKey="invoices"
        manual
        title="Invoice list"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(i) => i.id}
        rowCount={data?.pagination?.total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(i) => router.push(`/admin/invoices/${i.id}`)}
        rowActions={rowActions}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Number, booking, name or email" label="Search invoices" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={clear} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Type" allLabel="All" value={params.kind || ""} onChange={(kind) => setParams({ kind })} options={KINDS} />
            <SelectFilter label="Status" allLabel="All statuses" value={params.status || ""} onChange={(status) => setParams({ status })} options={statusOptions(INVOICE_STATUS)} />
            <DateRangeFilter label="Issued date" value={{ from: params.cf, to: params.ct }} onChange={(v) => setParams({ cf: v.from || "", ct: v.to || "" })} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No invoices match these filters" : "No invoices yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "An invoice is created when a booking is paid."}</p>
          </div>
        }
      />
    </>
  );
}
