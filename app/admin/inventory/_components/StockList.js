"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDayKey } from "../../_lib/format";
import {
  Button, FilterToolbar, Icon, PageHeader, SearchInput, SelectFilter, StatusTiles, buildChips, fromKitActions, fromKitColumns,
  useTableUrlState, usePageSize, useUrlParams,
} from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { ITEM_STATUS_FILTER, PRODUCT_TYPES, SORTS, STOCK_API, capText, itemHref, num, productHref, typeLabel } from "../_lib/stock";
import { CapacityBar, StockStatus } from "./parts";
import AddItemDialog from "./AddItemDialog";

const EMPTY = [];
const LIMIT = 20;
const statusLabel = (v) => ITEM_STATUS_FILTER.find((s) => s.value === v)?.label || v;

export function TitleCell({ item }) {
  return (
    <div className="inv-titlecell">
      <Link href={itemHref(item.id)} className="inv-titlelink">{item.title || "Untitled"}</Link>
      <small>{item.variantLabel || (item.variantId && item.variantId !== "default" ? item.variantId : item.productRef)}</small>
    </div>
  );
}

/** Stock overview: summary tiles, filters and the paged item table (GET /admin/stock/summary and /items). */
export default function StockList() {
  const router = useRouter();
  const { can } = useAdminMe();
  const canWrite = can("stock.write");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const type = PRODUCT_TYPES.some((t) => t.value === params.type) ? params.type : "";
  const status = ITEM_STATUS_FILTER.some((s) => s.value === params.status) ? params.status : "";
  const sort = SORTS.some((s) => s.value === params.sort) ? params.sort : "attention";
  const [adding, setAdding] = useState(false);

  const query = useMemo(() => ({ type: type || undefined, q: params.q, status: status || undefined, sort, page, limit }), [type, params.q, status, sort, page, limit]);
  const list = useAdminQuery(`${STOCK_API}/items`, query);
  const summary = useAdminQuery(`${STOCK_API}/summary`);
  const total = list.data?.pagination?.total;
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  // sorting is chosen with the "Sort" pill (the API owns the order); the table keeps its own header sort off
  const tableProps = { pagination: tableState.pagination, onPaginationChange: tableState.onPaginationChange };

  const columns = useMemo(
    () =>
      fromKitColumns([
        { key: "title", label: "Item", primary: true, render: (r) => <TitleCell item={r} /> },
        { key: "productType", label: "Type", nowrap: true, render: (r) => <span className="inv-type">{typeLabel(r.productType)}</span> },
        { key: "defaultCapacity", label: "Daily capacity", nowrap: true, render: (r) => <span className="inv-n">{capText(r.defaultCapacity ?? r.inheritedCapacity)}</span> },
        { key: "soldTotal", label: "Sold (30d)", nowrap: true, render: (r) => <span className="inv-n">{num(r.soldTotal)}</span> },
        { key: "heldTotal", label: "Held (30d)", nowrap: true, render: (r) => <span className="inv-n">{num(r.heldTotal)}</span> },
        {
          key: "availableTotal",
          label: "Available (30d)",
          nowrap: true,
          render: (r) => (
            <div className="inv-avail">
              <b>{r.availableTotal === null || r.availableTotal === undefined ? "Unlimited" : `${num(r.availableTotal)} / ${num(r.capacityTotal)}`}</b>
              <CapacityBar capacity={r.capacityTotal} sold={r.soldTotal} held={r.heldTotal} status={r.status} />
            </div>
          ),
        },
        { key: "status", label: "Status", nowrap: true, render: (r) => <StockStatus status={r.stopSale ? "closed" : r.status} /> },
        { key: "nextSoldOutDate", label: "Next sold-out", nowrap: true, render: (r) => (r.nextSoldOutDate ? formatDayKey(r.nextSoldOutDate) : <span className="adm-muted">-</span>) },
      ]),
    []
  );

  const rowActions = useMemo(
    () =>
      fromKitActions((r) => {
        const url = productHref(r);
        return [
          { label: "Manage", icon: "sliders", onSelect: () => router.push(itemHref(r.id)) },
          ...(url ? [{ label: "View on site", icon: "external", onSelect: () => window.open(url, "_blank", "noopener,noreferrer") }] : []),
        ];
      }),
    [router]
  );

  const clearAll = () => setParams({ q: "", type: "", status: "", sort: "" });
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: () => statusLabel(status) || params.status },
      { keys: ["sort"], label: "Sort", text: () => SORTS.find((s) => s.value === sort)?.label || params.sort },
    ],
    setParams
  );
  const filtered = !!(params.q || type || status);
  const s = summary.data;
  const tiles = [
    { key: "low", label: "Low stock", count: s?.lowStock ?? 0, icon: "alert", tone: "warning" },
    { key: "sold_out", label: "Sold out", count: s?.soldOut ?? 0, icon: "ban", tone: "danger" },
    { key: "closed", label: "Stopped", count: s?.stopped ?? 0, icon: "xCircle", tone: "neutral" },
  ];

  return (
    <div className="adm-inv">
      <PageHeader
        title="Stock"
        description={typeof total === "number" ? `${total.toLocaleString("en-GB")} item${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}. Counts for the next 30 days.` : "Capacity, bookings and availability per date, for every sellable item."}
        actions={
          <div className="adm-row">
            <Link href="/admin/inventory/alerts" className="adm-btn adm-btn--secondary"><Icon name="alert" size={16} /><span className="adm-btn__label">Low stock and sold out</span></Link>
            {canWrite ? <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add manual item</Button> : null}
          </div>
        }
      />
      {summary.error && !s ? (
        <p className="inv-note" role="status" style={{ marginBottom: 12 }}>Could not load the stock summary. {summary.error.message} <button type="button" className="adm-link" onClick={summary.reload}>Try again</button></p>
      ) : (
        <StatusTiles items={tiles} active={status} loading={summary.loading && !s} label="Filter by stock alert" onSelect={(key) => setParams({ status: status === key ? "" : key })} />
      )}

      <div className="inv-seg inv-typebar" role="group" aria-label="Product type">
        <button type="button" aria-pressed={!type} onClick={() => setParams({ type: "" })}>All</button>
        {PRODUCT_TYPES.map((t) => (
          <button key={t.value} type="button" aria-pressed={type === t.value} onClick={() => setParams({ type: type === t.value ? "" : t.value })}>{t.plural}</button>
        ))}
      </div>

      {list.error && list.data ? (
        <p className="inv-error" role="alert" style={{ marginBottom: 12 }}>Could not refresh the list: {list.error.message} <button type="button" className="adm-link" onClick={list.reload}>Try again</button></p>
      ) : null}
      <DataTable
        label="Stock items"
        storageKey="inventory-stock"
        manual
        title="Items"
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(r) => r.id}
        rowCount={total}
        {...tableProps}
        pageSizeOptions={[10, 20, 25, 50]}
        rowActions={rowActions}
        onRowClick={(r) => router.push(itemHref(r.id))}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search items" label="Search stock items" />}
        toolbar={
          <FilterToolbar chips={chips} onClearAll={clearAll}>
            <SelectFilter label="Status" allLabel="All" value={status} onChange={(v) => setParams({ status: v })} options={ITEM_STATUS_FILTER} />
            <SelectFilter label="Sort" allLabel="Attention first" value={sort === "attention" ? "" : sort} onChange={(v) => setParams({ sort: v })} options={SORTS.filter((o) => o.value !== "attention")} />
          </FilterToolbar>
        }
        emptyState={
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name={filtered ? "search" : "inbox"} size={22} /></span>
            <p className="adm-empty__title">{filtered ? "No items match your filters" : "No stock items yet"}</p>
            <p className="adm-empty__desc">{filtered ? "Try a different search or clear the filters." : "Activities, holidays, cruises and events appear here automatically. Add a manual item for yachts, transfers or hotel rooms."}</p>
            <div className="adm-empty__action">
              {filtered ? <Button onClick={clearAll}>Clear filters</Button> : canWrite ? <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add manual item</Button> : null}
            </div>
          </div>
        }
      />
      <AddItemDialog open={adding} onClose={() => setAdding(false)} onCreated={() => { list.reload(); summary.reload(); }} />
    </div>
  );
}
