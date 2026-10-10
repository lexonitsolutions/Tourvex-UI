"use client";

import "./tax.css";
import { formatDateTime, formatMoney } from "../../_lib/format";
import { Card, KeyValue } from "../../_kit";
import { MODEL_LABEL, fmtPercent } from "./taxLib";

const placeText = (p) => (p && typeof p === "object" ? [p.state ? `${p.state}${p.stateCode ? ` (${p.stateCode})` : ""}` : null, p.country].filter(Boolean).join(", ") : typeof p === "string" ? p : "");

/**
 * Read-only tax snapshot of a booking (GET /admin/bookings/:id -> `taxInfo`; `tax` stays the numeric amount). Hidden when the booking has none (older bookings).
 * Every field is read defensively: the snapshot is the tax determination, with the booking's taxOverride when staff set one.
 */
export default function BookingTaxCard({ b }) {
  const t = b?.taxInfo;
  if (!t || typeof t !== "object") return null;
  const country = t.country;
  const percent = t.percent;
  const rateCode = t.rateCode;
  const components = Array.isArray(t.components) ? t.components : [];
  const override = t.override;
  const place = placeText(t.placeOfSupply);
  const currency = b.currency || "AED";
  const items = [
    { label: "Tax regime", value: [country, t.taxName].filter(Boolean).join(" · ") + (t.model ? ` (${MODEL_LABEL[t.model] || t.model})` : "") || null },
    { label: "Rate", value: [rateCode, percent !== undefined && percent !== null ? fmtPercent(percent) : null].filter(Boolean).join(" · ") || null },
    components.length ? {
      label: "Components",
      value: components.map((c) => `${c.label || c.code}${c.percent !== undefined ? ` ${fmtPercent(c.percent)}` : ""}${c.taxAmount !== undefined ? ` = ${formatMoney(c.taxAmount, currency)}` : ""}`).join(", "),
    } : null,
    place ? { label: "Place of supply", value: place } : null,
    t.zeroRated ? { label: "Zero rated", value: "Yes" } : null,
  ].filter(Boolean);
  const ov = override && typeof override === "object" ? override : null;
  return (
    <Card title="Tax">
      <div className="adm-stack" style={{ gap: 10 }}>
        <KeyValue items={items} />
        {t.fallback ? <p className="tx-note">No active regime matched the service country, so the default country&apos;s regime was used.</p> : null}
        {ov ? (
          <div className="tx-note" role="note">
            <b>Set by staff when the booking was created.</b>
            {" "}
            {[
              ov.country ? `Country ${ov.country}` : null,
              ov.rateCode ? `rate ${ov.rateCode}` : null,
              ov.placeOfSupplyState ? `place of supply ${ov.placeOfSupplyState}` : null,
              ov.buyerRegistrationNumber ? `buyer registration ${ov.buyerRegistrationNumber}` : null,
            ].filter(Boolean).join(", ")}
            {ov.reason ? <>. Reason: {ov.reason}</> : null}
            {ov.by || ov.at ? <small className="adm-muted" style={{ display: "block", marginTop: 4 }}>{[typeof ov.by === "string" ? ov.by : ov.by?.name || ov.by?.email, ov.at ? formatDateTime(ov.at) : null].filter(Boolean).join(" · ")}</small> : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
