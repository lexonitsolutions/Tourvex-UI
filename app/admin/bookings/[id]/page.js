"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { formatDateTime } from "../../_lib/format";
import {
  Button, Card, CopyButton, DateField, ErrorState, KeyValue, Modal, MoneyField, PageHeader, RequirePermission, Skeleton, TextArea, TextField, Timeline, useToast,
} from "../../_kit";
import { RadioGroup, RadioGroupItem } from "../../_ui/components/radio-group";
import { BookingStatusBadge, InvoiceBadge, PaymentBadge, PdfButton, QrSvg, VoucherBadge, formatDay, money, paxText } from "../../_ops/Ops";
import { bookingStock } from "../../inventory/_lib/stock";

export default function BookingDetailPage() {
  return (
    <RequirePermission permission="bookings.read">
      <Detail />
    </RequirePermission>
  );
}

const TONE = { success: "success", warning: "warning", danger: "danger", info: "info" };

function Detail() {
  const { id } = useParams();
  const { data: b, error, loading, reload } = useAdminQuery(`/admin/bookings/${id}`);
  if (error && !b) return <ErrorState title={error.status === 404 ? "Booking not found" : "Could not load this booking"} description={error.message} onRetry={error.status === 404 ? undefined : reload} />;
  if (!b) {
    return (
      <>
        <PageHeader title="Booking" />
        <div className="adm-ops-detail"><Card><Skeleton height={14} width="60%" /><br /><Skeleton height={14} width="40%" /><br /><Skeleton height={14} width="50%" /></Card><Card><Skeleton height={14} width="70%" /></Card></div>
      </>
    );
  }
  return <BookingView b={b} reload={reload} busy={loading} />;
}

function BookingView({ b, reload }) {
  const api = useAdminApi();
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // confirm | cancel | refund | date | reject | approve | void
  const x = b.booking;
  const a = b.actions;
  const paidAmount = b.total;
  const { can } = useAdminMe();
  const stock = bookingStock(b); // see inventory/_lib/stock.js: the backend field names are mapped there
  const canReturn = !!stock?.returnable && can("stock.write");

  async function resend() {
    try {
      await api.post(`/admin/bookings/${b.id}/resend-confirmation`);
      toast.success("Confirmation and voucher sent again");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const header = (
    <PageHeader
      title={b.reference}
      meta={<div className="adm-row"><BookingStatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} />{b.orderReference ? <Link className="adm-ops-link" href={`/admin/bookings/orders/${b.orderReference}`}>Order {b.orderReference}</Link> : null}</div>}
      description={`${b.title}${b.optionName ? ` · ${b.optionName}` : ""}`}
      actions={
        <div className="adm-ops-actions">
          {a.confirm ? <Button variant="primary" icon="check" onClick={() => setDialog("confirm")}>Confirm</Button> : null}
          {a.resend ? <Button icon="refresh" onClick={resend}>Resend confirmation</Button> : null}
          {a.editDate ? <Button icon="calendar" onClick={() => setDialog("date")}>Change date</Button> : null}
          {a.refund ? <Button icon="receipt" onClick={() => setDialog("refund")}>Refund</Button> : null}
          {a.cancel ? <Button variant="danger" icon="close" onClick={() => setDialog("cancel")}>Cancel booking</Button> : null}
          {canReturn ? <Button icon="undo" onClick={() => setDialog("stock")}>Return to stock</Button> : null}
        </div>
      }
    />
  );

  return (
    <>
      {header}
      {a.approveCancellation || a.rejectCancellation ? (
        <div className="adm-ops-banner is-warning" role="status">
          <div className="adm-ops-banner__text">
            <b>The customer asked to cancel this booking.</b>
            <div className="adm-muted">
              {b.cancellationPolicyResult.eligible
                ? `Free-cancellation window still open: the policy refunds ${money(b.cancellationPolicyResult.refundAmount)}.`
                : `Policy refund: ${money(0)}. ${b.cancellationPolicyResult.reason}.`}
              {" "}Requested {formatDateTime(x.cancellationRequestedAt)}.
            </div>
          </div>
          <div className="adm-ops-actions">
            {a.approveCancellation ? <Button variant="primary" onClick={() => setDialog("approve")}>Approve cancellation</Button> : null}
            {a.rejectCancellation ? <Button onClick={() => setDialog("reject")}>Reject</Button> : null}
          </div>
        </div>
      ) : null}

      <div className="adm-ops-detail">
        <div className="adm-ops-col">
          <Card title="Trip">
            <KeyValue
              columns={2}
              items={[
                { label: "Service", value: b.title },
                { label: "Option", value: b.optionName },
                { label: "Service date", value: `${formatDay(b.serviceDay)}${b.startTime ? ` · ${b.startTime}` : ""}` },
                { label: "Travellers", value: paxText(b.adults, b.children) },
                { label: "Transfer", value: x.transferType },
                { label: "Location", value: x.activityLocation },
                { label: "Pick-up", value: x.pickup ? (x.pickup.mode === "now" ? [x.pickup.locationName, x.pickup.address].filter(Boolean).join(", ") : "To be confirmed (customer adds later)") : x.pickupRequired ? "Required, not provided" : "Not required" },
                { label: "Hotel", value: x.additional?.hotelName },
                { label: "Arrival flight", value: x.additional?.arrivalFlight },
                { label: "Lead travellers", value: x.additional?.leadTravellerNames?.join(", ") },
                { label: "Special requests", value: x.additional?.specialRequests },
              ]}
            />
          </Card>

          <Card title="Customer">
            <KeyValue
              columns={2}
              items={[
                { label: "Name", value: b.customer.fullName || b.customer.accountName },
                { label: "Email", value: b.customer.email || b.customer.accountEmail },
                { label: "Phone", value: b.customer.phone ? `${b.customer.phoneCountryCode || ""} ${b.customer.phone}` : null },
                { label: "Nationality", value: b.customer.nationality },
                { label: "Account", value: b.customer.accountEmail && b.customer.accountEmail !== b.customer.email ? b.customer.accountEmail : null },
              ]}
            />
          </Card>

          <Card title="Price breakdown">
            <table className="adm-ops-pricetable">
              <tbody>
                {(x.priceLines.length ? x.priceLines : [{ label: `${x.quantity} x ${b.title}`, total: { amount: x.subtotal } }]).map((l, i) => (
                  <tr key={i}><td>{l.label}</td><td>{money(l.total?.amount ?? x.subtotal, b.currency)}</td></tr>
                ))}
                {x.discount > 0 ? <tr><td>Discount{x.promoCode ? <> (promo <span className="adm-code">{x.promoCode}</span>)</> : null}</td><td className="adm-ops-neg">-{money(x.discount, b.currency)}</td></tr> : null}
                <tr><td>Taxes &amp; fees</td><td>{money(x.tax, b.currency)}</td></tr>
              </tbody>
              <tfoot>
                <tr><th scope="row">Total paid</th><td>{money(paidAmount, b.currency)}</td></tr>
                {b.refundedAmount > 0 ? <tr><td>Refunded</td><td className="adm-ops-neg">-{money(b.refundedAmount, b.currency)}</td></tr> : null}
              </tfoot>
            </table>
            <p className="adm-muted" style={{ marginTop: 10 }}>{x.cancellationPolicy}{x.freeCancellationUntil ? ` Free cancellation until ${formatDateTime(x.freeCancellationUntil)} (UAE time).` : ""}</p>
          </Card>

          <Card title="Timeline">
            <Timeline
              items={b.timeline.map((t) => ({
                id: t.id,
                title: t.title,
                body: t.detail,
                tone: TONE[t.tone],
                meta: `${formatDateTime(t.at)}${t.actor ? ` · ${t.actor}` : ""}`,
              }))}
            />
          </Card>

          <Notes b={b} onAdded={reload} />
        </div>

        <div className="adm-ops-col">
          <Card title="Payment">
            <KeyValue
              items={[
                { label: "Status", value: <PaymentBadge status={b.paymentStatus} /> },
                { label: "Paid on", value: b.confirmedAt ? formatDateTime(b.confirmedAt) : "Not paid" },
                { label: "Method", value: x.paymentMode === "mock" ? "Simulated (mock mode)" : x.paymentMode === "stripe" ? "Card (Stripe)" : x.paymentMode },
                { label: "Reference", value: x.paymentReference ? <span>{x.paymentReference} <CopyButton value={x.paymentReference} label="Copy payment reference" /></span> : null },
                { label: "Refundable now", value: b.refundable.remaining > 0 && b.confirmedAt ? money(b.refundable.remaining, b.currency) : "-" },
              ]}
            />
            {b.refunds.length ? (
              <>
                <h4 style={{ margin: "14px 0 6px" }}>Refunds</h4>
                <ul className="adm-notes" style={{ display: "grid", gap: 8 }}>
                  {b.refunds.map((r) => (
                    <li key={r.id} className="adm-ops-note">
                      <b>{money(r.amount, r.currency)}</b> <span className="adm-ops-pill">{r.status}{r.mode !== "stripe" ? ` · ${r.mode}` : ""}</span>
                      <p>{r.reason}</p>
                      <small>{formatDateTime(r.createdAt)}{r.creditNoteNumber ? ` · ${r.creditNoteNumber}` : ""}</small>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>

          <VoucherCard b={b} reload={reload} onVoid={() => setDialog("void")} />
          {stock ? <StockCard stock={stock} canReturn={canReturn} onReturn={() => setDialog("stock")} /> : null}

          <Card title="Invoice">
            {b.invoice ? (
              <div className="adm-stack">
                <KeyValue items={[{ label: "Number", value: b.invoice.invoiceNumber }, { label: "Status", value: <InvoiceBadge status={b.invoice.status} /> }, { label: "Issued", value: formatDateTime(b.invoice.issuedAt) }]} />
                <PdfButton path={`/admin/invoices/${b.invoice.id}/pdf`} filename={`${b.invoice.invoiceNumber}.pdf`} />
                {b.creditNotes.map((c) => (
                  <div key={c.id} className="adm-row">
                    <span>{c.invoiceNumber} <small className="adm-muted">({money(c.total, c.currency)})</small></span>
                    <PdfButton size="sm" variant="ghost" path={`/admin/invoices/${c.id}/pdf`} filename={`${c.invoiceNumber}.pdf`}>PDF</PdfButton>
                  </div>
                ))}
              </div>
            ) : <p className="adm-muted">{b.confirmedAt ? "No invoice has been generated for this booking yet." : "An invoice is created once the booking is paid."}</p>}
          </Card>
        </div>
      </div>

      {dialog === "confirm" ? <ConfirmDialog2 b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "cancel" ? <CancelDialog b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "approve" ? <CancelDialog b={b} approving onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "reject" ? <RejectDialog b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "refund" ? <RefundDialog b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "date" ? <DateDialog b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "void" ? <VoidDialog b={b} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "stock" ? <ReturnStockDialog b={b} stock={stock} onClose={() => setDialog(null)} onDone={reload} /> : null}
    </>
  );
}

function Notes({ b, onAdded }) {
  const api = useAdminApi();
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/admin/bookings/${b.id}/notes`, { text: text.trim() });
      setText("");
      toast.success("Note added");
      onAdded();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Internal notes">
      <div className="adm-ops-notes">
        {b.notes.length ? b.notes.slice().reverse().map((n) => (
          <div key={n.id} className="adm-ops-note"><p>{n.text}</p><small>{n.authorName} · {formatDateTime(n.at)}</small></div>
        )) : <p className="adm-muted">No notes yet. Notes are only visible to staff.</p>}
        {b.actions.note ? (
          <form onSubmit={add} className="adm-stack">
            <TextArea label="Add a note" value={text} onChange={setText} rows={3} maxLength={2000} />
            <div><Button type="submit" variant="primary" loading={busy} disabled={!text.trim()}>Add note</Button></div>
          </form>
        ) : null}
      </div>
    </Card>
  );
}

function VoucherCard({ b, reload, onVoid }) {
  const api = useAdminApi();
  const toast = useToast();
  const { can } = useAdminMe();
  const v = b.voucher;
  async function resend() {
    try {
      await api.post(`/admin/vouchers/${v.id}/resend`);
      toast.success("Voucher sent again");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  }
  return (
    <Card title="Voucher">
      {v ? (
        <div className="adm-stack">
          <div className="adm-ops-qrbox">
            <QrSvg qr={v.qr} className={v.status === "issued" ? "" : "is-dim"} label={`QR code of voucher ${v.displayCode}`} />
            <div className="adm-stack" style={{ gap: 6 }}>
              <span className="adm-ops-code">{v.displayCode}</span>
              <VoucherBadge status={v.status} />
              {v.redeemedAt ? <span className="adm-muted">Redeemed {formatDateTime(v.redeemedAt)}{v.redeemedByName ? ` by ${v.redeemedByName}` : ""}</span> : null}
              {v.voidReason ? <span className="adm-muted">Void: {v.voidReason}</span> : null}
            </div>
          </div>
          {can("vouchers.write") && v.status === "issued" ? (
            <div className="adm-ops-actions"><Button size="sm" icon="refresh" onClick={resend}>Resend</Button><Button size="sm" variant="ghost" onClick={onVoid}>Void voucher</Button></div>
          ) : null}
        </div>
      ) : <p className="adm-muted">{b.status === "confirmed" ? "No voucher was issued for this booking." : "A voucher is issued when the booking is confirmed."}</p>}
    </Card>
  );
}

/** Shared modal body: submit handler with busy + inline error. */
function useSubmit(onDone, onClose, success) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      const result = await fn();
      if (result?.refundError) toast.error(`Cancelled, but the refund failed: ${result.refundError}. Refund it from the booking page.`);
      else toast.success(success);
      onClose();
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

function Footer({ onClose, busy, label, tone = "primary", formId, disabled }) {
  return (
    <>
      <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
      <Button variant={tone} type="submit" form={formId} loading={busy} disabled={disabled}>{label}</Button>
    </>
  );
}

function ConfirmDialog2({ b, onClose, onDone }) {
  const api = useAdminApi();
  const [ref, setRef] = useState("");
  const { busy, error, run } = useSubmit(onDone, onClose, "Booking confirmed");
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Confirm booking" description="Use this when the customer paid outside the website (bank transfer, cash). A card payment confirms by itself." footer={<Footer onClose={onClose} busy={busy} label="Confirm booking" formId="ops-confirm" disabled={ref.trim().length < 3} />}>
      <form id="ops-confirm" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/admin/bookings/${b.id}/confirm`, { paymentReference: ref.trim() })); }}>
        <TextField label="Payment reference" required value={ref} onChange={setRef} hint="For example the bank transfer reference or receipt number." data-autofocus />
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

function CancelDialog({ b, approving = false, onClose, onDone }) {
  const api = useAdminApi();
  const { can } = useAdminMe();
  const canRefund = can("bookings.refund") && b.confirmedAt;
  const policy = b.cancellationPolicyResult;
  const [reason, setReason] = useState(approving ? "Cancellation requested by the customer" : "");
  const [refund, setRefund] = useState(canRefund && policy.refundAmount > 0 ? "policy" : "none");
  const [amount, setAmount] = useState(null);
  const { busy, error, run } = useSubmit(onDone, onClose, approving ? "Cancellation approved" : "Booking cancelled");
  const remaining = b.refundable.remaining;
  const options = [
    { value: "policy", label: `Refund by policy: ${money(policy.refundAmount)}`, hint: policy.reason, disabled: !canRefund },
    { value: "full", label: `Refund in full: ${money(remaining)}`, hint: "Ignore the policy and return everything still refundable.", disabled: !canRefund || remaining <= 0 },
    { value: "custom", label: "Refund a custom amount", hint: "Choose the amount below.", disabled: !canRefund || remaining <= 0 },
    { value: "none", label: "No refund now", hint: b.confirmedAt ? "Finance can refund it later from this page." : "Nothing was paid for this booking.", disabled: false },
  ];
  const customInvalid = refund === "custom" && !(amount > 0 && amount <= remaining);
  function submit(e) {
    e.preventDefault();
    const body = { reason: reason.trim(), ...(b.confirmedAt ? { refund, ...(refund === "custom" ? { refundAmount: amount } : {}) } : { refund: "none" }) };
    run(() => (approving ? api.post(`/admin/bookings/${b.id}/cancellation/approve`, { refund: body.refund, refundAmount: body.refundAmount, note: reason.trim() }) : api.post(`/admin/bookings/${b.id}/cancel`, body)));
  }
  return (
    <Modal open onClose={busy ? undefined : onClose} title={approving ? "Approve cancellation" : "Cancel booking"} description={`${b.reference} · ${b.title}. The voucher is voided and the seats are released.`} footer={<Footer onClose={onClose} busy={busy} tone="danger" label={approving ? "Approve and cancel" : "Cancel booking"} formId="ops-cancel" disabled={!reason.trim() || customInvalid} />}>
      <form id="ops-cancel" className="adm-stack" onSubmit={submit}>
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} data-autofocus />
        {b.confirmedAt ? (
          <div className="adm-stack" style={{ gap: 6 }}>
            <span className="adm-field__label" id="ops-refund-label">Refund</span>
            <RadioGroup value={refund} onValueChange={setRefund} aria-labelledby="ops-refund-label" className="adm-ops-choice">
              {options.map((o) => (
                <label key={o.value} style={o.disabled ? { opacity: 0.5 } : undefined}>
                  <RadioGroupItem value={o.value} disabled={o.disabled} className="tw:mt-0.5" />
                  <span>{o.label}<small>{o.hint}</small></span>
                </label>
              ))}
            </RadioGroup>
            {!canRefund ? <small className="adm-muted">Refunds need the finance permission; cancel now and finance can refund afterwards.</small> : null}
          </div>
        ) : null}
        {refund === "custom" ? <MoneyField label="Refund amount" value={amount} onChange={setAmount} error={customInvalid && amount != null ? `Between 0.01 and ${remaining.toFixed(2)}` : undefined} /> : null}
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

function RejectDialog({ b, onClose, onDone }) {
  const api = useAdminApi();
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit(onDone, onClose, "Cancellation request rejected");
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Reject cancellation request" description="The booking goes back to confirmed and keeps its voucher." footer={<Footer onClose={onClose} busy={busy} label="Reject request" formId="ops-reject" disabled={!reason.trim()} />}>
      <form id="ops-reject" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/admin/bookings/${b.id}/cancellation/reject`, { reason: reason.trim() })); }}>
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} data-autofocus />
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

function RefundDialog({ b, onClose, onDone }) {
  const api = useAdminApi();
  const remaining = b.refundable.remaining;
  const [amount, setAmount] = useState(remaining);
  const [reason, setReason] = useState("");
  const [key] = useState(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`));
  const { busy, error, run } = useSubmit(onDone, onClose, "Refund recorded");
  const invalid = !(amount > 0 && amount <= remaining + 1e-9);
  const simulated = b.booking.paymentMode === "mock";
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Refund booking" description={`${money(remaining, b.currency)} of ${money(b.total, b.currency)} can still be refunded. A credit note is created automatically.`} footer={<Footer onClose={onClose} busy={busy} label="Refund" formId="ops-refund" disabled={invalid || !reason.trim()} />}>
      <form id="ops-refund" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/admin/bookings/${b.id}/refund`, { amount, reason: reason.trim(), idempotencyKey: key })); }}>
        <MoneyField label="Amount" required value={amount} onChange={setAmount} error={invalid && amount != null ? `Between 0.01 and ${remaining.toFixed(2)}` : undefined} data-autofocus />
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} />
        <p className="adm-muted">{simulated ? "This payment was made in mock mode, so the refund is simulated (no money moves)." : b.booking.paymentMode === "stripe" ? "The refund is sent to the customer's card through Stripe." : "This payment was recorded manually, so the refund is only recorded here; return the money yourself."}</p>
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

function DateDialog({ b, onClose, onDone }) {
  const api = useAdminApi();
  const [date, setDate] = useState(b.serviceDay || "");
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit(onDone, onClose, "Service date changed");
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Change service date" description="Availability, group size and the booking cut-off are checked again for the new date. The price and the cancellation deadline stay as booked." footer={<Footer onClose={onClose} busy={busy} label="Move booking" formId="ops-date" disabled={!date || date === b.serviceDay || !reason.trim()} />}>
      <form id="ops-date" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.patch(`/admin/bookings/${b.id}/service-date`, { date, reason: reason.trim() })); }}>
        <DateField label="New date" required value={date} onChange={setDate} hint={`Currently ${formatDay(b.serviceDay)}`} data-autofocus />
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} />
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

function VoidDialog({ b, onClose, onDone }) {
  const api = useAdminApi();
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit(onDone, onClose, "Voucher voided");
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Void voucher" description="The QR code stops working immediately. This cannot be undone." footer={<Footer onClose={onClose} busy={busy} tone="danger" label="Void voucher" formId="ops-void" disabled={!reason.trim()} />}>
      <form id="ops-void" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/admin/vouchers/${b.voucher.id}/void`, { reason: reason.trim() })); }}>
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} data-autofocus />
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}

const STOCK_STATE = { held: "Held while the customer pays", used: "Units used", returned: "Returned to stock", kept: "Units kept (not returned)" };

/** Stock state of the booking: units held / used / returned, and the manual return when the cut-off has passed. */
function StockCard({ stock, canReturn, onReturn }) {
  const items = [
    { label: "State", value: stock.state ? (STOCK_STATE[stock.state] || stock.state) : stock.released === true ? "Released" : stock.released === false ? "Units in use" : null },
    { label: "Held", value: stock.held },
    { label: "Used", value: stock.used },
    { label: "Returned to stock", value: stock.returned },
  ];
  return (
    <Card title="Stock">
      <div className="adm-stack">
        <KeyValue items={items} />
        {stock.returnable ? <p className="adm-muted">The cut-off has passed, so these units were kept. {canReturn ? "You can return them to stock manually." : "Someone with the stock write permission can return them."}</p> : null}
        {canReturn ? <div><Button size="sm" icon="undo" onClick={onReturn}>Return to stock</Button></div> : null}
      </div>
    </Card>
  );
}

function ReturnStockDialog({ b, stock, onClose, onDone }) {
  const api = useAdminApi();
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit(onDone, onClose, "Units returned to stock");
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Return to stock" description={`${b.reference} was cancelled after the free-cancellation cut-off, so its units were kept. This makes ${stock?.used ? `${stock.used} unit${stock.used === 1 ? "" : "s"}` : "them"} available for sale again on ${formatDay(b.serviceDay)}.`} footer={<Footer onClose={onClose} busy={busy} label="Return to stock" formId="ops-stock" disabled={reason.trim().length < 3} />}>
      <form id="ops-stock" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/admin/stock/bookings/${b.id}/return-to-stock`, { reason: reason.trim() })); }}>
        <TextArea label="Reason" required value={reason} onChange={setReason} rows={2} maxLength={300} hint="Saved in the stock ledger." data-autofocus />
        {error ? <p className="adm-inline-error" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}
