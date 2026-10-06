// Clearly fake sample data for the /admin/_ui gallery (never real customers). Deterministic (seeded) so SSR and client agree.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Sample", "Demo", "Test", "Example", "Mock", "Placeholder"];
const LAST = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet"];
const STATUS = ["confirmed", "pending", "cancelled", "refunded"];
const PRODUCT = ["Desert safari (sample)", "City tour (sample)", "Dhow cruise (sample)", "Theme park (sample)", "Visa service (sample)"];

export function makeRows(n, seed = 7) {
  const r = rng(seed);
  const base = Date.UTC(2026, 0, 1);
  return Array.from({ length: n }, (_, i) => ({
    id: `row-${i + 1}`,
    ref: `SMP-${String(100000 + i)}`,
    customer: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
    product: PRODUCT[Math.floor(r() * PRODUCT.length)],
    status: STATUS[Math.floor(r() * STATUS.length)],
    total: Math.round(r() * 250000) / 100,
    created: new Date(base + Math.floor(r() * 280) * 86400000).toISOString().slice(0, 10),
  }));
}

export const TREND = [
  { label: "Mon", sales: 42, refunds: 4 },
  { label: "Tue", sales: 58, refunds: 6 },
  { label: "Wed", sales: 51, refunds: 3 },
  { label: "Thu", sales: 76, refunds: 8 },
  { label: "Fri", sales: 94, refunds: 5 },
  { label: "Sat", sales: 121, refunds: 9 },
  { label: "Sun", sales: 88, refunds: 4 },
];
