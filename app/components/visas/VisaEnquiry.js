"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../../lib/api";
import { holdAmbient } from "../../lib/motion";
import { submitVisaEnquiry } from "../../lib/visas";
import { useApp } from "../AppProvider";
import CurrencyNote from "../CurrencyNote";
import { useMotion } from "../MotionShell";
import { Flag, IconCheck, IconClose } from "./VisaParts";

const EMPTY = { fullName: "", email: "", phone: "", nationality: "", travellers: "1", travelDate: "", message: "", consent: false };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Client-side mirror of the API rules, so most mistakes are caught before the request. */
export function validate(v) {
  const e = {};
  const name = v.fullName.trim();
  if (name.length < 2 || name.length > 120) e.fullName = "Enter your full name (2 to 120 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!/^[0-9+\-\s]{6,20}$/.test(v.phone.trim())) e.phone = "Enter a phone number (6 to 20 digits; +, - and spaces are fine).";
  const nat = v.nationality.trim();
  if (nat.length < 2 || nat.length > 80) e.nationality = "Enter your nationality.";
  const n = Number(v.travellers);
  if (!Number.isInteger(n) || n < 1 || n > 20) e.travellers = "Travellers must be a whole number from 1 to 20.";
  if (v.travelDate && v.travelDate < todayISO()) e.travelDate = "Travel date cannot be in the past.";
  if (v.message.length > 1000) e.message = "Please keep your message under 1000 characters.";
  if (!v.consent) e.consent = "Please agree to be contacted so we can reply to your enquiry.";
  return e;
}

function Field({ id, label, error, hint, optional, children }) {
  return (
    <div className={`vis-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}{optional && <em> (optional)</em>}</label>
      {children}
      {hint && !error && <p className="vis-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="vis-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/**
 * Enquiry sheet. Built once (hidden) so opening is only a class toggle, and portalled into the .mk root so the theme
 * variables apply and `position: fixed` is not trapped by a transformed ancestor (same approach as LocaleModal).
 */
export default function VisaEnquiry({ visa, open, onClose }) {
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

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("visa-enquiry", true);
    const focusTimer = setTimeout(() => {
      const first = dialogRef.current?.querySelector(".vis-sheet-body input, .vis-sheet-body button");
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
      holdAmbient("visa-enquiry", false);
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
    const found = validate(values);
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
      travellers: Number(values.travellers),
      consent: true,
      ...(values.travelDate ? { travelDate: values.travelDate } : {}),
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
      const res = await submitVisaEnquiry(visa.slug, body, { token, signal: controller.signal });
      setReference(res.reference);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 429) setFormError("Too many enquiries just now. Please wait a minute and try again.");
      else if (err instanceof ApiError && err.status === 400) setFormError(err.message);
      else if (err instanceof ApiError && err.status === 404) setFormError("This visa is no longer available. Please choose another one or contact us.");
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
    "aria-describedby": errors[key] ? `vq-${key}-err` : undefined,
  });

  return createPortal(
    <div className={`vis-sheet${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="vis-sheet-scrim" aria-label="Close" tabIndex={-1} onClick={reference ? finish : onClose} />
      <div className="vis-sheet-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="vq-title">
        <button ref={closeRef} type="button" className="vis-sheet-close" aria-label="Close enquiry form" onClick={reference ? finish : onClose}>
          <IconClose width="20" height="20" />
        </button>
        {reference ? (
          <div className="vis-sheet-body vis-success" data-lenis-prevent>
            <span className="vis-success-ico" aria-hidden="true"><IconCheck width="30" height="30" strokeWidth="2.6" /></span>
            <h2 id="vq-title">Enquiry sent</h2>
            <p>Thank you. Our team will contact you about the {visa.title} using the details you gave us.</p>
            <p className="vis-ref-label">Your reference</p>
            <p className="vis-ref" aria-live="polite">{reference}</p>
            <p className="vis-hint">Keep this reference handy if you contact us about this enquiry.</p>
            <button type="button" className="mk-btn" onClick={finish}>Done</button>
          </div>
        ) : (
          <form className="vis-sheet-body" noValidate onSubmit={submit} data-lenis-prevent>
            <div className="vis-sheet-head">
              <Flag code={visa.countryCode} />
              <div>
                <h2 id="vq-title">Start your enquiry</h2>
                <p>{visa.title}</p>
              </div>
            </div>
            {formError && <p className="vis-form-error" role="alert">{formError}</p>}
            <div className="vis-form-grid">
              <Field id="vq-fullName" label="Full name" error={errors.fullName}>
                <input id="vq-fullName" name="fullName" value={values.fullName} onChange={set("fullName")} autoComplete="name" maxLength={120} {...a11y("fullName")} />
              </Field>
              <Field id="vq-email" label="Email" error={errors.email}>
                <input id="vq-email" name="email" type="email" inputMode="email" value={values.email} onChange={set("email")} autoComplete="email" {...a11y("email")} />
              </Field>
              <Field id="vq-phone" label="Phone" error={errors.phone}>
                <input id="vq-phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} autoComplete="tel" maxLength={20} {...a11y("phone")} />
              </Field>
              <Field id="vq-nationality" label="Nationality" error={errors.nationality}>
                <input id="vq-nationality" name="nationality" value={values.nationality} onChange={set("nationality")} autoComplete="country-name" maxLength={80} {...a11y("nationality")} />
              </Field>
              <Field id="vq-travellers" label="Travellers" error={errors.travellers}>
                <input id="vq-travellers" name="travellers" type="number" inputMode="numeric" min="1" max="20" step="1" value={values.travellers} onChange={set("travellers")} {...a11y("travellers")} />
              </Field>
              <Field id="vq-travelDate" label="Travel date" optional error={errors.travelDate}>
                <input id="vq-travelDate" name="travelDate" type="date" min={todayISO()} value={values.travelDate} onChange={set("travelDate")} {...a11y("travelDate")} />
              </Field>
            </div>
            <Field id="vq-message" label="Message" optional error={errors.message}>
              <textarea id="vq-message" name="message" rows={3} maxLength={1000} value={values.message} onChange={set("message")} {...a11y("message")} />
            </Field>
            <div className={`vis-consent${errors.consent ? " has-error" : ""}`}>
              <label>
                <input type="checkbox" name="consent" checked={values.consent} onChange={set("consent")} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "vq-consent-err" : undefined} />
                <span>I agree to be contacted about this enquiry</span>
              </label>
              {errors.consent && <p className="vis-error" id="vq-consent-err">{errors.consent}</p>}
            </div>
            <button type="submit" className="mk-btn mk-btn-block vis-submit" disabled={pending}>
              {pending ? "Sending..." : "Send enquiry"}
            </button>
            <p className="vis-hint vis-privacy">We only use your details to reply to this enquiry. No payment is taken here.</p>
            <p className="vis-hint vis-privacy"><CurrencyNote /></p>
          </form>
        )}
      </div>
    </div>,
    host
  );
}
