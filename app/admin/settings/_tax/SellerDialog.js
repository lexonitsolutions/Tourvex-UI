"use client";

import "./tax.css";
import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, ConfirmDialog, Modal, SelectField, Switch, TextArea, TextField, useToast } from "../../_kit";
import { EMAIL_RE, INDIA_STATES, INDIA_STATE_OPTIONS, TAX_API, countryOptions, regimeFor, same, serverErrors } from "./taxLib";

const KEYS = ["country", "legalName", "registrationNumber", "address", "state", "stateCode", "email", "phone", "website", "bankDetails", "isDefault", "active"];
const TEXT_KEYS = ["legalName", "registrationNumber", "address", "state", "stateCode", "email", "phone", "website", "bankDetails"];
const OPTIONAL = ["state", "stateCode", "email", "phone", "website", "bankDetails"];

function initial(seller, defaultCountry) {
  const s = seller || {};
  return {
    country: s.country || defaultCountry || "",
    legalName: s.legalName || "",
    registrationNumber: s.registrationNumber || "",
    address: s.address || "",
    state: s.state || "",
    stateCode: s.stateCode || "",
    email: s.email || "",
    phone: s.phone || "",
    website: s.website || "",
    bankDetails: typeof s.bankDetails === "string" ? s.bankDetails : s.bankDetails ? JSON.stringify(s.bankDetails) : "",
    isDefault: !!s.isDefault,
    active: s.active !== false,
  };
}

/** Add / edit a seller registration (the legal entity printed on invoices). POST /admin/tax/sellers, PATCH /admin/tax/sellers/:id. */
export default function SellerDialog({ seller, regimes, countries, defaultCountry, onClose, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const isNew = !seller;
  const [base] = useState(() => initial(seller, defaultCountry));
  const [form, setForm] = useState(base);
  const [errors, setErrors] = useState({});
  const [general, setGeneral] = useState([]);
  const [busy, setBusy] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const dirty = !same(form, base);
  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const regime = regimeFor(regimes, form.country);
  const india = regime?.model === "india_gst" || form.country === "IN";
  const regLabel = regime?.registrationLabel || "Registration number";
  const lockedDefault = !!seller?.isDefault;
  const requestClose = () => (busy ? undefined : dirty ? setAskDiscard(true) : onClose());

  function validate() {
    const e = {};
    if (!form.country) e.country = "Choose the country.";
    if (!form.legalName.trim()) e.legalName = "Legal name is required.";
    if (!form.registrationNumber.trim()) e.registrationNumber = `${regLabel} is required.`;
    if (!form.address.trim()) e.address = "Address is required.";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (form.website.trim() && !/^https?:\/\/\S+\.\S+/.test(form.website.trim())) e.website = "Enter a full URL starting with https://";
    if (india) {
      if (!form.stateCode) e.stateCode = "Choose the seller's state: it decides CGST + SGST or IGST.";
    }
    return e;
  }

  async function submit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setGeneral([]);
    if (Object.keys(found).length) return;
    const body = { country: form.country, isDefault: form.isDefault, active: form.active };
    TEXT_KEYS.forEach((k) => {
      const v = String(form[k] ?? "").trim();
      if (v) body[k] = v;
      else if (!isNew && OPTIONAL.includes(k) && String(seller?.[k] || "")) body[k] = "";
      else if (!OPTIONAL.includes(k)) body[k] = v;
    });
    if (!india) {
      delete body.stateCode;
    }
    setBusy(true);
    try {
      const saved = isNew ? await api.post(`${TAX_API}/sellers`, body) : await api.patch(`${TAX_API}/sellers/${seller.id}`, body);
      toast.success(isNew ? "Seller registration added" : "Seller registration saved");
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
        title={isNew ? "Add seller registration" : "Edit seller registration"}
        description="The legal entity that issues invoices. An invoice uses the active registration whose country matches the tax country, otherwise the default one. Issued invoices keep the details they were issued with."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={busy}>Cancel</Button>
            <Button variant="primary" type="submit" form="tx-seller" loading={busy} disabled={!isNew && !dirty}>{isNew ? "Add registration" : "Save changes"}</Button>
          </>
        }
      >
        <form id="tx-seller" className="tx-form" onSubmit={submit} noValidate>
          <div className="tx-form2">
            <SelectField label="Country" required value={form.country} onChange={(country) => set({ country, ...(country !== "IN" ? { stateCode: "" } : {}) })} options={countryOptions(countries)} placeholder="Choose a country" error={errors.country} disabled={!isNew && !!seller?.country} hint={!isNew ? "The country cannot be changed after it is created." : undefined} />
            <TextField label="Legal name" required value={form.legalName} onChange={(legalName) => set({ legalName })} error={errors.legalName} maxLength={160} placeholder="Registered company name" />
            <TextField label={regLabel} required value={form.registrationNumber} onChange={(registrationNumber) => set({ registrationNumber })} error={errors.registrationNumber} maxLength={40} hint={regime ? `Printed on invoices as "${regLabel}".` : "Add a tax regime for this country to label this number (TRN, GSTIN, VAT No)."} />
            <TextField label="Email" type="email" value={form.email} onChange={(email) => set({ email })} error={errors.email} maxLength={160} />
            <div className="is-wide">
              <TextArea label="Address" required rows={3} value={form.address} onChange={(address) => set({ address })} error={errors.address} maxLength={400} />
            </div>
            {india ? (
              <SelectField label="State (GST state code)" required value={form.stateCode} onChange={(stateCode) => set({ stateCode, state: INDIA_STATES.find((s) => s.code === stateCode)?.name || "" })} options={INDIA_STATE_OPTIONS} placeholder="Choose a state" error={errors.stateCode || errors.state} hint="Supply inside this state is split into CGST + SGST; outside it is IGST." />
            ) : (
              <TextField label="State / emirate" value={form.state} onChange={(state) => set({ state })} error={errors.state} maxLength={80} />
            )}
            <TextField label="Phone" value={form.phone} onChange={(phone) => set({ phone })} error={errors.phone} maxLength={40} />
            <TextField label="Website" value={form.website} onChange={(website) => set({ website })} error={errors.website} maxLength={200} placeholder="https://" />
            <div className="is-wide">
              <TextArea label="Bank details" rows={3} value={form.bankDetails} onChange={(bankDetails) => set({ bankDetails })} error={errors.bankDetails} maxLength={600} hint="Optional. Printed on the invoice so customers can pay by transfer." />
            </div>
          </div>
          <div className="tx-switches">
            <Switch label="Default registration" description={lockedDefault ? "This is the default. To change it, make another registration the default." : "Used when no registration matches the tax country. Only one registration is the default."} checked={form.isDefault} disabled={lockedDefault} onChange={(isDefault) => set({ isDefault })} />
            <Switch label="Active" description={lockedDefault ? "The default registration must stay active." : "Inactive registrations are not used for new invoices."} checked={form.active} disabled={lockedDefault} onChange={(active) => set({ active })} />
          </div>
          {general.length ? <p className="tx-error" role="alert">{general.join(" ")}</p> : null}
        </form>
      </Modal>
      <ConfirmDialog
        open={askDiscard}
        onClose={() => setAskDiscard(false)}
        onConfirm={() => { setAskDiscard(false); onClose(); }}
        title="Discard your changes?"
        description="You have unsaved changes in this registration. If you close it now they are lost."
        confirmLabel="Discard changes"
      />
    </>
  );
}

