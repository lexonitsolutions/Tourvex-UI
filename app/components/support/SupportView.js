"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "../../support.css";
import { ApiError, apiRequest } from "../../lib/api";
import { useApp } from "../AppProvider";

const CATEGORIES = [
  { value: "booking", label: "A booking" },
  { value: "payment", label: "Payment" },
  { value: "refund", label: "Refund or cancellation" },
  { value: "voucher", label: "Voucher or tickets" },
  { value: "general", label: "General question" },
  { value: "complaint", label: "Complaint" },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const STATUS_LABEL = { open: "Open", pending: "Awaiting your reply", resolved: "Resolved", closed: "Closed" };

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dubai" });
const when = (value) => (value ? fmt.format(new Date(value)) : "");

function errorText(error, fallback) {
  if (error instanceof ApiError) {
    if (error.status === 429) return "You are doing that too quickly. Please wait a minute and try again.";
    if (error.status === 400 || error.status === 409 || error.status === 404) return error.message;
  }
  return fallback;
}

function SignInPrompt() {
  return (
    <div className="mk-pg-card mk-pg-center">
      <h2>Sign in to contact support</h2>
      <p>Your tickets and our replies are tied to your account, so you can follow up on any booking.</p>
      <div className="mk-pg-actions">
        <Link className="mk-btn" href="/sign-in?redirect_url=%2Fsupport">Log in</Link>
        <Link className="mk-btn mk-btn-ghost" href="/sign-up?redirect_url=%2Fsupport">Create account</Link>
      </div>
    </div>
  );
}

function NewTicket({ bookings, onCancel, onCreated, getAccessToken }) {
  const [values, setValues] = useState({ subject: "", category: "general", bookingId: "", body: "" });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  async function submit(e) {
    e.preventDefault();
    if (pending) return;
    const found = {};
    const subject = values.subject.trim();
    if (subject.length < 3 || subject.length > 150) found.subject = "Enter a subject (3 to 150 characters).";
    if (!values.body.trim()) found.body = "Tell us how we can help.";
    if (values.body.length > 5000) found.body = "Please keep your message under 5000 characters.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setPending(true);
    setFormError("");
    try {
      const token = await getAccessToken();
      const ticket = await apiRequest("/tickets", {
        method: "POST",
        token,
        body: { subject, category: values.category, body: values.body.trim(), ...(values.bookingId ? { bookingId: values.bookingId } : {}) },
      });
      onCreated(ticket);
    } catch (error) {
      setFormError(errorText(error, "We could not open your ticket. Please check your connection and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="sp-card sp-form" noValidate onSubmit={submit}>
      <h2>New support ticket</h2>
      <div className={`sp-field${errors.subject ? " has-error" : ""}`}>
        <label htmlFor="sp-subject">Subject</label>
        <input id="sp-subject" value={values.subject} maxLength={150} onChange={set("subject")} aria-invalid={errors.subject ? true : undefined} />
        {errors.subject ? <p className="sp-error">{errors.subject}</p> : null}
      </div>
      <div className="sp-row">
        <div className="sp-field">
          <label htmlFor="sp-category">What is it about?</label>
          <select id="sp-category" value={values.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="sp-field">
          <label htmlFor="sp-booking">Related booking <em>(optional)</em></label>
          <select id="sp-booking" value={values.bookingId} onChange={set("bookingId")}>
            <option value="">Not about a booking</option>
            {bookings.map((b) => <option key={b._id || b.id} value={b._id || b.id}>{b.reference} - {b.title}</option>)}
          </select>
        </div>
      </div>
      <div className={`sp-field${errors.body ? " has-error" : ""}`}>
        <label htmlFor="sp-body">Message</label>
        <textarea id="sp-body" rows={6} maxLength={5000} value={values.body} onChange={set("body")} aria-invalid={errors.body ? true : undefined} />
        {errors.body ? <p className="sp-error">{errors.body}</p> : null}
      </div>
      {formError ? <p className="sp-error" role="alert">{formError}</p> : null}
      <div className="sp-actions">
        <button type="button" className="mk-btn mk-btn-ghost" onClick={onCancel} disabled={pending}>Cancel</button>
        <button type="submit" className="mk-btn" disabled={pending}>{pending ? "Sending..." : "Send to support"}</button>
      </div>
    </form>
  );
}

function Thread({ id, getAccessToken, onChanged, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | error
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const load = useCallback(async (signal) => {
    try {
      const token = await getAccessToken();
      const data = await apiRequest(`/tickets/${id}`, { token, signal });
      setTicket(data);
      setState("ok");
    } catch (e) {
      if (e.name === "AbortError") return;
      setState("error");
    }
  }, [id, getAccessToken]);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => load(controller.signal), 0);
    return () => { clearTimeout(t); controller.abort(); };
  }, [load]);

  const count = ticket?.messages?.length || 0;
  useEffect(() => {
    if (count) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  async function post(path, body, key) {
    setBusy(key);
    setError("");
    try {
      const token = await getAccessToken();
      const data = await apiRequest(`/tickets/${id}${path}`, { method: "POST", token, body });
      setTicket(data);
      onChanged();
      return true;
    } catch (e) {
      setError(errorText(e, "That did not work. Please try again."));
      return false;
    } finally {
      setBusy("");
    }
  }

  if (state === "loading") return <div className="sp-card sp-skel" aria-busy="true" aria-label="Loading ticket" />;
  if (state === "error" || !ticket) {
    return (
      <div className="sp-card sp-center" role="alert">
        <p>We could not load this ticket.</p>
        <button type="button" className="mk-btn" onClick={() => { setState("loading"); load(); }}>Try again</button>
      </div>
    );
  }
  const closed = ticket.status === "closed";
  return (
    <div className="sp-card sp-thread">
      <button type="button" className="sp-back" onClick={onBack}>Back to tickets</button>
      <header className="sp-thread__head">
        <div>
          <h2>{ticket.subject}</h2>
          <p className="sp-muted">{ticket.number} - {CATEGORY_LABEL[ticket.category]}{ticket.booking?.reference ? ` - Booking ${ticket.booking.reference}` : ""}</p>
        </div>
        <span className={`sp-badge is-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</span>
      </header>
      <ol className="sp-msgs" aria-live="polite">
        {ticket.messages.map((m) => (
          <li key={m.id} className={`sp-msg is-${m.authorType}`}>
            {m.authorType === "system" ? (
              <p className="sp-msg__sys">{m.body} - {when(m.at)}</p>
            ) : (
              <>
                <p className="sp-msg__meta"><b>{m.authorType === "staff" ? "Support team" : "You"}</b> - {when(m.at)}</p>
                <p className="sp-msg__body">{m.body}</p>
              </>
            )}
          </li>
        ))}
        <li ref={endRef} aria-hidden="true" />
      </ol>
      {closed ? (
        <div className="sp-closed">
          <p>This ticket is closed.</p>
          <button type="button" className="mk-btn" disabled={busy !== ""} onClick={() => post("/reopen", {}, "reopen")}>{busy === "reopen" ? "Reopening..." : "Reopen ticket"}</button>
        </div>
      ) : (
        <form
          className="sp-reply"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim() || busy) return;
            if (await post("/messages", { body: text.trim() }, "send")) setText("");
          }}
        >
          <label htmlFor="sp-reply" className="sp-sr">Your reply</label>
          <textarea id="sp-reply" rows={4} maxLength={5000} placeholder="Write a reply..." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="sp-actions">
            <button type="button" className="sp-link" disabled={busy !== ""} onClick={() => post("/close", {}, "close")}>{busy === "close" ? "Closing..." : "Close this ticket"}</button>
            <button type="submit" className="mk-btn" disabled={!text.trim() || busy !== ""}>{busy === "send" ? "Sending..." : "Send reply"}</button>
          </div>
        </form>
      )}
      {error ? <p className="sp-error" role="alert">{error}</p> : null}
    </div>
  );
}

export default function SupportView() {
  const { user, ready, getAccessToken } = useApp();
  const [list, setList] = useState({ status: "loading", items: [] });
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!ready || !user) return undefined;
    const controller = new AbortController();
    (async () => {
      try {
        const token = await getAccessToken();
        const [tickets, mine] = await Promise.all([
          apiRequest("/tickets?limit=50", { token, signal: controller.signal }),
          apiRequest("/bookings", { token, signal: controller.signal }).catch(() => []),
        ]);
        setList({ status: "ok", items: tickets.items || [] });
        setBookings(Array.isArray(mine) ? mine : []);
      } catch (e) {
        if (e.name !== "AbortError") setList({ status: "error", items: [] });
      }
    })();
    return () => controller.abort();
  }, [ready, user, getAccessToken, attempt]);

  let body;
  if (!ready) body = <div className="sp-card sp-skel" aria-busy="true" />;
  else if (!user) body = <SignInPrompt />;
  else if (list.status === "error") {
    body = (
      <div className="mk-pg-card mk-pg-center" role="alert">
        <h2>We could not load your tickets</h2>
        <p>Please check your connection and try again.</p>
        <div className="mk-pg-actions"><button type="button" className="mk-btn" onClick={() => { setList({ status: "loading", items: [] }); reload(); }}>Try again</button></div>
      </div>
    );
  } else {
    const showDetail = creating || selected;
    body = (
      <div className={`sp-layout${showDetail ? " has-detail" : ""}`}>
        <aside className="sp-list" aria-label="Your tickets">
          <button type="button" className="mk-btn mk-btn-block" onClick={() => { setCreating(true); setSelected(null); }}>New ticket</button>
          {list.status === "loading" ? <div className="sp-card sp-skel" aria-busy="true" /> : null}
          {list.status === "ok" && !list.items.length ? <p className="sp-muted sp-empty">You have no tickets yet. Open one and we will get back to you.</p> : null}
          <ul>
            {list.items.map((t) => (
              <li key={t.id}>
                <button type="button" className={`sp-item${selected === t.id ? " is-active" : ""}`} aria-current={selected === t.id ? "true" : undefined} onClick={() => { setSelected(t.id); setCreating(false); }}>
                  <span className="sp-item__top"><b>{t.subject}</b><span className={`sp-badge is-${t.status}`}>{STATUS_LABEL[t.status]}</span></span>
                  <span className="sp-muted">{t.number} - {when(t.lastMessageAt || t.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="sp-detail">
          {creating ? (
            <NewTicket bookings={bookings} getAccessToken={getAccessToken} onCancel={() => setCreating(false)} onCreated={(t) => { setCreating(false); setSelected(t.id); reload(); }} />
          ) : selected ? (
            <Thread key={selected} id={selected} getAccessToken={getAccessToken} onChanged={reload} onBack={() => setSelected(null)} />
          ) : (
            <div className="sp-card sp-center sp-hint">
              <h2>How can we help?</h2>
              <p>Choose a ticket to read our replies, or open a new one. For urgent changes to a trip happening today, please also call us from the Contact page.</p>
              <Link className="mk-btn mk-btn-ghost" href="/contact">Other ways to reach us</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="mk-container mk-pg">
      <h1 className="mk-pg-title">Help and Support</h1>
      {body}
    </section>
  );
}
