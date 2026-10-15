"use client";

import PartnersStrip from "../../components/PartnersStrip";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";
import "../../activity-detail.css";
import "../../contact.css";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", consent: false, website: "" };
const slugTitle = (slug) => slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const COMPANY_LOCATION = {
  name: "Karnish Tourism",
  address: "Dubai, United Arab Emirates",
  lat: 25.2048,
  lng: 55.2708,
};

function CompanyMap() {
  const [interactive, setInteractive] = useState(false);
  const delta = 0.025;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${COMPANY_LOCATION.lng - delta}%2C${COMPANY_LOCATION.lat - delta}%2C${COMPANY_LOCATION.lng + delta}%2C${COMPANY_LOCATION.lat + delta}&layer=mapnik&marker=${COMPANY_LOCATION.lat}%2C${COMPANY_LOCATION.lng}`;

  useEffect(() => {
    if (!interactive) return undefined;
    const release = (event) => event.key === "Escape" && setInteractive(false);
    window.addEventListener("keydown", release);
    return () => window.removeEventListener("keydown", release);
  }, [interactive]);

  return (
    <section className="hol-block act-location-wide contact-location" aria-labelledby="contact-location-title">
      <div className="container">
        <div className="section-subtitle">Visit Our Office</div>
        <h2 id="contact-location-title" className="section-title mb-20">Find us in <i>Dubai</i></h2>
        <p className="act-loc-text">
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          <span>{COMPANY_LOCATION.name} · {COMPANY_LOCATION.address}</span>
        </p>
      </div>
      <div className={`act-map-stage${interactive ? " is-interactive" : ""}`}>
        <iframe
          className="act-map"
          title={`Map of ${COMPANY_LOCATION.name}`}
          src={embedUrl}
          loading="lazy"
          tabIndex={interactive ? 0 : -1}
        />
        <div className="act-map-overlay">
          {!interactive ? (
            <button type="button" className="act-map-activate" onClick={() => setInteractive(true)} aria-label="Click to explore the company location map">
              <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
              <span>Click to explore the map</span>
            </button>
          ) : (
            <button type="button" className="act-map-release" onClick={() => setInteractive(false)}>Stop exploring map</button>
          )}
        </div>
      </div>
    </section>
  );
}

function CustomerServiceSection() {
  const services = [
    {
      icon: "fa-solid fa-route",
      title: "Personal travel planning",
      text: "Tell us what you have in mind and our team will help shape activities, holidays, visas, and transfers around your trip.",
    },
    {
      icon: "fa-solid fa-headset",
      title: "Booking assistance",
      text: "Get clear answers about availability, inclusions, timings, and booking details before you confirm your plans.",
    },
    {
      icon: "fa-solid fa-shield-heart",
      title: "Support after booking",
      text: "Need help with an existing booking? Our customer care team can guide you through updates and next steps.",
    },
  ];

  return (
    <section className="contact-service" aria-labelledby="customer-service-title">
      <div className="container">
        <div className="contact-service-head">
          <div>
            <span className="section-subtitle">Customer Service</span>
            <h2 id="customer-service-title">Support for every step of your <i>journey</i></h2>
          </div>
          <p>From the first idea to the final booking detail, our team is here to make travel planning feel straightforward.</p>
        </div>
        <div className="contact-service-grid">
          {services.map((service, index) => (
            <article className="contact-service-card" key={service.title}>
              <span className="contact-service-number">0{index + 1}</span>
              <span className="contact-service-icon"><i className={service.icon} aria-hidden="true"></i></span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Contact form: posts to POST /contact (creates a lead for the sales team). `?activity=<slug>` prefills the subject. */
function ContactForm() {
  const search = useSearchParams();
  const activity = (search.get("activity") || "").toLowerCase();
  const activitySlug = /^[a-z0-9][a-z0-9-]{0,119}$/.test(activity) ? activity : "";
  const [values, setValues] = useState(() => ({ ...EMPTY, subject: activitySlug ? `Enquiry about ${slugTitle(activitySlug)}`.slice(0, 150) : "" }));
  const [state, setState] = useState({ status: "idle", message: "" }); // idle | sending | done | error
  const [buttonMotion, setButtonMotion] = useState("idle");
  const resetMotionRef = useRef(null);
  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    if (buttonMotion === "success") setButtonMotion("idle");
  };

  useEffect(() => () => window.clearTimeout(resetMotionRef.current), []);

  const rejectSubmit = (message) => {
    window.clearTimeout(resetMotionRef.current);
    setState({ status: "error", message });
    setButtonMotion("invalid");
    resetMotionRef.current = window.setTimeout(() => setButtonMotion("idle"), 650);
  };

  async function submit(e) {
    e.preventDefault();
    if (state.status === "sending") return;
    if (values.name.trim().length < 2) return rejectSubmit("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return rejectSubmit("Please enter a valid email address.");
    const phone = values.phone.trim();
    if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone)) return rejectSubmit("Phone numbers may only contain digits, spaces, + and - (6 to 20 characters).");
    if (values.subject.trim().length < 2) return rejectSubmit("Please enter a subject.");
    if (values.message.trim().length < 5) return rejectSubmit("Please write a short message.");
    if (!values.consent) return rejectSubmit("Please agree to be contacted so we can reply to you.");
    setButtonMotion("sending");
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
      setButtonMotion("success");
    } catch (error) {
      setState({ status: "error", message: error.message || "We could not send your message. Please try again." });
      setButtonMotion("idle");
    }
  }

  const sending = state.status === "sending";
  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="row">
        <div className="col-md-12 text-left">
          <div className="contact-form-heading">
            <span>Send an enquiry</span>
            <h3>How can we help?</h3>
            <p>Share a few details and our travel team will get back to you shortly.</p>
          </div>
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
        <div className="col-md-12 contact-submit-track">
          <button className={`butn-arrow contact-submit is-${buttonMotion}`} type="submit" disabled={sending}>
            <span className="btn-text">{state.status === "done" ? "Message sent" : sending ? "Sending message..." : "Send message"}</span>
            <span className="arrow-wrap">
              <span className="arrow-inner">
                <i className={state.status === "done" ? "fa-solid fa-check" : "ti-arrow-right"}></i>
                <i className={state.status === "done" ? "fa-solid fa-check" : "ti-arrow-right"}></i>
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
      <header className="pg-hero contact-hero">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">Talk To Our Team</div>
              <div className="section-title">Travel questions? <i>We&apos;re here.</i></div>
              <p>
                Whether you have a question about activities, holiday packages, visas, or custom itineraries, our travel experts are ready to assist.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contact Content */}
      <div className="contact contact-main">
        <div className="container">
          <div className="row justify-content-center align-items-stretch contact-layout">
            <div className="col-lg-4">
              <aside className="contact-info-card">
                <div className="contact-info-top">
                  <span className="contact-info-kicker">Direct support</span>
                  <h2>Let&apos;s plan something memorable.</h2>
                  <p>
                    Speak directly with our customer care team for bookings, visa questions, or a tailored itinerary.
                  </p>
                  <div className="contact-methods">
                    <a className="contact-method" href="tel:+97142223456">
                      <span className="contact-method-icon">
                        <i className="fa-solid fa-phone-volume"></i>
                      </span>
                      <span><small>Call our team</small><strong>+971 4 222 3456</strong></span>
                      <i className="fa-solid fa-arrow-right contact-method-arrow" aria-hidden="true"></i>
                    </a>

                    <a className="contact-method" href="mailto:info@karnishtourism.com">
                      <span className="contact-method-icon">
                        <i className="fa-solid fa-envelope"></i>
                      </span>
                      <span><small>Email us</small><strong>info@karnishtourism.com</strong></span>
                      <i className="fa-solid fa-arrow-right contact-method-arrow" aria-hidden="true"></i>
                    </a>
                  </div>
                </div>
                <div className="contact-hours">
                  <i className="fa-regular fa-clock" aria-hidden="true"></i>
                  <div><small>Customer care hours</small><strong>Daily · 9:00 AM–8:00 PM</strong></div>
                </div>
              </aside>
            </div>

            <div className="col-lg-8">
              <div className="contact-form-card">
                <Suspense fallback={<div>Loading form...</div>}>
                  <ContactForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CompanyMap />
      <CustomerServiceSection />
      <PartnersStrip id="contact-partners" />
    </div>
  );
}
