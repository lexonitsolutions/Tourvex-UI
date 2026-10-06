"use client";

import { createContext, useContext } from "react";

/**
 * Hands the (server-fetched) global CMS content to client components such as the header, the mega menu and the
 * phone navigation. The value is serialised into the first HTML, so there is no client fetch and no flicker.
 */
const ContentContext = createContext({ header: null });

export function ContentProvider({ header, children }) {
  return <ContentContext.Provider value={{ header }}>{children}</ContentContext.Provider>;
}

export const useHeaderContent = () => useContext(ContentContext).header;
