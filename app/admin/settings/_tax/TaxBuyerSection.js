"use client";

import "./tax.css";
import { useEffect, useMemo, useState } from "react";
import { useAdminApi } from "../../_lib/adminApi";
import { Icon, SelectField, TextArea, TextField } from "../../_kit";
import TaxPreview from "./TaxPreview";
import { INDIA_STATES, INDIA_STATE_OPTIONS, TAX_API, countryOptions, fmtPercent, useCountries, useRegimes } from "./taxLib";

export const EMPTY_TAX_BUYER = { country: "", rateCode: "", stateCode: "", buyerName: "", buyerAddress: "", buyerCountry: "", buyerRegistration: "" };

/**
 * Body fields for POST /admin/stock/enquiry-bookings: `tax: { country?, rateCode?, placeOfSupplyState?, placeOfSupplyStateCode? }` and
 * `buyer: { name?, address?, country?, registrationNumber? }`. Empty parts are left out (Automatic = the service country's rule).
 */
export function taxBuyerPayload(v) {
  const tax = {};
  if (v.country) tax.country = v.country;
  if (v.country && v.rateCode) tax.rateCode = v.rateCode;
  if (v.stateCode) {
    tax.placeOfSupplyStateCode = v.stateCode;
    tax.placeOfSupplyState = INDIA_STATES.find((s) => s.code === v.stateCode)?.name;
  }
  const buyer = {};
  if (v.buyerName.trim()) buyer.name = v.buyerName.trim();
  if (v.buyerAddress.trim()) buyer.address = v.buyerAddress.trim();
  if (v.buyerCountry) buyer.country = v.buyerCountry;
  if (v.buyerRegistration.trim()) buyer.registrationNumber = v.buyerRegistration.trim();
  return { ...(Object.keys(tax).length ? { tax } : {}), ...(Object.keys(buyer).length ? { buyer } : {}) };
}

/**
 * Optional "Tax & buyer" part of the enquiry confirm dialog. Tax country and rate come from GET /admin/tax/regimes (default: Automatic,
 * by the product's service country); the net / tax split is previewed with POST /admin/tax/preview using the tax-inclusive total.
 * Uses only shared kit classes plus tax.css (this dialog also renders on pages that do not load inventory.css).
 */
export default function TaxBuyerSection({ value, onChange, total, currency, autoCountry }) {
  const api = useAdminApi();
  const [open, setOpen] = useState(false);
  const regimes = useRegimes();
  const countries = useCountries();
  const active = useMemo(() => regimes.items.filter((r) => r.active !== false), [regimes.items]);
  const regime = value.country ? active.find((r) => r.country === value.country) : active.find((r) => r.country === autoCountry);
  const india = regime?.model === "india_gst";
  const unavailable = !!regimes.error && !regimes.data;
  const previewCountry = value.country || autoCountry || "";

  // live preview, debounced; the answer is stored with the inputs it belongs to so stale answers are never shown
  const key = open && previewCountry && total > 0 ? JSON.stringify([previewCountry, value.rateCode, value.stateCode, total]) : "";
  const [answer, setAnswer] = useState({ key: "", result: null, error: "" });
  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const result = await api.post(`${TAX_API}/preview`, {
          country: previewCountry,
          amount: total,
          pricesIncludeTax: true,
          ...(value.rateCode ? { rateCode: value.rateCode } : {}),
          ...(value.stateCode ? { stateCode: value.stateCode, state: INDIA_STATES.find((s) => s.code === value.stateCode)?.name } : {}),
        });
        if (live) setAnswer({ key, result, error: "" });
      } catch (e) {
        if (live) setAnswer({ key, result: null, error: e?.message || "Could not preview the tax." });
      }
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // the key encodes every input of the request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, api]);
  const shown = key && answer.key === key ? answer : null;

  const summary = value.country ? `${active.find((r) => r.country === value.country)?.countryName || value.country}${value.rateCode ? `, ${value.rateCode}` : ""}` : "Automatic";
  const rateOptions = (regime?.rates || []).map((r) => ({ value: r.code, label: `${r.label || r.code} (${fmtPercent(r.percent)})${r.isDefault ? " - default" : ""}` }));
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className={`tx-sec${open ? " is-open" : ""}`}>
      <button type="button" className="tx-sec__toggle" aria-expanded={open} aria-controls="tx-sec-body" onClick={() => setOpen((o) => !o)}>
        <span className="tx-sec__title"><b>Tax &amp; buyer (optional)</b><small>Tax: {summary}{value.buyerName.trim() ? ` · Buyer: ${value.buyerName.trim()}` : ""}</small></span>
        <span className="tx-sec__chev" aria-hidden="true"><Icon name="chevronDown" size={18} /></span>
      </button>
      {open ? (
        <div className="tx-sec__body" id="tx-sec-body">
          <p className="tx-help">Leave the tax on Automatic and the tax of the country where the service is delivered applies. The invoice is issued as soon as the booking is created, so set anything special here. The total above is what the customer pays and it never changes: the tax is taken out of it.</p>
          {unavailable ? <p className="tx-note" role="status">The tax options could not be loaded ({regimes.error.message}). The automatic rule will apply; you can still add the buyer details.</p> : null}
          <div className="tx-form2">
            <SelectField label="Tax country" value={value.country} onChange={(country) => set({ country, rateCode: "", stateCode: "" })} options={active.map((r) => ({ value: r.country, label: `${r.countryName || r.country} - ${r.taxName}` }))} placeholder="Automatic" disabled={unavailable} />
            <SelectField label="Tax rate" value={value.rateCode} onChange={(rateCode) => set({ rateCode })} options={rateOptions} placeholder={value.country ? "Regime default" : "Automatic"} disabled={!value.country} />
            {india ? (
              <div className="is-wide"><SelectField label="Place of supply (state)" value={value.stateCode} onChange={(stateCode) => set({ stateCode })} options={INDIA_STATE_OPTIONS} placeholder="Not set" hint="Inside the seller's state the tax is CGST + SGST; elsewhere it is IGST." /></div>
            ) : null}
          </div>

          <div aria-live="polite">
            {!previewCountry ? <p className="tx-help">Choose a tax country to preview the net and tax split.</p> : !(total > 0) ? <p className="tx-help">Enter the total amount to preview the net and tax split.</p> : shown?.error ? <p className="tx-help">Preview unavailable: {shown.error}</p> : shown?.result ? <TaxPreview result={shown.result} currency={currency} /> : <p className="tx-help">Calculating the tax split...</p>}
          </div>

          <div className="tx-form2">
            <TextField label="Buyer name" value={value.buyerName} onChange={(buyerName) => set({ buyerName })} maxLength={160} hint="Leave empty to use the customer's name." />
            <TextField label={`Buyer ${regime?.registrationLabel || "registration number"}`} value={value.buyerRegistration} onChange={(buyerRegistration) => set({ buyerRegistration })} maxLength={40} />
            <div className="is-wide"><TextArea label="Buyer address" rows={2} value={value.buyerAddress} onChange={(buyerAddress) => set({ buyerAddress })} maxLength={400} /></div>
            {countries.items.length ? (
              <SelectField label="Buyer country" value={value.buyerCountry} onChange={(buyerCountry) => set({ buyerCountry })} options={countryOptions(countries.items)} placeholder="Not set" />
            ) : (
              <TextField label="Buyer country (code)" value={value.buyerCountry} onChange={(v) => set({ buyerCountry: v.toUpperCase().slice(0, 2) })} maxLength={2} placeholder="AE" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
