import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";

// Only used to show "updated <date>" and the provider attribution; the API does all conversion.
let pending = null;

/** One request per page session. Resolves to null when the endpoint is unavailable (callers then show no date). */
export function loadFxRates() {
  if (typeof window === "undefined") return Promise.resolve(null);
  pending ||= fetch(`${API_BASE_URL}/currency/rates`, { headers: { Accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null)
    .then((data) => {
      if (!data || typeof data !== "object") pending = null;
      return data || null;
    });
  return pending;
}

export function useFxRates() {
  const [rates, setRates] = useState(null);
  useEffect(() => {
    let live = true;
    loadFxRates().then((data) => live && setRates(data));
    return () => {
      live = false;
    };
  }, []);
  return rates;
}

export function formatRateDate(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
