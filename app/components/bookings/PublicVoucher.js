"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { formatDay } from "../../lib/actFormat";
import "../../checkout.css";

const TEXT = {
  valid: { tone: "ok", title: "Valid ticket", text: "This ticket can be used on the day of the activity." },
  already_redeemed: { tone: "bad", title: "Already used", text: "This ticket has already been scanned." },
  void: { tone: "bad", title: "Ticket cancelled", text: "This ticket is no longer valid." },
  too_early: { tone: "warn", title: "Not valid yet", text: "This ticket is only valid on the day of the activity." },
  expired: { tone: "bad", title: "Expired", text: "The day of this activity has passed." },
  booking_inactive: { tone: "bad", title: "Not valid", text: "The booking behind this ticket is not active." },
};

/** What a guest (or anyone) sees after scanning a ticket QR with a phone: validity, activity, date, group size. No personal data. */
export default function PublicVoucher({ code }) {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    let live = true;
    fetch(`${API_BASE_URL}/vouchers/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) return { status: "missing", data: null };
        if (!response.ok) return { status: "error", data: null };
        return { status: "ok", data: await response.json() };
      })
      .catch(() => ({ status: "error", data: null }))
      .then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, [code]);

  const info = state.data ? TEXT[state.data.status] || TEXT.booking_inactive : null;
  return (
    <section className="hol-page co-page">
      <div className="mk-container co-bk">
        <article className="co-voucher" aria-live="polite">
          {state.status === "loading" ? <div className="co-skel" role="status" aria-label="Checking ticket" /> : null}
          {state.status === "missing" ? <><h1 id="co-step-title">Ticket not found</h1><p>We could not find a ticket for this code. Check the code on your voucher.</p></> : null}
          {state.status === "error" ? <><h1 id="co-step-title">We could not check this ticket</h1><p>Please try again in a moment.</p></> : null}
          {info ? (
            <>
              <h1 id="co-step-title">{info.title}</h1>
              <p>{info.text}</p>
              <dl className="co-dl">
                <div><dt>Activity</dt><dd>{state.data.activityTitle}{state.data.optionName ? ` (${state.data.optionName})` : ""}</dd></div>
                <div><dt>Date</dt><dd>{state.data.serviceDay ? formatDay(state.data.serviceDay) : "-"}{state.data.startTime ? ` at ${state.data.startTime}` : ""}</dd></div>
                <div><dt>Travellers</dt><dd>{state.data.adults} adult{state.data.adults === 1 ? "" : "s"}{state.data.children ? `, ${state.data.children} child${state.data.children === 1 ? "" : "ren"}` : ""}</dd></div>
              </dl>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
