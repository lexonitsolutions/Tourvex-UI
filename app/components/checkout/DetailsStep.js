"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "../../lib/booking";
import { formatDay } from "../../lib/actFormat";
import { useCheckout } from "./CheckoutProvider";
import { nextStepHref, previousStepHref } from "./checkoutFlow";
import { FormError, ItemThumb, StepFrame, TripSummary } from "./CheckoutShared";

const INDEX = 2;

export default function DetailsStep() {
  const router = useRouter();
  const { cart, api, apply, itemKey } = useCheckout();
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      cart.items.map((i) => [
        itemKey(i),
        { lead: i.additional?.leadTravellerNames?.[0] || "", requests: i.additional?.specialRequests || "", flight: i.additional?.arrivalFlight || "", hotel: i.additional?.hotelName || "" },
      ])
    )
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (id, patch) => setValues((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let latest = cart;
      for (const item of cart.items) {
        const v = values[itemKey(item)];
        const body = {
          ...(v.lead.trim() ? { leadTravellerNames: [v.lead.trim()] } : {}),
          ...(v.requests.trim() ? { specialRequests: v.requests.trim() } : {}),
          ...(v.flight.trim() ? { arrivalFlight: v.flight.trim() } : {}),
          ...(v.hotel.trim() ? { hotelName: v.hotel.trim() } : {}),
        };
        latest = apply(await api.setAdditional(itemKey(item), body));
      }
      router.push(nextStepHref(latest, INDEX));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <StepFrame title="Additional details" intro="Everything here is optional. It helps the operator look after you on the day." summary={<TripSummary cart={cart} showHold />}>
      <form onSubmit={submit} noValidate>
        {cart.items.map((item) => {
          const id = itemKey(item);
          const v = values[id];
          return (
            <fieldset className="co-pickup" key={id}>
              <legend>
                <ItemThumb item={item} />
                <span><b>{item.activity?.title}</b><small>{item.option?.name} · {formatDay(item.date)}</small></span>
              </legend>
              <div className="co-fields">
                <div className="co-field">
                  <label htmlFor={`${id}-lead`}>Lead traveller name <em>(optional)</em></label>
                  <input id={`${id}-lead`} value={v.lead} maxLength={120} autoComplete="name" onChange={(e) => set(id, { lead: e.target.value })} />
                </div>
                <div className="co-field">
                  <label htmlFor={`${id}-hotel`}>Hotel name <em>(optional)</em></label>
                  <input id={`${id}-hotel`} value={v.hotel} maxLength={120} onChange={(e) => set(id, { hotel: e.target.value })} />
                </div>
                <div className="co-field">
                  <label htmlFor={`${id}-flight`}>Arrival flight <em>(optional)</em></label>
                  <input id={`${id}-flight`} value={v.flight} maxLength={40} onChange={(e) => set(id, { flight: e.target.value })} />
                </div>
                <div className="co-field">
                  <label htmlFor={`${id}-req`}>Special requests <em>(optional)</em></label>
                  <textarea id={`${id}-req`} rows={3} value={v.requests} maxLength={500} aria-describedby={`${id}-req-n`} onChange={(e) => set(id, { requests: e.target.value })} />
                  <small id={`${id}-req-n`} className="co-hint">{v.requests.length}/500. Requests are passed on but cannot be guaranteed.</small>
                </div>
              </div>
            </fieldset>
          );
        })}
        <FormError>{error}</FormError>
        <div className="co-actions">
          <Link className="mk-btn mk-btn-ghost" href={previousStepHref(cart, INDEX)}>Back</Link>
          <button type="submit" className="mk-btn" disabled={busy}>{busy ? "Saving..." : "Next"}</button>
        </div>
      </form>
    </StepFrame>
  );
}
