"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingError, createBookingApi, errorMessage, isNotFound, isUnauthorized } from "../../lib/booking";
import { formatDay, formatStamp, paxLabel } from "../../lib/actFormat";
import { formatPrice } from "../../lib/api";
import { loginUrlFor } from "../../lib/wishlistAuth";
import { useApp } from "../AppProvider";
import { StateMessage } from "../activities/ActivityParts";
import "../../checkout.css";

const STATUS = {
  pending_payment: "Pending payment", confirmed: "Confirmed", cancellation_requested: "Cancellation requested", cancelled: "Cancelled", refunded: "Refunded", expired: "Expired",
};
const num = (v) => (typeof v === "number" ? v : v && typeof v === "object" ? v.amount : null);
const amount = (v, currency) => (num(v) == null ? null : formatPrice(num(v), (v && v.currency) || currency || "AED"));

/** Reads the booking whichever way the API names things (flat or nested), so the page degrades instead of breaking. */
function view(b) {
  const currency = b.currency || b.pricing?.currency || "AED";
  return {
    reference: b.reference,
    orderReference: b.orderReference,
    status: b.status,
    title: b.title || b.activityTitle || b.activity?.title,
    option: b.optionName || b.option?.name,
    date: b.serviceDate || b.date,
    adults: b.adults ?? null,
    children: b.children ?? 0,
    pickup: b.pickup,
    additional: b.additional,
    customer: b.customer,
    currency,
    subtotal: b.subtotal ?? b.pricing?.subtotal,
    discount: b.discount ?? b.partnerDiscount ?? b.pricing?.discount,
    tax: b.tax ?? b.pricing?.taxesAndFees,
    total: b.total ?? b.pricing?.total,
    until: b.freeCancellationUntil,
    refundable: b.refundable,
    policy: b.cancellationPolicy,
    slug: b.activitySlug,
  };
}

function Rows({ rows }) {
  const list = rows.filter(([, value]) => value);
  if (!list.length) return null;
  return (
    <dl className="co-dl">
      {list.map(([k, value]) => <div key={k}><dt>{k}</dt><dd>{value}</dd></div>)}
    </dl>
  );
}

export function useBookingsApi() {
  const { user, ready, getAccessToken } = useApp();
  const api = useMemo(() => createBookingApi(getAccessToken), [getAccessToken]);
  return { api, user, ready };
}

function Frame({ children }) {
  return <section className="hol-page co-page"><div className="mk-container co-bk">{children}</div></section>;
}

function Gate({ ready, user, returnTo, children }) {
  if (!ready) return <Frame><div className="co-skel" role="status" aria-label="Loading" /></Frame>;
  if (!user) {
    return (
      <Frame>
        <StateMessage title="Sign in to see this booking" text="Bookings belong to your account." href={loginUrlFor(returnTo)} actionLabel="Sign in" />
      </Frame>
    );
  }
  return children;
}

/** QR image from the API's path data (the QR holds only a random code, never personal data). */
function QrCode({ qr, label }) {
  if (!qr?.path) return null;
  const pad = 2;
  const size = qr.size + pad * 2;
  return (
    <svg className="co-qr" viewBox={`${-pad} ${-pad} ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label={label}>
      <rect x={-pad} y={-pad} width={size} height={size} fill="#fff" />
      <path d={qr.path} fill="#0a1a40" />
    </svg>
  );
}

function Voucher({ b, onCancelled }) {
  const v = view(b);
  const { api } = useBookingsApi();
  const [ticket, setTicket] = useState(null);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  useEffect(() => {
    if (v.status !== "confirmed" && v.status !== "cancellation_requested") return undefined;
    let live = true;
    api.getVoucher(v.reference).then((t) => live && setTicket(t)).catch(() => {});
    return () => {
      live = false;
    };
  }, [api, v.reference, v.status]);
  const downloadInvoice = async () => {
    setInvoiceBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const blob = await api.downloadInvoice(v.reference);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${v.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setMsg({ type: "error", text: errorMessage(e) });
    } finally {
      setInvoiceBusy(false);
    }
  };
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const canCancel = v.status === "confirmed";
  const pickup = v.pickup?.mode === "now" ? [v.pickup.locationName, v.pickup.address].filter(Boolean).join(", ") : v.pickup?.mode === "later" ? "To be confirmed (you will add it later)" : "";

  const cancel = async () => {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await api.requestCancellation(v.reference);
      setMsg({ type: "ok", text: res?.message || "Your cancellation request was received. Our team will review it and handle any refund." });
      setConfirming(false);
      onCancelled?.();
    } catch (e) {
      setMsg({ type: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="co-voucher">
      <header className="co-v-head">
        <div>
          <p className="co-v-ref"><small>Booking reference</small><b>{v.reference}</b></p>
          <h1 id="co-step-title">{v.slug ? <Link href={`/activities/${v.slug}`}>{v.title}</Link> : v.title}</h1>
          {v.option && <p className="co-v-opt">{v.option}</p>}
        </div>
        <span className={`mk-bk-status is-${v.status}`}>{STATUS[v.status] || v.status}</span>
      </header>

      {ticket && ticket.status !== "void" ? (
        <section className="co-ticket" aria-labelledby="v-ticket">
          <QrCode qr={ticket.qr} label={`QR code of ticket ${ticket.displayCode}`} />
          <div>
            <h2 id="v-ticket">Your ticket</h2>
            <p>Show this QR code at the start of your activity. It works once, on the day of your booking.</p>
            <p className="co-ticket-code">{ticket.displayCode}</p>
            {ticket.status === "redeemed" ? <p className="co-note-ok">This ticket has been used.</p> : null}
          </div>
        </section>
      ) : null}

      <div className="co-v-grid">
        <section aria-labelledby="v-trip">
          <h2 id="v-trip">Your trip</h2>
          <Rows rows={[["Date", v.date ? formatDay(v.date) : ""], ["Travellers", v.adults != null ? paxLabel(v.adults, v.children) : ""], ["Pick-up", pickup]]} />
          {v.additional && (
            <Rows rows={[["Lead traveller", v.additional.leadTravellerNames?.join(", ")], ["Hotel", v.additional.hotelName], ["Arrival flight", v.additional.arrivalFlight], ["Special requests", v.additional.specialRequests]]} />
          )}
        </section>
        <section aria-labelledby="v-who">
          <h2 id="v-who">Booked by</h2>
          <Rows rows={[["Name", v.customer?.fullName], ["Email", v.customer?.email], ["Phone", v.customer?.phone ? `${v.customer.phoneCountryCode || ""} ${v.customer.phone}` : ""], ["Nationality", v.customer?.nationality]]} />
        </section>
        <section aria-labelledby="v-pay">
          <h2 id="v-pay">Payment ({v.currency})</h2>
          <Rows rows={[["Subtotal", amount(v.subtotal, v.currency)], ["Discount", num(v.discount) > 0 ? `-${amount(v.discount, v.currency)}` : ""], ["Taxes & fees", num(v.tax) > 0 ? amount(v.tax, v.currency) : ""], ["Total charged", amount(v.total, v.currency)]]} />
        </section>
        <section aria-labelledby="v-can">
          <h2 id="v-can">Cancellation</h2>
          <p>{v.policy || (v.refundable ? "This booking is refundable." : "This booking is non-refundable.")}</p>
          {v.until && <p><b>Free cancellation until {formatStamp(v.until)} (UAE time).</b></p>}
          {canCancel && !confirming && <button type="button" className="mk-btn mk-btn-ghost" onClick={() => setConfirming(true)}>Request cancellation</button>}
          {canCancel && confirming && (
            <div className="co-confirm" role="alertdialog" aria-label="Confirm cancellation request">
              <p>Send a cancellation request? Our team handles refunds, based on the policy above.</p>
              <div className="co-actions">
                <button type="button" className="mk-btn" disabled={busy} onClick={cancel}>{busy ? "Sending..." : "Yes, request cancellation"}</button>
                <button type="button" className="mk-btn mk-btn-ghost" onClick={() => setConfirming(false)}>Keep booking</button>
              </div>
            </div>
          )}
          <p className={msg.type === "error" ? "co-error" : "co-note-ok"} role="status" aria-live="polite">{msg.text}</p>
        </section>
      </div>
      <div className="co-v-foot">
        <button type="button" className="mk-btn mk-btn-ghost" onClick={() => window.print()}>Print voucher</button>
        {b.confirmedAt || v.status === "confirmed" || v.status === "refunded" || v.status === "cancelled" ? <button type="button" className="mk-btn mk-btn-ghost" disabled={invoiceBusy} onClick={downloadInvoice}>{invoiceBusy ? "Preparing..." : "Download invoice (PDF)"}</button> : null}
        <Link className="mk-btn mk-btn-ghost" href="/bookings">All bookings</Link>
      </div>
    </article>
  );
}

function useFetch(loader, deps) {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    let live = true;
    loader()
      .then((data) => live && setState({ status: "ok", data, error: "" }))
      .catch((e) => live && setState({ status: isNotFound(e) ? "missing" : isUnauthorized(e) ? "signin" : "error", data: null, error: errorMessage(e) }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, reload };
}

function Problem({ status, error, reload }) {
  if (status === "missing") return <Frame><StateMessage title="We could not find that booking" text="Check the reference, or look in your bookings list." href="/bookings" actionLabel="My bookings" /></Frame>;
  return <Frame><StateMessage title="We could not load this booking" text={error || "Please try again."} action="Try again" onAction={reload} /></Frame>;
}

export function BookingByReference({ reference }) {
  const { api, user, ready } = useBookingsApi();
  const result = useFetch(() => (ready && user ? api.getBooking(reference) : new Promise(() => {})), [api, ready, user, reference]);
  return (
    <Gate ready={ready} user={user} returnTo={`/bookings/${reference}`}>
      {result.status === "loading" ? <Frame><div className="co-skel" role="status" aria-label="Loading booking" /></Frame>
        : result.status === "ok" ? <Frame><Voucher b={result.data} onCancelled={result.reload} /></Frame>
        : <Problem {...result} />}
    </Gate>
  );
}

export function BookingsByOrder({ orderReference }) {
  const { api, user, ready } = useBookingsApi();
  const result = useFetch(
    async () => {
      if (!(ready && user)) return new Promise(() => {});
      const list = await api.getBookings();
      const items = (Array.isArray(list) ? list : []).filter((b) => b.orderReference === orderReference);
      if (!items.length) {
        throw new BookingError("Order not found", 404, "NOT_FOUND");
      }
      return items;
    },
    [api, ready, user, orderReference]
  );
  const items = result.data || [];
  const sum = items.reduce((t, b) => t + (num(b.total) || 0), 0);
  return (
    <Gate ready={ready} user={user} returnTo={`/bookings/order/${orderReference}`}>
      {result.status === "loading" ? <Frame><div className="co-skel" role="status" aria-label="Loading order" /></Frame>
        : result.status === "ok" ? (
          <Frame>
            <header className="co-v-head">
              <div>
                <p className="co-v-ref"><small>Order reference</small><b>{orderReference}</b></p>
                <h1 id="co-step-title">Your order</h1>
                <p className="co-v-opt">{items.length} {items.length === 1 ? "booking" : "bookings"} · {amount(sum, items[0]?.currency)} in total</p>
              </div>
            </header>
            <ul className="co-order">
              {items.map((b) => {
                const v = view(b);
                return (
                  <li key={v.reference} className="co-order-item">
                    <div>
                      <h2><Link href={`/bookings/${encodeURIComponent(v.reference)}`}>{v.title}</Link></h2>
                      <p>{[v.option, v.date ? formatDay(v.date) : "", v.adults != null ? paxLabel(v.adults, v.children) : ""].filter(Boolean).join(" · ")}</p>
                      <p className="co-v-refline">{v.reference}</p>
                    </div>
                    <div className="co-order-side">
                      <span className={`mk-bk-status is-${v.status}`}>{STATUS[v.status] || v.status}</span>
                      <b>{amount(v.total, v.currency)}</b>
                      <Link className="mk-btn mk-btn-ghost" href={`/bookings/${encodeURIComponent(v.reference)}`}>View voucher</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Frame>
        ) : <Problem {...result} />}
    </Gate>
  );
}
