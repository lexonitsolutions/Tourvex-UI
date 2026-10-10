"use client";

import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, Modal, SelectField, Switch, TextArea, TextField, useToast } from "../../_kit";
import { CURRENCIES, SUPPLIERS_PATH, supplierApiPath } from "../_lib/purchasing";
import { InlineError } from "./parts";

const blank = { name: "", legalName: "", country: "", registrationNumber: "", email: "", phone: "", address: "", paymentTermsDays: "0", currency: "AED", notes: "", active: true };

/** Add / edit a supplier: POST /admin/purchasing/suppliers or PATCH /admin/purchasing/suppliers/:id. `supplier` null = add. */
export default function SupplierDialog({ open, supplier, onClose, onSaved }) {
  return open ? <Inner key={supplier?.id || "new"} supplier={supplier} onClose={onClose} onSaved={onSaved} /> : null;
}

function Inner({ supplier, onClose, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const editing = !!supplier;
  const [form, setForm] = useState(() => (supplier ? { ...blank, ...Object.fromEntries(Object.keys(blank).map((k) => [k, supplier[k] ?? blank[k]])), paymentTermsDays: String(supplier.paymentTermsDays ?? 0) } : blank));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(event) {
    event.preventDefault();
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = "Enter the supplier's name.";
    if (form.country.trim() && !/^[A-Za-z]{2}$/.test(form.country.trim())) next.country = "Use the two-letter country code, for example AE or IN.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    const terms = String(form.paymentTermsDays).trim() === "" ? 0 : Number(form.paymentTermsDays);
    if (!Number.isInteger(terms) || terms < 0 || terms > 365) next.paymentTermsDays = "Whole days, 0 to 365.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    const body = {
      name,
      legalName: form.legalName.trim(),
      country: form.country.trim().toUpperCase(),
      registrationNumber: form.registrationNumber.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      paymentTermsDays: terms,
      currency: form.currency,
      notes: form.notes.trim(),
      active: form.active,
    };
    setBusy(true);
    try {
      const saved = editing ? await api.patch(supplierApiPath(supplier.id), body) : await api.post(SUPPLIERS_PATH, body);
      toast.success(editing ? `Saved "${name}"` : `Added supplier "${name}"`);
      onSaved?.(saved && typeof saved === "object" ? saved : { ...body, id: supplier?.id });
      onClose();
    } catch (e) {
      setServerError(e.status === 409 ? "A supplier with this name already exists." : e.message || "Could not save the supplier.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      size="lg"
      title={editing ? "Edit supplier" : "Add supplier"}
      description="Who you buy stock from. Only the name is required; the rest helps when you record their invoices."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="pur-supplier" loading={busy}>{editing ? "Save supplier" : "Add supplier"}</Button>
        </>
      }
    >
      <form id="pur-supplier" className="adm-stack" onSubmit={submit} noValidate>
        <div className="pur-formrow">
          <TextField label="Name" required value={form.name} onChange={(name) => set({ name })} error={errors.name} maxLength={120} placeholder="e.g. Desert Safari LLC" data-autofocus />
          <TextField label="Legal name" value={form.legalName} onChange={(legalName) => set({ legalName })} maxLength={160} hint="As printed on their invoices, if different." />
        </div>
        <div className="pur-formrow">
          <TextField label="Country" value={form.country} onChange={(country) => set({ country })} error={errors.country} maxLength={2} placeholder="AE" hint="Two-letter code." />
          <TextField label="Registration number" value={form.registrationNumber} onChange={(registrationNumber) => set({ registrationNumber })} maxLength={60} hint="TRN, GSTIN, VAT number or trade licence." />
        </div>
        <div className="pur-formrow">
          <TextField label="Email" type="email" value={form.email} onChange={(email) => set({ email })} error={errors.email} maxLength={160} />
          <TextField label="Phone" value={form.phone} onChange={(phone) => set({ phone })} maxLength={40} />
        </div>
        <TextArea label="Address" value={form.address} onChange={(address) => set({ address })} rows={2} maxLength={300} />
        <div className="pur-formrow">
          <TextField label="Payment terms" inputMode="numeric" value={form.paymentTermsDays} onChange={(paymentTermsDays) => set({ paymentTermsDays })} error={errors.paymentTermsDays} suffix="days" hint="Used to suggest a due date on their invoices." />
          <SelectField label="Currency" value={form.currency} onChange={(currency) => set({ currency })} options={CURRENCIES} />
        </div>
        <TextArea label="Notes" value={form.notes} onChange={(notes) => set({ notes })} rows={2} maxLength={1000} hint="Internal. Never shown to customers." />
        <Switch label="Active" description="Inactive suppliers stay on past purchases but cannot be chosen for new ones." checked={form.active} onChange={(active) => set({ active })} />
        <InlineError>{serverError}</InlineError>
      </form>
    </Modal>
  );
}
