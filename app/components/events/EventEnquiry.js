"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError } from "../../lib/api";
import { submitEventEnquiry } from "../../lib/events";
import { holdAmbient } from "../../lib/motion";
import { useApp } from "../AppProvider";
import CurrencyNote from "../CurrencyNote";
import { useMotion } from "../MotionShell";
import { IconCheck, IconX, formatDateTime } from "./EventParts";

const EMPTY = { fullName: "", email: "", phone: "", tickets: "2", sessionId: "", ticketType: "", message: "", consent: false };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

const isInt = (v, min, max) => /^\d+$/.test(String(v).trim()) && Number(v) >= min && Number(v) <= max;

/** Client-side mirror of the API limits (docs/EVENTS_API.md), so most mistakes are caught before the request. */
export function validate(v, sessions) {
  const e = {};
  const name = v.fullName.trim();
  if (name.length < 2 || name.length > 120) e.fullName = "Enter your full name (2 to 120 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email address.";
  const phone = v.phone.trim();
  if (phone.length < 6 || phone.length > 20) e.phone = "Enter a phone number (6 to 20 characters).";
  if (!isInt(v.tickets, 1, 20)) e.tickets = "Tickets must be a whole number from 1 to 20.";
  if (v.sessionId && !sessions.some((s) => s.id === v.sessionId)) e.sessionId = "Please choose one of the listed dates.";
  if (v.ticketType.length > 60) e.ticketType = "Ticket type is too long.";
  if (v.message.length > 1000) e.message = "Please keep your message under 1000 characters.";
  if (!v.consent) e.consent = "Please agree to be contacted so we can reply to your request.";
  return e;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div className={`ev-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}{optional && <em> (optional)</em>}</label>
      {children}
      {error && <p className="ev-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/**
 * Enquiry sheet. Built once (hidden) so opening is only a class toggle, and portalled into the .mk root so the theme
 * variables apply and `position: fixed` is not trapped by a transformed ancestor. Bottom sheet on phones.
 */
export default function EventEnquiry({ event, open, onClose, session, ticketType }) {
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
  const sessions = event.sessions || [];
  const ticketTypes = (event.ticketTypes || []).filter((t) => t.type);

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

  // Pick up the date / ticket type chosen on the page each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((v) => ({ ...v, sessionId: session || v.sessionId, ticketType: ticketType || v.ticketType }));
  }, [open, session, ticketType]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("event-enquiry", true);
    const focusTimer = setTimeout(() => {
      const first = dialogRef.current?.querySelector(".ev-sheet-body input, .ev-sheet-body button");
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
      holdAmbient("event-enquiry", false);
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
    const found = validate(values, sessions);
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
      tickets: Number(values.tickets),
      consent: true,
      ...(values.sessionId ? { sessionId: values.sessionId } : {}),
      ...(values.ticketType ? { ticketType: values.ticketType } : {}),
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
      const res = await submitEventEnquiry(event.slug, body, { token, signal: controller.signal });
      setReference(res.reference);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 429) setFormError("Too many enquiries just now. Please wait a minute and try again.");
      else if (err instanceof ApiError && err.status === 400) setFormError(err.message);
      else if (err instanceof ApiError && err.status === 404) setFormError("This event is no longer available. Please choose another one or contact us.");
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
    "aria-describedby": errors[key] ? `eq-${key}-err` : undefined,
  });

  return createPortal(
    <div className={`ev-sheet${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="ev-sheet-scrim" aria-label="Close" tabIndex={-1} onClick={reference ? finish : onClose} />
      <div className="ev-sheet-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="eq-title">
        <button ref={closeRef} type="button" className="ev-sheet-close" aria-label="Close ticket request form" onClick={reference ? finish : onClose}>
          <IconX width="20" height="20" />
        </button>
        {reference ? (
          <div className="ev-sheet-body ev-success" data-lenis-prevent>
            <span className="ev-success-ico" aria-hidden="true"><IconCheck width="30" height="30" strokeWidth="2.6" /></span>
            <h2 id="eq-title">Request sent</h2>
            <p>Thank you. Our team will contact you about {event.title} using the details you gave us. Your tickets are not reserved until we confirm with you.</p>
            <p className="ev-ref-label">Your reference</p>
            <p className="ev-ref" aria-live="polite">{reference}</p>
            <p className="ev-hint">Keep this reference handy if you contact us about this enquiry.</p>
            <button type="button" className="mk-btn" onClick={finish}>Done</button>
          </div>
        ) : (
          <form className="ev-sheet-body" noValidate onSubmit={submit} data-lenis-prevent>
            <div className="ev-sheet-head">
              <h2 id="eq-title">Request tickets</h2>
              <p>{event.title}</p>
              <p className="ev-sheet-note">This is an enquiry, not a purchase. Nothing is charged and tickets are not reserved until our team confirms with you.</p>
            </div>
            {formError && <p className="ev-form-error" role="alert">{formError}</p>}
            <div className="ev-form-grid">
              <Field id="eq-fullName" label="Full name" error={errors.fullName}>
                <input id="eq-fullName" name="fullName" value={values.fullName} onChange={set("fullName")} autoComplete="name" maxLength={120} {...a11y("fullName")} />
              </Field>
              <Field id="eq-email" label="Email" error={errors.email}>
                <input id="eq-email" name="email" type="email" inputMode="email" value={values.email} onChange={set("email")} autoComplete="email" {...a11y("email")} />
              </Field>
              <Field id="eq-phone" label="Phone" error={errors.phone}>
                <input id="eq-phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} autoComplete="tel" maxLength={20} {...a11y("phone")} />
              </Field>
              <Field id="eq-tickets" label="Number of tickets" error={errors.tickets}>
                <input id="eq-tickets" name="tickets" type="number" inputMode="numeric" min="1" max="20" step="1" value={values.tickets} onChange={set("tickets")} {...a11y("tickets")} />
              </Field>
              {ticketTypes.length > 0 && (
                <Field id="eq-ticketType" label="Ticket type" optional error={errors.ticketType}>
                  <select id="eq-ticketType" name="ticketType" value={values.ticketType} onChange={set("ticketType")} {...a11y("ticketType")}>
                    <option value="">No preference</option>
                    {ticketTypes.map((t) => <option key={t.type} value={t.type}>{t.type}</option>)}
                  </select>
                </Field>
              )}
              {sessions.length > 0 && (
                <Field id="eq-sessionId" label="Date and time" optional error={errors.sessionId}>
                  <select id="eq-sessionId" name="sessionId" value={values.sessionId} onChange={set("sessionId")} {...a11y("sessionId")}>
                    <option value="">No preference</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{formatDateTime(s.startsAt)}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <Field id="eq-message" label="Message" optional error={errors.message}>
              <textarea id="eq-message" name="message" rows={3} maxLength={1000} value={values.message} onChange={set("message")} {...a11y("message")} />
            </Field>
            <div className={`ev-consent${errors.consent ? " has-error" : ""}`}>
              <label>
                <input type="checkbox" name="consent" checked={values.consent} onChange={set("consent")} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? "eq-consent-err" : undefined} />
                <span>I agree to be contacted about this request</span>
              </label>
              {errors.consent && <p className="ev-error" id="eq-consent-err">{errors.consent}</p>}
            </div>
            <button type="submit" className="mk-btn mk-btn-block ev-submit" disabled={pending}>
              {pending ? "Sending..." : "Send request"}
            </button>
            <p className="ev-hint ev-privacy">We only use your details to reply to this enquiry. No payment is taken here.</p>
            <p className="ev-hint ev-privacy"><CurrencyNote /></p>
          </form>
        )}
      </div>
    </div>,
    host
  );
}
