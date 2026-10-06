"use client";

import { useMemo, useState } from "react";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatDateTime, humanize } from "../_lib/format";
import {
  Button, Card, CopyButton, DateRangeFilter, DateTime, Drawer, ErrorState, EmptyState, FilterToolbar, KeyValue,
  PageHeader, Pagination, RequirePermission, SearchInput, SelectFilter, Skeleton, Tabs, TabPanel, TextField, Timeline, UserCell,
  buildChips, dateChipText, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useUrlParams,
} from "../_kit";
import { DataTable } from "../_ui/data-table";

const LIMIT = 25;
const EMPTY = [];
const ENTITY_TYPES = ["staff", "settings", "booking", "enquiry", "ticket", "voucher", "customer", "catalog", "blog", "promo", "invoice"];

function show(value) {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Changes({ changes }) {
  if (!changes?.length) return null;
  return (
    <div className="adm-diff">
      {changes.map((c, i) => (
        <div className="adm-diff__row" key={`${c.field}-${i}`}>
          <span className="adm-diff__field">{c.field}</span>
          <span className="adm-diff__from">{show(c.from)}</span>
          <span aria-hidden="true">to</span>
          <span className="adm-diff__to">{show(c.to)}</span>
        </div>
      ))}
    </div>
  );
}

const actorOf = (e) => e.actorEmail || e.actorId || "system";

export default function AuditPage() {
  return (
    <RequirePermission permission="audit.read">
      <AuditLog />
    </RequirePermission>
  );
}

function AuditLog() {
  const [params, setParams] = useUrlParams();
  const page = Math.max(1, Number(params.page) || 1);
  const view = params.view === "table" ? "table" : "timeline";
  const filters = useMemo(
    () => ({ q: params.q, actor: params.actor, entityType: params.entityType, entityId: params.entityId, action: params.action, from: params.from, to: params.to }),
    [params.q, params.actor, params.entityType, params.entityId, params.action, params.from, params.to]
  );
  // The API takes inclusive ISO 8601 bounds; a date-only "to" means the end of that (UTC) day.
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const query = useMemo(() => ({ ...filters, to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined, page, limit }), [filters, page, limit]);
  const { data, error, loading, reload } = useAdminQuery("/admin/audit", query);
  const [selected, setSelected] = useState(null);
  const active = Object.values(filters).filter(Boolean).length;
  const clear = () => setParams({ q: "", actor: "", entityType: "", entityId: "", action: "", from: "", to: "" });
  const drill = (e) => setParams({ entityType: e.entityType, entityId: e.entityId, q: "", actor: "", action: "", from: "", to: "" });

  const columns = useMemo(
    () => fromKitColumns([
      { key: "at", label: "When", render: (e) => <DateTime value={e.at} /> },
      { key: "actor", label: "Actor", primary: true, render: (e) => <UserCell name={actorOf(e)} size={30} /> },
      { key: "action", label: "Action", render: (e) => <code className="adm-code">{e.action}</code> },
      {
        key: "entity", label: "Entity",
        render: (e) => (e.entityType ? <button type="button" className="adm-link" onClick={() => drill(e)} title="Show history for this record">{e.entityType}{e.entityId ? ` / ${String(e.entityId).slice(-8)}` : ""}</button> : "-"),
      },
      { key: "summary", label: "Summary", render: (e) => e.summary || "-" },
    ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams]
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rowActions = useMemo(
    () =>
      fromKitActions((e) => [
        { label: "View details", icon: "eye", onSelect: () => setSelected(e) },
        ...(e.entityId ? [{ label: "History of this record", icon: "audit", onSelect: () => drill(e) }] : []),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams]
  );
  const chips = buildChips(
    params,
    [
      { keys: ["q"], label: "Search" },
      { keys: ["actor"], label: "Actor" },
      { keys: ["action"], label: "Action" },
      { keys: ["entityType"], label: "Entity", text: (p) => humanize(p.entityType) },
      { keys: ["from", "to"], label: "Date", text: (p) => dateChipText(p.from, p.to) },
    ],
    setParams
  );

  const items = data?.items;
  const timelineItems = (items || []).map((e) => ({
    id: e.id || e._id,
    title: (
      <>
        <b>{actorOf(e)}</b> <span className="adm-muted">did</span> <code className="adm-code">{e.action}</code>
      </>
    ),
    body: (
      <>
        {e.summary ? <p>{e.summary}</p> : null}
        <Changes changes={e.changes} />
        <div className="adm-row" style={{ marginTop: 6 }}>
          {e.entityType ? <button type="button" className="adm-link" onClick={() => drill(e)}>{e.entityType}{e.entityId ? ` / ${e.entityId}` : ""}</button> : null}
          <Button size="sm" variant="ghost" onClick={() => setSelected(e)}>Details</Button>
        </div>
      </>
    ),
    meta: formatDateTime(e.at),
    tone: /delete|deactivate|cancel|revoke|refund/.test(e.action || "") ? "danger" : undefined,
  }));

  return (
    <>
      <PageHeader
        title="Audit log"
        description="An immutable record of every successful admin change. Entries cannot be edited or deleted."
      />
      <div style={{ marginBottom: 14 }}>
        <Tabs idPrefix="adm-audit" label="Audit view" variant="segmented" value={view} onChange={(v) => setParams({ view: v === "timeline" ? "" : v, page: params.page })} tabs={[{ id: "timeline", label: "Timeline" }, { id: "table", label: "Table" }]} />
      </div>

      <FilterToolbar chips={chips} onClearAll={clear}>
        <SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search summary or action" label="Search audit log" />
        <TextField className="adm-ft__input" value={params.actor || ""} onChange={(actor) => setParams({ actor: actor.trim() })} placeholder="Actor email" aria-label="Actor" />
        <TextField className="adm-ft__input" value={params.action || ""} onChange={(action) => setParams({ action: action.trim() })} placeholder="Action, e.g. staff.update" aria-label="Action" />
        <SelectFilter label="Entity" allLabel="All" value={params.entityType || ""} onChange={(entityType) => setParams({ entityType, entityId: "" })} options={ENTITY_TYPES.map((t) => ({ value: t, label: humanize(t) }))} />
        <DateRangeFilter label="Date" value={{ from: params.from, to: params.to }} onChange={(r) => setParams({ from: r.from || "", to: r.to || "" })} />
      </FilterToolbar>

      {params.entityId ? (
        <div className="adm-row" style={{ marginBottom: "var(--adm-s3)" }}>
          <span className="adm-chip">History of {params.entityType || "record"} / {params.entityId}</span>
          <Button size="sm" variant="ghost" icon="close" onClick={() => setParams({ entityType: "", entityId: "" })}>Show everything</Button>
        </div>
      ) : null}

      <TabPanel idPrefix="adm-audit" id="timeline" value={view}>
        <Card>
          {error && !items ? (
            <ErrorState title="Could not load the audit log" description={error.message} onRetry={reload} />
          ) : !items ? (
            <div className="adm-stack">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={44} />)}</div>
          ) : items.length === 0 ? (
            <EmptyState icon="audit" title={active ? "No entries match these filters" : "Nothing logged yet"} description={active ? "Widen the date range or clear a filter." : "Changes made in the admin will appear here."} action={active ? <Button onClick={clear}>Clear filters</Button> : null} />
          ) : (
            <Timeline items={timelineItems} />
          )}
        </Card>
        {items?.length && data.pagination ? <div style={{ marginTop: "var(--adm-s3)" }}><Pagination {...data.pagination} onPage={(p) => setParams({ page: p })} /></div> : null}
      </TabPanel>

      <TabPanel idPrefix="adm-audit" id="table" value={view}>
        <DataTable
          label="Audit log entries"
          storageKey="audit"
          manual
          title="Audit entries"
          columns={columns}
          data={items || EMPTY}
          getRowId={(e) => e.id || e._id}
          rowCount={data?.pagination?.total}
          {...tableState}
          rowActions={rowActions}
          onRowClick={(e) => setSelected(e)}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyState={
            <div className="adm-empty">
              <p className="adm-empty__title">{active ? "No entries match these filters" : "Nothing logged yet"}</p>
              <p className="adm-empty__desc">{active ? "Widen the date range or clear a filter." : "Changes made in the admin will appear here."}</p>
              {active ? <div className="adm-empty__action"><Button onClick={clear}>Clear filters</Button></div> : null}
            </div>
          }
        />
      </TabPanel>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.action || "Audit entry"} description={selected ? formatDateTime(selected.at) : ""} width={520}>
        {selected ? (
          <>
            <KeyValue
              items={[
                { label: "Actor", value: actorOf(selected) },
                { label: "Actor roles", value: (selected.actorRoles || []).map(humanize).join(", ") || "-" },
                { label: "Action", value: <code className="adm-code">{selected.action}</code> },
                { label: "Entity", value: selected.entityType ? `${selected.entityType}${selected.entityId ? ` / ${selected.entityId}` : ""}` : "-" },
                { label: "Request ID", value: selected.requestId ? <>{selected.requestId} <CopyButton value={selected.requestId} label="Copy request ID" /></> : "-" },
              ]}
            />
            {selected.summary ? <p>{selected.summary}</p> : null}
            {selected.changes?.length ? <div><h3 className="adm-card__title" style={{ marginBottom: 8 }}>Changes</h3><Changes changes={selected.changes} /></div> : <p className="adm-muted">No field-level changes were recorded.</p>}
            {selected.entityId ? <Button icon="audit" onClick={() => { drill(selected); setSelected(null); }}>View history of this record</Button> : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
}
