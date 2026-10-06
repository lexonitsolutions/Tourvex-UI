import { getServerCurrency } from "../lib/currencyServer";
import CurrencySync from "./CurrencySync";

/**
 * The visitor's currency lives in a cookie, which can only be read at request time. Reading it in the layout would make
 * every page wait for the request, so it lives here: rendered inside a <Suspense> boundary next to the layout, it streams
 * in with the first response while the rest of the shell is served from the prerender.
 */
export default async function CurrencySeed() {
  return <CurrencySync currency={await getServerCurrency()} />;
}
