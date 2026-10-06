import { cookies } from "next/headers";
import { CURRENCY_COOKIE, normalizeCurrency } from "./currencyCookie";

/** Server components only. Reading cookies makes the page render per request, which is what a per-visitor currency needs. */
export async function getServerCurrency() {
  const store = await cookies();
  return normalizeCurrency(store.get(CURRENCY_COOKIE)?.value);
}
