"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, ConfirmDialog, MoneyField, Switch, TextField, useToast } from "../../_kit";
import { itemApiPath, num, parseCount, stockErrorText } from "../_lib/stock";
import { InlineError } from "./parts";

/** One labelled control with its own Save button and its own server error. */
function Row({ label, hint, error, saved, children, action }) {
  return (
    <div className="inv-pol">
      <span className="inv-pol__label">{label}</span>
      <div className="inv-pol__row">{children}{action}</div>
      {hint ? <p className="inv-pol__hint">{hint}</p> : null}
      <InlineError>{error}</InlineError>
      {saved && !error ? <p className="inv-ok" role="status">Saved.</p> : null}
    </div>
  );
}

/**
 * Item policy: default daily capacity, low-stock threshold, stop sale, unit cost. Every control saves on its own with
 * PATCH /admin/stock/items/:id and shows the server error next to itself (STOCK_BELOW_COMMITTED names the date and the units).
 * Remount with a new `key` after the item reloads so the fields reset to the saved values.
 */
export default function PolicyPanel({ item, canWrite, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const canBuy = useAdminMe().can("purchasing.write");
  const [unlimited, setUnlimited] = useState((item.defaultCapacity ?? item.inheritedCapacity) === null || (item.defaultCapacity ?? item.inheritedCapacity) === undefined);
  const [capacity, setCapacity] = useState((item.defaultCapacity ?? item.inheritedCapacity) === null || (item.defaultCapacity ?? item.inheritedCapacity) === undefined ? "" : String(item.defaultCapacity ?? item.inheritedCapacity));
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState(String(item.lowStockThreshold ?? 10));
  const [cost, setCost] = useState(item.unitCost ?? null);
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState({});
  const [confirmStop, setConfirmStop] = useState(false);

  const setErr = (key, value) => setErrors((e) => ({ ...e, [key]: value }));

  async function patch(key, body, success) {
    setBusy(key);
    setErr(key, "");
    setSaved((s) => ({ ...s, [key]: false }));
    try {
      await api.patch(itemApiPath(item.id), body);
      toast.success(success);
      setSaved((s) => ({ ...s, [key]: true }));
      if (key === "stop") setConfirmStop(false);
      onSaved();
    } catch (e) {
      setErr(key, stockErrorText(e));
    } finally {
      setBusy("");
    }
  }

  function saveCapacity() {
    const parsed = unlimited ? { value: null, error: "" } : parseCount(capacity, { required: true, label: "Daily capacity" });
    if (parsed.error) return setErr("capacity", parsed.error);
    patch("capacity", { defaultCapacity: parsed.value, ...(reason.trim() ? { reason: reason.trim() } : {}) }, "Default capacity saved");
    return undefined;
  }
  function saveThreshold() {
    const parsed = parseCount(threshold, { required: true, label: "Threshold" });
    if (parsed.error) return setErr("threshold", parsed.error);
    patch("threshold", { lowStockThreshold: parsed.value }, "Low-stock threshold saved");
    return undefined;
  }
  function saveCost() {
    if (cost !== null && !(cost >= 0)) return setErr("cost", "Enter a valid amount.");
    patch("cost", { unitCost: cost }, cost === null ? "Unit cost cleared" : "Unit cost saved");
    return undefined;
  }

  const effective = item.defaultCapacity ?? item.inheritedCapacity ?? null;
  const capacityDirty = unlimited ? effective !== null : capacity !== String(effective ?? "");
  const thresholdDirty = threshold !== String(item.lowStockThreshold ?? 10);
  const costDirty = (cost ?? null) !== (item.unitCost ?? null);
  const dis = !canWrite || !!busy;

  return (
    <div className="inv-policy">
      <Row
        label="Default daily capacity"
        hint={item.capacitySource === "legacy" ? `Currently ${item.inheritedCapacity} per day, taken from the product's own setup. Saving a value here replaces it. Per-date changes in the calendar win over this.` : "Applies to every date without its own setting. Per-date changes in the calendar win over this."}
        error={errors.capacity}
        saved={saved.capacity}
        action={canWrite ? <Button variant="primary" size="sm" loading={busy === "capacity"} disabled={dis || !capacityDirty} onClick={saveCapacity}>Save</Button> : null}
      >
        <div className="adm-stack" style={{ gap: 10 }}>
          <Switch label="Unlimited" description="No daily limit." checked={unlimited} onChange={(v) => { setUnlimited(v); setErr("capacity", ""); }} disabled={dis} />
          {!unlimited ? <TextField label="Units per day" inputMode="numeric" value={capacity} onChange={(v) => { setCapacity(v); setErr("capacity", ""); }} disabled={dis} /> : null}
          {capacityDirty && canWrite ? <TextField label="Reason" value={reason} onChange={setReason} maxLength={300} placeholder="Optional, saved in the ledger" /> : null}
        </div>
      </Row>

      <Row
        label="Low-stock threshold"
        hint="Flagged as low when this many or fewer are left on a date."
        error={errors.threshold}
        saved={saved.threshold}
        action={canWrite ? <Button variant="primary" size="sm" loading={busy === "threshold"} disabled={dis || !thresholdDirty} onClick={saveThreshold}>Save</Button> : null}
      >
        <TextField label="Units" inputMode="numeric" value={threshold} onChange={(v) => { setThreshold(v); setErr("threshold", ""); }} disabled={dis} />
      </Row>

      <Row label="Stop sale" hint="Closes every date of this item for sale. Existing bookings are not affected." error={errors.stop} saved={saved.stop}>
        <Switch
          label={item.stopSale ? "Sales are stopped" : "Selling"}
          description={item.stopSale ? "Switch off to resume sales." : "Switch on to stop all sales of this item."}
          checked={!!item.stopSale}
          disabled={dis}
          onChange={(v) => (v ? setConfirmStop(true) : patch("stop", { stopSale: false }, "Sales resumed"))}
        />
      </Row>

      <Row
        label="Unit cost (optional)"
        hint={<>What one unit costs you. Not shown to customers; used for margin reports.{canBuy ? <> Receiving a purchase sets it for you: <Link href={`/admin/purchasing/new?item=${encodeURIComponent(item.id)}`} className="inv-link">Purchases</Link></> : null}</>}
        error={errors.cost}
        saved={saved.cost}
        action={canWrite ? <Button variant="primary" size="sm" loading={busy === "cost"} disabled={dis || !costDirty} onClick={saveCost}>Save</Button> : null}
      >
        <MoneyField label="Per unit" value={cost} onChange={(v) => { setCost(v); setErr("cost", ""); }} disabled={dis} />
      </Row>

      {!canWrite ? <p className="inv-pol__hint">You have view-only access to stock. Current default: {(item.defaultCapacity ?? item.inheritedCapacity) == null ? "unlimited" : `${num(item.defaultCapacity ?? item.inheritedCapacity)} per day`}.</p> : null}

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={() => patch("stop", { stopSale: true }, "Sales stopped")}
        busy={busy === "stop"}
        error={errors.stop}
        title={`Stop sales of "${item.title}"?`}
        description="Customers will no longer be able to book any date of this item. Existing bookings stay valid. You can resume sales at any time."
        confirmLabel="Stop sale"
      />
    </div>
  );
}
