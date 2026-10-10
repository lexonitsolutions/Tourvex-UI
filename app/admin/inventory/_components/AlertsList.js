"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { addDaysKey, dayKey, formatDayKey } from "../../_lib/format";
import { Button, EmptyState, ErrorState, Icon, PageHeader, Skeleton } from "../../_kit";
import { STOCK_API, itemApiPath, itemHref, num, typeLabel } from "../_lib/stock";
import { CapacityBar, StockStatus } from "./parts";
import BulkEditDialog from "./BulkEditDialog";

const GROUPS = [
  { status: "sold_out", title: "Sold out", sub: "No units left on at least one date in the next 30 days." },
  { status: "low", title: "Low stock", sub: "At or below the low-stock threshold on at least one date." },
  { status: "closed", title: "Stopped", sub: "Sales are stopped or every date is closed." },
];

/** Soonest affected dates of one item (GET /admin/stock/items/:id?from=today&to=+29), loaded when asked for. */
function AffectedDates({ item, today }) {
  const { data, error, loading, reload } = useAdminQuery(itemApiPath(item.id), { from: today, to: addDaysKey(today, 29) }, { prefetchNext: false });
  if (error && !data) return <p className="inv-error" role="alert">Could not load the dates. {error.message} <button type="button" className="adm-link" onClick={reload}>Try again</button></p>;
  if (loading && !data) return <Skeleton height={26} width="70%" />;
  const hits = (data?.days || []).filter((d) => d.status === "low" || d.status === "sold_out");
  if (!hits.length) return <p className="adm-muted" style={{ margin: 0 }}>No low or sold-out dates in the next 30 days.</p>;
  return (
    <ul className="inv-alertcard__days" aria-label="Affected dates">
      {hits.slice(0, 10).map((d) => (
        <li key={d.date} className={`inv-daychip is-${d.status}`}>
          {formatDayKey(d.date)}: {d.status === "sold_out" ? "sold out" : `${num(d.available)} left`}
        </li>
      ))}
      {hits.length > 10 ? <li className="inv-daychip">+{hits.length - 10} more</li> : null}
    </ul>
  );
}

function AlertCard({ item, status, today, canWrite, onAdd }) {
  const [showDates, setShowDates] = useState(false);
  return (
    <li className={`inv-alertcard is-${status}`}>
      <div className="inv-alertcard__top">
        <div>
          <h3 className="inv-alertcard__title">{item.title}</h3>
          <p className="inv-alertcard__sub">{typeLabel(item.productType)}{item.variantLabel ? ` - ${item.variantLabel}` : ""}</p>
        </div>
        <StockStatus status={status} />
      </div>
      <div className="inv-alertcard__facts">
        {item.lowestRemaining !== null && item.lowestRemaining !== undefined ? <span>Lowest remaining: <b>{num(item.lowestRemaining)}</b></span> : null}
        {item.nextSoldOutDate ? <span>Next sold out: <b>{formatDayKey(item.nextSoldOutDate)}</b></span> : null}
        <span>Available (30d): <b>{item.availableTotal === null || item.availableTotal === undefined ? "Unlimited" : `${num(item.availableTotal)} of ${num(item.capacityTotal)}`}</b></span>
        <span>Low-stock threshold: <b>{num(item.lowStockThreshold)}</b></span>
      </div>
      <CapacityBar capacity={item.capacityTotal} sold={item.soldTotal} held={item.heldTotal} status={status} />
      {showDates ? <AffectedDates item={item} today={today} /> : null}
      <div className="inv-alertcard__actions">
        {canWrite ? <Button size="sm" variant="primary" icon="plus" onClick={() => onAdd(item)}>Add stock</Button> : null}
        <Link href={itemHref(item.id)} className="adm-btn adm-btn--secondary adm-btn--sm inv-alertcard__open"><span className="adm-btn__label">Open</span><Icon name="chevronRight" size={14} /></Link>
        <Button size="sm" variant="ghost" onClick={() => setShowDates((v) => !v)} aria-expanded={showDates}>{showDates ? "Hide dates" : "Show affected dates"}</Button>
      </div>
    </li>
  );
}

function Group({ group, query, today, canWrite, onAdd }) {
  const { data, error, loading, reload } = query;
  const items = data?.items || [];
  const total = data?.pagination?.total ?? items.length;
  return (
    <section className="inv-stack" aria-labelledby={`inv-g-${group.status}`}>
      <div>
        <h2 className="inv-card__title" id={`inv-g-${group.status}`}>{group.title}{data ? ` (${total})` : ""}</h2>
        <p className="inv-card__sub">{group.sub}</p>
      </div>
      {error && !data ? (
        <ErrorState title={`Could not load ${group.title.toLowerCase()} items`} description={error.message} onRetry={reload} />
      ) : loading && !data ? (
        <div className="inv-stack"><Skeleton height={110} /><Skeleton height={110} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="checkCircle" title={`Nothing ${group.status === "closed" ? "is stopped" : group.status === "low" ? "is running low" : "is sold out"}`} description="Nothing needs attention here right now." />
      ) : (
        <>
          <ul className="inv-alerts">
            {items.map((item) => <AlertCard key={item.id} item={item} status={group.status} today={today} canWrite={canWrite} onAdd={onAdd} />)}
          </ul>
          {total > items.length ? <p className="inv-hint">Showing the {items.length} most urgent of {total}. Use the Stock page filters to see the rest.</p> : null}
        </>
      )}
    </section>
  );
}

/** Low stock and sold out: grouped cards with quick actions. */
export default function AlertsList() {
  const { can } = useAdminMe();
  const canWrite = can("stock.write");
  const [today] = useState(() => dayKey());
  const [adding, setAdding] = useState(null);
  const opts = { prefetchNext: false };
  const queries = {
    sold_out: useAdminQuery(`${STOCK_API}/items`, { status: "sold_out", sort: "attention", limit: 50 }, opts),
    low: useAdminQuery(`${STOCK_API}/items`, { status: "low", sort: "attention", limit: 50 }, opts),
    closed: useAdminQuery(`${STOCK_API}/items`, { status: "closed", sort: "attention", limit: 50 }, opts),
  };
  const reloadAll = () => Object.values(queries).forEach((q) => q.reload());
  return (
    <div className="adm-inv">
      <PageHeader
        title="Low stock and sold out"
        description="Items that need attention in the next 30 days, most urgent first."
        actions={<Link href="/admin/inventory" className="adm-btn adm-btn--secondary"><Icon name="inventory" size={16} /><span className="adm-btn__label">All stock</span></Link>}
      />
      <div className="inv-stack">
        {GROUPS.map((g) => (
          <Group key={g.status} group={g} query={queries[g.status]} today={today} canWrite={canWrite} onAdd={(item) => setAdding(item)} />
        ))}
      </div>
      <BulkEditDialog
        item={adding}
        initial={adding ? (() => { const from = adding.nextSoldOutDate && adding.nextSoldOutDate >= today ? adding.nextSoldOutDate : today; return { mode: "add", from, to: addDaysKey(from, 13) }; })() : undefined}
        onClose={() => setAdding(null)}
        onDone={reloadAll}
      />
    </div>
  );
}
