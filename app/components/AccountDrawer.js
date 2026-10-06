"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";
import { apiRequest } from "../lib/api";
import { subscribeWishlist, wishlistCount } from "../lib/holidays";
import { holdAmbient } from "../lib/motion";
import { useApp } from "./AppProvider";
import { useCartCount } from "./CartWatcher";
import { useMotion } from "./MotionShell";
import "../account.css";

const Ico = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Chevron = () => (
  <svg className="mk-acc-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 5 7 7-7 7" />
  </svg>
);

const ICONS = {
  cart: <Ico><path d="M3 4h2l2.4 11h10.2l2-8H6.2" /><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></Ico>,
  bookings: <Ico><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4z" /><path d="M14 6v12" strokeDasharray="2 2.4" /></Ico>,
  currency: <Ico><rect x="3" y="6" width="18" height="12" rx="3" /><circle cx="12" cy="12" r="2.6" /><path d="M6.5 12h.01M17.5 12h.01" /></Ico>,
  language: <Ico><circle cx="12" cy="12" r="9" /><path d="M8 8h8M12 8v1.5M9.5 16c2.3-1 3.7-2.8 4.3-6M10 11c.7 2 2 3.6 4.5 5" /></Ico>,
  terms: <Ico><path d="M4 7l1.4 1.4L8 5.8M4 13l1.4 1.4L8 11.8M4 19l1.4 1.4L8 17.8" /><path d="M12 7h8M12 13h8M12 19h8" /></Ico>,
  privacy: <Ico><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Ico>,
  about: <Ico><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ico>,
  help: <Ico><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Ico>,
  wallet: <Ico><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14.5h2" /></Ico>,
  profile: <Ico><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></Ico>,
  wishlist: <Ico><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Ico>,
  gift: <Ico><rect x="3" y="9" width="18" height="11" rx="2" /><path d="M12 9v11M3 13h18M12 9c-2.5 0-4-1-4-2.5S9.2 4 10.5 5c.8.6 1.5 4 1.5 4zM12 9c2.5 0 4-1 4-2.5S14.8 4 13.5 5c-.8.6-1.5 4-1.5 4z" /></Ico>,
  friends: <Ico><circle cx="9" cy="8.5" r="3.3" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M18 8v6M15 11h6" /></Ico>,
  logout: <Ico><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" /></Ico>,
};

const plural = (n) => `${n} ${n === 1 ? "Item" : "Items"}`;

/** One row of the panel: a link, or a disabled/static row when there is no page behind it yet. */
function Row({ icon, label, value, href, onClick, expanded, disabled, onNavigate }) {
  const body = (
    <>
      <span className="mk-acc-row-ico">{ICONS[icon]}</span>
      <span className="mk-acc-row-label">{label}</span>
      {value != null && <span className="mk-acc-row-value">{value}</span>}
      {!disabled && <Chevron />}
    </>
  );
  if (href) {
    return (
      <Link className="mk-acc-row" href={href} onClick={onNavigate}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={`mk-acc-row${expanded ? " is-expanded" : ""}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      aria-expanded={expanded === undefined ? undefined : expanded}
    >
      {body}
    </button>
  );
}

export default function AccountDrawer({ open, onClose, onOpenLocale }) {
  const { user, ready, currency, logout, getAccessToken } = useApp();
  const { openUserProfile } = useClerk();
  const { setScrollLocked } = useMotion();
  const savedCount = useSyncExternalStore(subscribeWishlist, wishlistCount, () => 0);
  const [bookingCount, setBookingCount] = useState(null);
  const cartCount = useCartCount();
  // Close this panel first, then open the language/currency dialog so only one overlay is ever up.
  const openLocale = () => {
    onClose();
    setTimeout(() => onOpenLocale?.(), 220);
  };
  // Clerk's profile dialog (name, photo, email, password, connected accounts); same one-overlay-at-a-time rule.
  const openProfile = () => {
    onClose();
    setTimeout(() => openUserProfile(), 220);
  };
  const [host, setHost] = useState(null);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  // Build the panel once, hidden, right after hydration. Opening it later is then just a class toggle
  // (a GPU transform), with no React mount/layout work landing in the middle of the slide-in.
  // It lives inside the .mk root (not <body>) so theme variables and fonts apply; the header itself is
  // transformed, so the panel must not be its child or `position: fixed` would break.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.querySelector(".mk"));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("account", true);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // The page behind the scrim must not scroll (wheel/touch); the panel scrolls itself.
    const scrim = document.querySelector(".mk-acc-scrim");
    const block = (e) => e.preventDefault();
    scrim?.addEventListener("wheel", block, { passive: false });
    scrim?.addEventListener("touchmove", block, { passive: false });
    const focusTimer = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      clearTimeout(focusTimer);
      setScrollLocked(false);
      holdAmbient("account", false);
      document.removeEventListener("keydown", onKey);
      scrim?.removeEventListener("wheel", block);
      scrim?.removeEventListener("touchmove", block);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, setScrollLocked]);

  // Real booking count from the API, fetched when the panel opens for a signed-in user (blank on failure).
  useEffect(() => {
    if (!open || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!user) setBookingCount(null);
      return undefined;
    }
    let live = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const list = await apiRequest("/bookings", { token });
        if (live) setBookingCount(Array.isArray(list) ? list.length : null);
      } catch {
        if (live) setBookingCount(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [open, user, getAccessToken]);

  if (!host) return null;

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";
  const initial = user ? (user.firstName || user.email || "?").charAt(0).toUpperCase() : "";

  return createPortal(
    <div className={`mk-acc${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="mk-acc-scrim" aria-label="Close account panel" tabIndex={-1} onClick={onClose} />
      <aside className="mk-acc-panel" role="dialog" aria-modal="true" aria-labelledby="mk-acc-title" data-lenis-prevent>
        <header className="mk-acc-head">
          <h2 id="mk-acc-title">My Account</h2>
          <button ref={closeRef} type="button" className="mk-acc-close" onClick={onClose} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
        </header>

        <div className="mk-acc-scroll">
          {ready && user ? (
            <div className="mk-acc-profile">
              <span className="mk-acc-user-text">
                <b>{name}</b>
                <small>{user.email}</small>
              </span>
              <span className="mk-acc-photo" aria-hidden="true">
                {user.imageUrl ? <img src={user.imageUrl} alt="" width="84" height="84" /> : <i>{initial}</i>}
              </span>
            </div>
          ) : (
            <div className="mk-acc-card mk-acc-login">
              <span>Already have an account?</span>
              {/* Close the panel first, then Clerk takes the visitor to sign in and back to this page. */}
              <span onClickCapture={onClose}>
                <SignInButton>
                  <button type="button" className="mk-acc-btn">Login Now</button>
                </SignInButton>
              </span>
            </div>
          )}
          {ready && !user && (
            <p className="mk-acc-register">
              New to Karnish?{" "}
              <span onClickCapture={onClose}>
                <SignUpButton>
                  <button type="button" className="mk-acc-linkbtn">Create an account</button>
                </SignUpButton>
              </span>{" "}
              or <Link href="/partners" onClick={onClose}>sign up as a partner</Link>.
            </p>
          )}

          <section className="mk-acc-section">
            <h3>My Account</h3>
            {ready && user ? (
              <>
                <Row icon="wallet" label="Wallet" value="Coming soon" disabled />
                <Row icon="profile" label="Edit Profile" onClick={openProfile} />
                <Row icon="cart" label="Cart" value={plural(cartCount || 0)} href="/checkout" onNavigate={onClose} />
                <Row icon="bookings" label="My Bookings" value={bookingCount == null ? null : plural(bookingCount)} href="/bookings" onNavigate={onClose} />
                <Row icon="wishlist" label="Wishlist" value={plural(savedCount)} href="/wishlist" onNavigate={onClose} />
                <Row icon="gift" label="My Giveaways" value="Coming soon" disabled />
                <Row icon="currency" label="Currency" value={currency} onClick={openLocale} />
                <Row icon="language" label="Language" value="English" onClick={openLocale} />
                <Row icon="friends" label="Manage Friends and Family" value="Coming soon" disabled />
              </>
            ) : (
              <>
                <Row icon="cart" label="Cart" href="/checkout" onNavigate={onClose} />
                <Row icon="bookings" label="My Bookings" href="/bookings" onNavigate={onClose} />
                <Row icon="currency" label="Currency" value={currency} onClick={openLocale} />
                <Row icon="language" label="Language" value="English" onClick={openLocale} />
              </>
            )}
          </section>

          <section className="mk-acc-section">
            <h3>Compliance</h3>
            <Row icon="terms" label="Terms &amp; Conditions" href="/terms" onNavigate={onClose} />
            <Row icon="privacy" label="Privacy Policy" href="/privacy" onNavigate={onClose} />
          </section>

          <section className="mk-acc-section">
            <h3>Help &amp; Support</h3>
            <Row icon="about" label="About Us" href="/about" onNavigate={onClose} />
            <Row icon="help" label="Help and Support" href="/support" onNavigate={onClose} />
            <Row icon="about" label="Contact Us" href="/contact" onNavigate={onClose} />
          </section>

          {ready && user && (
            <section className="mk-acc-section mk-acc-signout">
              <Row
                icon="logout"
                label="Log out"
                onClick={() => {
                  onClose();
                  logout();
                }}
              />
            </section>
          )}
        </div>
      </aside>
    </div>,
    host
  );
}
