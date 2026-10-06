"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import "../crm.css";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatDate } from "../_lib/format";
import {
  Button, ExportCsvButton, FilterToolbar, Money, PageHeader, RequirePermission, SearchInput, SelectFilter, StatusBadge,
  UserCell, buildChips, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";

const LIMIT = 20;
const EMPTY = [];
const KEYS = ["q", "status", "marketing", "type", "tag"];
const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Deactivated" }];
const TYPE_OPTIONS = [{ value: "consumer", label: "Customers only" }, { value: "b2b", label: "B2B partners only" }];
const MARKETING_OPTIONS = [{ value: "optout", label: "Opted out" }];

export default function CustomersPage() {
  return (
    <RequirePermission permission="customers.read">
      <Customers />
    </RequirePermission>
  );
}

function Customers() {
  const api = useAdminApi();
  const router = useRouter();
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const filters = useMemo(
    () => ({ q: params.q, status: params.status, marketingOptOut: params.marketing === "optout" ? "true" : undefined, b2b: params.type === "b2b" ? "true" : params.type === "consumer" ? "false" : undefined, tag: params.tag }),
    [params.q, params.status, params.marketing, params.type, params.tag]
  );
  const query = useMemo(() => ({ ...filters, page, limit, sort: params.sort || undefined }), [filters, page, limit, params.sort]);
  const { data, error, loading, reload } = useAdminQuery("/admin/customers", query);

  const columns = useMemo(
    () => fromKitColumns([
      { key: "firstName", label: "Customer", sortable: true, primary: true, render: (c) => <UserCell name={c.name} email={c.email} href={`/admin/customers/${c.id}`} size={34} /> },
      { key: "type", label: "Type", render: (c) => (c.isB2B ? <StatusBadge tone="brand" dot={false} icon="partners">B2B{c.partnerCompany ? ` - ${c.partnerCompany}` : ""}</StatusBadge> : <span className="adm-muted">Customer</span>) },
      { key: "bookings", label: "Bookings", align: "right", render: (c) => c.stats.bookings },
      { key: "ltv", label: "Lifetime value", align: "right", render: (c) => (c.stats.confirmed ? <Money value={c.stats.lifetimeValueAed} /> : "-") },
      { key: "last", label: "Last booking", nowrap: true, render: (c) => (c.stats.lastBookingAt ? formatDate(c.stats.lastBookingAt) : "-") },
      { key: "tags", label: "Tags", hidden: true, render: (c) => <div className="adm-chips">{c.tags.map((t) => <span className="adm-chip" key={t}>{t}</span>)}</div> },
      { key: "marketing", label: "Marketing", render: (c) => (c.marketingOptOut ? <StatusBadge tone="warning" dot={false} icon="ban">Opted out</StatusBadge> : <span className="adm-muted">Allowed</span>) },
      { key: "status", label: "Account", render: (c) => (c.active ? <StatusBadge status="active">Active</StatusBadge> : <StatusBadge status="deactivated">Deactivated</StatusBadge>) },
      { key: "createdAt", label: "Joined", sortable: true, nowrap: true, render: (c) => formatDate(c.createdAt) },
    ]),
    []
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rowActions = useMemo(
    () =>
      fromKitActions((c) => [
        { label: "View profile", icon: "eye", onSelect: () => router.push(`/admin/customers/${c.id}`) },
        ...(c.email ? [{ label: "Email customer", icon: "mail", href: `mailto:${c.email}` }] : []),
      ]),
    [router]
  );
  const active = KEYS.filter((k) => params[k]).length;
  const clear = () => setParams(Object.fromEntries(KEYS.map((k) => [k, ""])));
  const lookup = (opts, v) => opts.find((o) => o.value === v)?.label || v;
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Account", text: (p) => lookup(STATUS_OPTIONS, p.status) },
      { keys: ["type"], label: "Type", text: (p) => lookup(TYPE_OPTIONS, p.type) },
      { keys: ["marketing"], label: "Marketing", text: (p) => lookup(MARKETING_OPTIONS, p.marketing) },
      { keys: ["tag"], label: "Tag" },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description={data?.pagination ? `${data.pagination.total.toLocaleString("en-GB")} customers${active ? " match these filters" : ""} · lifetime value is the total of confirmed bookings charged in AED` : "Everyone with a website account."}
        actions={can("customers.export") ? <ExportCsvButton filename="customers.csv" getBlob={() => api.download("/admin/customers/export.csv", { query: { ...filters, sort: params.sort || undefined } })} /> : null}
      />
      <DataTable
        label="Customers"
        storageKey="customers"
        manual
        title="Customer list"
        columns={columns}
        data={data?.items || EMPTY}
        getRowId={(c) => c.id}
        rowCount={data?.pagination?.total}
        {...tableState}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        rowActions={rowActions}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search name, email or company" label="Search customers" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={clear} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Account" allLabel="All" value={params.status || ""} onChange={(status) => setParams({ status })} options={STATUS_OPTIONS} />
            <SelectFilter label="Type" allLabel="All" value={params.type || ""} onChange={(type) => setParams({ type })} options={TYPE_OPTIONS} />
            <SelectFilter label="Marketing" allLabel="Any" value={params.marketing || ""} onChange={(marketing) => setParams({ marketing })} options={MARKETING_OPTIONS} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active ? "No customers match these filters" : "No customers yet"}</p>
            <p className="adm-empty__desc">{active ? "Try a different search or clear the filters." : "Accounts appear here when people sign up on the website."}</p>
            {active ? <div className="adm-empty__action"><Button onClick={clear}>Clear filters</Button></div> : null}
          </div>
        }
      />
    </>
  );
}
