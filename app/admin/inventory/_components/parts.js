"use client";

import { StatusBadge } from "../../_kit";
import { STATUS, capText, num } from "../_lib/stock";

/** Status pill for an item row or a calendar day. */
export function StockStatus({ status }) {
  const s = STATUS[status];
  if (!s) return <span className="adm-muted">-</span>;
  return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
}

/** Thin coloured bar: sold + held out of capacity. Unlimited items get a flat info-tinted track. */
export function CapacityBar({ capacity, sold = 0, held = 0, status }) {
  if (capacity === null || capacity === undefined) return <span className="inv-bar is-unlimited" aria-hidden="true" />;
  const cap = Math.max(capacity, 0);
  const pct = (n) => (cap > 0 ? Math.min(100, (n / cap) * 100) : 0);
  const soldPct = cap > 0 ? pct(sold) : 100;
  const heldPct = Math.min(pct(held), 100 - soldPct);
  return (
    <span
      className={`inv-bar${status ? ` is-${status}` : ""}`}
      role="img"
      aria-label={`${num(sold)} sold, ${num(held)} held of ${capText(capacity)}`}
    >
      <i className="inv-bar__sold" style={{ width: `${soldPct}%` }} />
      <i className="inv-bar__held" style={{ width: `${heldPct}%` }} />
    </span>
  );
}

/** Inline error block that is announced to screen readers (server errors next to the control that caused them). */
export function InlineError({ children }) {
  return children ? <p className="inv-error" role="alert">{children}</p> : null;
}
