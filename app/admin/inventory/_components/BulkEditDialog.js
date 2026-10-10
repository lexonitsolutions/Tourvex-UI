"use client";

import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, DateRangeField, Modal, SelectField, TextArea, TextField, useToast } from "../../_kit";
import { MAX_DAYS, WEEKDAYS, countDays, daysBetween, itemApiPath, parseCount, stockErrorText } from "../_lib/stock";
import { InlineError } from "./parts";

const MODES = [
  { value: "set", label: "Set to", hint: "Writes this exact capacity for every selected date." },
  { value: "add", label: "Add", hint: "Raises the capacity of each selected date by this many units." },
  { value: "remove", label: "Remove", hint: "Lowers the capacity of each selected date by this many units. It never goes below what is already sold or held." },
  { value: "clear", label: "Reset", hint: "Deletes the per-date changes, so the dates fall back to the item default." },
];
const ALL_DAYS = WEEKDAYS.map((d) => d.value);

/**
 * Bulk edit of daily capacity: PUT /admin/stock/items/:id/days { from, to, weekdays?, mode, capacity?, closed?, note?, reason? }.
 * `initial` pre-fills the range / mode (the alerts page opens it in "add" mode).
 */
export default function BulkEditDialog({ item, initial, onClose, onDone }) {
  return item ? <Inner item={item} initial={initial} onClose={onClose} onDone={onDone} /> : null;
}

function Inner({ item, initial, onClose, onDone }) {
  const api = useAdminApi();
  const toast = useToast();
  const [form, setForm] = useState({
    from: initial?.from || "",
    to: initial?.to || initial?.from || "",
    weekdays: ALL_DAYS,
    mode: initial?.mode || "set",
    amount: "",
    closed: "keep",
    note: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const mode = MODES.find((m) => m.value === form.mode);
  const dates = countDays(form.from, form.to, form.weekdays);
  const span = form.from && form.to && form.to >= form.from ? daysBetween(form.from, form.to) : 0;

  function toggleDay(value) {
    set({ weekdays: form.weekdays.includes(value) ? form.weekdays.filter((d) => d !== value) : [...form.weekdays, value] });
  }

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.from || !form.to) next.range = "Choose the first and last date.";
    else if (form.to < form.from) next.range = "The last date must not be before the first date.";
    else if (span > MAX_DAYS) next.range = `At most ${MAX_DAYS} days at a time. This range is ${span} days.`;
    if (!form.weekdays.length) next.weekdays = "Pick at least one weekday.";
    else if (!next.range && dates === 0) next.weekdays = "None of the selected weekdays fall inside this range.";
    let capacity = null;
    if (form.mode !== "clear") {
      const parsed = parseCount(form.amount, { required: form.mode !== "set", label: "Amount" });
      if (parsed.error) next.amount = parsed.error;
      else if (form.mode === "set" && parsed.value === null && form.closed === "keep" && !form.note.trim()) next.amount = "Enter a capacity, close the dates or add a note.";
      else if ((form.mode === "add" || form.mode === "remove") && parsed.value === 0) next.amount = "Enter at least 1.";
      capacity = parsed.value;
    }
    if ((form.mode === "add" || form.mode === "remove") && form.reason.trim().length < 3) next.reason = "A reason is required when adding or removing stock.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await api.put(`${itemApiPath(item.id)}/days`, {
        from: form.from,
        to: form.to,
        ...(form.weekdays.length < 7 ? { weekdays: form.weekdays } : {}),
        mode: form.mode,
        ...(form.mode !== "clear" && capacity !== null ? { capacity } : {}),
        ...(form.mode === "set" && form.closed !== "keep" ? { closed: form.closed === "closed" } : {}),
        ...(form.mode === "set" && form.note.trim() ? { note: form.note.trim() } : {}),
        ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
      });
      const n = result?.updated ?? dates;
      toast.success(`Updated ${n} date${n === 1 ? "" : "s"}`);
      onClose();
      onDone?.(result);
    } catch (e) {
      setServerError(stockErrorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Bulk edit capacity"
      description={`${item.title}${item.variantLabel ? ` - ${item.variantLabel}` : ""}. Changes apply to every selected date and are written to the stock ledger.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="inv-bulk" loading={busy}>{dates ? `Apply to ${dates} date${dates === 1 ? "" : "s"}` : "Apply"}</Button>
        </>
      }
    >
      <form id="inv-bulk" className="adm-stack" onSubmit={submit} noValidate>
        <DateRangeField label="Dates" value={{ from: form.from, to: form.to }} onChange={(r) => set({ from: r.from || "", to: r.to || "" })} error={errors.range} hint={`Up to ${MAX_DAYS} days.`} />

        <div className="adm-field">
          <span className="adm-field__label" id="inv-wd-label">Weekdays</span>
          <div className="inv-wd" role="group" aria-labelledby="inv-wd-label">
            {WEEKDAYS.map((d) => (
              <button key={d.value} type="button" aria-pressed={form.weekdays.includes(d.value)} onClick={() => toggleDay(d.value)}>{d.label}</button>
            ))}
          </div>
          {errors.weekdays ? <p className="adm-field__error" role="alert">{errors.weekdays}</p> : null}
        </div>

        <div className="adm-field">
          <span className="adm-field__label" id="inv-mode-label">What to do</span>
          <div className="inv-modes" role="group" aria-labelledby="inv-mode-label">
            {MODES.map((m) => (
              <button key={m.value} type="button" aria-pressed={form.mode === m.value} onClick={() => set({ mode: m.value })}>{m.label}</button>
            ))}
          </div>
          <p className="adm-field__hint">{mode.hint}</p>
        </div>

        {form.mode !== "clear" ? (
          <TextField
            label={form.mode === "set" ? "Capacity per date" : "Units per date"}
            required={form.mode !== "set"}
            inputMode="numeric"
            value={form.amount}
            onChange={(amount) => set({ amount })}
            error={errors.amount}
            placeholder="e.g. 50"
            data-autofocus
          />
        ) : null}

        {form.mode === "set" ? (
          <div className="inv-formrow">
            <SelectField
              label="Sale status"
              value={form.closed}
              onChange={(closed) => set({ closed })}
              options={[{ value: "keep", label: "Leave as is" }, { value: "open", label: "Open for sale" }, { value: "closed", label: "Closed (not bookable)" }]}
            />
            <TextField label="Note" value={form.note} onChange={(note) => set({ note })} maxLength={200} placeholder="Optional, e.g. Eid peak" />
          </div>
        ) : null}

        <TextArea
          label="Reason"
          required={form.mode === "add" || form.mode === "remove"}
          rows={2}
          maxLength={300}
          value={form.reason}
          onChange={(reason) => set({ reason })}
          error={errors.reason}
          hint={form.mode === "add" || form.mode === "remove" ? "Saved in the ledger." : "Optional. Saved in the ledger."}
        />
        <InlineError>{serverError}</InlineError>
      </form>
    </Modal>
  );
}
