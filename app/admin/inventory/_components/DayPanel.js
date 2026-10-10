"use client";

import { useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Button, Drawer, SelectField, TextArea, TextField, useToast } from "../../_kit";
import { formatDayKey } from "../../_lib/format";
import { STATUS, capText, daysBetween, itemApiPath, num, parseCount, stockErrorText } from "../_lib/stock";
import { InlineError, StockStatus } from "./parts";

/**
 * Side panel for one calendar day or a selected range. Saving uses PUT /admin/stock/items/:id/days with mode "set";
 * "Reset to default" uses mode "clear". Past dates are shown read-only.
 */
export default function DayPanel({ item, days, selection, canWrite, today, onClose, onSaved, onBulk }) {
  return selection ? (
    <Drawer
      open
      onClose={onClose}
      width={460}
      title={selection.from === selection.to ? formatDayKey(selection.from) : `${formatDayKey(selection.from)} to ${formatDayKey(selection.to)}`}
      description={`${item.title}${item.variantLabel ? ` - ${item.variantLabel}` : ""}`}
    >
      <Body key={`${selection.from}_${selection.to}`} item={item} days={days} selection={selection} canWrite={canWrite} today={today} onClose={onClose} onSaved={onSaved} onBulk={onBulk} />
    </Drawer>
  ) : null;
}

function Body({ item, days, selection, canWrite, today, onClose, onSaved, onBulk }) {
  const api = useAdminApi();
  const toast = useToast();
  const single = selection.from === selection.to;
  const inRange = (days || []).filter((d) => d.date >= selection.from && d.date <= selection.to);
  const day = single ? inRange[0] : null;
  const count = daysBetween(selection.from, selection.to);
  const past = selection.to < today;
  const editable = canWrite && !past;
  const [capacity, setCapacity] = useState(day && day.capacitySource === "override" && day.capacity !== null ? String(day.capacity) : "");
  const [closed, setClosed] = useState(single ? (day?.closed ? "closed" : "open") : "keep");
  const [note, setNote] = useState(day?.note || "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState("");

  const committed = single && day ? (day.sold || 0) + (day.held || 0) : null;
  const dirty = single
    ? capacity !== (day && day.capacitySource === "override" && day.capacity !== null ? String(day.capacity) : "") || closed !== (day?.closed ? "closed" : "open") || note !== (day?.note || "")
    : capacity.trim() !== "" || closed !== "keep" || note.trim() !== "";

  async function run(kind, body, success) {
    setBusy(kind);
    setError("");
    try {
      await api.put(`${itemApiPath(item.id)}/days`, { from: selection.from, to: selection.to, ...body });
      toast.success(success);
      onSaved();
      onClose();
    } catch (e) {
      setError(stockErrorText(e));
    } finally {
      setBusy("");
    }
  }

  function save(event) {
    event.preventDefault();
    setFieldError("");
    const parsed = parseCount(capacity, { label: "Capacity" });
    if (parsed.error) {
      setFieldError(parsed.error);
      return;
    }
    if (single && parsed.value !== null && committed !== null && parsed.value < committed) {
      setFieldError(`${num(committed)} unit${committed === 1 ? " is" : "s are"} already sold or held on this date, so capacity cannot be lower than ${num(committed)}.`);
      return;
    }
    if (parsed.value === null && !single && closed === "keep" && !note.trim()) {
      setFieldError("Enter a capacity, change the sale status or add a note.");
      return;
    }
    run(
      "save",
      {
        mode: "set",
        ...(parsed.value !== null ? { capacity: parsed.value } : {}),
        ...(closed !== "keep" ? { closed: closed === "closed" } : {}),
        ...(single || note.trim() ? { note: note.trim() } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      },
      single ? "Day updated" : `Updated ${count} dates`
    );
  }

  return (
    <form className="adm-stack" onSubmit={save} noValidate>
      {single && day ? (
        <>
          <div className="adm-row"><StockStatus status={day.status} />{day.capacitySource ? <span className="adm-muted">Capacity from {day.capacitySource === "override" ? "this date's own setting" : day.capacitySource === "default" ? "the item default" : day.capacitySource === "legacy" ? "the activity option" : "no limit"}</span> : null}</div>
          <dl className="inv-facts">
            <div className="inv-fact"><span>Capacity</span><b>{capText(day.capacity)}</b></div>
            <div className="inv-fact"><span>Sold</span><b>{num(day.sold)}</b></div>
            <div className="inv-fact"><span>Held</span><b>{num(day.held)}</b></div>
            <div className="inv-fact"><span>Available</span><b>{capText(day.available)}</b></div>
          </dl>
          {day.status === "non_operational" ? <p className="inv-note">This option does not operate on this day (weekday or blackout date). You can still set stock, but guests cannot book it.</p> : null}
        </>
      ) : (
        <p className="inv-note">{count} dates selected. The values below are written to every one of them. For adding or removing units use Bulk edit.</p>
      )}
      {past ? <p className="inv-note">{single ? "This date is in the past and can no longer be changed." : "This range ends in the past and cannot be changed."} {STATUS.past.label} dates are read-only.</p> : null}
      {!canWrite ? <p className="inv-note">You can view stock but not change it. Ask an operations admin for the stock write permission.</p> : null}

      <TextField
        label="Capacity for this date"
        inputMode="numeric"
        value={capacity}
        onChange={setCapacity}
        error={fieldError}
        disabled={!editable}
        placeholder={item.defaultCapacity === null || item.defaultCapacity === undefined ? "Unlimited (item default)" : `${item.defaultCapacity} (item default)`}
        hint={single ? "Overrides the item default for this date only. Leave empty to keep it unchanged." : "Leave empty to keep each date's capacity unchanged."}
        data-autofocus
      />
      <SelectField
        label="Sale status"
        value={closed}
        onChange={setClosed}
        disabled={!editable}
        options={[...(single ? [] : [{ value: "keep", label: "Leave as is" }]), { value: "open", label: "Open for sale" }, { value: "closed", label: "Closed (not bookable)" }]}
      />
      <TextField label="Note" value={note} onChange={setNote} disabled={!editable} maxLength={200} placeholder="Optional, e.g. Private event" />
      <TextArea label="Reason" rows={2} maxLength={300} value={reason} onChange={setReason} disabled={!editable} hint="Optional. Saved in the stock ledger." />
      <InlineError>{error}</InlineError>

      <div className="adm-row" style={{ justifyContent: "space-between" }}>
        <div className="adm-row">
          {editable ? <Button variant="primary" type="submit" loading={busy === "save"} disabled={!dirty || !!busy}>Save</Button> : null}
          <Button variant="ghost" onClick={onClose} disabled={!!busy}>{editable ? "Cancel" : "Close"}</Button>
        </div>
        {editable ? (
          <div className="adm-row">
            <Button size="sm" variant="ghost" onClick={() => onBulk(selection)} disabled={!!busy}>Bulk edit</Button>
            <Button size="sm" variant="ghost" loading={busy === "clear"} disabled={!!busy} onClick={() => run("clear", { mode: "clear", ...(reason.trim() ? { reason: reason.trim() } : {}) }, "Reset to the item default")}>Reset to default</Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
