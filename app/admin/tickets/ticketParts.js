"use client";

import { formatDateTime } from "../_lib/format";
import { TICKET_PRIORITY, TICKET_STATUS } from "../_lib/crm";
import { StatusBadge } from "../_kit";

export function TicketStatusBadge({ status }) {
  const s = TICKET_STATUS[status];
  return <StatusBadge tone={s?.tone || "neutral"}>{s?.label || status}</StatusBadge>;
}

export function TicketPriority({ value }) {
  const p = TICKET_PRIORITY[value];
  return <span className={`adm-prio is-${value}`}>{p?.label || value}</span>;
}

/** Remaining/overdue time as "2h 10m". Computed from the server timestamps; call after mount only. */
export function duration(ms) {
  const abs = Math.abs(ms);
  const minutes = Math.round(abs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** SLA summary for a table cell. `now` comes from the page (state) so SSR and client agree. */
export function SlaCell({ ticket, now }) {
  const sla = ticket.sla;
  if (!sla) return <span className="adm-muted">-</span>;
  if (sla.breached) {
    const which = sla.firstResponse === "breached" ? "First response" : "Resolution";
    const due = sla.firstResponse === "breached" ? sla.firstResponseDueAt : sla.resolutionDueAt;
    return (
      <span className="adm-cellstack">
        <StatusBadge tone="danger">SLA breached</StatusBadge>
        <small>{which} {now ? `${duration(now - new Date(due).getTime())} ago` : ""}</small>
      </span>
    );
  }
  if (sla.nextDeadlineAt) {
    const left = now ? new Date(sla.nextDeadlineAt).getTime() - now : null;
    return (
      <span className="adm-cellstack">
        {sla.dueSoon ? <StatusBadge tone="warning">Due soon</StatusBadge> : <span>On track</span>}
        <small>{left != null ? `${duration(left)} left` : formatDateTime(sla.nextDeadlineAt)}</small>
      </span>
    );
  }
  return <span className="adm-muted">Met</span>;
}
