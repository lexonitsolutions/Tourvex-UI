import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailwind runs with the `tw` prefix (classes read `tw:flex`), so tailwind-merge must be told about it.
const twMerge = extendTailwindMerge({ prefix: "tw" });

/** Merge class names; later Tailwind utilities win over earlier conflicting ones. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
