import "../stock.css";

/**
 * Optional stock information from the public API (docs/STOCK_API.md, "Public API additions"):
 * `{ soldOut?, lowStock?, remaining?, nextAvailableDate? }`. Every field is optional; without `stock` nothing renders
 * and the page behaves as before.
 * @returns {{kind: "sold"} | {kind: "low", remaining: number | null} | null}
 */
export function stockInfo(stock) {
  if (!stock || typeof stock !== "object") return null;
  if (stock.soldOut) return { kind: "sold" };
  if (stock.lowStock) {
    const n = Math.floor(Number(stock.remaining));
    return { kind: "low", remaining: Number.isFinite(n) && n > 0 ? n : null };
  }
  return null;
}

export function stockText(info) {
  if (!info) return "";
  if (info.kind === "sold") return "Sold out";
  return info.remaining ? `Only ${info.remaining} left` : "Only a few left";
}

/** Small pill: "Only 3 left" (amber) or "Sold out" (red). Renders nothing when there is nothing to say. */
export function StockChip({ stock, className = "" }) {
  const info = stockInfo(stock);
  if (!info) return null;
  return <span className={`stk-chip is-${info.kind}${className ? ` ${className}` : ""}`}>{stockText(info)}</span>;
}

export const formatStockDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

/** Detail endpoints may put `stock` on the entity or beside it; always hand the UI one object that has it (or none). */
export const withStock = (entity, top) => (!entity || entity.stock || !top ? entity : { ...entity, stock: top });

/** Detail-page header line under the title: the chip, plus "Next available" for sold-out items. Reserves no space when empty. */
export function StockHead({ stock }) {
  const info = stockInfo(stock);
  const next = info?.kind === "sold" ? formatStockDate(stock.nextAvailableDate) : "";
  return (
    <div className="stk-head" role="status" aria-live="polite">
      {info && <StockChip stock={stock} />}
      {next && <span className="stk-next">Next available: {next}</span>}
    </div>
  );
}

/**
 * Shown at the top of an enquiry form. Sold-out items can still be enquired about (other dates or packages);
 * low-stock items get a gentle nudge. Nothing for items without stock info.
 */
export function EnquiryStockNote({ stock, noun = "package" }) {
  const info = stockInfo(stock);
  if (!info) return null;
  if (info.kind === "sold") {
    const next = formatStockDate(stock.nextAvailableDate);
    return (
      <p className="stk-note is-sold" role="status">
        <strong>This {noun} is currently sold out.</strong>
        You can still send an enquiry and we will check other dates or similar options for you.{next ? ` Next available: ${next}.` : ""}
      </p>
    );
  }
  return <p className="stk-note is-low" role="status">{stockText(info)}. Send your enquiry soon to avoid missing out.</p>;
}
