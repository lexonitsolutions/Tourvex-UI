"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../lib/api";
import { useApp } from "./AppProvider";

const RETURN = encodeURIComponent("/partners");

function Card({ title, children }) {
  return (
    <div className="mk-pg-card mk-pg-center">
      <span className="mk-pg-ico" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" />
        </svg>
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function ApplicationForm({ getAccessToken, onSubmitted, previouslyRejected }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const body = { companyName: String(form.get("companyName") || "").trim() };
    for (const key of ["phone", "website", "message"]) {
      const value = String(form.get(key) || "").trim();
      if (value) body[key] = value;
    }
    setPending(true);
    try {
      const token = await getAccessToken();
      const profile = await apiRequest("/users/me/partner-application", { method: "POST", body, token });
      onSubmitted(profile);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? "You already have an application in progress." : err.message || "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mk-auth-card mk-partner-form" onSubmit={submit}>
      <h2>Apply to become a partner</h2>
      <p className="mk-auth-sub">
        {previouslyRejected
          ? "Your previous application was not approved. You can update your details and apply again."
          : "Travel agents and companies get partner pricing once our team approves the account."}
      </p>
      <label className="mk-field">Company name
        <input name="companyName" required minLength={2} maxLength={120} autoComplete="organization" />
      </label>
      <div className="mk-field-row">
        <label className="mk-field">Phone <small>(optional)</small>
          <input name="phone" type="tel" minLength={6} maxLength={20} pattern="[0-9+\s\-]{6,20}" autoComplete="tel" />
        </label>
        <label className="mk-field">Website <small>(optional)</small>
          <input name="website" type="url" placeholder="https://" autoComplete="url" />
        </label>
      </div>
      <label className="mk-field">Message <small>(optional)</small>
        <textarea name="message" maxLength={1000} rows={4} />
      </label>
      {error && <p className="mk-error" role="alert">{error}</p>}
      <button className="mk-btn mk-btn-block" disabled={pending}>{pending ? "Sending…" : "Send application"}</button>
    </form>
  );
}

export default function PartnerApplication() {
  const { user, ready, getAccessToken } = useApp();
  const [state, setState] = useState({ status: "loading", profile: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || !user) return undefined;
    let live = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const profile = await apiRequest("/auth/me", { token });
        if (live) setState({ status: "ok", profile });
      } catch {
        if (live) setState({ status: "error", profile: null });
      }
    })();
    return () => {
      live = false;
    };
  }, [ready, user, getAccessToken, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", profile: null });
    setAttempt((n) => n + 1);
  }, []);

  let body;
  if (!ready || (user && state.status === "loading")) {
    body = <div className="mk-pg-card mk-skeleton" aria-busy="true" style={{ minHeight: 260 }} />;
  } else if (!user) {
    body = (
      <Card title="Become a Karnish travel partner">
        <p>Create a free account (or log in), then send us your company details. Approved partners get contract pricing.</p>
        <div className="mk-pg-actions">
          <Link className="mk-btn" href={`/sign-up?redirect_url=${RETURN}`}>Create account</Link>
          <Link className="mk-btn mk-btn-ghost" href={`/sign-in?redirect_url=${RETURN}`}>Log in</Link>
        </div>
      </Card>
    );
  } else if (state.status === "error") {
    body = (
      <Card title="We could not load your account">
        <p>Please try again in a moment.</p>
        <div className="mk-pg-actions">
          <button type="button" className="mk-btn" onClick={retry}>Try again</button>
        </div>
      </Card>
    );
  } else {
    const app = state.profile?.partnerApplication;
    const isPartner = state.profile?.roles?.some((r) => r.startsWith("b2b_"));
    if (isPartner || app?.status === "approved") {
      body = (
        <Card title="You are a Karnish partner">
          <p>Your partner account is active. Partner pricing is applied automatically when you are logged in.</p>
          <div className="mk-pg-actions">
            <Link className="mk-btn" href="/holidays">Browse holidays</Link>
          </div>
        </Card>
      );
    } else if (app?.status === "pending") {
      body = (
        <Card title="Application received">
          <p>
            Thanks{app.companyName ? `, ${app.companyName}` : ""}. Our team is reviewing your application and will email you at{" "}
            <b>{state.profile.email}</b> once it is approved.
          </p>
        </Card>
      );
    } else {
      body = (
        <ApplicationForm
          getAccessToken={getAccessToken}
          previouslyRejected={app?.status === "rejected"}
          onSubmitted={(profile) => setState({ status: "ok", profile })}
        />
      );
    }
  }

  return (
    <section className="mk-container mk-pg">
      <h1 className="mk-pg-title">Partners</h1>
      {body}
    </section>
  );
}
