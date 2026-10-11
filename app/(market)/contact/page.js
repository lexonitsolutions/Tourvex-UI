"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", consent: false, website: "" };
const slugTitle = (slug) => slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Contact form: posts to POST /contact (creates a lead for the sales team). `?activity=<slug>` prefills the subject. */
function ContactForm() {
  const search = useSearchParams();
  const activity = (search.get("activity") || "").toLowerCase();
  const activitySlug = /^[a-z0-9][a-z0-9-]{0,119}$/.test(activity) ? activity : "";
  const [values, setValues] = useState(() => ({ ...EMPTY, subject: activitySlug ? `Enquiry about ${slugTitle(activitySlug)}`.slice(0, 150) : "" }));
  const [state, setState] = useState({ status: "idle", message: "" }); // idle | sending | done | error
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (state.status === "sending") return;
    const phone = values.phone.trim();
    if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone)) return setState({ status: "error", message: "Phone numbers may only contain digits, spaces, + and - (6 to 20 characters)." });
    if (values.message.trim().length < 5) return setState({ status: "error", message: "Please write a short message." });
    if (!values.consent) return setState({ status: "error", message: "Please agree to be contacted so we can reply to you." });
    setState({ status: "sending", message: "" });
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          fullName: values.name.trim(),
          email: values.email.trim(),
          ...(phone ? { phone } : {}),
          subject: values.subject.trim(),
          message: values.message.trim(),
          ...(activitySlug ? { activitySlug } : {}),
          consent: true,
          website: values.website,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many messages just now. Please wait a minute and try again.");
        const raw = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        throw new Error(response.status === 400 && raw ? raw : "We could not send your message. Please try again or call us.");
      }
      setValues(EMPTY);
      setState({ status: "done", message: `Thank you, your message was sent. Our team will reply by email soon. Reference: ${data?.reference || "received"}` });
    } catch (error) {
      setState({ status: "error", message: error.message || "We could not send your message. Please try again." });
    }
  }

  const sending = state.status === "sending";
  return (
    <form onSubmit={submit} noValidate>
      <div className="row">
        <div className="col-md-12 text-left">
          <h3 style={{ marginBottom: 18, fontFamily: "Barlow Condensed, sans-serif", fontSize: 28, color: "var(--mk-navy)" }}>Get in touch with us</h3>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <input type="text" name="name" id="name" placeholder="Your name" required minLength={2} maxLength={120} value={values.name} onChange={set("name")} disabled={sending} autoComplete="name" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input type="email" name="email" id="email" placeholder="Your email" required maxLength={254} value={values.email} onChange={set("email")} disabled={sending} autoComplete="email" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input type="text" inputMode="tel" name="phone" id="phone" placeholder="Phone (optional)" maxLength={20} value={values.phone} onChange={set("phone")} disabled={sending} autoComplete="tel" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <input type="text" name="subject" id="subject" placeholder="Subject" required minLength={2} maxLength={150} value={values.subject} onChange={set("subject")} disabled={sending} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group form-textarea">
            <textarea name="message" id="message" cols="30" rows="4" placeholder="How can we help you?" required minLength={5} maxLength={2000} value={values.message} onChange={set("message")} disabled={sending}></textarea>
          </div>
        </div>
        {/* Honeypot */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} /></label>
        </div>
        <div className="col-md-12">
          <label htmlFor="consent" style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" id="consent" name="consent" checked={values.consent} onChange={set("consent")} disabled={sending} style={{ width: "auto", height: "auto", marginTop: 4 }} />
            <span>I agree to be contacted by Karnish Tourism regarding this enquiry.</span>
          </label>
        </div>
        {state.message ? (
          <div className="col-md-12">
            <p role={state.status === "error" ? "alert" : "status"} style={{ marginBottom: 16, fontSize: 15, padding: "10px 14px", borderRadius: 8, background: state.status === "error" ? "#fef2f2" : "#f0fdf4", color: state.status === "error" ? "#b42318" : "#0f7a4f" }}>{state.message}</p>
          </div>
        ) : null}
        <div className="col-md-12">
          <button className="butn-arrow" type="submit" disabled={sending} style={{ borderRadius: 10 }}>
            <span className="btn-text">{sending ? "Sending message..." : "Send message"}</span>
            <span className="arrow-wrap">
              <span className="arrow-inner">
                <i className="ti-arrow-right"></i>
                <i className="ti-arrow-right"></i>
              </span>
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="mk-contact-page">
      {/* Header Banner */}
      <header className="pg-hero section-padding" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="row mb-40 justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">Talk To Our Team</div>
              <div className="section-title mb-30">Get personalized travel support <i>today</i></div>
              <p style={{ color: "var(--mk-text)", fontSize: 17, maxWidth: 560, margin: "0 auto" }}>
                Whether you have a question about activities, holiday packages, visas, or custom itineraries, our travel experts are ready to assist.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contact Content */}
      <div className="contact section-padding" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row justify-content-center align-items-stretch" style={{ gap: "30px 0" }}>
            <div className="col-lg-5">
              <div style={{ background: "#ffffff", padding: "36px 32px", borderRadius: 20, border: "1px solid var(--mk-line)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 26, color: "var(--mk-navy)", marginBottom: 16 }}>Direct Contacts</h3>
                  <p style={{ color: "var(--mk-text)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    Reach out to our customer care team directly or visit our office in Dubai.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(32, 149, 174, 0.12)", color: "var(--mk-primary)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>
                        <i className="fa-solid fa-phone-volume"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--mk-text)" }}>Phone</div>
                        <a href="tel:+97142223456" style={{ fontSize: 16, fontWeight: 600, color: "var(--mk-navy)" }}>+971 4 222 3456</a>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(32, 149, 174, 0.12)", color: "var(--mk-primary)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--mk-text)" }}>Email</div>
                        <a href="mailto:info@karnishtourism.com" style={{ fontSize: 16, fontWeight: 600, color: "var(--mk-navy)" }}>info@karnishtourism.com</a>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(32, 149, 174, 0.12)", color: "var(--mk-primary)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>
                        <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--mk-text)" }}>Address</div>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--mk-navy)" }}>Dubai, United Arab Emirates</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 32, borderRadius: 14, overflow: "hidden" }}>
                  <img src="/images/destination-b.jpg" alt="Dubai skyline" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 14 }} />
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div style={{ background: "#ffffff", padding: "36px 32px", borderRadius: 20, border: "1px solid var(--mk-line)" }}>
                <Suspense fallback={<div>Loading form...</div>}>
                  <ContactForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
