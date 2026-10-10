"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { dayKey, formatDayKey } from "../../_lib/format";
import { Button, DateField, ErrorState, Modal, MoneyField, SelectField, Skeleton, StatusBadge, TextArea, TextField, useToast } from "../../_kit";
import { STATUS, STOCK_API, itemApiPath, num, parseCount, stockErrorText } from "../_lib/stock";
import TaxBuyerSection, { EMPTY_TAX_BUYER, taxBuyerPayload } from "../../settings/_tax/TaxBuyerSection";

// This dialog also renders on the leads pages, where inventory.css is not loaded: it only uses shared kit classes.

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "INR", "SAR"].map((c) => ({ value: c, label: c }));
const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card_offline", label: "Card (taken offline)" },
  { value: "other", label: "Other" },
];
const VARIANT_LABEL = { holiday: "Departure", cruise: "Cabin type", event: "Ticket type" };
export const CONFIRMABLE_SOURCES = ["holiday", "cruise", "event"];

/** Id of the enquiry document the API expects. Lead views may expose it as sourceId; the lead id is the fallback (see the report). */
const enquiryIdOf = (lead) => lead.sourceId || lead.enquiryId || lead.id;

/**
 * "Confirm booking" for a holiday / cruise / event enquiry: POST /admin/stock/enquiry-bookings. Shows the live availability of the
 * chosen variant and day (GET /admin/stock/items/:id?from=day&to=day) and the invoice number once created.
 */
export default function ConfirmBookingDialog({ lead, onClose, onDone }) {
  return lead ? <Inner lead={lead} onClose={onClose} onDone={onDone} /> : null;
}

function Inner({ lead, onClose, onDone }) {
  const api = useAdminApi();
  const toast = useToast();
  const slug = lead.catalog?.slug;
  const source = lead.source;
  const [today] = useState(() => dayKey());
  const variants = useAdminQuery(slug ? `${STOCK_API}/items` : null, { type: source, q: slug, limit: 100 }, { prefetchNext: false });
  const options = useMemo(() => (variants.data?.items || []).filter((i) => i.productRef === slug), [variants.data, slug]);

  const [form, setForm] = useState({
    variantId: "",
    serviceDay: lead.travelDate ? String(lead.travelDate).slice(0, 10) : "",
    adults: String(lead.adults ?? lead.pax ?? 1),
    children: String(lead.children ?? 0),
    amount: lead.valueAed ?? null,
    currency: "AED",
    paymentMode: "bank_transfer",
    paymentReference: "",
    note: "",
  });
  const [taxBuyer, setTaxBuyer] = useState(EMPTY_TAX_BUYER);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // a single variant (holidays: "default") is chosen for the staff member
  const variantId = form.variantId || (options.length === 1 ? options[0].variantId : "");
  const chosen = options.find((o) => o.variantId === variantId);
  const adults = parseCount(form.adults, { required: true, label: "Adults" });
  const children = parseCount(form.children, { label: "Children" });
  const quantity = (adults.value ?? 0) + (children.value ?? 0);

  const dayOk = /^\d{4}-\d{2}-\d{2}$/.test(form.serviceDay);
  const live = useAdminQuery(chosen && dayOk ? itemApiPath(chosen.id) : null, { from: form.serviceDay, to: form.serviceDay }, { prefetchNext: false });
  const day = (live.data?.days || []).find((d) => d.date === form.serviceDay) || null;
  const short = day && day.available !== null && day.available !== undefined && quantity > day.available;
  const unavailable = day && (day.status === "closed" || day.status === "sold_out");

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!variantId) next.variantId = `Choose the ${(VARIANT_LABEL[source] || "option").toLowerCase()}.`;
    if (!dayOk) next.serviceDay = "Choose the service date.";
    else if (form.serviceDay < today) next.serviceDay = "The service date cannot be in the past.";
    if (adults.error) next.adults = adults.error;
    else if (adults.value < 1) next.adults = "At least one adult.";
    if (children.error) next.children = children.error;
    if (!(form.amount > 0)) next.amount = "Enter the total amount received or agreed.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    if (short || unavailable) {
      setServerError(unavailable ? "That date is closed or sold out. Pick another date or add stock first." : `Only ${day.available} left on that date for ${quantity} traveller${quantity === 1 ? "" : "s"}.`);
      return;
    }
    setBusy(true);
    try {
      const result = await api.post(`${STOCK_API}/enquiry-bookings`, {
        source,
        enquiryId: enquiryIdOf(lead),
        variantId,
        serviceDay: form.serviceDay,
        quantity,
        adults: adults.value,
        children: children.value ?? 0,
        totalAmount: form.amount,
        currency: form.currency,
        paymentMode: form.paymentMode,
        ...(form.paymentReference.trim() ? { paymentReference: form.paymentReference.trim() } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
        ...taxBuyerPayload(taxBuyer),
      });
      toast.success("Booking confirmed");
      setDone(result || {});
      onDone?.(result);
    } catch (e) {
      setServerError(stockErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const booking = done.booking || {};
    const target = booking.id || booking.reference;
    return (
      <Modal open onClose={onClose} title="Booking confirmed" description={`${lead.name} - ${lead.catalog?.title || lead.subject || source}`} footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
        <div className="adm-stack">
          <p>
            Booking {target ? <Link className="adm-link" href={`/admin/bookings/${encodeURIComponent(target)}`}>{booking.reference || "Open booking"}</Link> : "created"}. Stock was reduced and the enquiry is marked as booked.
          </p>
          <p>{done.invoiceNumber ? <>Invoice number: <b>{done.invoiceNumber}</b></> : "The invoice is issued right after confirmation. Refresh the booking page in a moment to see its number."}</p>
          {done.tax && (done.tax.taxName || done.tax.country) ? <p className="adm-muted">Tax: {[done.tax.country, done.tax.taxName, done.tax.percent !== undefined ? `${done.tax.percent}%` : null].filter(Boolean).join(" ")}, included in the total.</p> : null}
          {target ? <div><Link className="adm-btn adm-btn--secondary" href={`/admin/bookings/${encodeURIComponent(target)}`}><span className="adm-btn__label">Open booking</span></Link></div> : null}
        </div>
      </Modal>
    );
  }

  const noProduct = !slug;
  const autoCountry = /^[A-Za-z]{2}$/.test(lead.serviceCountry || lead.catalog?.country || "") ? String(lead.serviceCountry || lead.catalog?.country).toUpperCase() : "";
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Confirm booking"
      description="Creates a confirmed booking from this enquiry, takes the units from stock and issues the invoice. Use it once the customer has paid or agreed to pay."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="inv-confirm" loading={busy} disabled={noProduct || (variants.loading && !variants.data) || (!!variants.data && !options.length)}>Confirm booking</Button>
        </>
      }
    >
      {noProduct ? (
        <ErrorState title="This enquiry is not linked to a product" description="Open the enquiry on the website catalogue first, or create the booking from the bookings page." />
      ) : variants.error && !variants.data ? (
        <ErrorState title="Could not load the stock options" description={variants.error.message} onRetry={variants.reload} />
      ) : variants.loading && !variants.data ? (
        <div className="adm-stack"><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></div>
      ) : !options.length ? (
        <ErrorState title="No stock items found for this product" description="This product has no sellable options in the stock system yet." />
      ) : (
        <form id="inv-confirm" className="adm-stack" onSubmit={submit} noValidate>
          <div className="adm-form-grid">
            {options.length > 1 || variantId !== "default" ? (
              <SelectField
                label={VARIANT_LABEL[source] || "Option"}
                required
                value={variantId}
                onChange={(v) => set({ variantId: v })}
                placeholder="Choose"
                options={options.map((o) => ({ value: o.variantId, label: o.variantLabel || o.variantId }))}
                error={errors.variantId}
              />
            ) : null}
            <DateField label="Service date" required value={form.serviceDay} min={today} onChange={(serviceDay) => set({ serviceDay })} error={errors.serviceDay} hint={source === "holiday" ? "The departure date." : undefined} />
            <TextField label="Adults" required inputMode="numeric" value={form.adults} onChange={(adults) => set({ adults })} error={errors.adults} />
            <TextField label="Children" inputMode="numeric" value={form.children} onChange={(children) => set({ children })} error={errors.children} />
          </div>

          {chosen && dayOk ? (
            <div className="adm-row" role="status" aria-live="polite">
              {live.loading && !live.data ? (
                <span className="adm-muted">Checking availability...</span>
              ) : live.error && !live.data ? (
                <span className="adm-inline-error">Could not check availability. {live.error.message}</span>
              ) : day ? (
                <>
                  <StatusBadge tone={STATUS[day.status]?.tone || "neutral"}>{STATUS[day.status]?.label || day.status}</StatusBadge>
                  <span>
                    {formatDayKey(day.date)}: {day.available === null || day.available === undefined ? "no limit" : `${num(day.available)} unit${day.available === 1 ? "" : "s"} available`}
                    {day.capacity !== null && day.capacity !== undefined ? ` of ${num(day.capacity)}` : ""}. This booking needs {quantity}.
                  </span>
                  {short ? <span className="adm-inline-error">Not enough units.</span> : null}
                </>
              ) : (
                <span className="adm-muted">No availability information for that date.</span>
              )}
            </div>
          ) : null}

          <div className="adm-form-grid">
            <MoneyField label="Total amount" required value={form.amount} currency={form.currency} onChange={(amount) => set({ amount })} error={errors.amount} />
            <SelectField label="Currency" value={form.currency} onChange={(currency) => set({ currency })} options={CURRENCIES} />
            <SelectField label="Payment mode" required value={form.paymentMode} onChange={(paymentMode) => set({ paymentMode })} options={PAYMENT_MODES} />
            <TextField label="Payment reference" value={form.paymentReference} onChange={(paymentReference) => set({ paymentReference })} hint="Bank transfer reference or receipt number." maxLength={120} />
          </div>
          <TaxBuyerSection value={taxBuyer} onChange={setTaxBuyer} total={form.amount} currency={form.currency} autoCountry={autoCountry} />
          <TextArea label="Note" rows={2} maxLength={500} value={form.note} onChange={(note) => set({ note })} hint="Internal. Saved on the booking." />
          {serverError ? <p className="adm-inline-error" role="alert">{serverError}</p> : null}
        </form>
      )}
    </Modal>
  );
}
