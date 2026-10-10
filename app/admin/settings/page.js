"use client";

import { useCallback, useMemo, useState } from "react";
import { useAdminApi } from "../_lib/adminApi";
import { useAdminMe } from "../_lib/AdminMeProvider";
import { useAdminQuery } from "../_lib/useAdminQuery";
import { formatDateTime, humanize } from "../_lib/format";
import {
  Button, Card, ErrorState, IconButton, PageHeader, RequirePermission, Skeleton, Switch, TabPanel, Tabs, TextArea, TextField,
  useToast, useUrlParams,
} from "../_kit";
import TaxSettingsTab from "./_tax/TaxSettingsTab";

const GROUPS = [
  { id: "general", label: "General" },
  { id: "commerce", label: "Commerce" },
  { id: "notifications", label: "Notifications" },
  { id: "homepage", label: "Homepage" },
  { id: "support", label: "Support" },
];
const TAX_TAB = { id: "tax", label: "Tax & invoicing" };
const META_KEYS = ["group", "updatedAt", "updatedBy", "_id", "id", "__v", "createdAt"];
// Mirrors the API whitelist (settings.dto.ts); templates with any other {{placeholder}} are rejected there.
const PLACEHOLDERS = ["bookingRef", "customerName", "serviceName", "travelDate", "totalAmount", "voucherUrl", "cancellationReason", "siteName", "supportEmail"];
const TEMPLATES = [
  { key: "bookingConfirmation", label: "Booking confirmation" },
  { key: "voucher", label: "Voucher" },
  { key: "cancellation", label: "Cancellation" },
];
const SOCIAL_LABELS = { facebook: "Facebook", instagram: "Instagram", x: "X", youtube: "YouTube", linkedin: "LinkedIn", tiktok: "TikTok", whatsapp: "WhatsApp" };
const SOCIALS = ["facebook", "instagram", "x", "youtube", "linkedin", "tiktok", "whatsapp"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function normalize(res) {
  const base = res && typeof res === "object" ? res.values || res.data || res.settings || res : {};
  const values = {};
  Object.keys(base).forEach((k) => { if (!META_KEYS.includes(k)) values[k] = base[k]; });
  return { values, updatedAt: res?.updatedAt, updatedBy: res?.updatedBy, isDefault: res?.isDefault, placeholders: res?.placeholders };
}

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
function range(errors, key, v, { min, max, int, label }) {
  const n = num(v);
  if (n === null || Number.isNaN(n)) errors[key] = `${label} is required.`;
  else if (int && !Number.isInteger(n)) errors[key] = `${label} must be a whole number.`;
  else if (n < min || n > max) errors[key] = `${label} must be between ${min} and ${max}.`;
}

function validate(group, v) {
  const e = {};
  if (group === "general") {
    if (!String(v.siteName || "").trim()) e.siteName = "Site name is required.";
    if (!EMAIL_RE.test(v.supportEmail || "")) e.supportEmail = "Enter a valid support email address.";
    if (v.supportPhone && !/^[+0-9()\-\s]{6,24}$/.test(v.supportPhone)) e.supportPhone = "Use digits, spaces, + ( ) or -.";
    if (v.legalName && String(v.legalName).length > 120) e.legalName = "Keep the legal name under 120 characters.";
    if (v.taxNumber && !/^[A-Za-z0-9][A-Za-z0-9 -/.]{3,29}$/.test(v.taxNumber)) e.taxNumber = "Use 4-30 letters, digits, spaces or - / .";
    SOCIALS.forEach((s) => {
      const url = v.socials?.[s];
      if (url && !/^https?:\/\/\S+\.\S+/.test(url)) e[`socials.${s}`] = "Enter a full URL starting with https://";
    });
  }
  if (group === "commerce") {
    range(e, "taxPercent", v.taxPercent, { min: 0, max: 30, label: "Tax percent" });
    range(e, "holdMinutes", v.holdMinutes, { min: 1, max: 120, int: true, label: "Hold minutes" });
    range(e, "fxMarkupPercent", v.fxMarkupPercent, { min: 0, max: 10, label: "FX markup percent" });
    range(e, "bookingCutoffHours", v.bookingCutoffHours, { min: 0, max: 720, int: true, label: "Booking cutoff hours" });
  }
  if (group === "support") {
    range(e, "firstResponseHours", v.firstResponseHours, { min: 1, max: 168, int: true, label: "First response target" });
    range(e, "resolutionHours", v.resolutionHours, { min: 1, max: 2160, int: true, label: "Resolution target" });
  }
  if (group === "notifications") {
    if (!String(v.senderName || "").trim()) e.senderName = "Sender name is required.";
    TEMPLATES.forEach(({ key }) => {
      const t = v.templates?.[key] || {};
      ["subject", "body"].forEach((field) => {
        const value = String(t[field] || "");
        const max = field === "subject" ? 150 : 5000;
        const bad = [...value.matchAll(/{{([^{}]*)}}/g)].map((m) => m[1].trim()).filter((n) => !PLACEHOLDERS.includes(n));
        const path = `templates.${key}.${field}`;
        if (!value.trim()) e[path] = `${humanize(field)} is required.`;
        else if (value.length > max) e[path] = `${humanize(field)} must be at most ${max} characters.`;
        else if (bad.length) e[path] = `Unknown placeholder: ${bad.map((n) => `{{${n}}}`).join(", ")}`;
        else if (/{{|}}/.test(value.replace(/{{[^{}]*}}/g, ""))) e[path] = "Unbalanced {{ }} braces.";
      });
    });
  }
  return e;
}

function Section({ title, description, children }) {
  return (
    <section className="adm-settings-section">
      <div>
        <h3 className="adm-card__title">{title}</h3>
        {description ? <p className="adm-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function GroupForm({ group, canWrite }) {
  const api = useAdminApi();
  const toast = useToast();
  const { data, error, loading, reload } = useAdminQuery(`/admin/settings/${group}`);
  const loaded = useMemo(() => (data ? normalize(data) : null), [data]);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(null);

  // New server data replaces the draft (adjusting state during render instead of in an effect).
  const [seen, setSeen] = useState(null);
  if (loaded && loaded !== seen) {
    setSeen(loaded);
    setDraft(clone(loaded.values));
    setSaved(clone(loaded.values));
    setErrors({});
  }

  const set = useCallback((path, value) => {
    setDraft((d) => {
      const next = clone(d);
      const keys = path.split(".");
      let o = next;
      keys.slice(0, -1).forEach((k) => { o[k] = o[k] && typeof o[k] === "object" ? o[k] : {}; o = o[k]; });
      o[keys[keys.length - 1]] = value;
      return next;
    });
    setErrors((e) => (e[path] ? { ...e, [path]: undefined } : e));
  }, []);

  if (error && !data) return <ErrorState title="Could not load these settings" description={error.message} onRetry={reload} />;
  if (loading && !draft) return <Card><div className="adm-stack">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={38} />)}</div></Card>;
  if (!draft) return null;

  const dirty = !same(draft, saved);
  const err = (p) => errors[p];
  const ro = !canWrite;
  const text = (path, label, extra = {}) => <TextField label={label} value={path.split(".").reduce((o, k) => o?.[k], draft) ?? ""} onChange={(v) => set(path, v)} error={err(path)} disabled={ro} {...extra} />;
  const number = (path, label, extra = {}) => <TextField label={label} inputMode="decimal" className="adm-field" value={draft[path] ?? ""} onChange={(v) => set(path, v === "" ? "" : v.replace(/[^0-9.]/g, ""))} error={err(path)} disabled={ro} {...extra} />;

  async function save(event) {
    event.preventDefault();
    const payload = clone(draft);
    if (group === "commerce") ["taxPercent", "holdMinutes", "fxMarkupPercent", "bookingCutoffHours"].forEach((k) => { payload[k] = num(payload[k]); });
    if (group === "support") ["firstResponseHours", "resolutionHours"].forEach((k) => { payload[k] = num(payload[k]); });
    const found = validate(group, group === "commerce" || group === "support" ? payload : draft);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    setApiError("");
    try {
      const res = await api.put(`/admin/settings/${group}`, payload);
      const next = normalize(res);
      const values = Object.keys(next.values).length ? next.values : payload;
      setDraft(clone(values));
      setSaved(clone(values));
      toast.success(`${GROUPS.find((g) => g.id === group).label} settings saved`);
    } catch (e) {
      setApiError(e.message);
      toast.error(e.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const placeholders = loaded?.placeholders?.length ? loaded.placeholders : PLACEHOLDERS;
  const sections = Array.isArray(draft.sections) ? draft.sections : [];
  const move = (i, d) => {
    const next = [...sections];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("sections", next);
  };

  return (
    <form onSubmit={save} noValidate>
      <Card>
        {group === "general" ? (
          <>
            <Section title="Identity" description="Shown in the site footer, emails and the public contact page.">
              <div className="adm-form-grid">
                {text("siteName", "Site name", { required: true })}
                {text("supportEmail", "Support email", { type: "email", required: true })}
                {text("supportPhone", "Support phone")}
                <div className="is-wide">{text("address", "Address")}</div>
              </div>
            </Section>
            <Section title="Invoices" description="Company details printed on invoices and credit notes. Documents keep the details they were issued with.">
              <div className="adm-form-grid">
                {text("legalName", "Legal name", { placeholder: "Registered company name" })}
                {text("taxNumber", "TRN / VAT number", { placeholder: "15-digit tax registration number" })}
              </div>
            </Section>
            <Section title="Social links" description="Full URLs. Leave empty to hide an icon.">
              <div className="adm-form-grid">{SOCIALS.map((s) => <div key={s}>{text(`socials.${s}`, SOCIAL_LABELS[s], { placeholder: "https://" })}</div>)}</div>
            </Section>
          </>
        ) : null}

        {group === "commerce" ? (
          <Section title="Checkout and pricing" description="Changes apply within about a minute, without a redeploy. Environment values stay as the defaults.">
            <div className="adm-form-grid">
              {number("taxPercent", "Tax percent", { suffix: "%", hint: "Added to the booking subtotal at checkout." })}
              {number("holdMinutes", "Cart hold", { suffix: "min", hint: "How long inventory is held during checkout." })}
              {number("fxMarkupPercent", "FX markup", { suffix: "%", hint: "Margin added to the currency conversion rates." })}
              {number("bookingCutoffHours", "Booking cutoff", { suffix: "hours", hint: "Stop selling this long before the activity starts." })}
            </div>
          </Section>
        ) : null}

        {group === "support" ? (
          <Section title="Support ticket SLA" description="Targets for the support queue. The clock starts when a ticket is created; a ticket is flagged once a target passes without a reply or resolution.">
            <div className="adm-form-grid">
              {number("firstResponseHours", "First response target", { suffix: "hours", hint: "Time to the first public reply from staff." })}
              {number("resolutionHours", "Resolution target", { suffix: "hours", hint: "Time to a resolved or closed ticket." })}
            </div>
          </Section>
        ) : null}

        {group === "notifications" ? (
          <>
            <Section title="Sender">{<div className="adm-form-grid">{text("senderName", "Sender name", { required: true })}</div>}</Section>
            <p className="adm-muted" style={{ marginTop: "var(--adm-s4)" }}>
              Placeholders you can use: {placeholders.map((p) => <code key={p} className="adm-code" style={{ marginRight: 4 }}>{`{{${p}}}`}</code>)}
            </p>
            {TEMPLATES.map(({ key, label }) => (
              <Section key={key} title={label}>
                {text(`templates.${key}.subject`, "Subject", { required: true })}
                <TextArea label="Body" rows={6} required value={draft.templates?.[key]?.body ?? ""} onChange={(v) => set(`templates.${key}.body`, v)} error={err(`templates.${key}.body`)} disabled={ro} />
              </Section>
            ))}
          </>
        ) : null}

        {group === "homepage" ? (
          <Section title="Homepage sections" description="Turn sections on or off and set the order they appear in.">
            {sections.length === 0 ? <p className="adm-muted">No homepage sections are configured yet (the API default is an empty list).</p> : (
              <ul className="adm-stack" style={{ gap: 0 }}>
                {sections.map((s, i) => (
                  <li key={s.id || s.key || i} className="adm-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--adm-line)", justifyContent: "space-between", flexWrap: "nowrap" }}>
                    <Switch label={s.label || humanize(s.id || s.key)} checked={s.enabled !== false} disabled={ro} onChange={(v) => set("sections", sections.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} />
                    <div className="adm-row" style={{ flexWrap: "nowrap" }}>
                      <IconButton icon="chevronUp" label={`Move ${s.label || s.id || s.key} up`} disabled={ro || i === 0} onClick={() => move(i, -1)} />
                      <IconButton icon="chevronDown" label={`Move ${s.label || s.id || s.key} down`} disabled={ro || i === sections.length - 1} onClick={() => move(i, 1)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ) : null}

        {apiError ? <p className="adm-inline-error" role="alert" style={{ marginTop: "var(--adm-s4)" }}>{apiError}</p> : null}

        <div className="adm-settings-bar">
          <span className="adm-muted">
            {ro ? "You can view these settings but not change them." : dirty ? "You have unsaved changes." : loaded?.isDefault ? "Showing defaults; nothing saved yet." : loaded?.updatedAt ? `Last saved ${formatDateTime(loaded.updatedAt)}${loaded.updatedBy ? ` by ${typeof loaded.updatedBy === "string" ? loaded.updatedBy : loaded.updatedBy.email || loaded.updatedBy.name || ""}` : ""}` : "Using default values."}
          </span>
          {!ro ? (
            <div className="adm-row">
              <Button variant="ghost" onClick={() => { setDraft(clone(saved)); setErrors({}); setApiError(""); }} disabled={!dirty || saving}>Discard</Button>
              <Button variant="primary" type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
            </div>
          ) : null}
        </div>
      </Card>
    </form>
  );
}

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.read">
      <SettingsTabs />
    </RequirePermission>
  );
}

function SettingsTabs() {
  const { can } = useAdminMe();
  const [params, setParams] = useUrlParams();
  const tabs = can("tax.read") ? [...GROUPS, TAX_TAB] : GROUPS;
  const tab = tabs.some((g) => g.id === params.tab) ? params.tab : "general";
  return (
    <>
      <PageHeader title="Site settings" description="Business details, checkout rules, email templates, homepage layout and tax." />
      <Tabs idPrefix="adm-settings" label="Settings groups" value={tab} onChange={(t) => setParams({ tab: t })} tabs={tabs} />
      {tabs.map((g) => (
        <TabPanel key={g.id} idPrefix="adm-settings" id={g.id} value={tab}>
          {g.id === "tax" ? <TaxSettingsTab /> : <GroupForm key={g.id} group={g.id} canWrite={can("settings.write")} />}
        </TabPanel>
      ))}
    </>
  );
}
