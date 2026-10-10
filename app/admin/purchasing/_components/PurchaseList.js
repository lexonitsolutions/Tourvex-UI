"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { dayKey, formatDayKey } from "../../_lib/format";
import {
  Button, DateRangeFilter, FilterToolbar, Icon, PageHeader, SearchInput, SelectFilter, buildChips, dateChipText, fromKitActions, fromKitColumns,
  useTableUrlState, usePageSize, useUrlParams,
} from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { PURCHASES_PATH, PURCHASING_API, STATUS, STATUS_FILTER, SUPPLIERS_PATH, isOverdue, money, newPurchaseHref, plural, purchaseHref, purchaseUnits } from "../_lib/purchasing";
import { PurchaseStatus } from "./parts";
import { PurchaseActionDialog } from "./PurchaseDialogs";

const EMPTY = [];
const LIMIT = 20;
const dayText = (v) => (v ? formatDayKey(String(v).slice(0, 10)) : <span className="adm-muted">-</span>);

function Tile({ label, value, sub, icon, tone, onClick, active, loading }) {
  const body = (
    <>
      <span className="pur-tile__top"><span className="pur-tile__label">{label}</span><span className="pur-tile__icon"><Icon name={icon} size={16} /></span></span>
      <span className="pur-tile__value">{loading ? <span className="adm-skel" style={{ width: 90, height: 26 }} aria-hidden="true" /> : value}</span>
      <span className="pur-tile__sub">{sub}</span>
    </>
  );
  return onClick ? (
    <button type="button" className={`pur-tile is-${tone}${active ? " is-on" : ""}`} aria-pressed={active} onClick={onClick}>{body}</button>
  ) : (
    <div className={`pur-tile is-${tone}`}>{body}</div>
  );
}

/** Purchases overview: summary tiles, filters and the paged table (GET /admin/purchasing/purchases and /summary). */
export default function PurchaseList() {
  const router = useRouter();
  const { can } = useAdminMe();
  const canWrite = can("purchasing.write");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const status = STATUS[params.status] ? params.status : "";
  const [today] = useState(() => dayKey());
  const [action, setAction] = useState(null); // { id, kind }

  const query = useMemo(
    () => ({ status: status || undefined, supplierId: params.supplierId, from: params.from, to: params.to, q: params.q, page, limit }),
    [status, params.supplierId, params.from, params.to, params.q, page, limit]
  );
  const list = useAdminQuery(PURCHASES_PATH, query);
  const summary = useAdminQuery(`${PURCHASING_API}/summary`);
  const suppliers = useAdminQuery(SUPPLIERS_PATH, { limit: 100 }, { prefetchNext: false });
  const total = list.data?.pagination?.total ?? list.data?.totals?.count;
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const tableProps = { pagination: tableState.pagination, onPaginationChange: tableState.onPaginationChange };
  const supplierOptions = useMemo(() => (suppliers.data?.items || []).map((s) => ({ value: s.id, label: s.name })), [suppliers.data]);
  const supplierName = supplierOptions.find((s) => s.value === params.supplierId)?.label || params.supplierId;

  const columns = useMemo(
    () =>
      fromKitColumns([
        {
          key: "number",
          label: "Purchase",
          primary: true,
          render: (r) => (
            <div className="pur-cell">
              <Link href={purchaseHref(r.id)} className="pur-link">{r.number}</Link>
              {r.dueDate && r.status !== "paid" && r.status !== "void" ? <small>Due {formatDayKey(String(r.dueDate).slice(0, 10))}</small> : null}
            </div>
          ),
        },
        { key: "supplierName", label: "Supplier", render: (r) => <span className="pur-supplier">{r.supplierName || "-"}</span> },
        { key: "supplierInvoiceNumber", label: "Supplier invoice", nowrap: true, render: (r) => r.supplierInvoiceNumber || <span className="adm-muted">-</span> },
        { key: "invoiceDate", label: "Invoice date", nowrap: true, render: (r) => dayText(r.invoiceDate) },
        { key: "units", label: "Units", nowrap: true, align: "right", render: (r) => { const u = purchaseUnits(r); return <span className="pur-n">{u === null ? "-" : u.toLocaleString("en-GB")}</span>; } },
        { key: "total", label: "Total", nowrap: true, align: "right", render: (r) => <span className="pur-n">{money(r.total, r.currency)}</span> },
        { key: "status", label: "Status", nowrap: true, render: (r) => <PurchaseStatus status={r.status} overdue={isOverdue(r, today)} /> },
      ]),
    [today]
  );

  const rowActions = useMemo(
    () =>
      fromKitActions((r) => [
        { label: "Open", icon: "eye", onSelect: () => router.push(purchaseHref(r.id)) },
        ...(canWrite && r.status === "draft" ? [{ label: "Receive stock", icon: "check", onSelect: () => setAction({ id: r.id, kind: "receive" }) }] : []),
        ...(canWrite && r.status === "received" ? [{ label: "Mark as paid", icon: "wallet", onSelect: () => setAction({ id: r.id, kind: "paid" }) }] : []),
        ...(canWrite && (r.status === "draft" || r.status === "received") ? [{ separator: true }, { label: "Void", icon: "ban", danger: true, onSelect: () => setAction({ id: r.id, kind: "void" }) }] : []),
      ]),
    [router, canWrite]
  );

  const clearAll = () => setParams({ q: "", status: "", supplierId: "", from: "", to: "" });
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["supplierId"], label: "Supplier", text: () => supplierName },
      { keys: ["from", "to"], label: "Invoice date", text: (p) => dateChipText(p.from, p.to) },
    ],
    setParams
  );
  const filtered = !!(params.q || status || params.supplierId || params.from || params.to);
  const s = summary.data;
  const done = () => { list.reload(); summary.reload(); };

  return (
    <div className="adm-pur">
      <PageHeader
        title="Purchases"
        description={
          typeof total === "number"
            ? `${plural(total, "purchase")}${filtered ? " match your filters" : ""}${list.data?.totals ? `, ${money(list.data.totals.total)} in total` : ""}. Receiving a purchase adds its units to stock.`
            : "Supplier invoices and the stock they add."
        }
        actions={
          <div className="adm-row">
            <Link href="/admin/purchasing/suppliers" className="adm-btn adm-btn--secondary"><Icon name="partners" size={16} /><span className="adm-btn__label">Suppliers</span></Link>
            {canWrite ? <Link href={newPurchaseHref()} className="adm-btn adm-btn--primary"><Icon name="plus" size={16} /><span className="adm-btn__label">New purchase</span></Link> : null}
          </div>
        }
      />

      {summary.error && !s ? (
        <p className="pur-note" role="status" style={{ marginBottom: 12 }}>Could not load the summary. {summary.error.message} <button type="button" className="adm-link" onClick={summary.reload}>Try again</button></p>
      ) : (
        <div className="pur-tiles">
          <Tile label="Drafts" icon="edit" tone="neutral" loading={summary.loading && !s} value={(s?.draftCount ?? 0).toLocaleString("en-GB")} sub="Not received yet" active={status === "draft"} onClick={() => setParams({ status: status === "draft" ? "" : "draft" })} />
          <Tile label="Received, unpaid" icon="wallet" tone="info" loading={summary.loading && !s} value={money(s?.receivedUnpaidTotal ?? 0)} sub="Owed to suppliers" active={status === "received"} onClick={() => setParams({ status: status === "received" ? "" : "received" })} />
          <Tile label="Overdue" icon="alert" tone={s?.overdueCount > 0 ? "danger" : "neutral"} loading={summary.loading && !s} value={(s?.overdueCount ?? 0).toLocaleString("en-GB")} sub="Past their due date" />
          <Tile label="Last 30 days" icon="trendUp" tone="success" loading={summary.loading && !s} value={money(s?.last30DaysTotal ?? 0)} sub="Purchased" />
        </div>
      )}

      <div className="pur-seg pur-statusbar" role="group" aria-label="Status">
        {STATUS_FILTER.map((o) => (
          <button key={o.value || "all"} type="button" aria-pressed={status === o.value} onClick={() => setParams({ status: o.value })}>{o.label}</button>
        ))}
      </div>

      {list.error && list.data ? (
        <p className="pur-error" role="alert" style={{ marginBottom: 12 }}>Could not refresh the list: {list.error.message} <button type="button" className="adm-link" onClick={list.reload}>Try again</button></p>
      ) : null}
      <DataTable
        label="Purchases"
        storageKey="purchasing-purchases"
        manual
        title="Purchases"
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(r) => r.id}
        rowCount={total}
        {...tableProps}
        pageSizeOptions={[10, 20, 25, 50]}
        rowActions={rowActions}
        onRowClick={(r) => router.push(purchaseHref(r.id))}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search number or invoice" label="Search purchases" />}
        toolbar={
          <FilterToolbar chips={chips} onClearAll={clearAll}>
            <SelectFilter label="Supplier" allLabel="All" value={params.supplierId || ""} onChange={(v) => setParams({ supplierId: v })} options={supplierOptions} />
            <DateRangeFilter label="Invoice date" value={{ from: params.from, to: params.to }} onChange={(r) => setParams({ from: r.from || "", to: r.to || "" })} />
          </FilterToolbar>
        }
        emptyState={
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name={filtered ? "search" : "inbox"} size={22} /></span>
            <p className="adm-empty__title">{filtered ? "No purchases match your filters" : "No purchases yet"}</p>
            <p className="adm-empty__desc">{filtered ? "Try a different search or clear the filters." : "Record a supplier invoice to add stock and keep each item's cost up to date for margin reports."}</p>
            <div className="adm-empty__action">
              {filtered ? <Button onClick={clearAll}>Clear filters</Button> : canWrite ? <Link href={newPurchaseHref()} className="adm-btn adm-btn--primary"><Icon name="plus" size={16} /><span className="adm-btn__label">New purchase</span></Link> : null}
            </div>
          </div>
        }
      />
      {action ? <PurchaseActionDialog id={action.id} action={action.kind} onClose={() => setAction(null)} onDone={done} /> : null}
    </div>
  );
}
