"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../../lib/api";
import { submitCruiseEnquiry } from "../../lib/cruises";
import { holdAmbient } from "../../lib/motion";
import { useApp } from "../AppProvider";
import CurrencyNote from "../CurrencyNote";
import { EnquiryStockNote } from "../StockBadge";
import { useMotion } from "../MotionShell";
import { IconCheck, IconX, formatDate } from "./CruiseParts";

const EMPTY = { fullName: "", email: "", phone: "", nationality: "", adults: "2", children: "0", departureDate: "", cabinType: "", message: "", consent: false };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

const isInt = (v, min, max) => /^\d+$/.test(String(v).trim()) && Number(v) >= min && Number(v) <= max;

/** Client-side mirror of the API limits (docs/CRUISES_API.md), so most mistakes are caught before the request. */
export function validate(v, departures) {
  const e = {};
  const name = v.fullName.trim();
  if (name.length < 2 || name.length > 120) e.fullName = "Enter your full name (2 to 120 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email address.";
  const phone = v.phone.trim();
  if (phone.length < 6 || phone.length > 20) e.phone = "Enter a phone number (6 to 20 characters).";
  const nat = v.nationality.trim();
  if (nat.length < 2 || nat.length > 80) e.nationality = "Enter your nationality (2 to 80 characters).";
  if (!isInt(v.adults, 1, 10)) e.adults = "Adults must be a whole number from 1 to 10.";
  if (!isInt(v.children, 0, 10)) e.children = "Children must be a whole number from 0 to 10.";
  if (v.departureDate && !departures.includes(v.departureDate)) e.departureDate = "Please choose one of the listed departure dates.";
  if (v.cabinType.length > 60) e.cabinType = "Cabin type is too long.";
  if (v.message.length > 1000) e.message = "Please keep your message under 1000 characters.";
  if (!v.consent) e.consent = "Please agree to be contacted so we can reply to your enquiry.";
  return e;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div className={`cr-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}{optional && <em> (optional)</em>}</label>
      {children}
      {error && <p className="cr-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/**
 * Enquiry sheet. Built once (hidden) so opening is only a class toggle, and portalled into the .mk root so the theme
 * variables apply and `position: fixed` is not trapped by a transformed ancestor. Bottom sheet on phones.
 */
export default function CruiseEnquiry({ cruise, open, onClose, departure, cabin }) {
  const { user, getAccessToken } = useApp();
  const { setScrollLocked } = useMotion();
  const [host, setHost] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [reference, setReference] = useState("");
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const abortRef = useRef(null);
  const departures = cruise.departures || [];
  const cabins = (cruise.cabins || []).filter((c) => c.type);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.querySelector(".mk"));
  }, []);

  // Prefill from the signed-in account without overwriting what the visitor already typed.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((v) => ({
      ...v,
      fullName: v.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: v.email || user.email || "",
    }));
  }, [user]);

  // Pick up the departure / cabin chosen on the page each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((v) => ({ ...v, departureDate: departure || v.departureDate, cabinType: cabin || v.cabinType }));
  }, [open, departure, cabin]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("cruise-enquiry", true);
    const focusTimer = setTimeout(() => {
      const first = dialogRef.current?.querySelector(".cr-sheet-body input, .cr-sheet-body button");
      (first || closeRef.current)?.focus({ preventScroll: true });
    }, 160);
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || []).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      setScrollLocked(false);
      holdAmbient("cruise-enquiry", false);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, setScrollLocked]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const set = useCallback((key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setFormError("");
    const found = validate(values, departures);
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      dialogRef.current?.querySelector(`[name="${firstKey}"]`)?.focus();
      return;
    }
    const body = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      nationality: values.nationality.trim(),
      adults: Number(values.adults),
      children: Number(values.children),
      consent: true,
      ...(values.departureDate ? { departureDate: values.departureDate } : {}),
      ...(values.cabinType ? { cabinType: values.cabinType } : {}),
      ...(values.message.trim() ? { message: values.message.trim() } : {}),
    };
    setPending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let token = null;
      try {
        token = await getAccessToken();
      } catch {
        token = null; // anonymous enquiries are fine
      }
      const res = await submitCruiseEnquiry(cruise.slug, body, { token, signal: controller.signal });
      setReference(res.reference);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 429) setFormError("Too many enquiries just now. Please wait a minute and try again.");
      else if (err instanceof ApiError && err.status === 400) setFormError(err.message);
      else if (err instanceof ApiError && err.status === 404) setFormError("This cruise is no longer available. Please choose another one or contact us.");
      else setFormError("We could not send your enquiry. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  const finish = () => {
    onClose();
    // Reset after the sheet has folded away.
    setTimeout(() => {
      setReference("");
      setFormError("");
      setErrors({});
      setValues((v) => ({ ...EMPTY, fullName: user ? v.fullName : "", email: user ? v.email : "" }));
    }, 500);
  };

  if (!host) return null;

  const a11y = (key) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `cq-${key}-err` : undefined,
  });

  return createPortal(
    <div className={`cr-sheet${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="cr-sheet-scrim" aria-label="Close" tabIndex={-1} onClick={reference ? finish : onClose} />
      <div className="cr-sheet-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cq-title">
        <button ref={closeRef} type="button" className="cr-sheet-close" aria-label="Close enquiry form" onClick={reference ? finish : onClose}>
          <IconX width="20" height="20" />
        </button>
        {reference ? (
          <div className="cr-sheet-body cr-success" data-lenis-prevent>
            <span className="cr-success-ico" aria-hidden="true"><IconCheck width="30" height="30" strokeWidth="2.6" /></span>
            <h2 id="cq-title">Enquiry sent</h2>
            <p>Thank you. Our team will contact you about {cruise.title} using the details you gave us.</p>
            <p className="cr-ref-label">Your reference</p>
            <p className="cr-ref" aria-live="polite">{reference}</p>
            <p className="cr-hint">Keep this reference handy if you contact us about this enquiry.</p>
            <button type="button" className="mk-btn" onClick={finish}>Done</button>
          </div>
        ) : (
          <form className="cr-sheet-body" noValidate onSubmit={submit} data-lenis-prevent>
            <div className="cr-sheet-head">
              <h2 id="cq-title">Start your enquiry</h2>
              <p>{cruise.title}</p>
            </div>
            <EnquiryStockNote stock={cruise.stock} noun="cruise" />
            {formError && <p className="cr-form-error" role="alert">{formError}</p>}
            <div className="cr-form-grid">
              <Field id="cq-fullName" label="Full name" error={errors.fullName}>
                <input id="cq-fullName" name="fullName" value={values.fullName} onChange={set("fullName")} autoComplete="name" maxLength={120} {...a11y("fullName")} />
              </Field>
              <Field id="cq-email" label="Email" error={errors.email}>
                <input id="cq-email" name="email" type="email" inputMode="email" value={values.email} onChange={set("email")} autoComplete="email" {...a11y("email")} />
              </Field>
              <Field id="cq-phone" label="Phone" error={errors.phone}>
                <input id="cq-phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} autoComplete="tel" maxLength={20} {...a11y("phone")} />
              </Field>
              <Field id="cq-nationality" label="Nationality" error={errors.nationality}>
                <input id="cq-nationality" name="nationality" value={values.nationality} onChange={set("nationality")} autoComplete="country-name" maxLength={80} {...a11y("nationality")} />
              </Field>
              <Field id="cq-adults" label="Adults" error={errors.adults}>
                <input id="cq-adults" name="adults" type="number" inputMode="numeric" min="1" max="10" step="1" value={values.adults} onChange={set("adults")} {...a11y("adults")} />
              </Field>
              <Field id="cq-children" label="Children" error={errors.children}>
                <input id="cq-children" name="children" type="number" inputMode="numeric" min="0" max="10" step="1" value={values.children} onChange={set("children")} {...a11y("children")} />
              </Field>
              {departures.length > 0 && (
                <Field id="cq-departureDate" label="Departure date" optional error={errors.departureDate}>
                  <select id="cq-departureDate" name="departureDate" value={values.departureDate} onChange={set("departureDate")} {...a11y("departureDate")}>
                    <option value="">No preference</option>
                    {departures.map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}
                  </select>
                </Field>
              )}
              {cabins.length > 0 && (
                <Field id="cq-cabinType" label="Cabin type" optional error={errors.cabinType}>
                  <select id="cq-cabinType" name="cabinType" value={values.cabinType} onChange={set("cabinType")} {...a11y("cabinType")}>
                    <option value="">No preference</option>
                    {cabins.map((c) => <option key={c.type} value={c.type}>{c.type}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <Field id="cq-message" label="Message" optional error={errors.message}>
              <textarea id="cq-message" name="message" rows={3} maxLength={1000} value={values.message} onChange={set("message")} {...a11y("message")} />
            </Field>
            <div className={`cr-consent${errors.consent ? " has-error" : ""}`}>
              <label>
                <input type="checkbox" name="consent" checked={values.consent} onChange={set("consent")} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "cq-consent-err" : undefined} />
                <span>I agree to be contacted about this enquiry</span>
              </label>
              {errors.consent && <p className="cr-error" id="cq-consent-err">{errors.consent}</p>}
            </div>
            <button type="submit" className="mk-btn mk-btn-block cr-submit" disabled={pending}>
              {pending ? "Sending..." : "Send enquiry"}
            </button>
            <p className="cr-hint cr-privacy">We only use your details to reply to this enquiry. No payment is taken here.</p>
            <p className="cr-hint cr-privacy"><CurrencyNote /></p>
          </form>
        )}
      </div>
    </div>,
    host
  );
}
