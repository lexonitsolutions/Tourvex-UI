"use client";

import { createContext, useContext } from "react";

/*
 * Radix portals render to <body> by default, i.e. OUTSIDE `.adm-root`, where none of the admin tokens exist.
 * Every shadcn wrapper therefore portals into `usePortalContainer()`:
 *   - the nearest <PortalContainer> element (the gallery uses one per forced light/dark panel), else
 *   - a single lazily created `<div class="adm-root adm-ui-portal">` host on <body> (same pattern as the kit's Dropdown).
 */
const PortalCtx = createContext(null);

export function PortalContainerProvider({ container, children }) {
  return <PortalCtx.Provider value={container}>{children}</PortalCtx.Provider>;
}

function getHost() {
  if (typeof document === "undefined") return undefined;
  let el = document.getElementById("adm-ui-portal");
  if (!el) {
    el = document.createElement("div");
    el.id = "adm-ui-portal";
    el.className = "adm-root adm-ui-portal";
    const root = document.querySelector("[data-adm-themeroot]");
    if (root) {
      ["data-adm-theme", "data-adm-dark"].forEach((a) => root.hasAttribute(a) && el.setAttribute(a, root.getAttribute(a)));
    }
    document.body.appendChild(el);
  }
  return el;
}

export function usePortalContainer() {
  const ctx = useContext(PortalCtx);
  return ctx || getHost();
}
