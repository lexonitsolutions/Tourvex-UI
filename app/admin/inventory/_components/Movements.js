"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDayKey } from "../../_lib/format";
import {
  Button, DateRangeFilter, DateTime, ExportCsvButton, FilterToolbar, Icon, PageHeader, SearchInput, SelectFilter, StatusBadge, TextField,
  buildChips, dateChipText, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { Popover, PopoverContent, PopoverTrigger } from "../../_ui/components/popover";
import { MOVEMENT_TONE, MOVEMENT_TYPES, STOCK_API, itemHref, movementLabel, num, typeLabel } from "../_lib/stock";

const EMPTY = [];
const LIMIT = 25;
const TYPE_OPTIONS = Object.entries(MOVEMENT_TYPES).map(([value, label]) => ({ value, label }));

/** Params kept in component state for the embedded (item detail) table; the full page keeps them in the URL. */
function useLocalParams() {
  const [params, setLocal] = useState({});
  const setParams = useCallback((patch) => {
    setLocal((cur) => {
      const next = { ...cur };
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") delete next[k];
        else next[k] = String(v);
      });
      if (!("page" in patch)) delete next.page;
      return next;
    });
  }, []);
  return [params, setParams];
}

function DeltaText({ value }) {
  if (typeof value !== "number") return <span className="adm-muted">-</span>;
  if (value === 0) return <span className="inv-delta">0</span>;
  return <span className={`inv-delta ${value > 0 ? "is-pos" : "is-neg"}`}>{value > 0 ? "+" : ""}{num(value)}</span>;
}

/** Lets staff pick an item to filter the ledger by (GET /admin/stock/items?q=). */
function ItemPicker({ value, label, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useAdminQuery(open ? `${STOCK_API}/items` : null, { q: q.trim() || undefined, limit: 8, sort: "title" }, { prefetchNext: false });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`adm-tbtn${value ? " is-active" : ""}`} aria-haspopup="dialog" aria-expanded={open}>
          <Icon name="inventory" size={16} />
          <span className="adm-tbtn__label">{value ? label || "Item" : "Item"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="tw:w-[min(360px,90vw)] tw:rounded-2xl tw:p-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find an item" label="Find an item" />
        <ul className="inv-stack" style={{ listStyle: "none", margin: "10px 0 0", padding: 0, gap: 4 }}>
          {results.error ? <li className="adm-muted">Could not load items. {results.error.message}</li> : null}
          {results.loading && !results.data ? <li className="adm-muted">Loading...</li> : null}
          {(results.data?.items || []).map((it) => (
            <li key={it.id}>
              <button type="button" className="adm-link" style={{ textAlign: "left" }} onClick={() => { onChange(it.id, `${it.title}${it.variantLabel ? ` - ${it.variantLabel}` : ""}`); setOpen(false); }}>
                {it.title}{it.variantLabel ? ` - ${it.variantLabel}` : ""} <small className="adm-muted">({typeLabel(it.productType)})</small>
              </button>
            </li>
          ))}
          {results.data && !results.data.items?.length ? <li className="adm-muted">No items found.</li> : null}
        </ul>
        {value ? <div style={{ marginTop: 10 }}><Button size="sm" variant="ghost" onClick={() => { onChange("", ""); setOpen(false); }}>Show all items</Button></div> : null}
      </PopoverContent>
    </Popover>
  );
}

/** Stock ledger (GET /admin/stock/movements). With `itemId` it is the Movements tab of one item; otherwise the full page. */
export default function Movements({ itemId }) {
  const embedded = !!itemId;
  const urlState = useUrlParams();
  const localState = useLocalParams();
  const [params, setParams] = embedded ? localState : urlState;
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const effectiveItem = itemId || params.itemId || "";
  const type = TYPE_OPTIONS.some((t) => t.value === params.type) ? params.type : "";
  const query = useMemo(
    () => ({ itemId: effectiveItem || undefined, type: type || undefined, actor: params.actor, purchaseNumber: params.purchaseNumber, from: params.from, to: params.to, page, limit }),
    [effectiveItem, type, params.actor, params.purchaseNumber, params.from, params.to, page, limit]
  );
  const list = useAdminQuery(`${STOCK_API}/movements`, query);
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rows = list.data?.items || EMPTY;
  const total = list.data?.pagination?.total;

  const columns = useMemo(
    () =>
      fromKitColumns([
        { key: "at", label: "When", nowrap: true, render: (m) => <DateTime value={m.at} /> },
        ...(embedded
          ? []
          : [{
              key: "title",
              label: "Item",
              primary: true,
              render: (m) => (
                <div className="inv-movecell">
                  {m.productRef ? <Link href={itemHref(`${m.productType}:${m.productRef}:${m.variantId}`)} className="inv-titlelink">{m.title || m.productRef}</Link> : <span>{m.title || "-"}</span>}
                  <small>{typeLabel(m.productType)}{m.variantId && m.variantId !== "default" ? ` - ${m.variantId}` : ""}</small>
                </div>
              ),
            }]),
        { key: "type", label: "Movement", nowrap: true, render: (m) => <StatusBadge tone={MOVEMENT_TONE[m.type] || "neutral"}>{movementLabel(m.type)}</StatusBadge> },
        { key: "date", label: "For date", nowrap: true, render: (m) => (m.date ? formatDayKey(String(m.date).slice(0, 10)) : <span className="adm-muted">Default</span>) },
        { key: "before", label: "Before", nowrap: true, render: (m) => <span className="inv-n">{m.before === null || m.before === undefined ? "Unlimited" : num(m.before)}</span> },
        { key: "after", label: "After", nowrap: true, render: (m) => <span className="inv-n">{m.after === null || m.after === undefined ? "Unlimited" : num(m.after)}</span> },
        { key: "delta", label: "Change", nowrap: true, render: (m) => <DeltaText value={m.delta} /> },
        { key: "reason", label: "Reason", render: (m) => (m.reason ? <span className="inv-reason">{m.reason}</span> : <span className="adm-muted">-</span>) },
        { key: "actor", label: "By", render: (m) => m.actorEmail || (m.actorId ? String(m.actorId) : <span className="adm-muted">System</span>) },
        { key: "bookingReference", label: "Booking", nowrap: true, render: (m) => (m.bookingReference ? <Link href={`/admin/bookings/${encodeURIComponent(m.bookingReference)}`} className="inv-ref">{m.bookingReference}</Link> : <span className="adm-muted">-</span>) },
      ]),
    [embedded]
  );

  const [itemLabel, setItemLabel] = useState("");
  const filtered = !!(params.type || params.actor || params.purchaseNumber || params.from || params.to || (!embedded && params.itemId));
  const clearAll = () => setParams({ itemId: "", type: "", actor: "", purchaseNumber: "", from: "", to: "" });
  const chips = buildChips(
    params,
    [
      ...(embedded ? [] : [{ keys: ["itemId"], label: "Item", text: () => itemLabel || params.itemId }]),
      { keys: ["type"], label: "Type", text: () => movementLabel(type || params.type) },
      { keys: ["actor"], label: "By" },
      { keys: ["purchaseNumber"], label: "Purchase" },
      { keys: ["from", "to"], label: "Dates", text: (p) => dateChipText(p.from, p.to) },
    ],
    setParams
  );
  const csvColumns = useMemo(
    () => [
      { label: "When", value: (m) => m.at },
      { label: "Item", value: (m) => m.title },
      { label: "Product type", value: (m) => m.productType },
      { label: "Variant", value: (m) => m.variantId },
      { label: "Movement", value: (m) => movementLabel(m.type) },
      { label: "For date", value: (m) => m.date },
      { label: "Before", value: (m) => m.before },
      { label: "After", value: (m) => m.after },
      { label: "Change", value: (m) => m.delta },
      { label: "Reason", value: (m) => m.reason },
      { label: "By", value: (m) => m.actorEmail || m.actorId },
      { label: "Booking", value: (m) => m.bookingReference },
    ],
    []
  );

  return (
    <div className={embedded ? undefined : "adm-inv"}>
      {embedded ? null : (
        <PageHeader title="Movements" description="Every stock change in order: capacity edits, bookings, cancellations and returns to stock. The ledger cannot be edited." />
      )}
      {list.error && list.data ? (
        <p className="inv-error" role="alert" style={{ marginBottom: 12 }}>Could not refresh the ledger: {list.error.message} <button type="button" className="adm-link" onClick={list.reload}>Try again</button></p>
      ) : null}
      <DataTable
        label="Stock movements"
        storageKey={embedded ? "inventory-item-movements" : "inventory-movements"}
        manual
        title={embedded ? "Movements for this item" : "Ledger"}
        columns={columns}
        data={rows}
        getRowId={(m, i) => m.id || m._id || `${m.at}-${m.type}-${m.date || ""}-${i}`}
        rowCount={total}
        pagination={tableState.pagination}
        onPaginationChange={tableState.onPaginationChange}
        pageSizeOptions={[10, 25, 50, 100]}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        toolbarActions={<ExportCsvButton filename="stock-movements.csv" columns={csvColumns} rows={rows} disabled={!rows.length}>Export CSV (this page)</ExportCsvButton>}
        toolbar={
          <FilterToolbar chips={chips} onClearAll={clearAll}>
            {embedded ? null : <ItemPicker value={params.itemId || ""} label={itemLabel} onChange={(id, label) => { setItemLabel(label); setParams({ itemId: id }); }} />}
            <SelectFilter label="Type" allLabel="All" value={type} onChange={(v) => setParams({ type: v })} options={TYPE_OPTIONS} />
            <DateRangeFilter label="Dates" value={{ from: params.from, to: params.to }} onChange={(r) => setParams({ from: r.from || "", to: r.to || "" })} />
            <TextField className="adm-ft__input" value={params.actor || ""} onChange={(actor) => setParams({ actor: actor.trim() })} placeholder="Actor email" aria-label="Actor email" />
          </FilterToolbar>
        }
        emptyState={
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name={filtered ? "search" : "inbox"} size={22} /></span>
            <p className="adm-empty__title">{filtered ? "No movements match your filters" : "No movements yet"}</p>
            <p className="adm-empty__desc">{filtered ? "Widen the dates or clear a filter." : "Capacity changes, bookings and returns will be listed here."}</p>
            {filtered ? <div className="adm-empty__action"><Button onClick={clearAll}>Clear filters</Button></div> : null}
          </div>
        }
      />
    </div>
  );
}
