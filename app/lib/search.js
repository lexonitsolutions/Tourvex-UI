// Pure search helpers (no React) so the ranking rules are easy to read and test.

const COUNTRY_BY_CITY = {
  Dubai: "United Arab Emirates",
  "Abu Dhabi": "United Arab Emirates",
  "Ras Al Khaimah": "United Arab Emirates",
  Sharjah: "United Arab Emirates",
  Fujairah: "United Arab Emirates",
  Ajman: "United Arab Emirates",
  Istanbul: "Türkiye",
  Maldives: "Maldives",
  Baku: "Azerbaijan",
  Almaty: "Kazakhstan",
};

const STOP_WORDS = new Set([
  "things", "to", "do", "in", "the", "a", "an", "and", "for", "of", "top", "best", "places", "visit", "days", "day",
  "experiences", "activities", "attractions", "tourists", "what", "with", "at", "near", "me", "my", "trip",
]);

export const countryOf = (city) => COUNTRY_BY_CITY[city] || "";

const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export function buildCities(items) {
  const map = new Map();
  items.forEach((item) =>
    (item.destinations || []).forEach((name) => {
      const entry = map.get(name) || { name, count: 0, country: countryOf(name) };
      entry.count += 1;
      map.set(name, entry);
    })
  );
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function priceInfo(item) {
  const sale = item.salePrice;
  const base = item.price;
  const current = sale || base;
  if (!current) return null;
  const was = sale && base && base.amount > sale.amount ? base : null;
  const saving = was ? Math.round((1 - current.amount / was.amount) * 100) : 0;
  return { amount: current.amount, currency: current.currency, was, saving };
}

/** Biggest advertised saving first, then everything else in catalog order. */
export function trendingActivities(items, limit = 9) {
  const scored = items.map((item, index) => ({ item, index, saving: priceInfo(item)?.saving || 0 }));
  scored.sort((a, b) => b.saving - a.saving || a.index - b.index);
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Natural-language-ish search: "Dubai activities for couples" finds Dubai activities; leftover words
 * (after dropping filler like "things to do in") must match the title or category.
 */
export function searchCatalog(items, cities, rawQuery) {
  const query = norm(rawQuery);
  if (!query) return { cities: [], activities: [], terms: [] };

  const mentioned = cities.filter((city) => query.includes(norm(city.name)));
  const cityWords = new Set(mentioned.flatMap((city) => norm(city.name).split(" ")));
  const terms = query.split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word) && !cityWords.has(word));

  const cityMatches = mentioned.length
    ? mentioned
    : cities.filter((city) => norm(city.name).includes(query) || query.split(" ").some((w) => w.length > 2 && norm(city.name).startsWith(w)));

  const scored = [];
  items.forEach((item) => {
    const title = norm(item.title);
    const haystack = `${title} ${norm((item.categories || []).join(" "))} ${norm((item.tripTypes || []).join(" "))}`;
    if (mentioned.length && !(item.destinations || []).some((d) => mentioned.some((m) => m.name === d))) return;
    let score = 0;
    if (mentioned.length) score += 2;
    if (title.includes(query)) score += 6;
    const hits = terms.filter((term) => haystack.includes(term)).length;
    if (terms.length && hits === 0 && !mentioned.length) return;
    if (terms.length && hits < terms.length && mentioned.length && hits === 0 && terms.length > 0) {
      // Only filler-free words that nothing matched: keep the city results but rank them last.
      score -= 1;
    }
    score += hits * 3;
    if (!mentioned.length && !terms.length) return;
    scored.push({ item, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return { cities: cityMatches, activities: scored.map((s) => s.item), terms };
}
