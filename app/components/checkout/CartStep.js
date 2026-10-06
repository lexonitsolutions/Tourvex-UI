"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "../../lib/booking";
import { formatDay, paxLabel } from "../../lib/actFormat";
import { IconCalendar, IconCart, IconEdit, IconTrash, IconUsers } from "../activities/ActivityParts";
import { useCheckout } from "./CheckoutProvider";
import { STEPS, nextStepHref } from "./checkoutFlow";
import { FormError, ItemBadges, ItemThumb, Money, StepFrame, TripSummary } from "./CheckoutShared";

export default function CartStep() {
  const router = useRouter();
  const { cart, api, apply, itemKey } = useCheckout();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  if (cart.items.length === 0) {
    return (
      <div className="co-card co-empty">
        <span className="co-empty-ico" aria-hidden="true"><IconCart width="30" height="30" /></span>
        <h1 id="co-step-title" tabIndex={-1}>Your cart is empty</h1>
        <p>Pick an activity, choose a date and add it to your cart. Items are held for a short time while you check out.</p>
        <Link className="mk-btn" href="/activities">Explore activities</Link>
      </div>
    );
  }

  const remove = async (id) => {
    setBusy(id);
    setError("");
    try {
      apply(await api.removeItem(id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <StepFrame
      title="Your cart"
      summary={
        <TripSummary cart={cart} showHold>
          <div className="co-actions is-stack">
            <button type="button" className="mk-btn mk-btn-block" onClick={() => router.push(nextStepHref(cart, 0))}>Proceed to pay</button>
            <Link className="mk-btn mk-btn-ghost mk-btn-block" href="/activities">Continue Shopping</Link>
          </div>
        </TripSummary>
      }
    >
      <h2 className="co-group">Activities</h2>
      <FormError>{error}</FormError>
      <ul className="co-items">
        {cart.items.map((item) => {
          const id = itemKey(item);
          return (
            <li key={id} className="co-item">
              <ItemThumb item={item} />
              <div className="co-item-body">
                <h3><Link href={`/activities/${item.activity?.slug}`}>{item.activity?.title}</Link></h3>
                <p className="co-item-opt">{item.option?.name}</p>
                <ItemBadges item={item} />
                <ul className="co-facts">
                  <li><IconCalendar width="16" height="16" />{formatDay(item.date)}</li>
                  <li><IconUsers width="16" height="16" />{paxLabel(item.adults, item.children || 0)}</li>
                </ul>
              </div>
              <div className="co-item-side">
                <p className="co-item-total"><Money value={item.pricing?.total} pricing={item.pricing} /></p>
                <div className="co-item-btns">
                  <Link className="co-chipbtn" href={`/activities/${item.activity?.slug}?modify=${encodeURIComponent(id)}`}><IconEdit width="16" height="16" />Modify</Link>
                  <button type="button" className="co-chipbtn is-danger" disabled={busy === id} onClick={() => remove(id)} aria-label={`Remove ${item.activity?.title}`}>
                    <IconTrash width="16" height="16" />{busy === id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <span className="co-sr">Step 1 of {STEPS.length}</span>
    </StepFrame>
  );
}
