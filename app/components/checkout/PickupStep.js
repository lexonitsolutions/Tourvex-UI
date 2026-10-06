"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "../../lib/booking";
import { formatDay } from "../../lib/actFormat";
import { useCheckout } from "./CheckoutProvider";
import { nextStepHref, previousStepHref } from "./checkoutFlow";
import { FormError, ItemThumb, StepFrame, TripSummary } from "./CheckoutShared";

const INDEX = 1;

function PickupItem({ item, value, onChange, errors }) {
  const name = `pickup-${item.id ?? item.itemId ?? item._id}`;
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <fieldset className="co-pickup">
      <legend>
        <ItemThumb item={item} />
        <span><b>{item.activity?.title}</b><small>{item.option?.name} · {formatDay(item.date)}</small></span>
      </legend>
      <div className="co-choices" role="radiogroup" aria-label={`Pick-up for ${item.activity?.title}`}>
        {[
          ["now", "Yes, I will add it now", "Tell us the hotel or address you will be picked up from."],
          ["later", "Not yet, I will add it later", "You can send it to our team before the activity date."],
        ].map(([mode, title, text]) => (
          <label key={mode} className={`co-choice${value.mode === mode ? " is-on" : ""}`}>
            <input type="radio" name={name} value={mode} checked={value.mode === mode} onChange={() => set({ mode })} />
            <span><b>{title}</b><small>{text}</small></span>
          </label>
        ))}
      </div>
      {value.mode === "now" && (
        <div className="co-fields">
          <div className="co-field">
            <label htmlFor={`${name}-n`}>Hotel or place name</label>
            <input id={`${name}-n`} value={value.locationName} maxLength={120} aria-invalid={!!errors.locationName} aria-describedby={errors.locationName ? `${name}-ne` : undefined} onChange={(e) => set({ locationName: e.target.value })} />
            {errors.locationName && <FormError id={`${name}-ne`}>{errors.locationName}</FormError>}
          </div>
          <div className="co-field">
            <label htmlFor={`${name}-a`}>Address</label>
            <input id={`${name}-a`} value={value.address} maxLength={200} aria-invalid={!!errors.address} aria-describedby={errors.address ? `${name}-ae` : undefined} onChange={(e) => set({ address: e.target.value })} />
            {errors.address && <FormError id={`${name}-ae`}>{errors.address}</FormError>}
          </div>
          <div className="co-field">
            <label htmlFor={`${name}-t`}>Notes for the driver <em>(optional)</em></label>
            <input id={`${name}-t`} value={value.notes} maxLength={200} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>
      )}
    </fieldset>
  );
}

export default function PickupStep() {
  const router = useRouter();
  const { cart, api, apply, itemKey } = useCheckout();
  const items = cart.items.filter((i) => i.option?.pickupRequired);
  const [values, setValues] = useState(() =>
    Object.fromEntries(items.map((i) => [itemKey(i), { mode: i.pickup?.mode || "", locationName: i.pickup?.locationName || "", address: i.pickup?.address || "", notes: i.pickup?.notes || "" }]))
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = items.every((i) => values[itemKey(i)]?.mode);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    items.forEach((i) => {
      const v = values[itemKey(i)];
      if (v.mode === "now") {
        const er = {};
        if (v.locationName.trim().length < 2) er.locationName = "Please enter the place name.";
        if (v.address.trim().length < 3) er.address = "Please enter the address.";
        if (Object.keys(er).length) found[itemKey(i)] = er;
      }
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError("");
    try {
      let latest = cart;
      for (const i of items) {
        const v = values[itemKey(i)];
        const body = v.mode === "now" ? { mode: "now", locationName: v.locationName.trim(), address: v.address.trim(), ...(v.notes.trim() ? { notes: v.notes.trim() } : {}) } : { mode: "later" };
        latest = apply(await api.setPickup(itemKey(i), body));
      }
      router.push(nextStepHref(latest, INDEX));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <StepFrame
      title="Do you know your pick-up point?"
      intro="Some of your activities include a pick-up. Tell us where now, or add it later."
      summary={<TripSummary cart={cart} showHold />}
    >
      <form onSubmit={submit} noValidate>
        {items.map((item) => (
          <PickupItem key={itemKey(item)} item={item} value={values[itemKey(item)]} errors={errors[itemKey(item)] || {}} onChange={(v) => setValues((s) => ({ ...s, [itemKey(item)]: v }))} />
        ))}
        <FormError>{error}</FormError>
        <div className="co-actions">
          <Link className="mk-btn mk-btn-ghost" href={previousStepHref(cart, INDEX)}>Back</Link>
          <button type="submit" className="mk-btn" disabled={!ready || busy}>{busy ? "Saving..." : "Next"}</button>
        </div>
      </form>
    </StepFrame>
  );
}
