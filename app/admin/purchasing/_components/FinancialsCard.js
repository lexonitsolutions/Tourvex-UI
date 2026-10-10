"use client";

import "../purchasing.css";
import Link from "next/link";
import { Card, Icon } from "../../_kit";
import { itemHref, money } from "../_lib/purchasing";
import { marginTone } from "./MarginReport";

const pctText = (v) => (typeof v === "number" && Number.isFinite(v) ? `${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%` : "-");

/**
 * Read-only revenue / cost / margin of a booking. Renders nothing unless the API sent `booking.financials`
 * (only for callers with finance.read). Without a cost it points to the item's stock page to set the unit cost.
 */
export default function FinancialsCard({ booking }) {
  const f = booking?.financials;
  if (!f || typeof f !== "object") return null;
  const cur = booking.currency || "AED";
  const noCost = f.cost === null || f.cost === undefined;
  const itemId = booking.stockItemId || f.itemId || null;
  const href = itemId ? itemHref(itemId) : `/admin/inventory${booking.title ? `?q=${encodeURIComponent(booking.title)}` : ""}`;
  const rows = [
    ["Revenue ex-tax", money(f.revenueExTax, cur)],
    ["Tax", money(f.taxTotal, cur)],
    ["Total", money(f.total, cur)],
    ["Cost", noCost ? "No cost recorded" : money(f.cost, cur)],
    ["Margin", noCost || f.margin === null || f.margin === undefined ? "-" : money(f.margin, cur)],
  ];
  return (
    <Card title="Financials">
      <div className="adm-pur">
        <dl className="pur-totals">
          {rows.map(([k, v]) => (
            <div key={k} className={k === "Total" ? "is-total" : undefined}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
          <div><dt>Margin %</dt><dd><span className={`pur-pct is-${marginTone(f.marginPct)}`}>{noCost ? "-" : pctText(f.marginPct)}</span></dd></div>
        </dl>
        {noCost ? (
          <p className="pur-note" style={{ marginTop: 12 }}>
            This booking was made before a unit cost was set, so there is no margin.{" "}
            <Link href={href} className="pur-link"><Icon name="inventory" size={14} />{itemId ? "Set the unit cost on the item" : "Find the item in Stock"}</Link>
            {" "}Bookings made afterwards will record it.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
