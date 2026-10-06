// Tailwind v4 is used by the admin only (app/admin/_ui/tailwind.css, loaded from app/admin/layout.js).
// The plugin leaves every stylesheet that has no Tailwind at-rules untouched, so the marketplace CSS is not processed.
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
