"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { dayKey, formatDayKey } from "../../_lib/format";
import { Button, ErrorState, Icon, PageHeader, Skeleton, TabPanel, Tabs } from "../../_kit";
import { addMonths, capText, decodeId, itemApiPath, monthEnd, monthOf, monthStart, num, productHref, typeLabel } from "../_lib/stock";
import { StockStatus } from "./parts";
import StockCalendar, { CalendarNav } from "./StockCalendar";
import DayPanel from "./DayPanel";
import PolicyPanel from "./PolicyPanel";
import BulkEditDialog from "./BulkEditDialog";
import Movements from "./Movements";

/** Stock calendar and policy of one item (GET /admin/stock/items/:id?from=&to=). */
export default function ItemDetail() {
  const id = decodeId(useParams().id);
  const { can } = useAdminMe();
  const canWrite = can("stock.write");
  const [today] = useState(() => dayKey());
  const [ym, setYm] = useState(() => monthOf(today));
  const [span, setSpan] = useState(1);
  const [tab, setTab] = useState("calendar");
  const [sel, setSel] = useState(null); // { from, to } selected days
  const [anchor, setAnchor] = useState(null);
  const [rangeMode, setRangeMode] = useState(false);
  const [panel, setPanel] = useState(false);
  const [bulk, setBulk] = useState(null); // { from, to, mode } | true

  const from = monthStart(ym);
  const to = monthEnd(addMonths(ym, span - 1));
  const query = useMemo(() => ({ from, to }), [from, to]);
  const { data, error, loading, reload } = useAdminQuery(id ? itemApiPath(id) : null, query, { prefetchNext: false });
  const item = data?.item;

  function pick(date, event) {
    const extend = (event.shiftKey || rangeMode) && anchor;
    if (extend) {
      const [a, b] = anchor <= date ? [anchor, date] : [date, anchor];
      setSel({ from: a, to: b });
      setAnchor(null);
      setPanel(true);
      return;
    }
    setAnchor(date);
    setSel({ from: date, to: date });
    // in range mode the first tap only marks the start; otherwise a plain click opens the editor right away
    setPanel(!rangeMode);
  }
  const clearSel = () => { setSel(null); setAnchor(null); setPanel(false); };
  const moveMonth = (n) => setYm((cur) => addMonths(cur, n * (span === 3 ? 3 : 1)));

  if (error && !data) {
    return (
      <div className="adm-inv">
        <Link href="/admin/inventory" className="inv-back"><Icon name="chevronLeft" size={14} />Stock</Link>
        <ErrorState title={error.status === 404 ? "Stock item not found" : "Could not load this item"} description={error.message} onRetry={error.status === 404 ? undefined : reload} />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="adm-inv">
        <PageHeader title="Stock item" />
        <div className="inv-stack"><div className="inv-card"><Skeleton height={16} width="40%" /><br /><Skeleton height={320} /></div></div>
      </div>
    );
  }

  const url = productHref(item);
  const head = `${item.variantLabel || (item.variantId && item.variantId !== "default" ? item.variantId : "")}`;
  const openBulk = (range) => setBulk({ from: range?.from || sel?.from || "", to: range?.to || sel?.to || "", mode: "set" });

  return (
    <div className={`adm-inv${canWrite ? " has-dock" : ""}`}>
      <Link href="/admin/inventory" className="inv-back"><Icon name="chevronLeft" size={14} />Stock</Link>
      <PageHeader
        title={item.title}
        description={[typeLabel(item.productType), head].filter(Boolean).join(" - ")}
        meta={
          <div className="adm-row">
            <StockStatus status={item.stopSale ? "closed" : item.status} />
            <span className="adm-muted">Daily capacity: {capText(item.defaultCapacity ?? item.inheritedCapacity)}</span>
            {item.availableTotal !== null && item.availableTotal !== undefined ? <span className="adm-muted">Next 30 days: {num(item.availableTotal)} of {num(item.capacityTotal)} available</span> : null}
          </div>
        }
        actions={
          <div className="adm-row">
            {url ? <a className="adm-btn adm-btn--secondary" href={url} target="_blank" rel="noopener noreferrer"><Icon name="external" size={16} /><span className="adm-btn__label">View product</span></a> : null}
            {canWrite ? <Button variant="primary" icon="sliders" onClick={() => openBulk()}>Bulk edit</Button> : null}
          </div>
        }
      />

      <Tabs idPrefix="inv-item" label="Item sections" value={tab} onChange={setTab} tabs={[{ id: "calendar", label: "Stock calendar" }, { id: "movements", label: "Movements" }]} />

      <TabPanel idPrefix="inv-item" id="calendar" value={tab}>
        <div className="inv-layout" style={{ marginTop: 16 }}>
          <section className="inv-card" aria-label="Stock calendar">
            <CalendarNav
              ym={ym}
              span={span}
              onMonth={moveMonth}
              onToday={() => setYm(monthOf(today))}
              onSpan={setSpan}
              rangeMode={rangeMode}
              onRangeMode={(v) => { setRangeMode(v); setAnchor(null); }}
              canWrite={canWrite}
            />
            <StockCalendar ym={ym} span={span} days={data?.days} loading={loading} selection={sel} anchor={anchor} onPick={pick} />
            <p className="inv-hint">
              {canWrite ? (rangeMode ? "Tap the first date, then the last date of the range." : "Click a date to edit it. Hold Shift and click another date to select a range, or use Select range.") : "Click a date to see its numbers."}
              {" "}Hover a date for sold and held units.
            </p>
            {sel && !panel ? (
              <div className="adm-row" style={{ marginTop: 10 }}>
                <span className="adm-muted">{sel.from === sel.to ? `${formatDayKey(sel.from)} selected` : `${formatDayKey(sel.from)} to ${formatDayKey(sel.to)} selected`}</span>
                {sel.from !== sel.to ? <Button size="sm" variant="primary" onClick={() => setPanel(true)}>Edit selection</Button> : null}
                <Button size="sm" variant="ghost" onClick={clearSel}>Clear</Button>
              </div>
            ) : null}
          </section>
          <div className="inv-side">
            <section className="inv-card" aria-label="Stock settings">
              <div className="inv-card__head">
                <div>
                  <h2 className="inv-card__title">Settings</h2>
                  <p className="inv-card__sub">Defaults for every date of this item.</p>
                </div>
              </div>
              <PolicyPanel key={`${item.id}-${item.updatedAt || ""}-${item.defaultCapacity}-${item.lowStockThreshold}-${item.stopSale}-${item.unitCost}`} item={item} canWrite={canWrite} onSaved={reload} />
            </section>
          </div>
        </div>
      </TabPanel>

      <TabPanel idPrefix="inv-item" id="movements" value={tab}>
        <div style={{ marginTop: 16 }}><Movements itemId={item.id} /></div>
      </TabPanel>

      <DayPanel
        item={item}
        days={data?.days}
        selection={panel ? sel : null}
        canWrite={canWrite}
        today={today}
        onClose={() => setPanel(false)}
        onSaved={reload}
        onBulk={(range) => { setPanel(false); openBulk(range); }}
      />
      <BulkEditDialog item={bulk ? item : null} initial={bulk || undefined} onClose={() => setBulk(null)} onDone={() => { reload(); clearSel(); }} />

      {canWrite ? (
        <div className="inv-dock">
          <Button variant="primary" icon="sliders" onClick={() => openBulk()}>Bulk edit</Button>
        </div>
      ) : null}
    </div>
  );
}
