"use client";

import { useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { dayKey } from "../../_lib/format";
import { Button, DateField, ErrorState, Modal, Skeleton, TextField, useToast } from "../../_kit";
import { fromPurchase, lineMetrics, money, plural, purchaseApiPath, purchaseErrorText, rangeText, totalsOf, weekdaysText } from "../_lib/purchasing";
import { InlineError } from "./parts";

/** Runs one POST with busy + inline error; closes and reports on success. */
function useAction(path, { success, action, onDone, onClose }) {
  const api = useAdminApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(body) {
    setBusy(true);
    setError("");
    try {
      const result = await api.post(path, body);
      toast.success(success);
      onDone?.(result);
      onClose();
    } catch (e) {
      setError(purchaseErrorText(e, action));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

/** One line of the confirm dialog: how many units land on which dates. */
function EffectLine({ line }) {
  const m = lineMetrics(line);
  return (
    <li>
      <b>{plural(m.units, "unit")}</b> to<span className="pur-effects__item">{line.title || line.itemId}{line.variantLabel ? ` - ${line.variantLabel}` : ""}</span>
      <small>{plural(line.quantity ? Number(line.quantity) : 0, "unit")} a day on {plural(m.dates, "date")}: {rangeText(line.dateFrom, line.dateTo)}, {weekdaysText(line.weekdays)}</small>
    </li>
  );
}

/** Receive stock: states exactly what will be added where, then POST /admin/purchasing/purchases/:id/receive. */
export function ReceiveDialog({ purchase, onClose, onDone }) {
  const lines = useMemo(() => fromPurchase(purchase).lines, [purchase]);
  const totals = useMemo(() => totalsOf(lines), [lines]);
  const { busy, error, run } = useAction(`${purchaseApiPath(purchase.id)}/receive`, { success: `${purchase.number} received. Stock updated.`, action: "receive", onDone, onClose });
  const items = new Set(lines.map((l) => l.itemId)).size;
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      size="lg"
      title={`Receive stock for ${purchase.number}`}
      description={`This adds ${plural(totals.units, "unit")} to the stock of ${plural(items, "item")}. You can still void the purchase afterwards while those units are unsold.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={() => run({})} loading={busy}>Receive {plural(totals.units, "unit")}</Button>
        </>
      }
    >
      <div className="adm-stack">
        <ul className="pur-effects">{lines.map((l) => <EffectLine key={l.key} line={l} />)}</ul>
        <p className="pur-note">Each item&apos;s unit cost is set to the cost on this purchase (the last cost) and written to the stock ledger. New bookings use it for margin reports; past bookings keep the cost they were sold with.</p>
        <InlineError>{error}</InlineError>
      </div>
    </Modal>
  );
}

/** Void: draft = nothing in stock changes; received = the units are removed again unless they are already committed. */
export function VoidDialog({ purchase, onClose, onDone }) {
  const received = purchase.status === "received";
  const totals = useMemo(() => totalsOf(fromPurchase(purchase).lines), [purchase]);
  const { busy, error, run } = useAction(`${purchaseApiPath(purchase.id)}/void`, { success: `${purchase.number} voided`, action: "void", onDone, onClose });
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Void ${purchase.number}?`}
      description={received ? `The ${plural(totals.units, "unit")} this purchase added are taken out of stock again. If any of those dates already has bookings that need them, the void is refused.` : "This draft is cancelled. Stock is not touched because nothing was received."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Keep purchase</Button>
          <Button variant="danger" onClick={() => run({})} loading={busy}>Void purchase</Button>
        </>
      }
    >
      <div className="adm-stack">
        <p className="pur-note">A voided purchase stays in the list for your records and cannot be reopened.</p>
        <InlineError>{error}</InlineError>
      </div>
    </Modal>
  );
}

/** Mark paid: POST .../mark-paid { paidAt, reference }. */
export function PaidDialog({ purchase, onClose, onDone }) {
  const [paidAt, setPaidAt] = useState(() => dayKey());
  const [reference, setReference] = useState("");
  const { busy, error, run } = useAction(`${purchaseApiPath(purchase.id)}/mark-paid`, { success: `${purchase.number} marked as paid`, action: "pay", onDone, onClose });
  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={`Mark ${purchase.number} as paid`}
      description={`You paid ${purchase.supplierName || "the supplier"} ${money(purchase.total, purchase.currency)}. This only records the payment here; it does not move money.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="pur-paid" loading={busy} disabled={!paidAt}>Mark as paid</Button>
        </>
      }
    >
      <form id="pur-paid" className="adm-stack" onSubmit={(e) => { e.preventDefault(); run({ paidAt, ...(reference.trim() ? { reference: reference.trim() } : {}) }); }}>
        <DateField label="Paid on" required value={paidAt} onChange={setPaidAt} data-autofocus />
        <TextField label="Payment reference" value={reference} onChange={setReference} maxLength={120} hint="Bank transfer or cheque number. Optional." />
        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  );
}

/** From the list: loads the purchase first (the list rows carry no lines), then shows the matching dialog. */
export function PurchaseActionDialog({ id, action, onClose, onDone }) {
  const { data, error, reload } = useAdminQuery(id ? purchaseApiPath(id) : null, undefined, { prefetchNext: false });
  const purchase = data?.purchase || data;
  if (purchase?.id && String(purchase.id) === String(id)) {
    if (action === "receive") return <ReceiveDialog purchase={purchase} onClose={onClose} onDone={onDone} />;
    if (action === "void") return <VoidDialog purchase={purchase} onClose={onClose} onDone={onDone} />;
    if (action === "paid") return <PaidDialog purchase={purchase} onClose={onClose} onDone={onDone} />;
  }
  return (
    <Modal open onClose={onClose} title="Loading purchase" description="Getting the purchase lines." footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      {error ? <ErrorState title="Could not load this purchase" description={error.message} onRetry={reload} /> : <div className="adm-stack"><Skeleton height={16} width="60%" /><Skeleton height={16} width="80%" /><Skeleton height={16} width="40%" /></div>}
    </Modal>
  );
}
