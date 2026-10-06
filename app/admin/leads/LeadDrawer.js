"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatDate, formatDateTime, formatMoney } from "../_lib/format";
import {
  CONTACT_CHANNELS, LEAD_PRIORITIES, LEAD_STATUS, LOST_REASON_LABEL, SOURCE_LABEL,
  catalogHref, localInputValue, mailtoHref, telHref, whatsappHref,
} from "../_lib/crm";
import {
  Button, CopyButton, Drawer, ErrorState, Icon, KeyValue, MoneyField, SelectField, Skeleton, StatusBadge,
  Tabs, TabPanel, TextArea, TextField, Timeline, useToast,
} from "../_kit";
import { Input } from "../_ui/components/input";
import { allowedTargets } from "./LeadBoard";
import { FollowUp, LeadStatusBadge } from "./leadParts";

const TIMELINE_TITLES = {
  created: () => "Lead created",
  status: (e) => `Status: ${LEAD_STATUS[e.from]?.label || e.from} to ${LEAD_STATUS[e.to]?.label || e.to}`,
  assigned: (e) => `Owner: ${e.from || "Unassigned"} to ${e.to || "Unassigned"}`,
  follow_up: (e) => (e.to === "cleared" ? "Follow-up cleared" : `Follow-up set for ${formatDateTime(e.to)}`),
  contact: (e) => `Contacted by ${CONTACT_CHANNELS[e.to] || e.to}`,
  priority: (e) => `Priority: ${e.from} to ${e.to}`,
  update: () => "Updated",
  imported: () => "Imported from the enquiry list",
};
const TONES = { status: "info", contact: "success", created: "info" };

function timelineItems(lead) {
  return (lead.timeline || []).map((e) => ({
    id: e.id,
    tone: TONES[e.type],
    title: (TIMELINE_TITLES[e.type] || (() => e.type))(e),
    body: e.text || null,
    meta: `${e.actorName || "Website visitor"} - ${formatDateTime(e.at)}`,
  }));
}

export default function LeadDrawer({ id, owners, canWrite, onClose, onChanged, onRequestStatus }) {
  const api = useAdminApi();
  const toast = useToast();
  const { data: lead, error, loading, reload } = useAdminQuery(id ? `/admin/leads/${id}` : null);
  const [tab, setTab] = useState("timeline");
  const [busy, setBusy] = useState("");

  async function run(key, call, success) {
    setBusy(key);
    try {
      await call();
      if (success) toast.success(success);
      reload();
      onChanged();
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={560}
      title={lead?.name || "Lead"}
      description={lead ? `${lead.reference} - ${SOURCE_LABEL[lead.source] || lead.source}` : undefined}
    >
      {error && !lead ? <ErrorState title="Could not load this lead" description={error.message} onRetry={reload} /> : null}
      {loading && !lead ? <div className="adm-stack">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={34} />)}</div> : null}
      {lead ? (
        <LeadBody
          key={lead.id}
          lead={lead}
          owners={owners}
          canWrite={canWrite}
          busy={busy}
          run={run}
          api={api}
          tab={tab}
          setTab={setTab}
          onRequestStatus={onRequestStatus}
        />
      ) : null}
    </Drawer>
  );
}

function LeadBody({ lead, owners, canWrite, busy, run, api, tab, setTab, onRequestStatus }) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(lead.nextFollowUpAt ? localInputValue(lead.nextFollowUpAt) : "");
  const [value, setValue] = useState(lead.valueAed ?? null);
  const [tags, setTags] = useState(lead.tags || []);
  const [tagText, setTagText] = useState("");
  const base = `/admin/leads/${lead.id}`;
  const logContact = (channel) => api.post(`${base}/contact`, { channel }).then(() => undefined).catch(() => undefined);
  const href = catalogHref(lead.catalog);
  const targets = allowedTargets(lead.status);
  const closed = lead.status === "won" || lead.status === "lost";

  function addTag() {
    const t = tagText.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10 && /^[a-z0-9][a-z0-9 _-]{0,29}$/.test(t)) setTags([...tags, t]);
    setTagText("");
  }
  const detailsDirty = value !== (lead.valueAed ?? null) || JSON.stringify(tags) !== JSON.stringify(lead.tags || []);

  const preset = (hours, atTen) => {
    const d = new Date(Date.now() + hours * 3_600_000);
    if (atTen) d.setHours(10, 0, 0, 0);
    setFollowUp(localInputValue(d));
  };

  return (
    <>
      <div className="adm-section">
        <h3 className="adm-section__title">Contact</h3>
        <div className="adm-pills">
          <LeadStatusBadge status={lead.status} />
          {lead.status === "lost" && lead.lostReason ? <StatusBadge tone="neutral" dot={false}>{LOST_REASON_LABEL[lead.lostReason] || lead.lostReason}</StatusBadge> : null}
          {lead.followUp === "overdue" || lead.followUp === "today" ? <FollowUp lead={lead} /> : null}
          {lead.marketingOptOut ? <StatusBadge tone="warning" dot={false}>No marketing</StatusBadge> : null}
        </div>
        <KeyValue
          items={[
            { label: "Email", value: <span className="adm-row" style={{ gap: 4 }}>{lead.email}<CopyButton value={lead.email} label="Copy email" /></span> },
            { label: "Phone", value: lead.phone ? <span className="adm-row" style={{ gap: 4 }}>{lead.phone}<CopyButton value={lead.phone} label="Copy phone" /></span> : "-" },
            { label: "Nationality", value: lead.nationality },
            { label: "Customer account", value: lead.userId ? <Link className="adm-link" href={`/admin/customers/${lead.userId}`}>View customer</Link> : "Guest" },
            { label: "Last contacted", value: lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : "Not yet" },
          ]}
        />
        {canWrite ? (
          <div className="adm-actions">
            <a className="adm-btn adm-btn--secondary adm-btn--sm" href={mailtoHref(lead.email, `Your enquiry ${lead.sourceRef}`)} onClick={() => logContact("email")}><Icon name="enquiries" size={15} /><span className="adm-btn__label">Email</span></a>
            {lead.phone ? (
              <>
                <a className="adm-btn adm-btn--secondary adm-btn--sm" href={telHref(lead.phone)} onClick={() => logContact("phone")}><Icon name="user" size={15} /><span className="adm-btn__label">Call</span></a>
                <a className="adm-btn adm-btn--secondary adm-btn--sm" href={whatsappHref(lead.phone, `Hello ${lead.name.split(" ")[0]}, thank you for your enquiry ${lead.sourceRef}.`)} target="_blank" rel="noopener noreferrer" onClick={() => logContact("whatsapp")}><Icon name="external" size={15} /><span className="adm-btn__label">WhatsApp</span></a>
              </>
            ) : null}
          </div>
        ) : null}
        {canWrite ? <p className="adm-muted" style={{ fontSize: 13 }}>Email, Call and WhatsApp open your own apps and log that you contacted this lead. No message is sent from here.</p> : null}
      </div>

      <div className="adm-section">
        <h3 className="adm-section__title">Pipeline</h3>
        <div className="adm-form-grid">
          <SelectField
            label="Status"
            value={lead.status}
            disabled={!canWrite || busy !== "" || targets.length === 0}
            onChange={(to) => onRequestStatus(lead, to)}
            options={[lead.status, ...targets].map((id) => ({ value: id, label: LEAD_STATUS[id]?.label || id }))}
            hint={closed ? "Reopen moves the lead back to Contacted." : undefined}
          />
          <SelectField
            label="Owner"
            value={lead.owner?.id || ""}
            disabled={!canWrite || busy !== ""}
            placeholder="Unassigned"
            onChange={(ownerId) => run("owner", () => api.post(`${base}/assign`, { ownerId: ownerId || null }), ownerId ? "Owner updated" : "Lead unassigned")}
            options={[...(lead.owner && !owners.some((o) => o.id === lead.owner.id) ? [{ value: lead.owner.id, label: lead.owner.name }] : []), ...owners.map((o) => ({ value: o.id, label: o.name }))]}
          />
          <SelectField
            label="Priority"
            value={lead.priority}
            disabled={!canWrite || busy !== ""}
            onChange={(priority) => run("priority", () => api.patch(base, { priority }), "Priority updated")}
            options={LEAD_PRIORITIES.map((p) => ({ value: p.id, label: p.label }))}
          />
          <MoneyField label="Value estimate" value={value} onChange={setValue} disabled={!canWrite} />
        </div>
        <div className="adm-field">
          <span className="adm-field__label">Tags</span>
          <div className="adm-tagedit">
            {tags.map((t) => (
              <span key={t} className="adm-tag">{t}{canWrite ? <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>x</button> : null}</span>
            ))}
            {canWrite ? (
              <Input
                className="tw:h-[30px] tw:w-[150px] tw:rounded-lg tw:bg-(--adm-control-bg) tw:text-sm"
                aria-label="Add tag"
                placeholder="Add tag, press Enter"
                value={tagText}
                maxLength={30}
                onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                onBlur={addTag}
              />
            ) : null}
          </div>
        </div>
        {canWrite && detailsDirty ? (
          <div className="adm-row">
            <Button variant="primary" size="sm" loading={busy === "details"} onClick={() => run("details", () => api.patch(base, { valueAed: value, tags }), "Lead updated")}>Save value and tags</Button>
            <Button variant="ghost" size="sm" onClick={() => { setValue(lead.valueAed ?? null); setTags(lead.tags || []); }}>Discard</Button>
          </div>
        ) : null}
      </div>

      <div className="adm-section">
        <h3 className="adm-section__title">Follow-up</h3>
        <div className="adm-inline-form">
          <TextField label="Next follow-up" type="datetime-local" value={followUp} onChange={setFollowUp} disabled={!canWrite || closed} hint={closed ? "Reopen the lead to schedule a follow-up." : undefined} />
          {canWrite && !closed ? (
            <>
              <Button size="sm" disabled={!followUp} loading={busy === "followup"} onClick={() => run("followup", () => api.post(`${base}/follow-up`, { at: new Date(followUp).toISOString() }), "Follow-up scheduled")}>Set</Button>
              {lead.nextFollowUpAt ? <Button size="sm" variant="ghost" loading={busy === "clear"} onClick={() => { setFollowUp(""); run("clear", () => api.post(`${base}/follow-up`, { at: null }), "Follow-up cleared"); }}>Clear</Button> : null}
            </>
          ) : null}
        </div>
        {canWrite && !closed ? (
          <div className="adm-row">
            <Button size="sm" variant="ghost" onClick={() => preset(3)}>In 3 hours</Button>
            <Button size="sm" variant="ghost" onClick={() => preset(24, true)}>Tomorrow 10:00</Button>
            <Button size="sm" variant="ghost" onClick={() => preset(72, true)}>In 3 days</Button>
          </div>
        ) : null}
      </div>

      <div className="adm-section">
        <h3 className="adm-section__title">Source</h3>
        <div className="adm-sourcecard">
          <div className="adm-sourcecard__head">
            <b>{lead.catalog?.title || lead.subject || SOURCE_LABEL[lead.source]}</b>
            {href ? <a className="adm-link" href={href} target="_blank" rel="noopener noreferrer">Open on site</a> : null}
          </div>
          <KeyValue
            items={[
              { label: "Source", value: SOURCE_LABEL[lead.source] || lead.source },
              { label: "Reference", value: lead.sourceRef },
              { label: "Travellers", value: lead.pax ? `${lead.pax}${lead.adults != null ? ` (${lead.adults} adults, ${lead.children ?? 0} children)` : ""}` : "-" },
              { label: "Travel date", value: lead.travelDate ? formatDate(lead.travelDate) : "-" },
              { label: "Value", value: lead.valueAed ? formatMoney(lead.valueAed) : "-" },
              { label: "Submitted", value: formatDateTime(lead.createdAt) },
              { label: "Consent given", value: formatDateTime(lead.consentAt) },
              { label: "Other leads, same email", value: lead.related?.sameEmail ?? 0 },
            ]}
          />
        </div>
        {lead.subject && lead.catalog?.title ? <p className="adm-muted">{lead.subject}</p> : null}
        {lead.message ? <div className="adm-message">{lead.message}</div> : <p className="adm-muted">No message was left.</p>}
      </div>

      <div className="adm-section">
        <Tabs idPrefix="adm-lead" label="Lead history" value={tab} onChange={setTab} tabs={[{ id: "timeline", label: "Timeline", badge: lead.timeline?.length }, { id: "notes", label: "Notes", badge: lead.notes?.length || undefined }]} />
        <TabPanel id="timeline" value={tab} idPrefix="adm-lead"><Timeline items={timelineItems(lead)} /></TabPanel>
        <TabPanel id="notes" value={tab} idPrefix="adm-lead">
          <div className="adm-stack">
            {canWrite ? (
              <form
                className="adm-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  run("note", () => api.post(`${base}/notes`, { text: note.trim() }), "Note added").then(() => setNote(""));
                }}
              >
                <TextArea label="Internal note" rows={3} maxLength={2000} value={note} onChange={setNote} hint="Only staff can see notes." />
                <div><Button variant="primary" size="sm" type="submit" disabled={!note.trim()} loading={busy === "note"}>Add note</Button></div>
              </form>
            ) : null}
            <div className="adm-notes">
              {(lead.notes || []).slice().reverse().map((n) => (
                <div key={n.id} className="adm-note"><p>{n.text}</p><small>{n.authorName} - {formatDateTime(n.at)}</small></div>
              ))}
              {!lead.notes?.length ? <p className="adm-muted">No notes yet.</p> : null}
            </div>
          </div>
        </TabPanel>
      </div>
    </>
  );
}

