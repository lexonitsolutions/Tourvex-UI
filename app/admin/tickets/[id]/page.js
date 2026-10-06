"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import "../../crm.css";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDateTime } from "../../_lib/format";
import { TICKET_CATEGORIES, TICKET_CATEGORY, TICKET_PRIORITIES, TICKET_STATUSES } from "../../_lib/crm";
import { Avatar, Button, Card, ErrorState, Icon, KeyValue, PageHeader, RequirePermission, SelectField, Skeleton, useToast } from "../../_kit";
import { TicketPriority, TicketStatusBadge, duration } from "../ticketParts";

export default function TicketPage({ params }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="tickets.read">
      <Thread id={id} />
    </RequirePermission>
  );
}

function Message({ m }) {
  if (m.authorType === "system") {
    return (
      <div className="adm-msg is-system">
        <div className="adm-msg__bubble">{m.body} - {formatDateTime(m.at)}</div>
      </div>
    );
  }
  const staff = m.authorType === "staff";
  return (
    <div className={`adm-msg${staff ? " is-staff" : ""}${m.internal ? " is-internal" : ""}`}>
      <div className="adm-msg__meta">
        {!staff ? <Avatar name={m.authorName} size={22} /> : null}
        <b>{m.authorName || (staff ? "Staff" : "Customer")}</b>
        {m.internal ? <span className="adm-chip">Internal note</span> : null}
        <span>{formatDateTime(m.at)}</span>
        {staff ? <Avatar name={m.authorName} size={22} /> : null}
      </div>
      <div className="adm-msg__bubble">{m.body}</div>
    </div>
  );
}

function Thread({ id }) {
  const api = useAdminApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const canWrite = can("tickets.write");
  const { data: ticket, error, loading, reload } = useAdminQuery(`/admin/tickets/${id}`);
  const assignees = useAdminQuery("/admin/tickets/assignees").data || [];
  const [mode, setMode] = useState("reply");
  const [body, setBody] = useState("");
  const [after, setAfter] = useState("pending");
  const [busy, setBusy] = useState("");
  const [now, setNow] = useState(null);
  const endRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);
  const count = ticket?.messages?.length || 0;
  useEffect(() => {
    if (count) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  async function act(key, call, success) {
    setBusy(key);
    try {
      await call();
      if (success) toast.success(success);
      reload();
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  async function send(event) {
    event?.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy("send");
    try {
      await api.post(`/admin/tickets/${id}/reply`, { body: text, internal: mode === "note", ...(mode === "reply" ? { setStatus: after } : {}) });
      toast.success(mode === "note" ? "Internal note added" : "Reply sent to the customer");
      setBody("");
      reload();
    } catch (e) {
      toast.error(e.message || "Could not send");
    } finally {
      setBusy("");
    }
  }

  if (error && !ticket) {
    return (
      <>
        <Link href="/admin/tickets" className="adm-backlink"><Icon name="chevronLeft" size={14} />All tickets</Link>
        <ErrorState title="Could not load this ticket" description={error.message} onRetry={reload} />
      </>
    );
  }
  if (loading && !ticket) return <div className="adm-stack"><Skeleton height={32} width="40%" /><Skeleton height={220} /></div>;
  if (!ticket) return null;

  const closed = ticket.status === "closed";
  const sla = ticket.sla;
  const slaRow = (label, phase, due) => {
    const text = phase === "met" ? "Met" : phase === "met_late" ? "Met late" : phase === "n/a" ? "Not applicable" : phase === "breached" ? `Breached ${now ? `${duration(now - new Date(due).getTime())} ago` : ""}` : `Due ${formatDateTime(due)}`;
    const cls = phase === "breached" ? "is-breached" : phase === "met" ? "is-met" : phase === "pending" && sla.dueSoon ? "is-soon" : "";
    return <div className="adm-sla__row"><span>{label}</span><b className={cls}>{text}</b></div>;
  };

  return (
    <>
      <Link href="/admin/tickets" className="adm-backlink"><Icon name="chevronLeft" size={14} />All tickets</Link>
      <PageHeader
        title={ticket.subject}
        meta={<span className="adm-row"><code className="adm-code">{ticket.number}</code><TicketStatusBadge status={ticket.status} /><TicketPriority value={ticket.priority} /><span className="adm-chip">{TICKET_CATEGORY[ticket.category]}</span></span>}
        actions={
          canWrite ? (
            closed ? <Button icon="refresh" loading={busy === "reopen"} onClick={() => act("reopen", () => api.post(`/admin/tickets/${id}/status`, { status: "open" }), "Ticket reopened")}>Reopen</Button> : (
              <>
                {ticket.status !== "resolved" ? <Button icon="check" loading={busy === "resolve"} onClick={() => act("resolve", () => api.post(`/admin/tickets/${id}/status`, { status: "resolved" }), "Ticket resolved")}>Resolve</Button> : null}
                <Button variant="ghost" loading={busy === "close"} onClick={() => act("close", () => api.post(`/admin/tickets/${id}/status`, { status: "closed" }), "Ticket closed")}>Close</Button>
              </>
            )
          ) : null
        }
      />
      <div className="adm-twocol">
        <div className="adm-stack">
          <Card>
            <div className="adm-thread" aria-live="polite">
              {ticket.messages.map((m) => <Message key={m.id} m={m} />)}
              <div ref={endRef} />
            </div>
          </Card>
          {canWrite ? (
            <form className={`adm-composer${mode === "note" ? " is-internal" : ""}`} onSubmit={send}>
              <div className="adm-composer__bar">
                <div className="adm-seg" role="group" aria-label="Message type">
                  <button type="button" className="adm-seg__btn" aria-pressed={mode === "reply"} onClick={() => setMode("reply")}>Reply to customer</button>
                  <button type="button" className="adm-seg__btn" aria-pressed={mode === "note"} onClick={() => setMode("note")}>Internal note</button>
                </div>
                <span className="adm-muted" style={{ fontSize: 13 }}>{mode === "note" ? "Only staff can see this." : "The customer sees this reply on the Support page."}</span>
              </div>
              <textarea
                className="adm-input adm-textarea"
                rows={5}
                maxLength={5000}
                aria-label={mode === "note" ? "Internal note" : "Reply to customer"}
                placeholder={closed && mode === "reply" ? "Reopen the ticket to reply to the customer." : mode === "note" ? "Write an internal note..." : "Write your reply..."}
                disabled={closed && mode === "reply"}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send(e); }}
              />
              <div className="adm-composer__bar">
                {mode === "reply" ? (
                  <SelectField label="After sending" className="adm-filter" value={after} onChange={setAfter} options={[{ value: "pending", label: "Waiting on customer" }, { value: "open", label: "Keep open" }, { value: "resolved", label: "Resolved" }]} />
                ) : <span />}
                <div className="adm-row">
                  <small className="adm-muted">Ctrl+Enter to send - {body.length}/5000</small>
                  <Button variant="primary" type="submit" loading={busy === "send"} disabled={!body.trim() || (closed && mode === "reply")}>{mode === "note" ? "Add note" : "Send reply"}</Button>
                </div>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="adm-sidepanel" aria-label="Ticket details">
          <Card title="Requester">
            <div className="adm-cellstack" style={{ marginBottom: 8 }}>
              <b>{ticket.requester.name || "Customer"}</b>
              <small>{ticket.requester.email}</small>
            </div>
            {ticket.requester.userId && can("customers.read") ? <Link className="adm-link" href={`/admin/customers/${ticket.requester.userId}`}>Open customer profile</Link> : null}
            {ticket.booking ? (
              <div style={{ marginTop: 10 }}>
                <span className="adm-muted">Linked booking: </span>
                {can("bookings.read") ? <Link className="adm-link" href={`/admin/bookings/${ticket.booking.id}`}>{ticket.booking.reference || "View booking"}</Link> : <b>{ticket.booking.reference}</b>}
              </div>
            ) : null}
          </Card>
          <Card title="Handling">
            <div className="adm-stack" style={{ gap: 12 }}>
              <SelectField label="Assignee" value={ticket.assignee?.id || ""} placeholder="Unassigned" disabled={!canWrite || !!busy} onChange={(assigneeId) => act("assign", () => api.post(`/admin/tickets/${id}/assign`, { assigneeId: assigneeId || null }), "Assignee updated")} options={[...(ticket.assignee && !assignees.some((a) => a.id === ticket.assignee.id) ? [{ value: ticket.assignee.id, label: ticket.assignee.name }] : []), ...assignees.map((a) => ({ value: a.id, label: a.name }))]} />
              <SelectField label="Status" value={ticket.status} disabled={!canWrite || !!busy} onChange={(status) => act("status", () => api.post(`/admin/tickets/${id}/status`, { status }), "Status updated")} options={TICKET_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />
              <SelectField label="Priority" value={ticket.priority} disabled={!canWrite || !!busy} onChange={(priority) => act("priority", () => api.patch(`/admin/tickets/${id}`, { priority }), "Priority updated")} options={TICKET_PRIORITIES.map((s) => ({ value: s.id, label: s.label }))} />
              <SelectField label="Category" value={ticket.category} disabled={!canWrite || !!busy} onChange={(category) => act("category", () => api.patch(`/admin/tickets/${id}`, { category }), "Category updated")} options={TICKET_CATEGORIES.map((s) => ({ value: s.id, label: s.label }))} />
            </div>
          </Card>
          <Card title="SLA clock">
            {sla ? (
              <div className="adm-sla">
                {slaRow("First response", sla.firstResponse, sla.firstResponseDueAt)}
                {slaRow("Resolution", sla.resolution, sla.resolutionDueAt)}
                <p className="adm-muted" style={{ fontSize: 13 }}>Targets come from Settings, Support. The clock runs from when the ticket was opened.</p>
              </div>
            ) : null}
            <KeyValue items={[
              { label: "Opened", value: formatDateTime(ticket.createdAt) },
              { label: "First reply", value: ticket.firstResponseAt ? formatDateTime(ticket.firstResponseAt) : "Not yet" },
              { label: "Resolved", value: ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "-" },
            ]} />
          </Card>
        </aside>
      </div>
    </>
  );
}
