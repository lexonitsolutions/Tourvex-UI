"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { aboutText, formatDay, money, paxLabel, plural, TRANSFER_LABEL } from "../../lib/actFormat";
import { FALLBACK_IMG, showFallback } from "../activities/ActivityParts";
import { useCheckout } from "./CheckoutProvider";
import "../../checkout.css";

/** Seconds left until `expiresAt`; `null` until mounted so the server and first client render match. */
export function useCountdown(expiresAt) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const target = new Date(expiresAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [expiresAt]);
  return left;
}

export const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** "Items held for 09:41". When it reaches zero the cart is re-read so expired items drop out. */
export function HoldTimer({ expiresAt }) {
  const { refresh } = useCheckout();
  const left = useCountdown(expiresAt);
  useEffect(() => {
    if (left === 0) refresh();
  }, [left, refresh]);
  if (!expiresAt || left == null) return null;
  return (
    <p className={`co-hold${left < 120 ? " is-low" : ""}`}>
      {left > 0 ? (
        <>
          <span>Your items are held for</span>
          <b aria-hidden="true">{clock(left)}</b>
          <span className="co-sr">{Math.ceil(left / 60)} minutes</span>
        </>
      ) : (
        <span role="alert">Your hold has ended. Refreshing your cart...</span>
      )}
    </p>
  );
}

export function ItemBadges({ item }) {
  const o = item.option || {};
  return (
    <ul className="co-badges">
      <li className={o.refundable ? "is-good" : "is-warn"}>{o.refundable ? "Refundable" : "Non-refundable"}</li>
      {o.transferType && <li>{TRANSFER_LABEL[o.transferType] || o.transferType}</li>}
      {o.startTime && <li>Starts {o.startTime}</li>}
    </ul>
  );
}

export function ItemThumb({ item }) {
  return <img className="co-thumb" src={item.activity?.image || FALLBACK_IMG} alt="" width="120" height="90" loading="lazy" onError={showFallback} />;
}

export function Money({ value, pricing }) {
  const about = pricing ? aboutText(pricing) : "";
  return (
    <>
      <b>{money(value)}</b>
      {about && <small className="co-about">{about}</small>}
    </>
  );
}

/** Right-hand summary: service count, per-item lines, totals in AED and any `children` (the step's buttons). */
export function TripSummary({ cart, showHold = false, children, charged = false }) {
  const n = cart.items.length;
  const p = cart.pricing || {};
  const discount = p.discount?.amount > 0;
  return (
    <aside className="co-summary" aria-label="Trip summary">
      <h2>Trip Summary</h2>
      <p className="co-sum-count">{plural(n, "service")}</p>
      <ul className="co-sum-lines">
        {cart.items.map((item) => (
          <li key={item.id ?? item.itemId ?? item._id}>
            <span>{item.activity?.title}<small>{formatDay(item.date)} · {paxLabel(item.adults, item.children || 0)}</small></span>
            <b>{money(item.pricing?.total)}</b>
          </li>
        ))}
      </ul>
      <dl className="co-sum-totals">
        <div><dt>Subtotal</dt><dd>{money(p.subtotal)}</dd></div>
        {discount && <div className="is-discount"><dt>Discount{p.promoCode ? ` (${p.promoCode})` : ""}</dt><dd>-{money(p.discount)}</dd></div>}
        <div><dt>Taxes &amp; fees</dt><dd>{money(p.taxesAndFees)}</dd></div>
        <div className="is-total"><dt>Total payable</dt><dd>{money(p.total)}</dd></div>
      </dl>
      {aboutText(p) && <p className="co-about-line">{aboutText(p)}, shown for reference only.</p>}
      {charged && <p className="co-charged">Your card will be charged in AED.</p>}
      {showHold && <HoldTimer expiresAt={cart.expiresAt} />}
      {children}
      <ul className="co-why" aria-label="Good to know">
        <li>Taxes and fees are included in the total you see.</li>
        <li>Your vouchers are sent to the email you give us after payment.</li>
        <li>Questions? <Link href="/contact">Our team is happy to help</Link>.</li>
      </ul>
    </aside>
  );
}

/** Two-column frame used by every step: the step card on the left, the summary on the right. */
export function StepFrame({ title, intro, children, summary }) {
  return (
    <div className="co-grid">
      <section className="co-card" aria-labelledby="co-step-title">
        <h1 id="co-step-title" tabIndex={-1}>{title}</h1>
        {intro && <p className="co-intro">{intro}</p>}
        {children}
      </section>
      {summary}
    </div>
  );
}

export function FormError({ id, children }) {
  return <p id={id} className="co-error" role="alert" aria-live="assertive">{children}</p>;
}
