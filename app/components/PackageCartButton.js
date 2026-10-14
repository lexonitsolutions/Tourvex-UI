"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingApi, errorMessage } from "../lib/booking";
import { loginUrlFor } from "../lib/wishlistAuth";
import { useApp } from "./AppProvider";
import "../package-cart.css";

const key = (value) => String(value || "standard").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "standard";
const tomorrow = () => { const d = new Date(Date.now() + 86400000); return d.toISOString().slice(0, 10); };

export default function PackageCartButton({ item, type, compact = true, date: selectedDate, adults = 1, children = 0, option: selectedOption }) {
  const router = useRouter();
  const { user, ready, getAccessToken } = useApp();
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);
  const [state, setState] = useState("");
  if (!item?.allowAddToCart || !item?.price || item?.stock?.soldOut) return null;

  const add = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!ready) return;
    if (!user) {
      router.push(loginUrlFor(typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`));
      return;
    }
    setState("busy");
    const date = selectedDate || (type === "cruise" ? String(item.nextDepartures?.[0] || item.departures?.[0] || tomorrow()).slice(0, 10)
      : type === "event" ? String(item.nextDate || item.sessions?.[0]?.startsAt || tomorrow()).slice(0, 10) : tomorrow());
    const option = selectedOption || (type === "cruise" ? item.cabins?.[0]?.type : type === "event" ? item.ticketTypes?.[0]?.type : "standard");
    try {
      await api.addItem({ productType: type, productSlug: item.slug, optionId: key(option), date, adults, children });
      setState("added");
      window.setTimeout(() => setState(""), 2600);
    } catch (error) {
      setState(errorMessage(error));
      window.setTimeout(() => setState(""), 4000);
    }
  };

  const failed = state && state !== "busy" && state !== "added";
  return (
    <span className={`pkg-cart-wrap${compact ? " is-compact" : ""}`}>
      <button type="button" className="pkg-cart-btn" onClick={add} disabled={state === "busy"} aria-label={`Add ${item.title} to cart`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6.1M10 20h.01M17 20h.01" /></svg>
        <span>{state === "busy" ? "Adding…" : state === "added" ? "Added" : "Add to Cart"}</span>
      </button>
      {(state === "added" || failed) && <span className={`pkg-cart-note${failed ? " is-error" : ""}`} role="status">{failed || "Added to your cart"}</span>}
    </span>
  );
}
