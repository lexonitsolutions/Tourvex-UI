"use client";

import { useState } from "react";
import { formatMoney } from "../_lib/format";
import { LEAD_STATUSES, SOURCE_LABEL } from "../_lib/crm";
import { Dropdown, Icon, StatusBadge } from "../_kit";
import { FollowUp, LeadStatusBadge, OwnerCell, PriorityText, leadSubtitle } from "./leadParts";

/** Mirrors the API's pipeline rules (leads.rules.ts) so the menu only offers moves the server will accept. */
export function allowedTargets(from) {
  if (from === "won" || from === "lost") return ["contacted"];
  return LEAD_STATUSES.map((s) => s.id).filter((id) => id !== from && id !== "new" && !(id === "won" && from === "new"));
}

function Card({ lead, canWrite, onOpen, onMove, dragging, setDragging }) {
  const targets = allowedTargets(lead.status);
  return (
    <li
      className={`adm-lcard${dragging === lead.id ? " is-dragging" : ""}`}
      draggable={canWrite && targets.length > 0}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(lead.id);
      }}
      onDragEnd={() => setDragging(null)}
    >
      <div className="adm-lcard__top">
        <button type="button" className="adm-lcard__name" onClick={() => onOpen(lead.id)}>{lead.name}</button>
        {canWrite && targets.length ? (
          <Dropdown
            label={`Move ${lead.name}`}
            trigger={({ props }) => (
              <button type="button" className="adm-iconbtn" aria-label={`Move ${lead.name} to another stage`} title="Move to..." {...props}><Icon name="more" size={16} /></button>
            )}
            items={targets.map((id) => ({ label: `Move to ${LEAD_STATUSES.find((s) => s.id === id).label}`, onSelect: () => onMove(lead, id) }))}
          />
        ) : null}
      </div>
      <div className="adm-lcard__meta">
        <StatusBadge tone="neutral" dot={false}>{SOURCE_LABEL[lead.source] || lead.source}</StatusBadge>
        <span>{lead.catalog?.title || lead.subject || lead.reference}</span>
      </div>
      {leadSubtitle(lead) ? <div className="adm-lcard__meta">{leadSubtitle(lead)}</div> : null}
      <div className="adm-lcard__foot">
        <OwnerCell owner={lead.owner} />
        <span className="adm-row" style={{ gap: 6, flexWrap: "nowrap" }}>
          {lead.priority === "high" ? <PriorityText value="high" /> : null}
          {lead.followUp === "overdue" || lead.followUp === "today" ? <FollowUp lead={lead} /> : null}
        </span>
      </div>
    </li>
  );
}

export function LeadBoard({ columns, loading, canWrite, onOpen, onMove, limitPerColumn }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const byId = new Map(columns.flatMap((c) => c.items.map((l) => [l.id, l])));

  return (
    <>
      <p className="adm-board__hint">
        {canWrite ? "Drag a card to another stage, or use the menu on a card (keyboard friendly). " : ""}Each stage shows the {limitPerColumn} most recently updated leads; use the table for the full list.
      </p>
      <div className="adm-board" role="list" aria-busy={loading || undefined}>
        {columns.map((col) => {
          const meta = LEAD_STATUSES.find((s) => s.id === col.status);
          return (
            <section
              key={col.status}
              role="listitem"
              aria-label={`${meta.label}, ${col.count} leads`}
              className={`adm-board__col${over === col.status ? " is-over" : ""}`}
              onDragOver={(e) => {
                if (!canWrite || !dragging) return;
                const lead = byId.get(dragging);
                if (lead && allowedTargets(lead.status).includes(col.status)) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOver(col.status);
                }
              }}
              onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const lead = byId.get(e.dataTransfer.getData("text/plain") || dragging);
                setOver(null);
                setDragging(null);
                if (lead && lead.status !== col.status) onMove(lead, col.status);
              }}
            >
              <header className="adm-board__head">
                <span className="adm-board__title"><LeadStatusBadge status={col.status} /><span className="adm-board__count">{col.count}</span></span>
                {col.valueAed ? <span className="adm-board__sum">{formatMoney(col.valueAed)}</span> : null}
              </header>
              <ul className="adm-board__list">
                {col.items.map((lead) => (
                  <Card key={lead.id} lead={lead} canWrite={canWrite} onOpen={onOpen} onMove={onMove} dragging={dragging} setDragging={setDragging} />
                ))}
                {!col.items.length ? <li className="adm-board__empty">{loading ? "Loading..." : "No leads"}</li> : null}
                {col.count > col.items.length ? <li className="adm-board__more">+{col.count - col.items.length} more in the table</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
