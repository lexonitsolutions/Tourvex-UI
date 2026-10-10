"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { errorMessage, isUnavailableError, unavailableIds } from "../../lib/booking";
import { money } from "../../lib/actFormat";
import { requestCartRefresh, setCartCount } from "../../lib/cartStore";
import { STRIPE_APPEARANCE, getStripe, stripeKeyPresent } from "../../lib/stripeClient";
import { IconLock } from "../activities/ActivityParts";
import { useCheckout } from "./CheckoutProvider";
import { previousStepHref } from "./checkoutFlow";
import { FormError, StepFrame, TripSummary } from "./CheckoutShared";

const INDEX = 4;
const PENDING_KEY = "tourvex.pendingOrder";

const bookingHref = (refs) =>
  refs.orderReference ? `/bookings/order/${encodeURIComponent(refs.orderReference)}` : refs.bookingReference ? `/bookings/${encodeURIComponent(refs.bookingReference)}` : "/bookings";

function Promo({ cart, locked }) {
  const { api, apply } = useCheckout();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const applied = cart.pricing?.promoCode;

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      apply(await fn());
      setCode("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="co-block">
      <h2>Offers &amp; discounts</h2>
      {applied ? (
        <p className="co-promo-on">
          <span>Promo code <b>{applied}</b> applied.</span>
          {!locked && <button type="button" className="co-linkbtn" disabled={busy} onClick={() => run(() => api.removePromo())}>Remove</button>}
        </p>
      ) : (
        <form className="co-promo" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => api.applyPromo(code.trim())); }}>
          <label className="co-sr" htmlFor="co-promo">Promo code</label>
          <input id="co-promo" value={code} placeholder="Promo code" autoCapitalize="characters" autoComplete="off" disabled={locked || busy} aria-describedby={error ? "co-promo-e" : undefined} onChange={(e) => setCode(e.target.value)} />
          <button type="submit" className="mk-btn" disabled={locked || busy || !code.trim()}>{busy ? "Applying..." : "Apply"}</button>
        </form>
      )}
      <FormError id="co-promo-e">{error}</FormError>
    </div>
  );
}

/** Stripe's own Payment Element decides which methods to offer; we never render card inputs ourselves. */
function StripeForm({ cart, refs, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    onError("");
    const query = new URLSearchParams({ session: cart.id || "" });
    if (refs.orderReference) query.set("order", refs.orderReference);
    if (refs.bookingReference) query.set("ref", refs.bookingReference);
    try {
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(refs));
    } catch {
      /* storage unavailable */
    }
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/checkout/complete?${query}` } });
    // Only reached when the payment could not start (validation or card error); success redirects away.
    if (error) onError(error.message || "Your payment could not be completed. Please try again.");
    setBusy(false);
  };

  return (
    <>
      <PaymentElement options={{ layout: "tabs" }} />
      <button type="button" className="mk-btn mk-btn-block co-pay" disabled={!stripe || busy} onClick={confirm}>
        <IconLock width="18" height="18" />{busy ? "Processing..." : `Pay ${money(cart.pricing?.total)}`}
      </button>
    </>
  );
}

export default function PaymentStep() {
  const router = useRouter();
  const { cart, api, apply, setPaused, flagItems } = useCheckout();
  const [phase, setPhase] = useState({ name: "idle" });
  const [error, setError] = useState("");
  const total = money(cart.pricing?.total);

  // Leaving the page while an order is open must not trip the "cart is empty" guard.
  useEffect(() => () => setPaused(false), [setPaused]);

  const pay = async () => {
    setPhase({ name: "paying" });
    setError("");
    try {
      const res = await api.pay();
      const refs = { orderReference: res.orderReference, bookingReference: res.bookingReference };
      if (res.mode === "mock") {
        setPaused(true);
        setCartCount(0);
        requestCartRefresh();
        setPhase({ name: "mock", refs });
      } else if (res.mode === "stripe") {
        if (!res.clientSecret || !res.publishableKeyConfigured || !stripeKeyPresent) setPhase({ name: "unconfigured" });
        else setPhase({ name: "stripe", clientSecret: res.clientSecret, refs });
      } else {
        setPhase({ name: "idle" });
        setError("We could not start your payment. Please try again.");
      }
    } catch (e) {
      setPhase({ name: "idle" });
      setError(errorMessage(e));
      if (isUnavailableError(e)) {
        // A date sold out while paying: mark the line(s) and send the customer to the cart to change the date or remove it.
        const ids = unavailableIds(e);
        flagItems(ids, errorMessage(e));
        if (ids.length) {
          api.getCart().then(apply).catch(() => {});
          router.push("/checkout");
          return;
        }
      }
      // The hold may have ended or a step is incomplete: re-read the cart so the guards can react.
      if (e.code === "SESSION_EXPIRED" || e.code === "CART_EXPIRED" || e.status === 409) api.getCart().then(apply).catch(() => {});
    }
  };

  const options = useMemo(() => (phase.name === "stripe" ? { clientSecret: phase.clientSecret, appearance: STRIPE_APPEARANCE } : null), [phase]);
  const locked = phase.name !== "idle" && phase.name !== "paying";

  const payAction =
    phase.name === "stripe" || phase.name === "mock" || phase.name === "unconfigured" ? null : (
      <div className="co-actions is-stack">
        <button type="button" className="mk-btn mk-btn-block co-pay" disabled={phase.name === "paying"} onClick={pay}>
          <IconLock width="18" height="18" />{phase.name === "paying" ? "Please wait..." : `Pay ${total}`}
        </button>
        <Link className="mk-btn mk-btn-ghost mk-btn-block" href={previousStepHref(cart, INDEX)}>Back</Link>
      </div>
    );

  const frame = (
    <StepFrame title="Payment" summary={<TripSummary cart={cart} showHold charged>{payAction}</TripSummary>}>
      <Promo cart={cart} locked={locked} />
      <div className="co-block">
        <h2>Payment options</h2>
        {phase.name === "mock" ? (
          <div className="co-mock" role="status">
            <b>Test mode: payment is simulated</b>
            <p>No money was taken. Your booking has been confirmed so you can see what customers will receive.</p>
            <button type="button" className="mk-btn" onClick={() => router.push(bookingHref(phase.refs))}>View my booking</button>
          </div>
        ) : phase.name === "unconfigured" ? (
          <div className="co-unconf" role="alert">
            <b>Payments are not configured yet</b>
            <p>Online card payment is not switched on for this site yet. Your booking has not been charged. Please contact our team and we will complete it with you.</p>
            <Link className="mk-btn mk-btn-ghost" href="/contact">Contact us</Link>
          </div>
        ) : phase.name === "stripe" ? (
          <>
            <p className="co-pay-note">Choose how to pay below. Your details go straight to Stripe and never touch our servers.</p>
            <StripeForm cart={cart} refs={phase.refs} onError={setError} />
          </>
        ) : (
          <p className="co-pay-note">
            Press Pay to continue. You will then enter your payment details securely with Stripe (the methods available to you are shown there). Charged in AED.
          </p>
        )}
        <FormError>{error}</FormError>
      </div>
    </StepFrame>
  );

  return options ? <Elements stripe={getStripe()} options={options} key={options.clientSecret}>{frame}</Elements> : frame;
}
