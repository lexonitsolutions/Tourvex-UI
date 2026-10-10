"use client";

import { useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import {
  Button, FilterToolbar, Icon, Modal, PageHeader, SearchInput, StatusBadge, buildChips, fromKitActions, fromKitColumns, useToast,
  useTableUrlState, usePageSize, useUrlParams,
} from "../../_kit";
import { DataTable } from "../../_ui/data-table";
import { SUPPLIERS_PATH, plural, supplierApiPath } from "../_lib/purchasing";
import { InlineError } from "./parts";
import SupplierDialog from "./SupplierDialog";

const EMPTY = [];
const LIMIT = 20;
const ACTIVE_FILTER = [{ value: "", label: "All" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }];

/** Delete a supplier; when it already has purchases (409 SUPPLIER_IN_USE) offer to deactivate it instead. */
function DeleteDialog({ supplier, onClose, onDone }) {
  const api = useAdminApi();
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [inUse, setInUse] = useState(false);

  async function remove() {
    setBusy("delete");
    setError("");
    try {
      await api.delete(supplierApiPath(supplier.id));
      toast.success(`Deleted "${supplier.name}"`);
      onDone();
      onClose();
    } catch (e) {
      if (e.code === "SUPPLIER_IN_USE" || (e.status === 409 && !e.code)) setInUse(true);
      else setError(e.message || "Could not delete the supplier.");
    } finally {
      setBusy("");
    }
  }
  async function deactivate() {
    setBusy("deactivate");
    setError("");
    try {
      await api.patch(supplierApiPath(supplier.id), { active: false });
      toast.success(`"${supplier.name}" is now inactive`);
      onDone();
      onClose();
    } catch (e) {
      setError(e.message || "Could not deactivate the supplier.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      size="sm"
      title={inUse ? `"${supplier.name}" has purchases` : `Delete "${supplier.name}"?`}
      description={inUse ? "A supplier with purchases cannot be deleted because those purchases keep pointing to it." : "This removes the supplier. It cannot be undone."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={!!busy}>{inUse ? "Close" : "Cancel"}</Button>
          {inUse ? (
            supplier.active === false ? null : <Button variant="primary" onClick={deactivate} loading={busy === "deactivate"}>Deactivate instead</Button>
          ) : (
            <Button variant="danger" onClick={remove} loading={busy === "delete"}>Delete supplier</Button>
          )}
        </>
      }
    >
      <div className="adm-stack">
        {inUse ? <p className="pur-note">{supplier.active === false ? "It is already inactive, so it cannot be chosen for new purchases." : "Deactivate it instead: it stays on past purchases but cannot be chosen for new ones. You can reactivate it any time."}</p> : null}
        <InlineError>{error}</InlineError>
      </div>
    </Modal>
  );
}

/** Suppliers (GET /admin/purchasing/suppliers): search, active filter, add / edit dialog, deactivate and delete. */
export default function SupplierList() {
  const api = useAdminApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const canWrite = can("purchasing.write");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const page = Math.max(1, Number(params.page) || 1);
  const active = params.active === "true" || params.active === "false" ? params.active : "";
  const [editing, setEditing] = useState(null); // supplier | "new"
  const [deleting, setDeleting] = useState(null);

  const query = useMemo(() => ({ q: params.q, active: active || undefined, page, limit }), [params.q, active, page, limit]);
  const list = useAdminQuery(SUPPLIERS_PATH, query);
  const total = list.data?.pagination?.total;
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const tableProps = { pagination: tableState.pagination, onPaginationChange: tableState.onPaginationChange };

  async function setActive(supplier, value) {
    try {
      await api.patch(supplierApiPath(supplier.id), { active: value });
      toast.success(value ? `"${supplier.name}" is active again` : `"${supplier.name}" is now inactive`);
      list.reload();
    } catch (e) {
      toast.error(e.message || "Could not update the supplier.");
    }
  }

  const columns = useMemo(
    () =>
      fromKitColumns([
        {
          key: "name",
          label: "Supplier",
          primary: true,
          render: (r) => (
            <div className="pur-cell pur-cell--wide">
              <span className="pur-link pur-link--static">{r.name}</span>
              {r.legalName && r.legalName !== r.name ? <small>{r.legalName}</small> : null}
            </div>
          ),
        },
        { key: "country", label: "Country", nowrap: true, render: (r) => r.country || <span className="adm-muted">-</span> },
        {
          key: "contact",
          label: "Contact",
          render: (r) => (r.email || r.phone ? <div className="pur-cell"><span>{r.email || r.phone}</span>{r.email && r.phone ? <small>{r.phone}</small> : null}</div> : <span className="adm-muted">-</span>),
        },
        { key: "registrationNumber", label: "Registration", nowrap: true, render: (r) => r.registrationNumber || <span className="adm-muted">-</span> },
        { key: "paymentTermsDays", label: "Terms", nowrap: true, align: "right", render: (r) => <span className="pur-n">{r.paymentTermsDays ? `${r.paymentTermsDays} days` : "On receipt"}</span> },
        { key: "currency", label: "Currency", nowrap: true, render: (r) => r.currency || "-" },
        { key: "active", label: "Status", nowrap: true, render: (r) => <StatusBadge tone={r.active === false ? "neutral" : "success"}>{r.active === false ? "Inactive" : "Active"}</StatusBadge> },
      ]),
    []
  );
  const rowActions = useMemo(
    () =>
      canWrite
        ? fromKitActions((r) => [
            { label: "Edit", icon: "edit", onSelect: () => setEditing(r) },
            r.active === false ? { label: "Reactivate", icon: "check", onSelect: () => setActive(r, true) } : { label: "Deactivate", icon: "ban", onSelect: () => setActive(r, false) },
            { separator: true },
            { label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleting(r) },
          ])
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canWrite]
  );

  const clearAll = () => setParams({ q: "", active: "" });
  const chips = buildChips(params, [{ keys: ["q"], label: "Search" }], setParams);
  const filtered = !!(params.q || active);

  return (
    <div className="adm-pur">
      <PageHeader
        title="Suppliers"
        description={typeof total === "number" ? `${plural(total, "supplier")}${filtered ? " match your filters" : ""}. The companies you buy stock from.` : "The companies you buy stock from."}
        actions={canWrite ? <Button variant="primary" icon="plus" onClick={() => setEditing("new")}>Add supplier</Button> : null}
      />
      <div className="pur-seg pur-statusbar" role="group" aria-label="Status">
        {ACTIVE_FILTER.map((o) => (
          <button key={o.value || "all"} type="button" aria-pressed={active === o.value} onClick={() => setParams({ active: o.value })}>{o.label}</button>
        ))}
      </div>
      {list.error && list.data ? (
        <p className="pur-error" role="alert" style={{ marginBottom: 12 }}>Could not refresh the list: {list.error.message} <button type="button" className="adm-link" onClick={list.reload}>Try again</button></p>
      ) : null}
      <DataTable
        label="Suppliers"
        storageKey="purchasing-suppliers"
        manual
        title="Suppliers"
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(r) => r.id}
        rowCount={total}
        {...tableProps}
        pageSizeOptions={[10, 20, 25, 50]}
        rowActions={rowActions}
        onRowClick={canWrite ? (r) => setEditing(r) : undefined}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search suppliers" label="Search suppliers" />}
        toolbar={chips.length ? <FilterToolbar chips={chips} onClearAll={clearAll} /> : undefined}
        emptyState={
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name={filtered ? "search" : "partners"} size={22} /></span>
            <p className="adm-empty__title">{filtered ? "No suppliers match your filters" : "No suppliers yet"}</p>
            <p className="adm-empty__desc">{filtered ? "Try a different search or clear the filters." : "Add the companies you buy tickets, rooms or seats from, then record their invoices as purchases."}</p>
            <div className="adm-empty__action">
              {filtered ? <Button onClick={clearAll}>Clear filters</Button> : canWrite ? <Button variant="primary" icon="plus" onClick={() => setEditing("new")}>Add supplier</Button> : null}
            </div>
          </div>
        }
      />
      <SupplierDialog open={!!editing} supplier={editing && editing !== "new" ? editing : null} onClose={() => setEditing(null)} onSaved={() => list.reload()} />
      {deleting ? <DeleteDialog supplier={deleting} onClose={() => setDeleting(null)} onDone={() => list.reload()} /> : null}
    </div>
  );
}
