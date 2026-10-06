"use client";

import { useLayoutEffect } from "react";
import { useApp } from "./AppProvider";

/** Hands the server-read cookie currency to AppProvider before the first paint of the streamed parts. Renders nothing. */
export default function CurrencySync({ currency }) {
  const { adoptServerCurrency } = useApp();
  useLayoutEffect(() => {
    adoptServerCurrency(currency);
  }, [adoptServerCurrency, currency]);
  return null;
}
