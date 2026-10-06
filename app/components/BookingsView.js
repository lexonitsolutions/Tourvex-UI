"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest, formatPrice } from "../lib/api";
import { useApp } from "./AppProvider";
import CurrencyNote from "./CurrencyNote";

const STATUS_LABELS = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancellation_requested: "Cancellation requested",
  cancelled: "Cancelled",
  refunded: "Refunded",
  expired: "Expired",
};

const humanize = (value) => String(value || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** GET /bookings with the Clerk session token (the API verifies it and maps it to our user record). */
async function loadBookings(getAccessToken, signal) {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Please sign in", 401);
  return apiRequest("/bookings", { token, signal });
}

function SignInPrompt() {
  return (
    <div className="mk-pg-card mk-pg-center">
      <span className="mk-pg-ico" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4z" />
          <path d="M14 6v12" strokeDasharray="2 2.4" />
        </svg>
      </span>
      <h2>Sign in to see your bookings</h2>
      <p>Your tickets, tours and holidays will show up here once you are logged in.</p>
      <div className="mk-pg-actions">
        <Link className="mk-btn" href="/sign-in?redirect_url=%2Fbookings">Log in</Link>
        <Link className="mk-btn mk-btn-ghost" href="/sign-up?redirect_url=%2Fbookings">Create account</Link>
      </div>
    </div>
  );
}

function BookingCard({ booking }) {
  const date = formatDate(booking.serviceDate);
  const created = formatDate(booking.createdAt);
  const total = formatPrice(booking.total, booking.currency);
  return (
    <li className="mk-bk-card">
      <div className="mk-bk-top">
        <span className="mk-bk-ref">{booking.reference}</span>
        <span className={`mk-bk-status is-${booking.status}`}>{STATUS_LABELS[booking.status] || humanize(booking.status)}</span>
      </div>
      <h3><Link className="mk-bk-link" href={`/bookings/${encodeURIComponent(booking.reference)}`}>{booking.title}</Link></h3>
      <dl className="mk-bk-meta">
        {booking.serviceType && (
          <div><dt>Type</dt><dd>{humanize(booking.serviceType)}</dd></div>
        )}
        {date && (
          <div><dt>Service date</dt><dd>{date}</dd></div>
        )}
        {booking.quantity != null && (
          <div><dt>Guests / qty</dt><dd>{booking.quantity}</dd></div>
        )}
        {created && (
          <div><dt>Booked on</dt><dd>{created}</dd></div>
        )}
      </dl>
      {total && (
        <p className="mk-bk-total">
          <span>{booking.currency ? `Total charged (${booking.currency})` : "Total charged"}</span>
          <strong>{total}</strong>
        </p>
      )}
      <p className="mk-bk-more">
        <Link className="mk-bk-link" href={`/bookings/${encodeURIComponent(booking.reference)}`}>View details and voucher</Link>
        {booking.orderReference && <> · <Link className="mk-bk-link" href={`/bookings/order/${encodeURIComponent(booking.orderReference)}`}>Whole order</Link></>}
      </p>
    </li>
  );
}

export default function BookingsView() {
  const { user, ready, getAccessToken } = useApp();
  const [state, setState] = useState({ status: "loading", items: [] });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ status: "loading", items: [] });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!ready || !user) return undefined;
    const controller = new AbortController();
    loadBookings(getAccessToken, controller.signal)
      .then((data) => setState({ status: "ok", items: Array.isArray(data) ? data : [] }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ status: error instanceof ApiError && error.status === 401 ? "signin" : "error", items: [] });
      });
    return () => controller.abort();
  }, [ready, user, attempt, getAccessToken]);

  let body;
  if (!ready) body = <BookingSkeleton />;
  else if (!user || state.status === "signin") body = <SignInPrompt />;
  else if (state.status === "loading") body = <BookingSkeleton />;
  else if (state.status === "error") {
    body = (
      <div className="mk-pg-card mk-pg-center" role="alert">
        <h2>We could not load your bookings</h2>
        <p>Please check your connection and try again.</p>
        <div className="mk-pg-actions">
          <button type="button" className="mk-btn" onClick={retry}>Try again</button>
        </div>
      </div>
    );
  } else if (!state.items.length) {
    body = (
      <div className="mk-pg-card mk-pg-center">
        <span className="mk-pg-ico" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m15.5 8.5-2 5-5 2 2-5z" />
          </svg>
        </span>
        <h2>No bookings yet</h2>
        <p>When you book an experience it will appear here.</p>
        <div className="mk-pg-actions">
          <Link className="mk-btn" href="/activities">Explore activities</Link>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <ul className="mk-bk-list">
          {state.items.map((booking) => (
            <BookingCard key={booking._id || booking.reference} booking={booking} />
          ))}
        </ul>
        <p className="mk-bk-fxnote"><CurrencyNote showAttribution={false} /></p>
      </>
    );
  }

  return (
    <section className="mk-container mk-pg">
      <h1 className="mk-pg-title">My bookings</h1>
      {body}
    </section>
  );
}

function BookingSkeleton() {
  return (
    <ul className="mk-bk-list" aria-busy="true" aria-label="Loading bookings">
      {[0, 1].map((i) => (
        <li key={i} className="mk-bk-card mk-skeleton" aria-hidden="true" />
      ))}
    </ul>
  );
}
