// Selected-currency helpers shared by client code and (through currencyServer.js) server components.
// The cookie is the source of truth for server rendering; React context mirrors it on the client.

import { CURRENCY_CODES } from "./currencies";

export const CURRENCY_COOKIE = "tourvex.currency";
export const CURRENCY_STORAGE_KEY = "tourvex.currency";
export const DEFAULT_CURRENCY = "AED";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Upper-cases and validates against the picker list; anything unknown becomes AED. */
export function normalizeCurrency(value) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return CURRENCY_CODES.includes(code) ? code : DEFAULT_CURRENCY;
}

/** Browser only: the cookie value (AED on the server or when unset). */
export function readCurrencyCookie() {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const hit = document.cookie.split("; ").find((part) => part.startsWith(`${CURRENCY_COOKIE}=`));
  return normalizeCurrency(hit ? decodeURIComponent(hit.slice(CURRENCY_COOKIE.length + 1)) : "");
}

export function hasCurrencyCookie() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((part) => part.startsWith(`${CURRENCY_COOKIE}=`));
}

export function writeCurrencyCookie(code) {
  document.cookie = `${CURRENCY_COOKIE}=${normalizeCurrency(code)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

/**
 * The currency a lib call should request. An explicit value wins; in the browser an omitted value falls back to the
 * cookie (so every client fetch is currency-aware); on the server it falls back to AED (pass it explicitly there).
 */
export function resolveCurrency(currency) {
  return currency ? normalizeCurrency(currency) : readCurrencyCookie();
}

/** Appends `currency=XXX` to an API path that may already carry a query string. */
export function withCurrency(path, currency) {
  const code = resolveCurrency(currency);
  return `${path}${path.includes("?") ? "&" : "?"}currency=${encodeURIComponent(code)}`;
}
