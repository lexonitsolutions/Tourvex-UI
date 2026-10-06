"use client";

import { useState } from "react";
import { formatDate, formatDateTime, formatMoney } from "../_lib/format";
import { followUpBadge, LEAD_PRIORITIES, LEAD_STATUS, LOST_REASONS, SOURCE_LABEL } from "../_lib/crm";
import { Avatar, Button, Modal, SelectField, StatusBadge, TextField } from "../_kit";

export function LeadStatusBadge({ status }) {
  const s = LEAD_STATUS[status];
  return <StatusBadge tone={s?.tone || "neutral"}>{s?.label || status}</StatusBadge>;
}

export function FollowUp({ lead }) {
  const badge = followUpBadge(lead.followUp);
  if (!lead.nextFollowUpAt) return <span className="adm-muted">-</span>;
  return (
    <span className="adm-cellstack">
      <span>{formatDateTime(lead.nextFollowUpAt)}</span>
      {badge ? <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge> : null}
    </span>
  );
}

export function OwnerCell({ owner }) {
  if (!owner) return <span className="adm-muted">Unassigned</span>;
  return (
    <span className="adm-owner" title={owner.name}>
      <Avatar name={owner.name} size={24} />
      <span>{owner.name}</span>
    </span>
  );
}

export function PriorityText({ value }) {
  const label = LEAD_PRIORITIES.find((p) => p.id === value)?.label || value;
  return <span className={`adm-prio is-${value}`}>{label}</span>;
}

export function sourceLine(lead) {
  return lead.catalog?.title || lead.subject || SOURCE_LABEL[lead.source] || lead.source;
}

export function leadSubtitle(lead) {
  const bits = [];
  if (lead.pax) bits.push(`${lead.pax} traveller${lead.pax === 1 ? "" : "s"}`);
  if (lead.travelDate) bits.push(formatDate(lead.travelDate));
  if (lead.valueAed) bits.push(formatMoney(lead.valueAed));
  return bits.join(" - ");
}

/** Asks for the lost reason (required by the API) before a lead is moved to Lost. `count` > 1 for bulk. */
export function LostReasonModal({ open, count = 1, busy, error, onClose, onConfirm }) {
  return open ? <LostInner count={count} busy={busy} error={error} onClose={onClose} onConfirm={onConfirm} /> : null;
}

function LostInner({ count, busy, error, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      size="sm"
      title={count > 1 ? `Mark ${count} leads as lost` : "Mark lead as lost"}
      description="A reason is required so lost leads can be reviewed later."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(reason, note.trim())} disabled={!reason} loading={busy}>Mark lost</Button>
        </>
      }
    >
      <div className="adm-stack">
        <SelectField label="Reason" required value={reason} onChange={setReason} placeholder="Choose a reason" options={LOST_REASONS} data-autofocus />
        {count === 1 ? <TextField label="Note" value={note} onChange={setNote} maxLength={500} hint="Optional, saved in the timeline." /> : null}
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </div>
    </Modal>
  );
}
