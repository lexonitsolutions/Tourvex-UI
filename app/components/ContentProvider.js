"use client";

import { createContext, useContext } from "react";

/**
 * Hands the (server-fetched) global CMS content to client components such as the header, the mega menu and the
 * phone navigation. The value is serialised into the first HTML, so there is no client fetch and no flicker.
 */
const ContentContext = createContext({ header: null, visaSections: [], activityItems: null, menus: {} });

export function ContentProvider({ header, visaSections = [], activityItems = null, menus = {}, children }) {
  return <ContentContext.Provider value={{ header, visaSections, activityItems, menus }}>{children}</ContentContext.Provider>;
}

export const useHeaderContent = () => useContext(ContentContext).header;
export const useVisaMenuContent = () => useContext(ContentContext).visaSections;
export const useActivityMenuContent = () => useContext(ContentContext).activityItems;
/** Ready-made menus for holidays, cruises and events: `{ holidays, cruises, events }`, each a menu object or null. */
export const useCatalogMenus = () => useContext(ContentContext).menus || {};
