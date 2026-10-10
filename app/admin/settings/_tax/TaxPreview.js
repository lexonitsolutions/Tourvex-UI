"use client";

import "./tax.css";
import { formatMoney } from "../../_lib/format";
import { fmtPercent } from "./taxLib";

/**
 * Result of POST /admin/tax/preview: `{ determination, net, components: [{ code, label, percent, taxAmount }], taxTotal, total, seller }`.
 * Shared by the settings calculator and the enquiry confirm dialog. Every field is read defensively.
 */
export default function TaxPreview({ result, currency = "AED", showMeta = true }) {
  if (!result) return null;
  const d = result.determination || {};
  const comps = Array.isArray(result.components) ? result.components : [];
  const seller = result.seller && typeof result.seller === "object" ? result.seller : null;
  const place = d.placeOfSupply && typeof d.placeOfSupply === "object" ? [d.placeOfSupply.state, d.placeOfSupply.country].filter(Boolean).join(", ") : "";
  return (
    <div className="adm-stack" style={{ gap: 10 }}>
      <dl className="tx-result">
        <div className="tx-result__row"><dt>Net (before tax)</dt><dd>{formatMoney(result.net, currency)}</dd></div>
        {comps.map((c) => (
          <div className="tx-result__row" key={c.code || c.label}><dt>{c.label || c.code} {c.percent !== undefined ? fmtPercent(c.percent) : ""}</dt><dd>{formatMoney(c.taxAmount, currency)}</dd></div>
        ))}
        {comps.length > 1 ? <div className="tx-result__row"><dt>Total tax</dt><dd>{formatMoney(result.taxTotal, currency)}</dd></div> : null}
        {!comps.length && result.taxTotal !== undefined ? <div className="tx-result__row"><dt>Tax</dt><dd>{formatMoney(result.taxTotal, currency)}</dd></div> : null}
        <div className="tx-result__row is-total"><dt>Total</dt><dd>{formatMoney(result.total, currency)}</dd></div>
      </dl>
      {d.fallback ? <p className="tx-warn" role="status">No active regime matches this country, so the default country&apos;s regime was used.</p> : null}
      {showMeta ? (
        <p className="tx-meta">
          {[
            d.taxName ? `${d.country ? `${d.country} ` : ""}${d.taxName}${d.percent !== undefined ? ` ${fmtPercent(d.percent)}` : ""}${d.rateCode ? ` (${d.rateCode})` : ""}` : null,
            d.zeroRated ? "Zero rated" : null,
            place ? `Place of supply: ${place}` : null,
            seller?.legalName ? `Seller: ${seller.legalName}${seller.registrationNumber ? ` (${seller.registrationNumber})` : ""}` : null,
          ].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
