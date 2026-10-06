"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "../../lib/booking";
import { COUNTRIES, flagFor } from "../../lib/countries";
import { useApp } from "../AppProvider";
import { useCheckout } from "./CheckoutProvider";
import { nextStepHref, previousStepHref } from "./checkoutFlow";
import { FormError, StepFrame, TripSummary } from "./CheckoutShared";

const INDEX = 3;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// One entry per dialling code for the select; the first country listed for a shared code (+1, +7) stands for it.
const DIALS = (() => {
  const seen = new Set();
  return COUNTRIES.filter((c) => (seen.has(c.dial) ? false : seen.add(c.dial)));
})();

export default function CustomerStep() {
  const router = useRouter();
  const { user } = useApp();
  const { cart, api, apply } = useCheckout();
  const saved = cart.customer || {};
  const [v, setV] = useState({
    fullName: saved.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    email: saved.email || user?.email || "",
    phoneCountryCode: saved.phoneCountryCode || "+971",
    phone: saved.phone || "",
    nationality: saved.nationality || "",
    marketingOptOut: !!saved.marketingOptOut,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch) => setV((s) => ({ ...s, ...patch }));
  const dialCountry = COUNTRIES.find((c) => c.dial === v.phoneCountryCode);
  const flag = dialCountry ? flagFor(dialCountry.code) : null;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    const name = v.fullName.trim();
    const digits = v.phone.replace(/[\s-]/g, "");
    if (name.length < 2 || name.length > 120) er.fullName = "Please enter your full name.";
    if (!EMAIL.test(v.email.trim())) er.email = "Please enter a valid email address.";
    if (!/^\d{6,15}$/.test(digits)) er.phone = "Enter 6 to 15 digits, without the country code.";
    if (!v.nationality) er.nationality = "Please choose your nationality.";
    setErrors(er);
    if (Object.keys(er).length) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid='true']")?.focus());
      return;
    }
    setBusy(true);
    setError("");
    try {
      const latest = apply(await api.setCustomer({ fullName: name, email: v.email.trim(), phoneCountryCode: v.phoneCountryCode, phone: digits, nationality: v.nationality, marketingOptOut: v.marketingOptOut }));
      router.push(nextStepHref(latest, INDEX));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const field = (id, label, error, control, hint) => (
    <div className={`co-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && <small className="co-hint" id={`${id}-h`}>{hint}</small>}
      {error && <FormError id={`${id}-e`}>{error}</FormError>}
    </div>
  );
  const describe = (id, error, hint) => [hint ? `${id}-h` : null, error ? `${id}-e` : null].filter(Boolean).join(" ") || undefined;

  return (
    <StepFrame title="Customer details" intro="Who should we send your booking to?" summary={<TripSummary cart={cart} showHold />}>
      <form onSubmit={submit} noValidate>
        <div className="co-fields">
          {field("co-name", "Full name", errors.fullName,
            <input id="co-name" value={v.fullName} autoComplete="name" maxLength={120} aria-invalid={!!errors.fullName} aria-describedby={describe("co-name", errors.fullName)} onChange={(e) => set({ fullName: e.target.value })} />)}
          {field("co-email", "Email address", errors.email,
            <input id="co-email" type="email" inputMode="email" value={v.email} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={describe("co-email", errors.email, true)} onChange={(e) => set({ email: e.target.value })} />,
            "Your tickets and vouchers are sent to this email address, so please double-check it.")}
          <div className={`co-field${errors.phone ? " has-error" : ""}`}>
            <label htmlFor="co-phone">Phone number</label>
            <div className="co-phone">
              <span className="co-phone-code">
                {flag && <img src={flag} alt="" width="22" height="16" />}
                <select aria-label="Country code" value={v.phoneCountryCode} onChange={(e) => set({ phoneCountryCode: e.target.value })}>
                  {DIALS.map((c) => <option key={c.dial} value={c.dial}>{c.dial} ({c.name})</option>)}
                </select>
              </span>
              <input id="co-phone" type="tel" inputMode="tel" value={v.phone} autoComplete="tel-national" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "co-phone-e" : undefined} onChange={(e) => set({ phone: e.target.value })} />
            </div>
            {errors.phone && <FormError id="co-phone-e">{errors.phone}</FormError>}
          </div>
          {field("co-nat", "Nationality", errors.nationality,
            <select id="co-nat" value={v.nationality} autoComplete="country-name" aria-invalid={!!errors.nationality} aria-describedby={describe("co-nat", errors.nationality)} onChange={(e) => set({ nationality: e.target.value })}>
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>)}
          <label className="co-check">
            <input type="checkbox" checked={v.marketingOptOut} onChange={(e) => set({ marketingOptOut: e.target.checked })} />
            <span>I do not want to receive offers and travel news by email.</span>
          </label>
        </div>
        <FormError>{error}</FormError>
        <div className="co-actions">
          <Link className="mk-btn mk-btn-ghost" href={previousStepHref(cart, INDEX)}>Back</Link>
          <button type="submit" className="mk-btn" disabled={busy}>{busy ? "Saving..." : "Next"}</button>
        </div>
      </form>
    </StepFrame>
  );
}
