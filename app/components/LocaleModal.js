"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CURRENCY_CODES, LANGUAGES, POPULAR_CURRENCIES, currencyName, flagSrc } from "../lib/currencies";
import { holdAmbient } from "../lib/motion";
import { useApp } from "./AppProvider";
import CurrencyNote from "./CurrencyNote";
import { useMotion } from "./MotionShell";
import "../locale.css";

const CurrencyCard = memo(function CurrencyCard({ code, active, warm, onPick }) {
  return (
    <button type="button" role="radio" aria-checked={active} className={`mk-loc-cur${active ? " is-active" : ""}`} onClick={() => onPick(code)}>
      <img className="mk-loc-flag" src={warm ? flagSrc(code) : undefined} alt="" width="26" height="20" decoding="async" />
      <span className="mk-loc-code">{code}</span>
      <span className="mk-loc-name">{currencyName(code)}</span>
      {active && (
        <svg className="mk-loc-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      )}
    </button>
  );
});

/**
 * Language + currency picker. Built once (hidden) after hydration so opening it is only a class toggle,
 * and portalled into the .mk root so theme variables apply and `position: fixed` isn't trapped by the
 * transformed header.
 */
export default function LocaleModal({ open, onClose }) {
  const { currency, setCurrency } = useApp();
  const { setScrollLocked } = useMotion();
  const [host, setHost] = useState(null);
  const [warm, setWarm] = useState(false);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const releaseTimer = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.querySelector(".mk"));
  }, []);

  // Fetch and decode the 50 flag images while the browser is idle after load, so opening the dialog is
  // only a slide-in. (Opening earlier than that just starts the load immediately.)
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() => setWarm(true), { timeout: 4000 });
    return () => cancel(id);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(releaseTimer.current); // reopened before the last close finished
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWarm(true);
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("locale", true);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const scrim = document.querySelector(".mk-loc-scrim");
    const block = (e) => e.preventDefault();
    scrim?.addEventListener("wheel", block, { passive: false });
    scrim?.addEventListener("touchmove", block, { passive: false });
    const focusTimer = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      clearTimeout(focusTimer);
      setScrollLocked(false);
      // Keep the hero paused until the sheet has finished folding away, so the close stays smooth too.
      releaseTimer.current = setTimeout(() => holdAmbient("locale", false), 1250);
      document.removeEventListener("keydown", onKey);
      scrim?.removeEventListener("wheel", block);
      scrim?.removeEventListener("touchmove", block);
      lastFocus.current?.focus?.({ preventScroll: true });
      // Next time it opens, start from the top of the list (after the close animation has finished).
      setTimeout(() => document.querySelector(".mk-loc-currencies")?.scrollTo(0, 0), 1250);
    };
  }, [open, onClose, setScrollLocked]);

  const more = useMemo(() => CURRENCY_CODES.filter((c) => !POPULAR_CURRENCIES.includes(c)).sort(), []);

  if (!host) return null;

  const pick = (code) => {
    setCurrency(code);
    setTimeout(onClose, 220); // let the selected state register before the dialog leaves
  };

  return createPortal(
    <div className={`mk-loc${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="mk-loc-scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="mk-loc-dialog" role="dialog" aria-modal="true" aria-labelledby="mk-loc-title">
        <button ref={closeRef} type="button" className="mk-loc-close" onClick={onClose} aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </button>

        <section className="mk-loc-langs" aria-labelledby="mk-loc-title">
          <h2 id="mk-loc-title">Languages</h2>
          <div role="radiogroup" aria-label="Language">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={lang.code === "en"}
                disabled={!lang.available}
                className={`mk-loc-lang${lang.code === "en" ? " is-active" : ""}`}
                onClick={onClose}
              >
                <span>{lang.label}</span>
                {lang.available ? <small>{lang.native}</small> : <small>Coming soon</small>}
              </button>
            ))}
          </div>
        </section>

        <section className="mk-loc-currencies" data-lenis-prevent aria-label="Currency">
          <p className="mk-loc-note">
            <CurrencyNote />
          </p>
          <h2>Popular Currencies</h2>
          <div className="mk-loc-grid" role="radiogroup" aria-label="Popular currencies">
            {POPULAR_CURRENCIES.map((code) => (
              <CurrencyCard key={code} code={code} active={code === currency} warm={warm} onPick={pick} />
            ))}
          </div>
          <h2>More Currencies</h2>
          <div className="mk-loc-grid" role="radiogroup" aria-label="More currencies">
            {more.map((code) => (
              <CurrencyCard key={code} code={code} active={code === currency} warm={warm} onPick={pick} />
            ))}
          </div>
        </section>
      </div>
    </div>,
    host
  );
}
