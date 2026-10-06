// Currencies offered in the language/currency picker, each mapped to the country whose flag represents it.
// Flag SVGs live in public/flags (copied from the MIT-licensed "flag-icons" package, see public/flags/LICENSE).
// The list is a curated set of travel-relevant currencies, not every ISO code.

export const CURRENCY_COUNTRY = {
  AED: "ae", AMD: "am", AUD: "au", AZN: "az", BDT: "bd", BHD: "bh", BRL: "br", CAD: "ca", CHF: "ch", CNY: "cn",
  DKK: "dk", EGP: "eg", EUR: "eu", GBP: "gb", GEL: "ge", HKD: "hk", IDR: "id", INR: "in", JOD: "jo", JPY: "jp",
  KES: "ke", KRW: "kr", KWD: "kw", KZT: "kz", LKR: "lk", MAD: "ma", MOP: "mo", MUR: "mu", MVR: "mv", MYR: "my",
  NOK: "no", NPR: "np", NZD: "nz", OMR: "om", PHP: "ph", PKR: "pk", QAR: "qa", RSD: "rs", RUB: "ru", SAR: "sa",
  SCR: "sc", SEK: "se", SGD: "sg", THB: "th", TRY: "tr", TZS: "tz", USD: "us", UZS: "uz", VND: "vn", ZAR: "za",
};

export const CURRENCY_CODES = Object.keys(CURRENCY_COUNTRY);
export const POPULAR_CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"];

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", available: true },
  { code: "ar", label: "Arabic", native: "العربية", available: false },
];

export const flagSrc = (code) => `/flags/${CURRENCY_COUNTRY[code]}.svg`;

let names;
/** English currency name from the browser's own data (no hand-typed names to go stale). */
export function currencyName(code) {
  try {
    names ||= new Intl.DisplayNames(["en"], { type: "currency" });
    return names.of(code) || code;
  } catch {
    return code;
  }
}
