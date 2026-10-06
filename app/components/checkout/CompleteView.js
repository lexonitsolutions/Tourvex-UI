"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBookingApi } from "../../lib/booking";
import { requestCartRefresh } from "../../lib/cartStore";
import { useApp } from "../AppProvider";
import { IconCheck, IconInfo } from "../activities/ActivityParts";
import "../../checkout.css";

const PENDING_KEY = "tourvex.pendingOrder";
const MAX_TRIES = 30;

function readPending() {
  try {
    return JSON.parse(window.sessionStorage.getItem(PENDING_KEY) || "null") || {};
  } catch {
    return {};
  }
}

/** Where Stripe sends the customer back. Polls the session until our webhook has confirmed the booking. */
export default function CompleteView() {
  const params = useSearchParams();
  const { user, ready, getAccessToken } = useApp();
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);
  const session = params.get("session") || "";
  const failedRedirect = params.get("redirect_status") === "failed";
  const [state, setState] = useState({ phase: failedRedirect ? "failed" : "checking", refs: {} });

  useEffect(() => {
    if (!ready || !user || failedRedirect) return undefined;
    let live = true;
    let timer;
    let tries = 0;
    const tick = async () => {
      let next = null;
      try {
        const s = session ? await api.sessionStatus(session) : await api.cartStatus();
        if (!live) return;
        if (s.status === "completed") {
          const pending = readPending();
          next = {
            phase: "done",
            refs: {
              bookingReference: s.bookingReference || params.get("ref") || pending.bookingReference,
              orderReference: s.orderReference || params.get("order") || pending.orderReference,
            },
          };
        } else if (s.status === "expired") {
          next = { phase: "expired", refs: {} };
        }
      } catch {
        /* keep polling: a blip must not look like a failed payment */
      }
      if (next) {
        setState(next);
        if (next.phase === "done") {
          requestCartRefresh();
          try {
            window.sessionStorage.removeItem(PENDING_KEY);
          } catch {
            /* ignore */
          }
        }
        return;
      }
      tries += 1;
      if (tries >= MAX_TRIES) {
        setState({ phase: "slow", refs: {} });
        return;
      }
      timer = setTimeout(tick, 2000);
    };
    tick();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [ready, user, api, session, failedRedirect, params]);

  const { phase, refs } = state;
  const viewHref = refs.orderReference ? `/bookings/order/${encodeURIComponent(refs.orderReference)}` : refs.bookingReference ? `/bookings/${encodeURIComponent(refs.bookingReference)}` : "/bookings";

  return (
    <div className="hol-page co-page">
      <div className="mk-container co-complete">
        <div className="co-card co-done" role="status" aria-live="polite">
          {phase === "checking" && (
            <>
              <span className="co-spinner" aria-hidden="true" />
              <h1 id="co-step-title">Confirming your payment</h1>
              <p>This usually takes a few seconds. Please keep this page open.</p>
            </>
          )}
          {phase === "done" && (
            <>
              <span className="co-ok" aria-hidden="true"><IconCheck width="30" height="30" strokeWidth="3" /></span>
              <h1 id="co-step-title">Your booking is confirmed</h1>
              <p>Thank you. We will email your voucher to the address you gave us.</p>
              {(refs.orderReference || refs.bookingReference) && (
                <p className="co-ref"><small>{refs.orderReference ? "Order reference" : "Booking reference"}</small><b>{refs.orderReference || refs.bookingReference}</b></p>
              )}
              <Link className="mk-btn" href={viewHref}>View booking</Link>
            </>
          )}
          {phase === "failed" && (
            <>
              <span className="co-bad" aria-hidden="true"><IconInfo width="30" height="30" /></span>
              <h1 id="co-step-title">Your payment did not go through</h1>
              <p>You have not been charged. You can try again while your items are still held.</p>
              <Link className="mk-btn" href="/checkout/payment">Back to payment</Link>
            </>
          )}
          {phase === "expired" && (
            <>
              <span className="co-bad" aria-hidden="true"><IconInfo width="30" height="30" /></span>
              <h1 id="co-step-title">Your hold has ended</h1>
              <p>The payment was not completed in time and the items were released. Please start again.</p>
              <Link className="mk-btn" href="/activities">Explore activities</Link>
            </>
          )}
          {phase === "slow" && (
            <>
              <span className="co-bad" aria-hidden="true"><IconInfo width="30" height="30" /></span>
              <h1 id="co-step-title">We are still confirming</h1>
              <p>Your bank has not confirmed the payment yet. Check My Bookings in a few minutes. If you were charged, your booking will appear there.</p>
              <Link className="mk-btn" href="/bookings">My bookings</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
