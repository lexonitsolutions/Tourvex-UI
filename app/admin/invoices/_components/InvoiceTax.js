"use client";

import "../../settings/_tax/tax.css";
import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { formatDateTime } from "../../_lib/format";
import { Button, Card, KeyValue, Modal, StatusBadge, TextField, useToast } from "../../_kit";
import { money } from "../../_ops/Ops";
import { EMAIL_RE, EMAIL_STATUS, MODEL_LABEL, fmtPercent, taxErrorText } from "../../settings/_tax/taxLib";

/* Everything here is guarded: legacy invoices have none of the Phase 2 fields (title, tax, buyer, email, expanded seller) and render as before. */

export function EmailStatusBadge({ status }) {
  if (!status) return <span className="adm-muted">-</span>;
  const e = EMAIL_STATUS[status] || { label: status, tone: "neutral" };
  return <StatusBadge tone={e.tone}>{e.label}</StatusBadge>;
}

/** Phase 2 breakdown object (`taxInfo`); the legacy numeric `tax` (total tax amount) is untouched. */
const taxOf = (inv) => (inv.taxInfo && typeof inv.taxInfo === "object" ? inv.taxInfo : null);

const placeText = (p) => (p && typeof p === "object" ? [p.state ? `${p.state}${p.stateCode ? ` (${p.stateCode})` : ""}` : null, p.country].filter(Boolean).join(", ") : typeof p === "string" ? p : "");

/** Per-component tax table (rate, taxable amount, tax amount). Renders nothing for legacy invoices. */
export function TaxBreakdownCard({ inv, credit }) {
  const tax = taxOf(inv);
  const components = Array.isArray(tax?.components) ? tax.components : [];
  if (!components.length) return null;
  const sign = credit ? "-" : "";
  const total = components.reduce((n, c) => n + (Number(c.taxAmount) || 0), 0);
  return (
    <Card title={`${tax.taxName || "Tax"} breakdown`}>
      <div className="tx-brkwrap">
        <table className="tx-brk">
          <thead>
            <tr><th scope="col">Component</th><th scope="col">Rate</th><th scope="col">Taxable amount</th><th scope="col">Tax amount</th></tr>
          </thead>
          <tbody>
            {components.map((c, i) => (
              <tr key={`${c.code}-${i}`}>
                <td>{c.label || c.code}</td>
                <td>{c.percent !== undefined ? fmtPercent(c.percent) : "-"}</td>
                <td>{c.taxableAmount !== undefined ? `${sign}${money(c.taxableAmount, inv.currency)}` : "-"}</td>
                <td>{c.taxAmount !== undefined ? `${sign}${money(c.taxAmount, inv.currency)}` : "-"}</td>
              </tr>
            ))}
          </tbody>
          {components.length > 1 ? (
            <tfoot>
              <tr><th scope="row" colSpan={3}>Total {tax.taxName || "tax"}</th><td>{sign}{money(total, inv.currency)}</td></tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {tax.pricesIncludeTax ? <p className="adm-muted" style={{ marginTop: 10 }}>Listed prices included tax; the tax above was taken out of the total.</p> : null}
    </Card>
  );
}

/** Regime, place of supply, SAC / HSN and document title. Null for legacy invoices. */
export function TaxDetailsCard({ inv }) {
  const tax = taxOf(inv);
  if (!tax && !inv.title) return null;
  const sc = tax?.serviceCode;
  const rate = tax && (tax.rateCode || tax.percent !== undefined) ? [tax.rateCode, tax.percent !== undefined ? fmtPercent(tax.percent) : null].filter(Boolean).join(" · ") : null;
  return (
    <Card title="Tax details">
      <KeyValue
        items={[
          { label: "Document", value: [inv.title, inv.invoiceNumber].filter(Boolean).join(" ") },
          tax?.country ? { label: "Tax country", value: `${tax.country}${tax.taxName ? ` · ${tax.taxName}` : ""}${tax.model ? ` (${MODEL_LABEL[tax.model] || tax.model})` : ""}` } : null,
          rate ? { label: "Rate", value: rate } : null,
          tax?.placeOfSupply ? { label: "Place of supply", value: placeText(tax.placeOfSupply) || "-" } : null,
          sc?.value ? { label: sc.label || "SAC / HSN", value: sc.description ? `${sc.value} · ${sc.description}` : sc.value } : null,
          tax && tax.reverseCharge !== undefined ? { label: "Reverse charge", value: tax.reverseCharge ? "Yes" : "No" } : null,
        ].filter(Boolean)}
      />
    </Card>
  );
}

/** Rows of the "Billed to" card: the new buyer block when present, else exactly the legacy two rows. */
export function buyerItems(inv) {
  const b = inv.buyer;
  if (!b || typeof b !== "object") return [{ label: "Name", value: inv.customerName }, { label: "Email", value: inv.customerEmail }];
  const label = taxOf(inv)?.registrationLabel || inv.seller?.registrationLabel || "Registration no.";
  return [
    { label: "Name", value: b.name || inv.customerName },
    { label: "Email", value: b.email || inv.customerEmail },
    b.phone ? { label: "Phone", value: b.phone } : null,
    b.address ? { label: "Address", value: b.address } : null,
    b.country || b.state ? { label: "Country / state", value: [b.state ? `${b.state}${b.stateCode ? ` (${b.stateCode})` : ""}` : null, b.country].filter(Boolean).join(", ") } : null,
    b.registrationNumber ? { label, value: b.registrationNumber } : null,
  ].filter(Boolean);
}

/** Rows of the "Issued by" card: legacy rows, with the registration label / number and extras when the seller snapshot has them. */
export function sellerItems(inv) {
  const s = inv.seller;
  const number = s.registrationNumber || s.taxNumber;
  return [
    { label: "Company", value: s.legalName },
    { label: "Address", value: s.address },
    { label: s.registrationLabel || "TRN / VAT no.", value: number || "Not set" },
    s.country || s.state ? { label: "Country / state", value: [s.state ? `${s.state}${s.stateCode ? ` (${s.stateCode})` : ""}` : null, s.country].filter(Boolean).join(", ") } : null,
    { label: "Email", value: s.email },
    { label: "Phone", value: s.phone },
    s.bankDetails ? { label: "Bank details", value: typeof s.bankDetails === "string" ? s.bankDetails : JSON.stringify(s.bankDetails) } : null,
  ].filter(Boolean);
}
export const sellerHasNumber = (inv) => !!(inv.seller?.registrationNumber || inv.seller?.taxNumber);

/** Email delivery status with the "Email invoice" action. Shown only when the document carries the email block. */
export function EmailCard({ inv, onDone }) {
  const { can } = useAdminMe();
  const [open, setOpen] = useState(false);
  const email = inv.email;
  if (!email || typeof email !== "object") return null;
  const credit = inv.kind === "credit_note";
  const canSend = can("invoices.write");
  return (
    <Card title="Email delivery" actions={canSend ? <Button size="sm" icon="mail" onClick={() => setOpen(true)}>{credit ? "Email credit note" : "Email invoice"}</Button> : null}>
      <div className="tx-emailgrid">
        <KeyValue
          items={[
            { label: "Status", value: <EmailStatusBadge status={email.status} /> },
            { label: "Sent to", value: email.to },
            { label: "Last sent", value: email.lastSentAt ? formatDateTime(email.lastSentAt) : null },
            { label: "Attempts", value: email.attempts ?? 0 },
          ]}
        />
        {email.lastError ? <p className="tx-lasterror" role="status">Last error: {email.lastError}</p> : null}
        {email.status === "pending" ? <p className="adm-muted">Waiting to be sent. If email is not configured on the server, the invoice stays pending until it is.</p> : null}
      </div>
      {open ? <EmailDialog inv={inv} onClose={() => setOpen(false)} onDone={onDone} /> : null}
    </Card>
  );
}

/** POST /admin/invoices/:id/email { to } -> { sent, to, status, attempts }. 409 EMAIL_NOT_CONFIGURED is explained, nothing is lost. */
function EmailDialog({ inv, onClose, onDone }) {
  const api = useAdminApi();
  const toast = useToast();
  const credit = inv.kind === "credit_note";
  const [to, setTo] = useState(inv.buyer?.email || inv.customerEmail || inv.email?.to || "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!EMAIL_RE.test(to.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    setBusy(true);
    try {
      const res = await api.post(`/admin/invoices/${inv.id}/email`, { to: to.trim() });
      onDone?.();
      if (res?.sent === false) {
        setFailed(true);
        setError(`The email could not be delivered (attempt ${res.attempts ?? "?"}). The status was updated and the system retries automatically; you can also try again.`);
      } else {
        toast.success(`${credit ? "Credit note" : "Invoice"} emailed to ${res?.to || to.trim()}`);
        onClose();
      }
    } catch (e) {
      if (e.code === "EMAIL_NOT_CONFIGURED" || (e.status === 409 && /smtp|configured/i.test(e.message || ""))) setNotice(taxErrorText({ code: "EMAIL_NOT_CONFIGURED" }));
      else setError(e.status === 429 ? "Too many email requests. Wait a minute and try again." : taxErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={credit ? "Email credit note" : "Email invoice"}
      description={`${inv.invoiceNumber} is sent as a PDF attachment. Leave the buyer's address or type another one.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{failed || notice ? "Close" : "Cancel"}</Button>
          <Button variant="primary" type="submit" form="tx-email" icon="mail" loading={busy}>{failed ? "Try again" : "Send email"}</Button>
        </>
      }
    >
      <form id="tx-email" className="tx-form" onSubmit={submit} noValidate>
        <TextField label="Send to" type="email" required value={to} onChange={(v) => { setTo(v); setFieldError(""); }} error={fieldError} data-autofocus hint={inv.buyer?.email || inv.customerEmail ? "Defaults to the buyer's email." : undefined} />
        {notice ? <p className="tx-warn" role="alert">{notice}</p> : null}
        {error ? <p className="tx-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}
