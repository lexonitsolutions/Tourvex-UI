"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import "../crm.css";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatRelative } from "../_lib/format";
import { TICKET_CATEGORIES, TICKET_CATEGORY, TICKET_PRIORITIES, TICKET_STATUSES } from "../_lib/crm";
import {
  Button, ExportCsvButton, FilterToolbar, PageHeader, RequirePermission, SearchInput, SelectFilter, Tabs, UserCell,
  buildChips, fromKitActions, fromKitColumns, useSelectionState, useTableUrlState, usePageSize, useToast, useUrlParams,
} from "../_kit";
import { DataTable, DataTableColumnsMenu } from "../_ui/data-table";
import { OwnerCell } from "../leads/leadParts";
import { SlaCell, TicketPriority, TicketStatusBadge } from "./ticketParts";

const LIMIT = 20;
const EMPTY = [];
const TABS = ["mine", "unassigned", "all", "overdue"];
const KEYS = ["q", "status", "priority", "category", "assignee"];

export default function TicketsPage() {
  return (
    <RequirePermission permission="tickets.read">
      <Queue />
    </RequirePermission>
  );
}

function Queue() {
  const api = useAdminApi();
  const toast = useToast();
  const router = useRouter();
  const { can } = useAdminMe();
  const canWrite = can("tickets.write");
  const [params, setParams] = useUrlParams();
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const tab = TABS.includes(params.tab) ? params.tab : "all";
  const page = Math.max(1, Number(params.page) || 1);
  const [selected, setSelected] = useState([]);
  // Clock for SLA text; set after mount so the server HTML and first client render match.
  const [now, setNow] = useState(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, []);

  const filters = useMemo(() => ({ q: params.q, status: params.status, priority: params.priority, category: params.category, assignee: params.assignee }), [params.q, params.status, params.priority, params.category, params.assignee]);
  const query = useMemo(() => ({ ...filters, tab, page, limit, sort: params.sort || undefined }), [filters, tab, page, limit, params.sort]);
  const list = useAdminQuery("/admin/tickets", query);
  const counts = useAdminQuery("/admin/tickets/counts");
  const assignees = useAdminQuery("/admin/tickets/assignees").data || [];
  const c = counts.data;

  async function bulkClose(ids) {
    try {
      const res = await api.post("/admin/tickets/bulk/close", { ids });
      toast.success(`${res.updated} ticket${res.updated === 1 ? "" : "s"} closed${res.skipped?.length ? `, ${res.skipped.length} skipped` : ""}`);
      setSelected([]);
      list.reload();
      counts.reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const columns = useMemo(
    () => fromKitColumns([
      {
        key: "number", label: "Ticket", primary: true, sortable: true,
        render: (t) => (
          <div className="adm-cellstack">
            <Link className="adm-link" style={{ textDecoration: "none" }} href={`/admin/tickets/${t.id}`}>{t.subject}</Link>
            <small>{t.number} - {TICKET_CATEGORY[t.category] || t.category}{t.booking ? ` - ${t.booking.reference || "booking"}` : ""}</small>
          </div>
        ),
      },
      { key: "requester", label: "Requester", render: (t) => <UserCell name={t.requester.name} email={t.requester.email} size={32} /> },
      { key: "status", label: "Status", sortable: true, render: (t) => <TicketStatusBadge status={t.status} /> },
      { key: "priority", label: "Priority", sortable: true, render: (t) => <TicketPriority value={t.priority} /> },
      { key: "assignee", label: "Assignee", render: (t) => <OwnerCell owner={t.assignee} /> },
      { key: "sla", label: "SLA", render: (t) => <SlaCell ticket={t} now={now} /> },
      { key: "lastMessageAt", label: "Last activity", sortable: true, render: (t) => <span suppressHydrationWarning>{formatRelative(t.lastMessageAt || t.createdAt, now || undefined)}</span> },
    ]),
    [now]
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const selection = useSelectionState(selected, setSelected);
  const rowActions = useMemo(
    () =>
      fromKitActions((t) => [
        { label: "Open ticket", icon: "eye", onSelect: () => router.push(`/admin/tickets/${t.id}`) },
        ...(canWrite && t.status !== "closed" ? [{ label: "Close ticket", icon: "check", onSelect: () => bulkClose([t.id]) }] : []),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, canWrite]
  );

  const active = KEYS.filter((k) => params[k]).length;
  const clear = () => setParams(Object.fromEntries(KEYS.map((k) => [k, ""])));
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["status"], label: "Status", text: (p) => TICKET_STATUSES.find((x) => x.id === p.status)?.label || p.status },
      { keys: ["priority"], label: "Priority", text: (p) => TICKET_PRIORITIES.find((x) => x.id === p.priority)?.label || p.priority },
      { keys: ["category"], label: "Category", text: (p) => TICKET_CATEGORY[p.category] || p.category },
      { keys: ["assignee"], label: "Assignee", text: (p) => assignees.find((a) => a.id === p.assignee)?.name || p.assignee },
    ],
    setParams
  );

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description={c ? `${c.all.toLocaleString("en-GB")} tickets · ${c.open.toLocaleString("en-GB")} open · ${c.unassigned.toLocaleString("en-GB")} unassigned · ${c.overdue.toLocaleString("en-GB")} past their SLA target` : "Customer requests from the website."}
        actions={can("tickets.export") ? <ExportCsvButton filename="tickets.csv" getBlob={() => api.download("/admin/tickets/export.csv", { query: { ...filters, tab, sort: params.sort || undefined } })} /> : null}
      />
      <div style={{ marginBottom: 14 }}>
        <Tabs
          idPrefix="adm-tickets"
          label="Queues"
          variant="segmented"
          value={tab}
          onChange={(t) => { setSelected([]); setParams({ tab: t === "all" ? "" : t }); }}
          tabs={[
            { id: "mine", label: "Mine", badge: c?.mine },
            { id: "unassigned", label: "Unassigned", badge: c?.unassigned },
            { id: "all", label: "All", badge: c?.all },
            { id: "overdue", label: "Overdue SLA", badge: c?.overdue },
          ]}
        />
      </div>
      <DataTable
        label="Support tickets"
        storageKey="tickets"
        manual
        title="Ticket queue"
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(t) => t.id}
        rowCount={list.data?.pagination?.total}
        {...tableState}
        {...selection}
        enableRowSelection={canWrite}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        onRowClick={(t) => router.push(`/admin/tickets/${t.id}`)}
        rowActions={rowActions}
        bulkActions={({ ids }) => <Button size="sm" icon="check" onClick={() => bulkClose(ids)}>Close selected</Button>}
        columnsInToolbar
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search number, subject, customer, booking" label="Search tickets" />}
        toolbar={(table) => (
          <FilterToolbar chips={chips} onClearAll={clear} end={<DataTableColumnsMenu table={table} />}>
            <SelectFilter label="Status" allLabel="All" value={params.status || ""} onChange={(status) => setParams({ status })} options={TICKET_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
            <SelectFilter label="Priority" allLabel="All" value={params.priority || ""} onChange={(priority) => setParams({ priority })} options={TICKET_PRIORITIES.map((s) => ({ value: s.id, label: s.label }))} />
            <SelectFilter label="Category" allLabel="All" value={params.category || ""} onChange={(category) => setParams({ category })} options={TICKET_CATEGORIES.map((s) => ({ value: s.id, label: s.label }))} />
            <SelectFilter label="Assignee" allLabel="Anyone" value={params.assignee || ""} onChange={(assignee) => setParams({ assignee })} options={assignees.map((a) => ({ value: a.id, label: a.name }))} />
          </FilterToolbar>
        )}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{active || tab !== "all" ? "No tickets in this view" : "No tickets yet"}</p>
            <p className="adm-empty__desc">{tab === "overdue" ? "Nothing has missed its response or resolution target." : "Tickets opened from the website Support page appear here."}</p>
            {active ? <div className="adm-empty__action"><Button onClick={clear}>Clear filters</Button></div> : null}
          </div>
        }
      />
    </>
  );
}
