"use client";

import "./tax.css";
import { useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, ConfirmDialog, IconButton, Modal, SelectField, Switch, TextArea, TextField, useToast } from "../../_kit";
import { MODELS, QR_OPTIONS, SERVICE_CODE_LABELS, TAX_API, clone, countryOptions, previewNumber, same, serverErrors } from "./taxLib";

const KEYS = ["country", "countryName", "taxName", "invoiceTitle", "registrationLabel", "model", "rates", "serviceCode", "pricesIncludeTax", "numbering", "invoiceNotes", "qr", "active"];
const YEAR_DIGITS = [{ value: "4", label: "4 digits (2026)" }, { value: "2", label: "2 digits (26)" }];
const SEQ_DIGITS = [4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `${n} digits` }));

const blankRate = (isDefault = false) => ({ code: "", label: "", percent: "", isDefault });

function blankRegime() {
  return {
    country: "", countryName: "", taxName: "VAT", invoiceTitle: "Tax Invoice", registrationLabel: "VAT No", model: "single",
    rates: [{ code: "standard", label: "Standard rate", percent: "", isDefault: true }],
    serviceCode: { label: "SAC", value: "", description: "" },
    pricesIncludeTax: false,
    numbering: { prefix: "INV", creditPrefix: "CN", includeCountry: true, yearDigits: "4", sequenceDigits: "6", maxLength: "" },
    invoiceNotes: "", qr: "none", active: true,
  };
}

function fromRegime(r) {
  const b = blankRegime();
  return {
    country: r.country || "",
    countryName: r.countryName || "",
    taxName: r.taxName || "",
    invoiceTitle: r.invoiceTitle || "",
    registrationLabel: r.registrationLabel || "",
    model: r.model || "single",
    rates: (r.rates?.length ? r.rates : b.rates).map((x) => ({ code: x.code || "", label: x.label || "", percent: x.percent === undefined || x.percent === null ? "" : String(x.percent), isDefault: !!x.isDefault })),
    serviceCode: { label: r.serviceCode?.label || "SAC", value: r.serviceCode?.value || "", description: r.serviceCode?.description || "" },
    pricesIncludeTax: !!r.pricesIncludeTax,
    numbering: {
      prefix: r.numbering?.prefix ?? "INV",
      creditPrefix: r.numbering?.creditPrefix ?? "CN",
      includeCountry: !!r.numbering?.includeCountry,
      yearDigits: String(r.numbering?.yearDigits || 4),
      sequenceDigits: String(r.numbering?.sequenceDigits || 6),
      maxLength: r.numbering?.maxLength ? String(r.numbering.maxLength) : "",
    },
    invoiceNotes: r.invoiceNotes || "",
    qr: r.qr || "none",
    active: r.active !== false,
  };
}

const PERCENT_RE = /^\d{1,3}(\.\d{1,3})?$/;

function setIn(obj, path, value) {
  const next = clone(obj);
  const keys = path.split(".");
  let o = next;
  keys.slice(0, -1).forEach((k) => { o = o[k]; });
  o[keys[keys.length - 1]] = value;
  return next;
}

/** Add / edit a tax regime. POST /admin/tax/regimes, PATCH /admin/tax/regimes/:id. */
export default function RegimeDialog({ regime, regimes, countries, onClose, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const isNew = !regime;
  const [base] = useState(() => (regime ? fromRegime(regime) : blankRegime()));
  const [form, setForm] = useState(base);
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState([]);
  const [busy, setBusy] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const dirty = !same(form, base);
  const india = form.model === "india_gst";

  const set = (path, value) => {
    setForm((f) => setIn(f, path, value));
    setErrors((e) => (e[path] ? { ...e, [path]: undefined } : e));
  };
  const requestClose = () => (busy ? undefined : dirty ? setAskDiscard(true) : onClose());

  const countryChoices = useMemo(() => {
    const active = new Set(regimes.filter((r) => r.active !== false).map((r) => r.country));
    return countries.map((c) => ({ value: c.code, label: `${c.name} (${c.code})${active.has(c.code) && c.code !== regime?.country ? " - already has a regime" : ""}` }));
  }, [countries, regimes, regime]);

  function pickCountry(code) {
    set("country", code);
    set("countryName", countries.find((c) => c.code === code)?.name || "");
  }

  const rates = form.rates;
  function addRate() {
    setForm((f) => ({ ...f, rates: [...f.rates, blankRate(!f.rates.length)] }));
  }
  function removeRate(i) {
    setForm((f) => {
      const next = f.rates.filter((_, j) => j !== i);
      if (next.length && !next.some((r) => r.isDefault)) next[0] = { ...next[0], isDefault: true };
      return { ...f, rates: next };
    });
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("rates"))));
  }
  function makeDefault(i) {
    setForm((f) => ({ ...f, rates: f.rates.map((r, j) => ({ ...r, isDefault: j === i })) }));
  }

  const n = form.numbering;
  const maxLen = Number(n.maxLength) || null;
  const invoiceSample = previewNumber(n, form.country);
  const creditSample = previewNumber(n, form.country, { credit: true });
  const longest = Math.max(invoiceSample.length, creditSample.length);
  const over = maxLen && longest > maxLen;

  function validate() {
    const e = {};
    if (!form.country) e.country = "Choose the country.";
    if (!form.taxName.trim()) e.taxName = "Tax name is required (VAT, GST ...).";
    if (!form.invoiceTitle.trim()) e.invoiceTitle = "Invoice title is required (for example Tax Invoice).";
    if (!form.registrationLabel.trim()) e.registrationLabel = "Registration label is required (TRN, GSTIN, VAT No ...).";
    if (!rates.length) e.rates = "Add at least one rate.";
    const seen = new Set();
    rates.forEach((r, i) => {
      const code = r.code.trim();
      if (!code) e[`rates.${i}.code`] = "Code is required.";
      else if (!/^[A-Za-z0-9_-]{1,24}$/.test(code)) e[`rates.${i}.code`] = "Use letters, digits, - or _.";
      else if (seen.has(code.toLowerCase())) e[`rates.${i}.code`] = "Codes must be unique.";
      seen.add(code.toLowerCase());
      if (!r.label.trim()) e[`rates.${i}.label`] = "Label is required.";
      const p = r.percent.trim();
      if (!p) e[`rates.${i}.percent`] = "Required (0 is allowed).";
      else if (!PERCENT_RE.test(p)) e[`rates.${i}.percent`] = "Up to 3 decimals.";
      else if (Number(p) > 100) e[`rates.${i}.percent`] = "At most 100.";
    });
    if (rates.length && rates.filter((r) => r.isDefault).length !== 1) e.rates = "Exactly one rate must be the default.";
    const sc = form.serviceCode;
    if (sc.description.trim() && !sc.value.trim()) e["serviceCode.value"] = "Enter the code or clear the description.";
    if (!n.prefix.trim()) e["numbering.prefix"] = "Prefix is required.";
    else if (!/^[A-Za-z0-9]{1,8}$/.test(n.prefix.trim())) e["numbering.prefix"] = "1-8 letters or digits.";
    if (!n.creditPrefix.trim()) e["numbering.creditPrefix"] = "Credit note prefix is required.";
    else if (!/^[A-Za-z0-9]{1,8}$/.test(n.creditPrefix.trim())) e["numbering.creditPrefix"] = "1-8 letters or digits.";
    if (n.maxLength.trim()) {
      const m = Number(n.maxLength);
      if (!Number.isInteger(m) || m < 8 || m > 40) e["numbering.maxLength"] = "A whole number from 8 to 40, or leave empty.";
      else if (over) e["numbering.maxLength"] = `The longest number (${longest} characters) exceeds this limit. Shorten the prefix or the digits.`;
    }
    return e;
  }

  async function submit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setGeneral([]);
    if (Object.keys(found).length) return;
    const sc = form.serviceCode;
    const hasService = !!sc.value.trim();
    const body = {
      ...(isNew ? { country: form.country, countryName: form.countryName || countries.find((c) => c.code === form.country)?.name || form.country } : {}),
      taxName: form.taxName.trim(),
      invoiceTitle: form.invoiceTitle.trim(),
      registrationLabel: form.registrationLabel.trim(),
      model: form.model,
      rates: rates.map((r) => ({ code: r.code.trim(), label: r.label.trim(), percent: Number(r.percent), isDefault: r.isDefault })),
      pricesIncludeTax: form.pricesIncludeTax,
      numbering: {
        prefix: n.prefix.trim(),
        creditPrefix: n.creditPrefix.trim(),
        includeCountry: n.includeCountry,
        yearDigits: Number(n.yearDigits),
        sequenceDigits: Number(n.sequenceDigits),
        ...(maxLen ? { maxLength: maxLen } : {}),
      },
      qr: form.qr,
      active: form.active,
    };
    if (hasService) body.serviceCode = { label: sc.label, value: sc.value.trim(), description: sc.description.trim() };
    else if (!isNew && regime?.serviceCode) body.serviceCode = null;
    if (form.invoiceNotes.trim()) body.invoiceNotes = form.invoiceNotes.trim();
    else if (!isNew && regime?.invoiceNotes) body.invoiceNotes = "";
    setBusy(true);
    try {
      const saved = isNew ? await api.post(`${TAX_API}/regimes`, body) : await api.patch(`${TAX_API}/regimes/${regime.id}`, body);
      toast.success(isNew ? "Tax regime added" : "Tax regime saved");
      onSaved?.(saved);
      onClose();
    } catch (e) {
      const parsed = serverErrors(e, KEYS);
      setErrors((prev) => ({ ...prev, ...parsed.fields }));
      setGeneral(parsed.general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isNew ? "Add a country" : `Edit tax regime - ${regime.countryName || regime.country}`}
        description={isNew ? "Set up the tax name, rate(s), registration label and invoice numbering for any country. Rates and formats are configuration: have your accountant confirm them." : "Changes apply to new bookings and new invoices. Issued invoices keep the tax they were issued with."}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={busy}>Cancel</Button>
            <Button variant="primary" type="submit" form="tx-regime" loading={busy} disabled={!isNew && !dirty}>{isNew ? "Add country" : "Save changes"}</Button>
          </>
        }
      >
        <form id="tx-regime" className="tx-form" onSubmit={submit} noValidate>
          <fieldset className="tx-fieldset">
            <legend>Country and tax</legend>
            <div className="tx-form2">
              <SelectField label="Country" required value={form.country} onChange={pickCountry} options={countryChoices} placeholder="Choose a country" error={errors.country} disabled={!isNew} hint={!isNew ? "The country cannot be changed. Add a new country instead." : undefined} />
              <SelectField label="Tax model" required value={form.model} onChange={(v) => set("model", v)} options={MODELS} error={errors.model} hint={india ? "The chosen rate is split into CGST + SGST (half each) inside the seller's state, otherwise IGST (full rate)." : "One tax line at the chosen rate."} />
              <TextField label="Tax name" required value={form.taxName} onChange={(v) => set("taxName", v)} error={errors.taxName} maxLength={30} placeholder="VAT, GST, Sales tax ..." />
              <TextField label="Invoice title" required value={form.invoiceTitle} onChange={(v) => set("invoiceTitle", v)} error={errors.invoiceTitle} maxLength={60} placeholder="Tax Invoice" />
              <TextField label="Registration label" required value={form.registrationLabel} onChange={(v) => set("registrationLabel", v)} error={errors.registrationLabel} maxLength={30} placeholder="TRN, GSTIN, VAT No" hint="What the seller's and buyer's registration numbers are called on the invoice." />
            </div>
            <div className="tx-switches">
              <Switch label="Listed prices include tax" description="Off (default): the prices on the website exclude tax and tax is added at checkout." checked={form.pricesIncludeTax} onChange={(v) => set("pricesIncludeTax", v)} />
              <Switch label="Active" description="Inactive regimes are not used for new bookings. Past invoices are unaffected." checked={form.active} onChange={(v) => set("active", v)} />
            </div>
          </fieldset>

          <fieldset className="tx-fieldset">
            <legend>Tax rates</legend>
            <p className="tx-help">The default rate applies automatically. Other rates can be chosen when staff create a booking. A 0% rate is allowed (zero rated or exempt supplies).</p>
            <ul className="tx-rates">
              {rates.map((r, i) => (
                <li key={i} className="tx-rate">
                  <TextField label="Code" value={r.code} onChange={(v) => set(`rates.${i}.code`, v)} error={errors[`rates.${i}.code`]} maxLength={24} placeholder="standard" />
                  <TextField className="tx-rate__label" label="Label" value={r.label} onChange={(v) => set(`rates.${i}.label`, v)} error={errors[`rates.${i}.label`]} maxLength={60} placeholder="Standard rate" />
                  <TextField label="Percent" inputMode="decimal" suffix="%" value={r.percent} onChange={(v) => set(`rates.${i}.percent`, v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))} error={errors[`rates.${i}.percent`]} />
                  <div className="tx-rate__def">
                    <span id={`tx-def-${i}`}>Default</span>
                    <input type="radio" name="tx-default-rate" checked={r.isDefault} onChange={() => makeDefault(i)} aria-labelledby={`tx-def-${i}`} />
                  </div>
                  <div className="tx-rate__rm"><IconButton icon="trash" label={`Remove rate ${r.label || r.code || i + 1}`} onClick={() => removeRate(i)} disabled={rates.length <= 1} /></div>
                </li>
              ))}
            </ul>
            {errors.rates ? <p className="adm-field__error" role="alert">{errors.rates}</p> : null}
            <div><Button size="sm" icon="plus" onClick={addRate}>Add rate</Button></div>
          </fieldset>

          <fieldset className="tx-fieldset">
            <legend>{india ? "SAC / HSN code" : "Service code (optional)"}</legend>
            <div className="tx-form2">
              <SelectField label="Code type" value={form.serviceCode.label} onChange={(v) => set("serviceCode.label", v)} options={SERVICE_CODE_LABELS} />
              <TextField label="Code" value={form.serviceCode.value} onChange={(v) => set("serviceCode.value", v)} error={errors["serviceCode.value"]} maxLength={20} placeholder="998555" hint="Printed on the invoice line. Leave empty to print none." />
              <div className="is-wide"><TextField label="Description" value={form.serviceCode.description} onChange={(v) => set("serviceCode.description", v)} maxLength={160} placeholder="Tour operator services" /></div>
            </div>
          </fieldset>

          <fieldset className="tx-fieldset">
            <legend>Invoice numbering</legend>
            <div className="tx-grid3">
              <TextField label="Invoice prefix" required value={n.prefix} onChange={(v) => set("numbering.prefix", v.toUpperCase())} error={errors["numbering.prefix"]} maxLength={8} />
              <TextField label="Credit note prefix" required value={n.creditPrefix} onChange={(v) => set("numbering.creditPrefix", v.toUpperCase())} error={errors["numbering.creditPrefix"]} maxLength={8} />
              <SelectField label="Year" value={n.yearDigits} onChange={(v) => set("numbering.yearDigits", v)} options={YEAR_DIGITS} />
              <SelectField label="Sequence" value={n.sequenceDigits} onChange={(v) => set("numbering.sequenceDigits", v)} options={SEQ_DIGITS} />
              <TextField label="Max length" inputMode="numeric" value={n.maxLength} onChange={(v) => set("numbering.maxLength", v.replace(/\D/g, ""))} error={errors["numbering.maxLength"]} maxLength={2} placeholder="No limit" hint="India allows 16 characters." />
            </div>
            <Switch label="Include the country code" description="Adds the country (IN, SA ...) in front of the year, for example INV-IN26-000001." checked={n.includeCountry} onChange={(v) => set("numbering.includeCountry", v)} />
            <div className="tx-preview" aria-live="polite">
              <div className="tx-preview__row"><span className="tx-preview__label">Invoice</span><span className="tx-preview__num">{invoiceSample}</span><span className={`tx-preview__len${maxLen && invoiceSample.length > maxLen ? " is-over" : ""}`}>{invoiceSample.length}{maxLen ? ` / ${maxLen}` : ""} characters</span></div>
              <div className="tx-preview__row"><span className="tx-preview__label">Credit note</span><span className="tx-preview__num">{creditSample}</span><span className={`tx-preview__len${maxLen && creditSample.length > maxLen ? " is-over" : ""}`}>{creditSample.length}{maxLen ? ` / ${maxLen}` : ""} characters</span></div>
              <p className="tx-help">Sample for the first document of the year. Numbers run in sequence without gaps, per seller registration, document type and year.</p>
            </div>
          </fieldset>

          <fieldset className="tx-fieldset">
            <legend>Invoice layout</legend>
            <TextArea label="Invoice notes" rows={3} maxLength={600} value={form.invoiceNotes} onChange={(v) => set("invoiceNotes", v)} error={errors.invoiceNotes} hint="Printed at the bottom of invoices for this country, for example a reverse-charge or exemption statement." />
            <SelectField label="QR code" value={form.qr} onChange={(v) => set("qr", v)} options={QR_OPTIONS} error={errors.qr} hint="ZATCA prints the phase 1 QR only (seller, VAT number, timestamp, total, VAT). There is no live e-invoicing integration." />
          </fieldset>

          {general.length ? <p className="tx-error" role="alert">{general.join(" ")}</p> : null}
        </form>
      </Modal>
      <ConfirmDialog
        open={askDiscard}
        onClose={() => setAskDiscard(false)}
        onConfirm={() => { setAskDiscard(false); onClose(); }}
        title="Discard your changes?"
        description="You have unsaved changes in this tax regime. If you close it now they are lost."
        confirmLabel="Discard changes"
      />
    </>
  );
}
