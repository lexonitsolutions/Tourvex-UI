"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { addDaysKey, dayKey, formatDayKey } from "../../_lib/format";
import { useLeaveGuard } from "../../content/_components/leaveGuard";
import { Button, ConfirmDialog, DateField, ErrorState, Icon, MoneyField, PageHeader, SelectField, Skeleton, TextArea, TextField, useToast } from "../../_kit";
import { STOCK_API, WEEKDAYS, itemApiPath, typeLabel } from "../../inventory/_lib/stock";
import {
  BASE_CURRENCY, CURRENCIES, MAX_DAYS, PURCHASES_PATH, SUPPLIERS_PATH, blankLine, emptyForm, fromPurchase, isOverdue, itemHref, lineMetrics, money, movementsHref, plural,
  purchaseApiPath, purchaseErrorText, purchaseHref, rangeText, toPayload, totalsOf, validateForm, weekdaysText,
} from "../_lib/purchasing";
import { InlineError, Picker, PurchaseStatus } from "./parts";
import { PaidDialog, ReceiveDialog, VoidDialog } from "./PurchaseDialogs";
import SupplierDialog from "./SupplierDialog";

const autoDue = (invoiceDate, terms) => (invoiceDate && terms > 0 ? addDaysKey(invoiceDate, terms) : "");
const optionOfItem = (it) => ({ id: it.id, title: it.title || "Untitled", sub: [it.variantLabel, typeLabel(it.productType)].filter(Boolean).join(" - ") });

/* ------------------------------------------------------------------ one line */

function LineCard({ line, index, errors, readOnly, currency, canRemove, onChange, onRemove }) {
  const m = lineMetrics(line);
  const set = (patch) => onChange(line.key, patch);
  const toggleDay = (d) => set({ weekdays: line.weekdays.includes(d) ? line.weekdays.filter((x) => x !== d) : [...line.weekdays, d] });
  const ready = m.units > 0 && m.total > 0;
  return (
    <li className={`pur-line${errors && Object.keys(errors).length ? " has-error" : ""}`} aria-label={`Line ${index + 1}`}>
      <div className="pur-line__head">
        <span className="pur-line__n">Line {index + 1}</span>
        {!readOnly && canRemove ? <Button size="sm" variant="ghost" icon="trash" onClick={() => onRemove(line.key)} aria-label={`Remove line ${index + 1}`}>Remove</Button> : null}
      </div>
      <Picker
        label="Stock item"
        required
        error={errors?.itemId}
        valueTitle={line.title || line.itemId}
        valueSub={line.itemId ? [line.variantLabel, typeLabel(line.productType)].filter(Boolean).join(" - ") : ""}
        placeholder="Search for an item"
        searchPlaceholder="Search stock items"
        icon="inventory"
        disabled={readOnly}
        path={`${STOCK_API}/items`}
        buildQuery={(q) => ({ q: q || undefined, limit: 10, sort: "title" })}
        option={optionOfItem}
        emptyText="No stock items match."
        onPick={(it) => set({ itemId: it.id, title: it.title || "", variantLabel: it.variantLabel || "", productType: it.productType || "" })}
      />
      <div className="pur-line__grid">
        <TextField label="Units per day" required inputMode="numeric" value={line.quantity} onChange={(quantity) => set({ quantity: quantity.replace(/[^0-9]/g, "") })} error={errors?.quantity} disabled={readOnly} placeholder="e.g. 4" />
        <DateField label="From" required value={line.dateFrom} onChange={(dateFrom) => set({ dateFrom, ...(line.dateTo && dateFrom > line.dateTo ? { dateTo: dateFrom } : {}), ...(!line.dateTo && dateFrom ? { dateTo: dateFrom } : {}) })} error={errors?.dateFrom} disabled={readOnly} />
        <DateField label="To" required value={line.dateTo} min={line.dateFrom || undefined} onChange={(dateTo) => set({ dateTo })} error={errors?.dateTo} disabled={readOnly} />
        <MoneyField label="Unit cost" required currency={currency} value={line.unitCost} onChange={(unitCost) => set({ unitCost })} error={errors?.unitCost} disabled={readOnly} />
        <TextField label="Tax" inputMode="decimal" suffix="%" value={line.taxPercent} onChange={(taxPercent) => set({ taxPercent: taxPercent.replace(/[^0-9.]/g, "") })} error={errors?.taxPercent} disabled={readOnly} placeholder="0" />
      </div>
      <div className="pur-wdrow">
        <span className="pur-wdrow__label" id={`${line.key}-wd`}>Only on</span>
        <div className="pur-wd" role="group" aria-labelledby={`${line.key}-wd`}>
          {WEEKDAYS.map((d) => (
            <button key={d.value} type="button" aria-pressed={line.weekdays.includes(d.value)} disabled={readOnly} onClick={() => toggleDay(d.value)}>{d.label}</button>
          ))}
        </div>
        <span className="pur-wdrow__hint">{line.weekdays.length && line.weekdays.length < 7 ? weekdaysText(line.weekdays) : "None picked means every day."}</span>
      </div>
      {errors?.weekdays ? <p className="pur-fielderror" role="alert">{errors.weekdays}</p> : null}
      <p className={`pur-calc${ready ? " is-ready" : ""}`} aria-live="polite">
        {m.span > MAX_DAYS ? (
          <span>That range is {m.span} days; a line covers at most {MAX_DAYS}.</span>
        ) : m.dates > 0 ? (
          <>
            <span>{plural(m.dates, "date")} <i aria-hidden="true">&times;</i> {plural(m.quantity, "unit")} <i aria-hidden="true">=</i> <b>{plural(m.units, "unit")}</b></span>
            <span className="pur-calc__total">{ready ? <>Line total <b>{money(m.total, currency)}</b>{m.tax > 0 ? <small> + {money(m.tax, currency)} tax</small> : null}</> : "Add a unit cost for the line total"}</span>
          </>
        ) : (
          <span>Pick the dates this line covers to see the units.</span>
        )}
      </p>
    </li>
  );
}

/* ------------------------------------------------------------------ actions */

function Actions({ status, isNew, canWrite, dirty, busy, notesDirty, onSave, onReceive, onPaid, onVoid, onSaveNotes }) {
  if (!canWrite) return null;
  if (status === "void") return null;
  if (status === "draft") {
    return (
      <>
        {!isNew ? <Button variant="ghost" onClick={onVoid} disabled={!!busy}>Void</Button> : null}
        <Button variant={isNew ? "primary" : "secondary"} icon="check" onClick={onSave} loading={busy === "save"} disabled={!!busy && busy !== "save"}>Save draft</Button>
        {!isNew ? <Button variant="primary" icon="inventory" onClick={onReceive} disabled={!!busy || dirty} title={dirty ? "Save your changes first" : undefined}>Receive stock</Button> : null}
      </>
    );
  }
  return (
    <>
      {notesDirty ? <Button variant="secondary" icon="check" onClick={onSaveNotes} loading={busy === "notes"} disabled={!!busy && busy !== "notes"}>Save notes</Button> : null}
      {status === "received" ? <Button variant="ghost" onClick={onVoid} disabled={!!busy}>Void</Button> : null}
      {status === "received" ? <Button variant="primary" icon="wallet" onClick={onPaid} disabled={!!busy}>Mark as paid</Button> : null}
    </>
  );
}

/* ------------------------------------------------------------------ editor */

function Editor({ purchase, reload }) {
  const api = useAdminApi();
  const router = useRouter();
  const toast = useToast();
  const search = useSearchParams();
  const { can } = useAdminMe();
  const canWrite = can("purchasing.write");
  const isNew = !purchase;
  const status = purchase?.status || "draft";
  const editable = canWrite && status === "draft";
  const presetId = isNew ? search.get("item") || "" : "";

  const [form, setForm] = useState(() => (purchase ? fromPurchase(purchase) : { ...emptyForm(), invoiceDate: dayKey() }));
  const [base, setBase] = useState(() => JSON.stringify(form));
  const [dueAuto, setDueAuto] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState("");
  const [serverError, setServerError] = useState("");
  const [dialog, setDialog] = useState(null); // receive | paid | void
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [leaveTo, setLeaveTo] = useState("");
  const [today] = useState(() => dayKey());

  // ?item= : preselect that stock item on the first (empty) line, once its title is known
  const preset = useAdminQuery(presetId ? itemApiPath(presetId) : null, undefined, { prefetchNext: false });
  const [presetDone, setPresetDone] = useState(false);
  if (presetId && !presetDone && (preset.data?.item || preset.error)) {
    setPresetDone(true);
    const it = preset.data?.item;
    const parts = presetId.split(":");
    const next = {
      ...form,
      lines: form.lines.map((l, i) =>
        i === 0 && !l.itemId ? { ...l, itemId: presetId, title: it?.title || parts[1] || presetId, variantLabel: it?.variantLabel || "", productType: it?.productType || parts[0] || "" } : l
      ),
    };
    setForm(next);
    setBase(JSON.stringify(next));
  }

  const validation = useMemo(() => validateForm(form), [form]);
  const errors = show ? validation : { header: {}, lines: {} };
  const live = useMemo(() => totalsOf(form.lines), [form.lines]);
  const dirty = JSON.stringify(form) !== base;
  const notesDirty = !editable && !isNew && form.notes !== (purchase.notes || "");
  const showServerTotals = !!purchase && !dirty && typeof purchase.total === "number";
  const totals = showServerTotals ? { subtotal: purchase.subtotal, tax: purchase.taxTotal, total: purchase.total, units: live.units } : live;

  useLeaveGuard(() => (editable || isNew ? JSON.stringify(form) !== base : false), (href) => setLeaveTo(href));

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const changeLine = (key, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const removeLine = (key) => setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.key !== key) }));
  const addLine = () => setForm((f) => { const last = f.lines[f.lines.length - 1]; return { ...f, lines: [...f.lines, blankLine(last ? { dateFrom: last.dateFrom, dateTo: last.dateTo } : {})] }; });

  function pickSupplier(s) {
    const terms = Number(s.paymentTermsDays) || 0;
    setForm((f) => {
      const useAuto = dueAuto || !f.dueDate;
      return { ...f, supplierId: s.id, supplierName: s.name, supplierTerms: terms, currency: s.currency || f.currency, dueDate: useAuto && terms > 0 ? autoDue(f.invoiceDate, terms) : f.dueDate };
    });
    if (terms > 0) setDueAuto(true);
  }
  function changeInvoiceDate(invoiceDate) {
    setForm((f) => ({ ...f, invoiceDate, dueDate: (dueAuto || !f.dueDate) && f.supplierTerms > 0 ? autoDue(invoiceDate, f.supplierTerms) : f.dueDate }));
  }

  async function save() {
    setShow(true);
    setServerError("");
    if (!validation.ok) {
      toast.error("Some fields need attention. They are marked below.");
      return;
    }
    setBusy("save");
    try {
      const body = toPayload(form);
      const res = isNew ? await api.post(PURCHASES_PATH, body) : await api.patch(purchaseApiPath(purchase.id), body);
      const saved = res?.purchase || res;
      toast.success(isNew ? "Draft saved" : "Changes saved");
      setBase(JSON.stringify(form));
      if (isNew && saved?.id) router.replace(purchaseHref(saved.id));
      else reload();
    } catch (e) {
      setServerError(purchaseErrorText(e));
    } finally {
      setBusy("");
    }
  }
  async function saveNotes() {
    setBusy("notes");
    setServerError("");
    try {
      await api.patch(purchaseApiPath(purchase.id), { notes: form.notes.trim() });
      toast.success("Notes saved");
      setBase(JSON.stringify(form));
      reload();
    } catch (e) {
      setServerError(purchaseErrorText(e));
    } finally {
      setBusy("");
    }
  }

  const overdue = purchase ? isOverdue(purchase, today) : false;
  const actions = (
    <Actions status={status} isNew={isNew} canWrite={canWrite} dirty={dirty} busy={busy} notesDirty={notesDirty} onSave={save} onSaveNotes={saveNotes} onReceive={() => setDialog("receive")} onPaid={() => setDialog("paid")} onVoid={() => setDialog("void")} />
  );
  const hasActions = canWrite && status !== "void";
  const lineTitle = (l) => `${l.title || l.itemId}${l.variantLabel ? ` - ${l.variantLabel}` : ""}`;
  const currencyNote = form.currency && form.currency !== BASE_CURRENCY;

  return (
    <div className={`adm-pur${hasActions ? " has-dock" : ""}`}>
      <Link href="/admin/purchasing" className="pur-back"><Icon name="chevronLeft" size={14} />Purchases</Link>
      <PageHeader
        title={isNew ? "New purchase" : purchase.number}
        description={isNew ? "Record a supplier invoice. Receiving it adds the units to stock." : `${purchase.supplierName || "Supplier"}${purchase.supplierInvoiceNumber ? ` - invoice ${purchase.supplierInvoiceNumber}` : ""}`}
        meta={
          <div className="adm-row">
            <PurchaseStatus status={status} overdue={overdue} />
            {isNew ? <span className="adm-muted">Not saved yet</span> : null}
            {purchase?.receivedAt ? <span className="adm-muted">Received {formatDayKey(String(purchase.receivedAt).slice(0, 10))}</span> : null}
            {purchase?.paidAt ? <span className="adm-muted">Paid {formatDayKey(String(purchase.paidAt).slice(0, 10))}</span> : null}
            {dirty && editable ? <span className="pur-dirty">Unsaved changes</span> : null}
          </div>
        }
        actions={hasActions ? <div className="adm-row pur-headactions">{actions}</div> : null}
      />

      {!canWrite && !isNew ? <p className="pur-note" role="status" style={{ marginBottom: 12 }}>You have view-only access to purchasing.</p> : null}
      {status === "received" || status === "paid" ? <p className="pur-note" role="status" style={{ marginBottom: 12 }}>Stock was added by this purchase, so its lines are locked. You can still edit the notes{status === "received" ? ", mark it paid or void it" : ""}.</p> : null}
      {status === "void" ? <p className="pur-note" role="status" style={{ marginBottom: 12 }}>This purchase is void. Any units it added to stock were taken out again.</p> : null}

      <div className="pur-layout">
        <div className="pur-main">
          <section className="pur-card" aria-label="Supplier invoice">
            <div className="pur-card__head"><div><h2 className="pur-card__title">Supplier invoice</h2><p className="pur-card__sub">Who you bought from and what their invoice says.</p></div></div>
            <div className="adm-stack">
              <div className="pur-formrow">
                <Picker
                  label="Supplier"
                  required
                  error={errors.header.supplierId}
                  valueTitle={form.supplierName}
                  placeholder="Search suppliers"
                  searchPlaceholder="Search suppliers"
                  icon="partners"
                  disabled={!editable}
                  path={SUPPLIERS_PATH}
                  buildQuery={(q) => ({ q: q || undefined, active: "true", limit: 10 })}
                  option={(s) => ({ id: s.id, title: s.name, sub: [s.country, s.email].filter(Boolean).join(" - ") })}
                  emptyText="No active supplier matches."
                  onPick={pickSupplier}
                  footer={(close) => (
                    <button type="button" className="pur-picker__add" onClick={() => { close(); setAddingSupplier(true); }}><Icon name="plus" size={15} />Add supplier</button>
                  )}
                />
                <TextField label="Supplier invoice number" value={form.supplierInvoiceNumber} onChange={(supplierInvoiceNumber) => set({ supplierInvoiceNumber })} disabled={!editable} maxLength={80} hint="Printed on their invoice. Each supplier invoice can be recorded once." />
              </div>
              <div className="pur-formrow pur-formrow--3">
                <DateField label="Invoice date" required value={form.invoiceDate} onChange={changeInvoiceDate} error={errors.header.invoiceDate} disabled={!editable} />
                <DateField label="Due date" value={form.dueDate} min={form.invoiceDate || undefined} onChange={(dueDate) => { setDueAuto(false); set({ dueDate }); }} error={errors.header.dueDate} disabled={!editable} hint={dueAuto && form.dueDate ? "From the supplier's payment terms." : undefined} />
                <SelectField label="Currency" value={form.currency} onChange={(currency) => set({ currency })} options={CURRENCIES} disabled={!editable} />
              </div>
              {currencyNote ? <p className="pur-note">Sales and margin reports are in {BASE_CURRENCY}. Enter costs in {BASE_CURRENCY}, or convert them first, so the margin is right.</p> : null}
              <TextArea label="Notes" value={form.notes} onChange={(notes) => set({ notes })} rows={3} maxLength={1000} disabled={!canWrite || status === "void"} hint="Internal. Can be edited at any time." />
            </div>
          </section>

          <section className="pur-card" aria-label="Lines">
            <div className="pur-card__head">
              <div><h2 className="pur-card__title">Lines</h2><p className="pur-card__sub">Each line adds units to one stock item on every date it covers.</p></div>
              {editable ? <Button size="sm" icon="plus" onClick={addLine}>Add line</Button> : null}
            </div>
            {errors.header.lines ? <InlineError>{errors.header.lines}</InlineError> : null}
            <ol className="pur-lines">
              {form.lines.map((l, i) => (
                <LineCard key={l.key} line={l} index={i} errors={errors.lines[l.key]} readOnly={!editable} currency={form.currency} canRemove={form.lines.length > 1} onChange={changeLine} onRemove={removeLine} />
              ))}
            </ol>
            {editable ? <div className="pur-addrow"><Button icon="plus" onClick={addLine}>Add another line</Button></div> : null}
          </section>
          <InlineError>{serverError}</InlineError>
        </div>

        <aside className="pur-side" aria-label="Summary">
          <section className="pur-card" aria-label="Totals">
            <div className="pur-card__head"><div><h2 className="pur-card__title">Totals</h2><p className="pur-card__sub">{showServerTotals ? "As recorded." : "Estimate. The server confirms the final amounts when you save."}</p></div></div>
            <dl className="pur-totals">
              <div><dt>Units added</dt><dd>{totals.units.toLocaleString("en-GB")}</dd></div>
              <div><dt>Subtotal</dt><dd>{money(totals.subtotal, form.currency)}</dd></div>
              <div><dt>Tax</dt><dd>{money(totals.tax, form.currency)}</dd></div>
              <div className="is-total"><dt>Total</dt><dd>{money(totals.total, form.currency)}</dd></div>
            </dl>
            {purchase && (purchase.dueDate || purchase.paidAt) ? (
              <dl className="pur-facts">
                {purchase.dueDate ? <div><dt>Due</dt><dd className={overdue ? "is-bad" : undefined}>{formatDayKey(String(purchase.dueDate).slice(0, 10))}{overdue ? " (overdue)" : ""}</dd></div> : null}
                {purchase.paidAt ? <div><dt>Paid</dt><dd>{formatDayKey(String(purchase.paidAt).slice(0, 10))}</dd></div> : null}
                {purchase.paymentReference ? <div><dt>Reference</dt><dd>{purchase.paymentReference}</dd></div> : null}
              </dl>
            ) : null}
          </section>

          {purchase && (status === "received" || status === "paid") ? (
            <section className="pur-card" aria-label="Stock effects">
              <div className="pur-card__head"><div><h2 className="pur-card__title">Stock effects</h2><p className="pur-card__sub">What receiving this purchase changed.</p></div></div>
              <ul className="pur-effects pur-effects--links">
                {form.lines.map((l) => {
                  const m = lineMetrics(l);
                  return (
                    <li key={l.key}>
                      <b>+{m.units.toLocaleString("en-GB")}</b>
                      <Link href={itemHref(l.itemId)} className="pur-link">{lineTitle(l)}</Link>
                      <small>{plural(Number(l.quantity), "unit")} a day on {plural(m.dates, "date")}: {rangeText(l.dateFrom, l.dateTo)}, {weekdaysText(l.weekdays)}. Unit cost set to {money(l.unitCost, form.currency)}.</small>
                    </li>
                  );
                })}
              </ul>
              <Link href={movementsHref(purchase.number)} className="pur-link pur-link--block"><Icon name="movements" size={15} />See these movements in the stock ledger</Link>
            </section>
          ) : null}
        </aside>
      </div>

      {hasActions ? <div className="pur-dock">{actions}</div> : null}

      <SupplierDialog open={addingSupplier} supplier={null} onClose={() => setAddingSupplier(false)} onSaved={(s) => { if (s?.id) pickSupplier(s); }} />
      {dialog === "receive" && purchase ? <ReceiveDialog purchase={purchase} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "paid" && purchase ? <PaidDialog purchase={purchase} onClose={() => setDialog(null)} onDone={reload} /> : null}
      {dialog === "void" && purchase ? <VoidDialog purchase={purchase} onClose={() => setDialog(null)} onDone={reload} /> : null}
      <ConfirmDialog
        open={!!leaveTo}
        onClose={() => setLeaveTo("")}
        onConfirm={() => { const to = leaveTo; setBase(JSON.stringify(form)); setLeaveTo(""); router.push(to); }}
        tone="primary"
        title="Leave without saving?"
        description="You have changes that are not saved. If you leave now they are lost."
        confirmLabel="Leave"
      />
    </div>
  );
}

/** Loads the purchase (GET /admin/purchasing/purchases/:id) and mounts the editor; `id` undefined = new purchase. */
export default function PurchaseEditor({ id }) {
  const { data, error, reload } = useAdminQuery(id ? purchaseApiPath(id) : null, undefined, { prefetchNext: false });
  const purchase = id && data ? data.purchase || data : null;
  if (id && error && !purchase) {
    return (
      <div className="adm-pur">
        <Link href="/admin/purchasing" className="pur-back"><Icon name="chevronLeft" size={14} />Purchases</Link>
        <ErrorState title={error.status === 404 ? "Purchase not found" : "Could not load this purchase"} description={error.message} onRetry={error.status === 404 ? undefined : reload} />
      </div>
    );
  }
  if (id && !purchase) {
    return (
      <div className="adm-pur">
        <PageHeader title="Purchase" />
        <div className="pur-stack"><div className="pur-card"><Skeleton height={16} width="40%" /><br /><Skeleton height={220} /></div></div>
      </div>
    );
  }
  return <Editor key={purchase ? `${purchase.id}-${purchase.status}-${purchase.updatedAt || ""}` : "new"} purchase={purchase} reload={reload} />;
}
