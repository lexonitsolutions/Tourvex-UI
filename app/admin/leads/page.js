"use client";

import { useCallback, useMemo, useState } from "react";
import "../crm.css";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, SOURCE_LABEL } from "../_lib/crm";
import {
  Button, DateRangeFilter, DateTime, Dropdown, ExportCsvButton, FilterToolbar, FiltersButton, FiltersDrawer, Icon, Money,
  PageHeader, RequirePermission, SearchInput, SelectField, SelectFilter, StatusTiles, UserCell, buildChips, dateChipText,
  fromKitActions, fromKitColumns, useSelectionState, useTableUrlState, usePageSize, useToast, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";
import { LeadBoard } from "./LeadBoard";
import LeadDrawer from "./LeadDrawer";
import { FollowUp, LeadStatusBadge, LostReasonModal, OwnerCell, PriorityText, leadSubtitle } from "./leadParts";

const LIMIT = 20;
const EMPTY = [];
const OPEN = "new,contacted,qualified,quoted";
const FILTER_KEYS = ["q", "source", "status", "owner", "priority", "followUp", "from", "to"];
const STATUS_TILE = {
  new: { icon: "inbox", tone: "info" },
  contacted: { icon: "mail", tone: "periwinkle" },
  qualified: { icon: "flag", tone: "butter" },
  quoted: { icon: "receipt", tone: "peach" },
  won: { icon: "checkCircle", tone: "success" },
  lost: { icon: "xCircle", tone: "danger" },
};

export default function LeadsPage() {
  return (
    <RequirePermission permission="enquiries.read">
      <Leads />
    </RequirePermission>
  );
}

const dayStart = (value) => (value ? new Date(`${value}T00:00:00+04:00`).toISOString() : undefined);
const dayEnd = (value) => (value ? new Date(`${value}T23:59:59.999+04:00`).toISOString() : undefined);

function Leads() {
  const api = useAdminApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const canWrite = can("enquiries.write");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const view = params.view === "board" ? "board" : "table";
  const page = Math.max(1, Number(params.page) || 1);
  const [selected, setSelected] = useState([]);
  const [lost, setLost] = useState(null); // { ids, busy, error }
  const [drawer, setDrawer] = useState(false);

  const filters = useMemo(
    () => ({ q: params.q, source: params.source, owner: params.owner, priority: params.priority, followUp: params.followUp, from: dayStart(params.from), to: dayEnd(params.to) }),
    [params.q, params.source, params.owner, params.priority, params.followUp, params.from, params.to]
  );
  const listQuery = useMemo(() => ({ ...filters, status: params.status, page, limit, sort: params.sort || undefined }), [filters, params.status, page, limit, params.sort]);
  const list = useAdminQuery(view === "table" ? "/admin/leads" : null, listQuery);
  // The pipeline answer carries a real count per status (honouring every filter except status): it feeds the board and the status tiles.
  const board = useAdminQuery("/admin/leads/pipeline", filters);
  const stats = useAdminQuery("/admin/leads/stats");
  const owners = useAdminQuery("/admin/leads/owners").data || [];

  const { reload: reloadList } = list;
  const { reload: reloadBoard } = board;
  const { reload: reloadStats } = stats;
  const refresh = useCallback(() => {
    reloadList();
    reloadBoard();
    reloadStats();
  }, [reloadList, reloadBoard, reloadStats]);

  const openId = params.lead || null;
  const openLead = useCallback((id) => setParams({ lead: id, page: params.page }), [setParams, params.page]);
  const closeLead = () => setParams({ lead: "", page: params.page });

  async function applyStatus(ids, to, reason, note) {
    if (ids.length === 1) {
      await api.post(`/admin/leads/${ids[0]}/status`, { status: to, ...(reason ? { lostReason: reason } : {}), ...(note ? { note } : {}) });
      toast.success(`Moved to ${LEAD_STATUSES.find((s) => s.id === to).label}`);
    } else {
      const res = await api.post("/admin/leads/bulk/status", { ids, status: to, ...(reason ? { lostReason: reason } : {}) });
      toast.success(`${res.updated} of ${res.requested} leads updated${res.skipped?.length ? `, ${res.skipped.length} skipped by the pipeline rules` : ""}`);
    }
    setSelected([]);
    refresh();
  }

  /** Single entry point for every status change (board drag, card menu, drawer, bulk). Lost always asks for a reason first. */
  async function requestStatus(target, to) {
    const ids = Array.isArray(target) ? target : [target.id];
    if (to === "lost") {
      setLost({ ids, busy: false, error: "" });
      return;
    }
    try {
      await applyStatus(ids, to);
    } catch (e) {
      toast.error(e.message || "Could not change the status");
    }
  }

  async function confirmLost(reason, note) {
    setLost((s) => ({ ...s, busy: true, error: "" }));
    try {
      await applyStatus(lost.ids, "lost", reason, note);
      setLost(null);
    } catch (e) {
      setLost((s) => ({ ...s, busy: false, error: e.message }));
    }
  }

  async function bulkAssign(ownerId) {
    try {
      const res = await api.post("/admin/leads/bulk/assign", { ids: selected, ownerId });
      toast.success(`${res.updated} lead${res.updated === 1 ? "" : "s"} ${ownerId ? "assigned" : "unassigned"}`);
      setSelected([]);
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const s = stats.data;
  const reset = Object.fromEntries(FILTER_KEYS.map((k) => [k, ""]));
  const activeCount = FILTER_KEYS.filter((k) => params[k]).length;
  const clearAll = () => setParams(reset);
  const advancedKeys = view === "table" ? ["followUp", "status"] : ["followUp"];
  const advancedCount = (params.followUp ? 1 : 0) + (view === "table" && params.status === OPEN ? 1 : 0);

  const columns = useMemo(
    () => fromKitColumns([
      {
        key: "name", label: "Lead", primary: true, sortable: true,
        render: (l) => <UserCell name={l.name} email={l.email} onClick={() => openLead(l.id)} size={34} />,
      },
      {
        key: "source", label: "Source",
        render: (l) => (
          <div className="adm-cellstack">
            <span>{SOURCE_LABEL[l.source] || l.source}</span>
            <small>{l.catalog?.title || l.subject || l.reference}</small>
          </div>
        ),
      },
      { key: "status", label: "Status", sortable: true, render: (l) => <LeadStatusBadge status={l.status} /> },
      { key: "priority", label: "Priority", sortable: true, render: (l) => <PriorityText value={l.priority} /> },
      { key: "owner", label: "Owner", render: (l) => <OwnerCell owner={l.owner} /> },
      { key: "nextFollowUpAt", label: "Follow-up", sortable: true, render: (l) => <FollowUp lead={l} /> },
      { key: "details", label: "Details", hidden: true, render: (l) => leadSubtitle(l) || "-" },
      { key: "valueAed", label: "Value", sortable: true, align: "right", render: (l) => (l.valueAed ? <Money value={l.valueAed} /> : "-") },
      { key: "createdAt", label: "Received", sortable: true, render: (l) => <DateTime value={l.createdAt} /> },
    ]),
    [openLead]
  );

  const exportQuery = { ...filters, status: params.status, sort: params.sort || undefined };
  const ownerOptions = [{ value: "me", label: "Me" }, { value: "unassigned", label: "Unassigned" }, ...owners.map((o) => ({ value: o.id, label: o.name }))];
  const columnsPipeline = board.data?.columns;
  const tiles = [
    { key: "", label: "All leads", icon: "leads", tone: "brand", count: (columnsPipeline || []).reduce((sum, c) => sum + c.count, 0) },
    ...LEAD_STATUSES.map((st) => ({ key: st.id, label: st.label, ...STATUS_TILE[st.id], count: columnsPipeline?.find((c) => c.status === st.id)?.count ?? 0 })),
  ];

  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["source"], label: "Source", text: (p) => SOURCE_LABEL[p.source] || p.source },
      ...(view === "table" ? [{ keys: ["status"], label: "Status", text: (p) => (p.status === OPEN ? "Open stages" : LEAD_STATUSES.find((x) => x.id === p.status)?.label || p.status) }] : []),
      { keys: ["owner"], label: "Owner", text: (p) => ownerOptions.find((o) => o.value === p.owner)?.label || p.owner },
      { keys: ["priority"], label: "Priority", text: (p) => LEAD_PRIORITIES.find((x) => x.id === p.priority)?.label || p.priority },
      { keys: ["followUp"], label: "Follow-up", text: (p) => (p.followUp === "today" ? "Due today" : p.followUp === "overdue" ? "Overdue" : p.followUp) },
      { keys: ["from", "to"], label: "Received", text: (p) => dateChipText(p.from, p.to) },
    ],
    setParams
  );

  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const selection = useSelectionState(selected, setSelected);
  const rowActions = useMemo(
    () =>
      fromKitActions((l) => [
        { label: "Open lead", icon: "eye", onSelect: () => openLead(l.id) },
        ...(l.email ? [{ label: "Email lead", icon: "mail", href: `mailto:${l.email}` }] : []),
        ...(canWrite && l.status !== "won" && l.status !== "lost" ? [{ separator: true }, { label: "Mark as won", icon: "checkCircle", onSelect: () => requestStatus(l, "won") }, { label: "Mark as lost", icon: "xCircle", danger: true, onSelect: () => requestStatus(l, "lost") }] : []),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openLead, canWrite]
  );

  // The same one-row toolbar serves the table (Columns menu in its end slot) and the board (no columns to toggle).
  const filterToolbar = (columnsMenu) => (
    <FilterToolbar chips={chips} onClearAll={clearAll} end={columnsMenu}>
      <SelectFilter label="Source" allLabel="All" value={params.source || ""} onChange={(source) => setParams({ source })} options={LEAD_SOURCES.map((x) => ({ value: x.id, label: x.label }))} />
      <SelectFilter label="Owner" allLabel="Anyone" value={params.owner || ""} onChange={(owner) => setParams({ owner })} options={ownerOptions} />
      <SelectFilter label="Priority" allLabel="All" value={params.priority || ""} onChange={(priority) => setParams({ priority })} options={LEAD_PRIORITIES.map((x) => ({ value: x.id, label: x.label }))} />
      <DateRangeFilter label="Received date" placeholder="Received date range" value={{ from: params.from, to: params.to }} onChange={(v) => setParams({ from: v.from || "", to: v.to || "" })} />
      <FiltersButton count={advancedCount} expanded={drawer} onClick={() => setDrawer(true)} />
    </FilterToolbar>
  );

  return (
    <>
      <PageHeader
        title="Leads & Enquiries"
        description={s ? `${s.open.toLocaleString("en-GB")} open · ${s.new.toLocaleString("en-GB")} new · ${s.unassigned.toLocaleString("en-GB")} unassigned · ${s.overdue.toLocaleString("en-GB")} overdue follow-ups` : "Every website enquiry, contact message and B2B request in one pipeline."}
        actions={
          <>
            <div className="adm-seg" role="group" aria-label="View">
              <button type="button" className="adm-seg__btn" aria-pressed={view === "table"} onClick={() => setParams({ view: "", page: "" })}><Icon name="leads" size={15} />Table</button>
              <button type="button" className="adm-seg__btn" aria-pressed={view === "board"} onClick={() => setParams({ view: "board", status: "", page: "" })}><Icon name="columns" size={15} />Board</button>
            </div>
            {can("enquiries.export") ? <ExportCsvButton filename="leads.csv" getBlob={() => api.download("/admin/leads/export.csv", { query: exportQuery })} /> : null}
          </>
        }
      />

      {view === "table" ? (
        <StatusTiles items={tiles} active={params.status === OPEN ? null : params.status || ""} onSelect={(status) => setParams({ status, page: "" })} loading={board.loading && !board.data} label="Filter leads by status" />
      ) : null}

      {view === "table" ? (
        <DataTable
          label="Leads"
          storageKey="leads"
          manual
          title="Lead list"
          columns={columns}
          data={list.data?.items || EMPTY}
          getRowId={(l) => l.id}
          rowCount={list.data?.pagination?.total}
          {...tableState}
          {...selection}
          enableRowSelection={canWrite}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={(l) => openLead(l.id)}
          rowActions={rowActions}
          columnsInToolbar
          search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search name, email, phone, reference" label="Search leads" />}
          toolbar={(table) => filterToolbar(<DataTableColumnsMenu table={table} />)}
          bulkActions={({ ids }) => (
            <>
              <Dropdown
                label="Assign selected leads"
                trigger={({ props }) => <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" {...props}><Icon name="user" size={15} /><span className="adm-btn__label">Assign to</span></button>}
                items={[{ label: "Unassigned", onSelect: () => bulkAssign(null) }, { separator: true }, ...owners.map((o) => ({ label: o.name, onSelect: () => bulkAssign(o.id) }))]}
              />
              <Dropdown
                label="Set status of selected leads"
                trigger={({ props }) => <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" {...props}><Icon name="check" size={15} /><span className="adm-btn__label">Set status</span></button>}
                items={LEAD_STATUSES.filter((x) => x.id !== "new").map((x) => ({ label: x.label, onSelect: () => requestStatus(ids, x.id) }))}
              />
            </>
          )}
          emptyState={
            <div className="adm-empty">
              <p className="adm-empty__title">{activeCount ? "No leads match these filters" : "No leads yet"}</p>
              <p className="adm-empty__desc">{activeCount ? "Try a different search or clear the filters." : "Enquiries from the website will appear here as they come in."}</p>
              {activeCount ? <div className="adm-empty__action"><Button onClick={clearAll}>Clear filters</Button></div> : null}
            </div>
          }
        />
      ) : board.error && !board.data ? (
        <div className="adm-empty adm-empty--error" role="alert">
          <p className="adm-empty__title">Could not load the pipeline</p>
          <p className="adm-empty__desc">{board.error.message}</p>
          <Button onClick={board.reload} icon="refresh">Try again</Button>
        </div>
      ) : (
        <>
          {filterToolbar(null)}
          <div className="adm-ft__row" style={{ marginBottom: 12 }}>
            <SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search name, email, phone, reference" label="Search leads" />
          </div>
          <LeadBoard
            columns={board.data?.columns || LEAD_STATUSES.map((x) => ({ status: x.id, count: 0, valueAed: 0, items: [] }))}
            loading={board.loading}
            canWrite={canWrite}
            onOpen={openLead}
            onMove={requestStatus}
            limitPerColumn={board.data?.limitPerColumn || 40}
          />
        </>
      )}

      <FiltersDrawer open={drawer} onClose={() => setDrawer(false)} title="More filters" description="Follow-up timing and pipeline scope." keys={advancedKeys} values={params} onApply={(patch) => setParams(patch)}>
        {(draft, set) => (
          <>
            <SelectField
              label="Follow-up"
              value={draft.followUp}
              onChange={(followUp) => set({ followUp })}
              placeholder="Any time"
              options={[
                { value: "today", label: `Due today${s ? ` (${s.dueToday})` : ""}` },
                { value: "overdue", label: `Overdue${s ? ` (${s.overdue})` : ""}` },
              ]}
            />
            {view === "table" ? (
              <SelectField
                label="Pipeline scope"
                value={draft.status === OPEN ? OPEN : draft.status ? "__single" : ""}
                onChange={(v) => set({ status: v === OPEN ? OPEN : v === "__single" ? draft.status : "" })}
                placeholder="All stages"
                options={[{ value: OPEN, label: "Open stages only (new to quoted)" }, ...(draft.status && draft.status !== OPEN ? [{ value: "__single", label: `Only ${LEAD_STATUSES.find((x) => x.id === draft.status)?.label || draft.status}` }] : [])]}
                hint="Pick a single stage with the tiles above."
              />
            ) : null}
          </>
        )}
      </FiltersDrawer>

      <LeadDrawer id={openId} owners={owners} canWrite={canWrite} onClose={closeLead} onChanged={refresh} onRequestStatus={requestStatus} />
      <LostReasonModal open={!!lost} count={lost?.ids.length || 1} busy={lost?.busy} error={lost?.error} onClose={() => setLost(null)} onConfirm={confirmLost} />
    </>
  );
}
