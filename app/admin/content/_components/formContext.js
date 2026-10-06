"use client";

import { createContext, useContext } from "react";

/**
 * Shared by every field of the open section. `errors` is { [pathKey]: message } for that section (client + API validation),
 * `onChange(pathKey, value)` is stable, `readOnly` disables every control (no cms.write).
 */
export const FormContext = createContext({ errors: {}, readOnly: false, onChange: () => {} });
export const useFormContext = () => useContext(FormContext);

/** Messages stored at or under `key` (image/link sub fields, list items). */
export function errorsUnder(errors, key) {
  const prefix = `${key}.`;
  return Object.keys(errors).filter((k) => k === key || k.startsWith(prefix));
}
