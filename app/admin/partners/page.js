"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import "../crm.css";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatDate, formatDateTime, formatMoney, humanize } from "../_lib/format";
import {
  Button, Card, Drawer, ErrorState, ExportCsvButton, KeyValue, Modal, Money, PageHeader, RequirePermission,
  SearchInput, SelectField, Skeleton, StatusBadge, Tabs, TextArea, TextField, UserCell, fromKitActions, fromKitColumns, useTableUrlState, usePageSize, useToast, useUrlParams,
} from "../_kit";
import { DataTable } from "../_ui/data-table";

const LIMIT = 20;
const EMPTY = [];
const TABS = ["pending", "approved", "rejected", "all"];
const B2B_ROLES = [
  { value: "b2b_owner", label: "Owner (full partner access)" },
  { value: "b2b_manager", label: "Manager" },
  { value: "b2b_agent", label: "Agent" },
];
const TONE = { pending: "warning", approved: "success", rejected: "danger" };

export default function PartnersPage() {
  return (
    <RequirePermission permission="partners.read">
      <Partners />
    </RequirePermission>
  );
}

const num = (v) => (v === "" || v == null ? undefined : Number(v));

function TermsModal({ partner, mode, onClose, onDone }) {
  const api = useAdminApi();
  const toast = useToast();
  const reviewing = mode === "review";
  const [decision, setDecision] = useState("approve");
  const [reason, setReason] = useState("");
  const [role, setRole] = useState(partner.b2bRole || "b2b_owner");
  const [discount, setDiscount] = useState(String(partner.profile?.discountPercent ?? 0));
  const [credit, setCredit] = useState(String(partner.profile?.creditTermsDays ?? 0));
  const [limit, setLimit] = useState(partner.profile?.creditLimitAed != null ? String(partner.profile.creditLimitAed) : "");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate() {
    const e = {};
    const d = num(discount);
    const c = num(credit);
    if (decision === "approve") {
      if (d === undefined || Number.isNaN(d) || d < 0 || d > 100) e.discount = "Enter a percentage between 0 and 100.";
      if (c === undefined || !Number.isInteger(c) || c < 0 || c > 365) e.credit = "Enter whole days between 0 and 365.";
      if (limit !== "" && (Number.isNaN(Number(limit)) || Number(limit) < 0)) e.limit = "Enter a positive amount.";
    } else if (reason.trim().length < 3) e.reason = "Give a reason; it is saved with the application.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setApiError("");
    try {
      if (reviewing) {
        await api.post(`/admin/partners/${partner.id}/review`, decision === "approve"
          ? { decision, role, discountPercent: num(discount), creditTermsDays: num(credit), ...(limit !== "" ? { creditLimitAed: Number(limit) } : {}), ...(reason.trim() ? { reason: reason.trim() } : {}) }
          : { decision, reason: reason.trim() });
        toast.success(decision === "approve" ? "Partner approved" : "Application rejected");
      } else {
        await api.patch(`/admin/partners/${partner.id}`, { role, discountPercent: num(discount), creditTermsDays: num(credit), ...(limit !== "" ? { creditLimitAed: Number(limit) } : {}) });
        toast.success("Partner terms updated");
      }
      onDone();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const approving = !reviewing || decision === "approve";
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={reviewing ? `Review ${partner.company || partner.name}` : `Terms for ${partner.company || partner.name}`}
      description={reviewing ? "Approving gives the person a B2B role and the commercial terms below." : "Changes apply to the partner's account from the next request."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={approving ? "primary" : "danger"} type="submit" form="adm-partner-form" loading={busy}>{reviewing ? (approving ? "Approve partner" : "Reject application") : "Save terms"}</Button>
        </>
      }
    >
      <form id="adm-partner-form" className="adm-stack" onSubmit={submit} noValidate>
        {reviewing ? (
          <div className="adm-seg" role="group" aria-label="Decision" style={{ justifySelf: "start" }}>
            <button type="button" className="adm-seg__btn" aria-pressed={decision === "approve"} onClick={() => setDecision("approve")}>Approve</button>
            <button type="button" className="adm-seg__btn" aria-pressed={decision === "reject"} onClick={() => setDecision("reject")}>Reject</button>
          </div>
        ) : null}
        {approving ? (
          <>
            <SelectField label="B2B role" value={role} onChange={setRole} options={B2B_ROLES} />
            <div className="adm-form-grid">
              <TextField label="Discount" suffix="%" inputMode="decimal" value={discount} onChange={setDiscount} error={errors.discount} hint="Stored with the partner; applied once partner pricing reads it." />
              <TextField label="Credit terms" suffix="days" inputMode="numeric" value={credit} onChange={setCredit} error={errors.credit} hint="0 = pays at booking." />
              <TextField label="Credit limit" prefix="AED" inputMode="decimal" value={limit} onChange={setLimit} error={errors.limit} hint="Optional." />
            </div>
          </>
        ) : null}
        {reviewing ? <TextArea label={approving ? "Note (optional)" : "Reason"} required={!approving} rows={3} maxLength={1000} value={reason} onChange={setReason} error={errors.reason} data-autofocus={!approving ? true : undefined} /> : null}
        {apiError ? <p className="adm-inline-error" role="alert">{apiError}</p> : null}
      </form>
    </Modal>
  );
}

function PartnerDrawer({ id, canWrite, onClose, onAct }) {
  const { data: p, error, loading, reload } = useAdminQuery(id ? `/admin/partners/${id}` : null);
  return (
    <Drawer open={!!id} onClose={onClose} width={520} title={p?.company || p?.name || "Partner"} description={p ? p.email : undefined}>
      {error && !p ? <ErrorState title="Could not load this partner" description={error.message} onRetry={reload} /> : null}
      {loading && !p ? <div className="adm-stack">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={30} />)}</div> : null}
      {p ? (
        <div className="adm-stack">
          <div className="adm-pills">
            <StatusBadge tone={TONE[p.applicationStatus] || "neutral"}>{humanize(p.applicationStatus || "no application")}</StatusBadge>
            {p.b2bRole ? <span className="adm-chip">{humanize(p.b2bRole)}</span> : null}
          </div>
          <KeyValue items={[
            { label: "Reference", value: p.applicationReference || "-" },
            { label: "Contact", value: p.name },
            { label: "Business type", value: p.businessType || "-" },
            { label: "Category", value: p.partnershipCategory || "-" },
            { label: "Location", value: [p.city, p.country].filter(Boolean).join(", ") || "-" },
            { label: "Phone", value: p.phone },
            { label: "Website", value: p.website ? <a className="adm-link" href={p.website} target="_blank" rel="noopener noreferrer">{p.website}</a> : "-" },
            { label: "Submitted", value: p.submittedAt ? formatDateTime(p.submittedAt) : "-" },
            { label: "Reviewed", value: p.reviewedAt ? `${formatDateTime(p.reviewedAt)}${p.reviewedBy ? ` by ${p.reviewedBy}` : ""}` : "-" },
            { label: "Review note", value: p.reviewNote },
            { label: "Discount", value: p.profile ? `${p.profile.discountPercent}%` : "-" },
            { label: "Credit terms", value: p.profile ? `${p.profile.creditTermsDays} days${p.profile.creditLimitAed != null ? `, limit ${formatMoney(p.profile.creditLimitAed)}` : ""}` : "-" },
            { label: "Customer profile", value: <Link className="adm-link" href={`/admin/customers/${p.id}`}>Open</Link> },
          ]} />
          {p.businessDescription ? <div className="adm-message"><b>Business description</b><br />{p.businessDescription}</div> : null}
          {p.message ? <div className="adm-message">{p.message}</div> : null}
          <Card title={`Bookings (${p.stats.bookings})`} flush>
            <div style={{ padding: "var(--adm-s3) var(--adm-s4)" }}>
              <p className="adm-muted">Confirmed value: <b>{formatMoney(p.stats.lifetimeValueAed)}</b> across {p.stats.confirmed} confirmed booking(s).</p>
              {p.bookings.map((b) => <div key={b.id} className="adm-sla__row" style={{ padding: "6px 0" }}><span>{b.reference} - {b.title}</span><b>{formatMoney(b.total, b.currency)}</b></div>)}
              {!p.bookings.length ? <p className="adm-muted">No bookings yet.</p> : null}
            </div>
          </Card>
          {canWrite ? (
            <div className="adm-row">
              {p.applicationStatus === "pending" ? <Button variant="primary" onClick={() => onAct(p, "review")}>Review application</Button> : null}
              {p.applicationStatus === "approved" ? <Button onClick={() => onAct(p, "terms")}>Edit terms</Button> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

function Partners() {
  const api = useAdminApi();
  const { can } = useAdminMe();
  const canWrite = can("partners.write");
  const [params, setParams] = useUrlParams();
  const tab = TABS.includes(params.tab) ? params.tab : "pending";
  const page = Math.max(1, Number(params.page) || 1);
  const filters = useMemo(() => ({ q: params.q, status: tab === "all" ? undefined : tab }), [params.q, tab]);
  const [limit, setLimit] = usePageSize(params, setParams, LIMIT);
  const query = useMemo(() => ({ ...filters, page, limit, sort: params.sort || undefined }), [filters, page, limit, params.sort]);
  const list = useAdminQuery("/admin/partners", query);
  const counts = useAdminQuery("/admin/partners/counts");
  const c = counts.data;
  const [dialog, setDialog] = useState(null); // { partner, mode }
  const openId = params.id || null;

  const openPartner = useCallback((id) => setParams({ id, page: params.page }), [setParams, params.page]);
  const columns = useMemo(
    () => fromKitColumns([
      {
        key: "company", label: "Partner", primary: true,
        render: (p) => <UserCell name={p.company || p.name} email={`${p.name} - ${p.email}`} onClick={() => openPartner(p.id)} size={34} />,
      },
      { key: "status", label: "Application", render: (p) => (p.applicationStatus ? <StatusBadge tone={TONE[p.applicationStatus]}>{humanize(p.applicationStatus)}</StatusBadge> : <span className="adm-muted">B2B role only</span>) },
      { key: "submittedAt", label: "Submitted", sortable: true, nowrap: true, render: (p) => (p.submittedAt ? formatDate(p.submittedAt) : "-") },
      { key: "terms", label: "Terms", render: (p) => (p.profile ? `${p.profile.discountPercent}% off, ${p.profile.creditTermsDays}d credit` : "-") },
      { key: "bookings", label: "Bookings", align: "right", render: (p) => (<>{p.stats.bookings}<small className="adm-ops-sub"><Money value={p.stats.lifetimeValueAed} /></small></>) },
    ]),
    [openPartner]
  );
  const tableState = useTableUrlState(params, setParams, limit, setLimit);
  const rowActions = useMemo(
    () =>
      fromKitActions((p) => [
        { label: "Open details", icon: "eye", onSelect: () => openPartner(p.id) },
        ...(canWrite && p.applicationStatus === "pending" ? [{ label: "Review application", icon: "check", onSelect: () => setDialog({ partner: p, mode: "review" }) }] : []),
        ...(canWrite && p.applicationStatus === "approved" ? [{ label: "Edit terms", icon: "edit", onSelect: () => setDialog({ partner: p, mode: "terms" }) }] : []),
      ]),
    [openPartner, canWrite]
  );

  const done = () => { setDialog(null); list.reload(); counts.reload(); };

  return (
    <>
      <PageHeader
        title="Partners"
        description={c ? `${c.pending.toLocaleString("en-GB")} to review · ${c.approved.toLocaleString("en-GB")} approved · ${c.rejected.toLocaleString("en-GB")} rejected` : "B2B partner applications and approved partners."}
        actions={can("partners.export") ? <ExportCsvButton filename="partners.csv" getBlob={() => api.download("/admin/partners/export.csv", { query: filters })} /> : null}
      />
      <div style={{ marginBottom: 14 }}>
        <Tabs idPrefix="adm-partners" label="Applications" variant="segmented" value={tab} onChange={(t) => setParams({ tab: t === "pending" ? "" : t })} tabs={[
          { id: "pending", label: "To review", badge: c?.pending },
          { id: "approved", label: "Approved", badge: c?.approved },
          { id: "rejected", label: "Rejected", badge: c?.rejected },
          { id: "all", label: "All" },
        ]} />
      </div>
      <DataTable
        label="Partners"
        storageKey="partners"
        manual
        title="Partner list"
        columns={columns}
        data={list.data?.items || EMPTY}
        getRowId={(p) => p.id}
        rowCount={list.data?.pagination?.total}
        {...tableState}
        rowActions={rowActions}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        search={<SearchInput value={params.q} onChange={(q) => setParams({ q })} placeholder="Search company, name or email" label="Search partners" />}
        emptyState={
          <div className="adm-empty">
            <p className="adm-empty__title">{tab === "pending" ? "No applications waiting" : "No partners here"}</p>
            {tab === "pending" ? <p className="adm-empty__desc">New B2B applications from the website appear here for review.</p> : null}
          </div>
        }
      />
      <PartnerDrawer id={openId} canWrite={canWrite} onClose={() => setParams({ id: "", page: params.page })} onAct={(partner, mode) => setDialog({ partner, mode })} />
      {dialog ? <TermsModal key={`${dialog.partner.id}-${dialog.mode}`} partner={dialog.partner} mode={dialog.mode} onClose={() => setDialog(null)} onDone={done} /> : null}
    </>
  );
}
