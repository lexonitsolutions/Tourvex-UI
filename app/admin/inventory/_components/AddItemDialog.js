"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, Modal, SelectField, Switch, TextField, useToast } from "../../_kit";
import { MANUAL_TYPES, STOCK_API, itemHref, parseCount, stockErrorText } from "../_lib/stock";
import { InlineError } from "./parts";

const slugify = (text) => String(text || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** "Add manual item" (yacht / transfer / hotel room / custom): POST /admin/stock/items. */
export default function AddItemDialog({ open, onClose, onCreated }) {
  return open ? <Inner onClose={onClose} onCreated={onCreated} /> : null;
}

function Inner({ onClose, onCreated }) {
  const api = useAdminApi();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ productType: "yacht", title: "", productRef: "", variantId: "default", variantLabel: "", unlimited: false, capacity: "", threshold: "10" });
  const [refTouched, setRefTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function submit(event) {
    event.preventDefault();
    const next = {};
    const title = form.title.trim();
    const ref = (form.productRef || slugify(form.title)).trim();
    if (!title) next.title = "Enter a name for this item.";
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(ref)) next.productRef = "Use lowercase letters, numbers and dashes.";
    const variant = form.variantId.trim() || "default";
    if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,39}$/.test(variant)) next.variantId = "Letters, numbers, spaces, dashes. Max 40 characters.";
    const capacity = form.unlimited ? { value: null, error: "" } : parseCount(form.capacity, { required: true, label: "Daily capacity" });
    if (capacity.error) next.capacity = capacity.error;
    const threshold = parseCount(form.threshold, { required: true, label: "Low-stock threshold" });
    if (threshold.error) next.threshold = threshold.error;
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const item = await api.post(`${STOCK_API}/items`, {
        productType: form.productType,
        productRef: ref,
        variantId: variant,
        title,
        ...(form.variantLabel.trim() ? { variantLabel: form.variantLabel.trim() } : {}),
        defaultCapacity: capacity.value,
        lowStockThreshold: threshold.value,
      });
      toast.success(`Added "${title}"`);
      onCreated?.(item);
      onClose();
      if (item?.id) router.push(itemHref(item.id));
    } catch (e) {
      setServerError(e.status === 409 ? "An item with this type, reference and variant already exists. Change the reference or variant." : stockErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Add manual item"
      description="For things sold outside the website catalogue: a yacht charter, a transfer, a hotel room or any add-on. You can set capacity per date afterwards."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="inv-add" loading={busy}>Add item</Button>
        </>
      }
    >
      <form id="inv-add" className="adm-stack" onSubmit={submit} noValidate>
        <SelectField label="Type" required value={form.productType} onChange={(productType) => set({ productType })} options={MANUAL_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
        <TextField
          label="Name"
          required
          value={form.title}
          onChange={(title) => set({ title, ...(refTouched ? {} : { productRef: slugify(title) }) })}
          error={errors.title}
          maxLength={120}
          placeholder="e.g. Sunset yacht charter"
          data-autofocus
        />
        <div className="inv-formrow">
          <TextField label="Reference" required value={form.productRef} onChange={(productRef) => { setRefTouched(true); set({ productRef: slugify(productRef) }); }} error={errors.productRef} hint="Short and unique. Used in the item URL." />
          <TextField label="Variant id" value={form.variantId} onChange={(variantId) => set({ variantId })} error={errors.variantId} hint={'Leave "default" unless the item has sizes or types.'} />
        </div>
        <TextField label="Variant label" value={form.variantLabel} onChange={(variantLabel) => set({ variantLabel })} maxLength={80} placeholder="e.g. 6-hour charter" hint="Shown next to the name. Optional." />
        <div className="inv-formrow">
          <div className="adm-stack" style={{ gap: 8 }}>
            <Switch label="Unlimited" description="No daily limit." checked={form.unlimited} onChange={(unlimited) => set({ unlimited })} />
            {!form.unlimited ? (
              <TextField label="Daily capacity" required inputMode="numeric" value={form.capacity} onChange={(capacity) => set({ capacity })} error={errors.capacity} placeholder="e.g. 4" />
            ) : null}
          </div>
          <TextField label="Low-stock threshold" required inputMode="numeric" value={form.threshold} onChange={(threshold) => set({ threshold })} error={errors.threshold} hint="Flagged as low when this many or fewer are left." />
        </div>
        <InlineError>{serverError}</InlineError>
      </form>
    </Modal>
  );
}
