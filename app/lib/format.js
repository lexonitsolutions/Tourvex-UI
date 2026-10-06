/** Fills `{name}` placeholders. Unknown placeholders are left as they are. Pure; safe on server and client. */
export function fmt(template, vars = {}) {
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars && vars[name] != null ? String(vars[name]) : match));
}

/** `["/holidays", "/tours"]` from the CMS `match` text ("/holidays,/tours"). */
export function splitMatch(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("/"));
}
