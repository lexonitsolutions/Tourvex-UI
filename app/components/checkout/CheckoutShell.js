"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { loginUrlFor } from "../../lib/wishlistAuth";
import { useApp } from "../AppProvider";
import { IconCheck, StateMessage } from "../activities/ActivityParts";
import { useCheckout } from "./CheckoutProvider";
import { STEPS, firstOpenStep, needsPickup, nextStepHref, stepDone, stepIndexForPath } from "./checkoutFlow";
import "../../checkout.css";

/** Checkout needs an account: signed-out visitors go to Clerk's sign-in and come straight back here. */
export function CheckoutGate({ children }) {
  const { user, ready } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (ready && !user) router.replace(loginUrlFor(pathname, "checkout"));
  }, [ready, user, pathname, router]);
  if (!ready || !user) {
    return (
      <div className="hol-page co-page mk-container" aria-busy="true">
        <p className="co-loading" role="status">{ready ? "Taking you to sign in..." : "Loading checkout..."}</p>
      </div>
    );
  }
  return children;
}

function Stepper({ cart, current }) {
  const done = stepDone(cart);
  const open = firstOpenStep(cart);
  const pickupSkipped = !needsPickup(cart);
  return (
    <nav className="co-stepper" aria-label="Checkout progress">
      <p className="co-step-compact" aria-hidden="true">Step {current + 1} of {STEPS.length}: {STEPS[current].label}</p>
      <ol>
        {STEPS.map((step, i) => {
          const skipped = step.id === "pickup" && pickupSkipped;
          const complete = (done[step.id] && i < current) || skipped;
          const reachable = i <= open && !skipped;
          const body = (
            <>
              <span className="co-step-dot" aria-hidden="true">{complete ? <IconCheck width="14" height="14" strokeWidth="3" /> : i + 1}</span>
              <span className="co-step-label">{step.label}{skipped ? <small> (not needed)</small> : null}</span>
            </>
          );
          return (
            <li key={step.id} className={`co-step${i === current ? " is-current" : ""}${complete ? " is-done" : ""}`} aria-current={i === current ? "step" : undefined}>
              {reachable && i !== current ? <Link href={step.href}>{body}</Link> : <span>{body}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Persistent frame for the five steps: the stepper, hold-expiry notice and the step guards. */
export default function CheckoutShell({ children }) {
  const { status, cart, error, retry, expired, dismissExpired, paused } = useCheckout();
  const pathname = usePathname();
  const router = useRouter();
  const current = stepIndexForPath(pathname);
  const first = useRef(true);

  let redirect = null;
  if (status === "ready" && !paused) {
    const open = firstOpenStep(cart);
    if (cart.items.length === 0 && current > 0) redirect = "/checkout";
    else if (cart.items.length > 0 && current > open) redirect = STEPS[open].href;
    else if (STEPS[current].id === "pickup" && !needsPickup(cart)) redirect = nextStepHref(cart, current);
  }

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  // Move focus to the new step's heading so screen reader users hear where they are.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById("co-step-title")?.focus({ preventScroll: true });
  }, [pathname]);

  if (status === "error") {
    return (
      <div className="hol-page co-page mk-container">
        <StateMessage title="We could not load your cart" text={error || "Please try again in a moment."} action="Try again" onAction={retry} />
      </div>
    );
  }
  if (status !== "ready" || redirect) {
    return (
      <div className="hol-page co-page mk-container" aria-busy="true">
        <div className="co-skel" role="status" aria-label="Loading your cart" />
      </div>
    );
  }

  return (
    <div className="hol-page co-page">
      <div className="mk-container">
        {cart.items.length > 0 && <Stepper cart={cart} current={current} />}
        {expired.length > 0 && (
          <div className="co-notice" role="status">
            <p>
              {expired.length === 1 ? "One activity was" : `${expired.length} activities were`} removed because the hold time ended:{" "}
              {expired.map((i) => i.activity?.title).filter(Boolean).join(", ")}. Availability may have changed, so please add {expired.length === 1 ? "it" : "them"} again.
            </p>
            <button type="button" className="co-linkbtn" onClick={dismissExpired}>Dismiss</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
