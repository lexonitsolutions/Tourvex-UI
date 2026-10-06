"use client";

import { memo } from "react";
import { formatRateDate, useFxRates } from "../lib/fxRates";
import { useApp } from "./AppProvider";

/**
 * Honest pricing note: converted prices use indicative rates, payments are always charged in AED.
 * The date and attribution come from GET /currency/rates and are simply left out when that is unavailable.
 */
function CurrencyNote({ className = "", showAttribution = true }) {
  const { currency } = useApp();
  const rates = useFxRates();
  const date = formatRateDate(rates?.updatedAt);
  const converted = currency !== "AED";
  return (
    <span className={`mk-fx-note ${className}`.trim()}>
      {converted ? (
        <>
          Prices are shown in <b>{currency}</b> at indicative rates{date ? ` (updated ${date})` : ""}. Payments are charged in AED.
        </>
      ) : (
        <>Prices are shown in <b>AED</b>. Payments are charged in AED.</>
      )}
      {converted && showAttribution ? <small className="mk-fx-attr"> {rates?.attribution || "Rates by ExchangeRate-API"}</small> : null}
    </span>
  );
}

export default memo(CurrencyNote);
