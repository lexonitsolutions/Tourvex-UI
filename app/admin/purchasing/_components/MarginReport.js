"use client";

import "../purchasing.css";
import Link from "next/link";
import { useMemo } from "react";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { fmtAed2, fmtInt } from "../../_lib/reports";
import { Icon, SelectFilter } from "../../_kit";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../_ui/components/tooltip";
import { PRODUCT_TYPES } from "../../inventory/_lib/stock";
import { SUPPLIERS_PATH, newPurchaseHref } from "../_lib/purchasing";

export const MARGIN_GROUPS = [
  { value: "product", label: "Product" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "type", label: "Type" },
];
const GROUP_HEAD = { product: "Product", day: "Day", month: "Month", type: "Type" };

/** Extra query for GET /admin/reports/margin (the date range comes from rangeQuery). */
export function marginQuery(params) {
  const groupBy = MARGIN_GROUPS.some((g) => g.value === params.groupBy) ? params.groupBy : "product";
  return { groupBy, productType: params.productType || undefined, supplierId: params.supplierId || undefined };
}

/** Margin colour: below 10% bad, 10 to 25% warn, 25% and up good. null = no costed bookings. */
export function marginTone(pct) {
  if (typeof pct !== "number" || !Number.isFinite(pct)) return "none";
  if (pct < 10) return "bad";
  if (pct < 25) return "warn";
  return "good";
}
const pctText = (v) => (typeof v === "number" && Number.isFinite(v) ? `${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%` : "-");

function Pct({ value }) {
  return <span className={`pur-pct is-${marginTone(value)}`}>{pctText(value)}</span>;
}

function InfoTip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="pur-info" aria-label={label}><Icon name="info" size={13} /></button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

/** Group-by switch, product type and supplier filters. The date range is the report page's own RangePicker. */
export function MarginFilters({ params, setParams }) {
  const q = marginQuery(params);
  const suppliers = useAdminQuery(SUPPLIERS_PATH, { limit: 100 }, { prefetchNext: false });
  const supplierOptions = useMemo(() => (suppliers.data?.items || []).map((s) => ({ value: s.id, label: s.name })), [suppliers.data]);
  return (
    <div className="adm-pur pur-marginfilters">
      <div className="pur-seg" role="group" aria-label="Group by">
        <span className="pur-seg__label">Group by</span>
        {MARGIN_GROUPS.map((g) => (
          <button key={g.value} type="button" aria-pressed={q.groupBy === g.value} onClick={() => setParams({ groupBy: g.value === "product" ? "" : g.value })}>{g.label}</button>
        ))}
      </div>
      <SelectFilter label="Type" allLabel="All" value={params.productType || ""} onChange={(v) => setParams({ productType: v })} options={PRODUCT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
      <SelectFilter label="Supplier" allLabel="All" value={params.supplierId || ""} onChange={(v) => setParams({ supplierId: v })} options={supplierOptions} />
    </div>
  );
}

const rowTitle = (r) => r.title || r.key || "-";

/** Report body for GET /admin/reports/margin: totals, table with a totals row, explanations. */
export function MarginView({ data, groupBy = "product" }) {
  const rows = data.rows || [];
  const t = data.totals || {};
  const empty = !rows.length;
  const allUncosted = !empty && (t.bookings || 0) > 0 && (t.bookingsWithoutCost || 0) >= (t.bookings || 0);
  const tiles = [
    { label: "Revenue ex-tax", value: fmtAed2(t.revenueExTax), tone: "mint" },
    { label: "Cost", value: fmtAed2(t.cost), tone: "peach" },
    { label: "Margin", value: fmtAed2(t.margin), tone: "teal" },
    { label: "Margin %", value: <Pct value={t.marginPct} />, tone: "butter" },
    { label: "Bookings", value: fmtInt(t.bookings), tone: "periwinkle" },
  ];

  return (
    <>
      <div className="adm-reporttotals">
        {tiles.map((x) => (
          <div key={x.label} className={`adm-tone-${x.tone}`}><span>{x.label}</span><b>{x.value}</b></div>
        ))}
      </div>

      <section className="adm-bt" style={{ "--i": 2 }}>
        <header className="adm-bt__head"><div><h2 className="adm-bt__title">Margin by {GROUP_HEAD[groupBy].toLowerCase()}</h2><p className="adm-bt__sub">Revenue without tax against the cost recorded when each booking was made</p></div></header>
        {empty ? (
          <div className="adm-empty">
            <span className="adm-empty__icon"><Icon name="inbox" size={22} /></span>
            <p className="adm-empty__title">No margin to show for these filters</p>
            <p className="adm-empty__desc">Margin needs a cost per unit. Set the unit cost on a stock item, or receive a purchase (which sets it for you); bookings made afterwards record that cost.</p>
            <div className="adm-empty__action adm-row" style={{ justifyContent: "center" }}>
              <Link href="/admin/inventory" className="adm-btn adm-btn--secondary"><span className="adm-btn__label">Open stock</span></Link>
              <Link href={newPurchaseHref()} className="adm-btn adm-btn--primary"><Icon name="plus" size={16} /><span className="adm-btn__label">New purchase</span></Link>
            </div>
          </div>
        ) : (
          <div className="adm-rtable__wrap">
            <table className="adm-rtable pur-mtable">
              <thead>
                <tr>
                  <th>{GROUP_HEAD[groupBy]}</th>
                  <th style={{ textAlign: "right" }}>Revenue ex-tax</th>
                  <th style={{ textAlign: "right" }}>Cost</th>
                  <th style={{ textAlign: "right" }}>Margin</th>
                  <th style={{ textAlign: "right" }}>Margin %</th>
                  <th style={{ textAlign: "right" }}>Units</th>
                  <th style={{ textAlign: "right" }}>Bookings</th>
                  <th style={{ textAlign: "right" }}>
                    <span className="pur-th">Without cost<InfoTip label="About bookings without cost">Bookings made before a unit cost was set. They are counted here and left out of the cost, margin and margin %. Set the item&apos;s unit cost or receive a purchase so new bookings record it.</InfoTip></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key ?? i}>
                    <td data-label={GROUP_HEAD[groupBy]} className="pur-mtable__name">{rowTitle(r)}</td>
                    <td data-label="Revenue ex-tax" style={{ textAlign: "right" }}>{fmtAed2(r.revenueExTax)}</td>
                    <td data-label="Cost" style={{ textAlign: "right" }}>{r.cost === null || r.cost === undefined ? "-" : fmtAed2(r.cost)}</td>
                    <td data-label="Margin" style={{ textAlign: "right" }}>{r.margin === null || r.margin === undefined ? "-" : fmtAed2(r.margin)}</td>
                    <td data-label="Margin %" style={{ textAlign: "right" }}><Pct value={r.marginPct} /></td>
                    <td data-label="Units" style={{ textAlign: "right" }}>{fmtInt(r.units)}</td>
                    <td data-label="Bookings" style={{ textAlign: "right" }}>{fmtInt(r.bookings)}</td>
                    <td data-label="Without cost" style={{ textAlign: "right" }}>{r.bookingsWithoutCost > 0 ? <span className="pur-uncosted">{fmtInt(r.bookingsWithoutCost)}</span> : <span className="adm-muted">0</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="pur-mtable__total">
                  <td data-label="Total">Total</td>
                  <td data-label="Revenue ex-tax" style={{ textAlign: "right" }}>{fmtAed2(t.revenueExTax)}</td>
                  <td data-label="Cost" style={{ textAlign: "right" }}>{t.cost === null || t.cost === undefined ? "-" : fmtAed2(t.cost)}</td>
                  <td data-label="Margin" style={{ textAlign: "right" }}>{t.margin === null || t.margin === undefined ? "-" : fmtAed2(t.margin)}</td>
                  <td data-label="Margin %" style={{ textAlign: "right" }}><Pct value={t.marginPct} /></td>
                  <td data-label="Units" style={{ textAlign: "right" }}>{fmtInt(t.units)}</td>
                  <td data-label="Bookings" style={{ textAlign: "right" }}>{fmtInt(t.bookings)}</td>
                  <td data-label="Without cost" style={{ textAlign: "right" }}>{fmtInt(t.bookingsWithoutCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {allUncosted ? (
        <p className="pur-note">None of the bookings in this period has a recorded cost, so there is no margin yet. Set unit costs on the items or receive purchases; new bookings will then carry their cost.</p>
      ) : null}
      <p className="adm-reportnote">
        Revenue is the booking total minus tax, with refunds taken off in proportion. Margin % is margin divided by revenue, counting only bookings that have a cost.
        Colours: <span className="pur-pct is-good">25% and above</span>, <span className="pur-pct is-warn">10 to 25%</span>, <span className="pur-pct is-bad">below 10%</span>. All money is AED.
      </p>
    </>
  );
}
