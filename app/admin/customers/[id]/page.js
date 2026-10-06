"use client";

import Link from "next/link";
import { use, useState } from "react";
import "../../crm.css";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDate, formatDateTime, formatMoney, humanize } from "../../_lib/format";
import { LEAD_STATUS, SOURCE_LABEL } from "../../_lib/crm";
import {
  Avatar, Button, Card, ConfirmDialog, ErrorState, Icon, InlineTable, KeyValue, PageHeader, RequirePermission, Skeleton,
  StatCard, StatusBadge, Switch, TabPanel, Tabs, TextArea, useToast,
} from "../../_kit";
import { Input } from "../../_ui/components/input";
import { TicketStatusBadge } from "../../tickets/ticketParts";

export default function CustomerPage({ params }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="customers.read">
      <Detail id={id} />
    </RequirePermission>
  );
}

function Detail({ id }) {
  const api = useAdminApi();
  const toast = useToast();
  const { can, user: me } = useAdminMe();
  const canWrite = can("customers.write");
  const canDeactivate = can("customers.delete");
  const { data: c, error, loading, reload } = useAdminQuery(`/admin/customers/${id}`);
  const [tab, setTab] = useState("bookings");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [tagText, setTagText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  async function act(key, call, success) {
    setBusy(key);
    try {
      await call();
      if (success) toast.success(success);
      reload();
      return true;
    } catch (e) {
      toast.error(e.message || "Something went wrong");
      return false;
    } finally {
      setBusy("");
    }
  }

  if (error && !c) {
    return (
      <>
        <Link href="/admin/customers" className="adm-backlink"><Icon name="chevronLeft" size={14} />All customers</Link>
        <ErrorState title="Could not load this customer" description={error.message} onRetry={reload} />
      </>
    );
  }
  if (loading && !c) return <div className="adm-stack"><Skeleton height={32} width="35%" /><Skeleton height={100} /><Skeleton height={240} /></div>;
  if (!c) return null;

  const saveTags = (tags) => act("tags", () => api.patch(`/admin/customers/${id}`, { tags }), "Tags updated");
  function addTag() {
    const t = tagText.trim().toLowerCase();
    setTagText("");
    if (t && !c.tags.includes(t) && c.tags.length < 10 && /^[a-z0-9][a-z0-9 _-]{0,29}$/.test(t)) saveTags([...c.tags, t]);
  }
  const self = me?.id === c.id;

  async function toggleActive() {
    setConfirmError("");
    setBusy("active");
    try {
      await api.post(`/admin/customers/${id}/${c.active ? "deactivate" : "reactivate"}`, {});
      toast.success(c.active ? "Account deactivated" : "Account reactivated");
      setConfirm(false);
      reload();
    } catch (e) {
      setConfirmError(e.message);
    } finally {
      setBusy("");
    }
  }

  const bookingCols = [
    { key: "reference", label: "Reference", primary: true, render: (b) => (can("bookings.read") ? <Link className="adm-link" href={`/admin/bookings/${b.id}`}>{b.reference}</Link> : b.reference) },
    { key: "title", label: "Booking", render: (b) => b.title },
    { key: "status", label: "Status", render: (b) => <StatusBadge status={b.status}>{humanize(b.status)}</StatusBadge> },
    { key: "serviceDate", label: "Service date", render: (b) => (b.serviceDate ? formatDate(b.serviceDate) : "-") },
    { key: "total", label: "Total", align: "right", render: (b) => formatMoney(b.total, b.currency) },
  ];
  const ticketCols = [
    { key: "number", label: "Ticket", primary: true, render: (t) => (can("tickets.read") ? <Link className="adm-link" href={`/admin/tickets/${t.id}`}>{t.number}</Link> : t.number) },
    { key: "subject", label: "Subject", render: (t) => t.subject },
    { key: "status", label: "Status", render: (t) => <TicketStatusBadge status={t.status} /> },
    { key: "createdAt", label: "Opened", render: (t) => formatDateTime(t.createdAt) },
  ];
  const leadCols = [
    { key: "reference", label: "Lead", primary: true, render: (l) => (can("enquiries.read") ? <Link className="adm-link" href={`/admin/leads?lead=${l.id}`}>{l.reference}</Link> : l.reference) },
    { key: "source", label: "Source", render: (l) => `${SOURCE_LABEL[l.source] || l.source}${l.catalog?.title ? ` - ${l.catalog.title}` : ""}` },
    { key: "status", label: "Status", render: (l) => <StatusBadge tone={LEAD_STATUS[l.status]?.tone}>{LEAD_STATUS[l.status]?.label || l.status}</StatusBadge> },
    { key: "createdAt", label: "Received", render: (l) => formatDateTime(l.createdAt) },
  ];

  return (
    <>
      <Link href="/admin/customers" className="adm-backlink"><Icon name="chevronLeft" size={14} />All customers</Link>
      <PageHeader
        title={<span className="adm-row"><Avatar name={c.name} size={36} />{c.name}</span>}
        meta={<span className="adm-row">{c.active ? <StatusBadge status="active">Active</StatusBadge> : <StatusBadge status="deactivated">Deactivated</StatusBadge>}{c.isB2B ? <StatusBadge tone="info" dot={false}>B2B partner</StatusBadge> : null}<span className="adm-muted">{c.email}</span></span>}
        actions={canDeactivate && !self ? <Button variant={c.active ? "danger" : "secondary"} icon={c.active ? "lock" : "refresh"} onClick={() => { setConfirmError(""); setConfirm(true); }}>{c.active ? "Deactivate account" : "Reactivate account"}</Button> : null}
      />
      <div className="adm-grid adm-grid--stats" style={{ marginBottom: "var(--adm-s4)" }}>
        <StatCard label="Lifetime value" icon="finance" tone="success" value={formatMoney(c.stats.lifetimeValueAed)} hint={c.stats.otherCurrencyConfirmed ? `+${c.stats.otherCurrencyConfirmed} confirmed booking(s) in another currency, not included` : "Confirmed bookings, AED"} />
        <StatCard label="Confirmed bookings" icon="bookings" value={String(c.stats.confirmed)} />
        <StatCard label="All bookings" icon="calendar" value={String(c.stats.bookings)} hint={c.stats.lastBookingAt ? `Last: ${formatDate(c.stats.lastBookingAt)}` : "No bookings yet"} />
        <StatCard label="Customer since" icon="customers" value={formatDate(c.createdAt)} />
      </div>
      <div className="adm-twocol">
        <Card>
          <Tabs idPrefix="adm-cust" label="Customer activity" value={tab} onChange={setTab} tabs={[
            { id: "bookings", label: "Bookings", badge: c.bookings.length },
            { id: "tickets", label: "Tickets", badge: c.tickets.length },
            { id: "leads", label: "Leads", badge: c.leads.length },
            { id: "notes", label: "Notes", badge: c.notes?.length || undefined },
          ]} />
          <TabPanel id="bookings" value={tab} idPrefix="adm-cust"><InlineTable caption="Recent bookings" columns={bookingCols} rows={c.bookings} emptyTitle="No bookings yet" /></TabPanel>
          <TabPanel id="tickets" value={tab} idPrefix="adm-cust"><InlineTable caption="Support tickets" columns={ticketCols} rows={c.tickets} emptyTitle="No support tickets" /></TabPanel>
          <TabPanel id="leads" value={tab} idPrefix="adm-cust"><InlineTable caption="Leads" columns={leadCols} rows={c.leads} emptyTitle="No leads or enquiries" /></TabPanel>
          <TabPanel id="notes" value={tab} idPrefix="adm-cust">
            <div className="adm-stack">
              {canWrite ? (
                <form className="adm-stack" onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; if (await act("note", () => api.post(`/admin/customers/${id}/notes`, { text: note.trim() }), "Note added")) setNote(""); }}>
                  <TextArea label="Internal note" rows={3} maxLength={2000} value={note} onChange={setNote} hint="Only staff can see notes." />
                  <div><Button variant="primary" size="sm" type="submit" disabled={!note.trim()} loading={busy === "note"}>Add note</Button></div>
                </form>
              ) : null}
              <div className="adm-notes">
                {(c.notes || []).map((n) => <div key={n.id} className="adm-note"><p>{n.text}</p><small>{n.authorName} - {formatDateTime(n.at)}</small></div>)}
                {!c.notes?.length ? <p className="adm-muted">No notes yet.</p> : null}
              </div>
            </div>
          </TabPanel>
        </Card>
        <aside className="adm-sidepanel" aria-label="Customer details">
          <Card title="Profile">
            <KeyValue items={[
              { label: "Email", value: c.email },
              { label: "Sign-in", value: c.linkedToClerk ? "Linked" : "Not signed in yet" },
              { label: "Language", value: c.preferredLocale || "-" },
              { label: "Currency", value: c.preferredCurrency || "-" },
              { label: "Roles", value: <span className="adm-chips">{c.roles.map((r) => <span key={r} className="adm-chip">{humanize(r)}</span>)}</span> },
              ...(c.partnerApplication ? [{ label: "Partner application", value: <Link className="adm-link" href={`/admin/partners?id=${c.id}`}>{humanize(c.partnerApplication.status)} - {c.partnerApplication.companyName}</Link> }] : []),
            ]} />
          </Card>
          <Card title="Preferences and tags">
            <div className="adm-stack" style={{ gap: 12 }}>
              <Switch label="Opted out of marketing" description="Staff must not send offers to this person." checked={c.marketingOptOut} disabled={!canWrite || busy === "mkt"} onChange={(v) => act("mkt", () => api.patch(`/admin/customers/${id}`, { marketingOptOut: v }), v ? "Marked as opted out" : "Marketing allowed")} />
              <div className="adm-tagedit">
                {c.tags.map((t) => <span key={t} className="adm-tag">{t}{canWrite ? <button type="button" aria-label={`Remove tag ${t}`} onClick={() => saveTags(c.tags.filter((x) => x !== t))}>x</button> : null}</span>)}
                {canWrite ? <Input className="tw:h-[30px] tw:w-[150px] tw:rounded-lg tw:bg-(--adm-control-bg) tw:text-sm" aria-label="Add tag" placeholder="Add tag, press Enter" maxLength={30} value={tagText} onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} /> : null}
                {!c.tags.length && !canWrite ? <span className="adm-muted">No tags</span> : null}
              </div>
            </div>
          </Card>
        </aside>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={toggleActive}
        busy={busy === "active"}
        error={confirmError}
        tone={c.active ? "danger" : "primary"}
        title={c.active ? "Deactivate this customer account?" : "Reactivate this customer account?"}
        description={c.active ? `${c.name} will be refused on every request until the account is reactivated. Their bookings and history are kept. This is recorded in the audit log.` : `${c.name} will be able to sign in and use the site again.`}
        confirmText={c.active ? c.email : undefined}
        confirmLabel={c.active ? "Deactivate" : "Reactivate"}
      />
    </>
  );
}
