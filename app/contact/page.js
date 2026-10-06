"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { API_BASE_URL } from "../lib/api";

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
          <h3>Get in touch!</h3>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group"> <span className="form-icon"><i className="fa-light fa-face-smile"></i></span>
            <input type="text" name="name" id="name" placeholder="Your name" required minLength={2} maxLength={120} value={values.name} onChange={set("name")} disabled={sending} autoComplete="name" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group"> <span className="form-icon"><i className="fa-light fa-envelope"></i></span>
            <input type="email" name="email" id="email" placeholder="Your email" required maxLength={254} value={values.email} onChange={set("email")} disabled={sending} autoComplete="email" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group"> <span className="form-icon"><i className="fa-light fa-phone"></i></span>
            <input type="text" inputMode="tel" name="phone" id="phone" placeholder="Phone (optional)" maxLength={20} value={values.phone} onChange={set("phone")} disabled={sending} autoComplete="tel" />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group"> <span className="form-icon"><i className="fa-light fa-book"></i></span>
            <input type="text" name="subject" id="subject" placeholder="Subject" required minLength={2} maxLength={150} value={values.subject} onChange={set("subject")} disabled={sending} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="form-group form-textarea"> <span className="form-icon"><i className="fa-light fa-comment"></i></span>
            <textarea name="message" id="message" cols="30" rows="3" placeholder="Message" required minLength={5} maxLength={2000} value={values.message} onChange={set("message")} disabled={sending}></textarea>
          </div>
        </div>
        {/* Honeypot: hidden from people, bots tend to fill it. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} /></label>
        </div>
        <div className="col-md-12">
          <label htmlFor="consent" style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" id="consent" name="consent" checked={values.consent} onChange={set("consent")} disabled={sending} style={{ width: "auto", height: "auto", marginTop: 4 }} />
            <span>I agree to be contacted about my message.</span>
          </label>
        </div>
        {state.message ? (
          <div className="col-md-12">
            <p role={state.status === "error" ? "alert" : "status"} style={{ marginBottom: 14, fontSize: 15, color: state.status === "error" ? "#b42318" : "#0f7a4f" }}>{state.message}</p>
          </div>
        ) : null}
        <div className="col-md-12">
          <button className="butn-arrow" type="submit" disabled={sending}><span className="btn-text">{sending ? "Sending..." : "Send message"}</span> <span className="arrow-wrap">
              <span className="arrow-inner">
                <i className="ti-arrow-right"></i>
                <i className="ti-arrow-right"></i>
              </span> </span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Contact() {
  return (
    <>
      {/* Preloader */}
      <div className="loader-wrap">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path id="svg" d="M0,1005S175,995,500,995s500,5,500,5V0H0Z"></path>
        </svg>
        <div className="loader-wrap-heading">
          <div className="load-text"> <span>L</span> <span>o</span> <span>a</span> <span>d</span> <span>i</span> <span>n</span> <span>g</span> </div>
        </div>
      </div>
      {/* Cursor */}
      <div className="cursor"></div>
      {/* Progress scroll totop */}
      <div className="progress-wrap cursor-pointer">
        <svg className="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
          <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"></path>
        </svg>
      </div>
      {/* Smooth-wrapper */}
      <div id="smooth-wrapper">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            {/* Logo */}
            <div className="logo-wrapper">
              <a className="logo" href="/"><img src="/images/karnish-logo.png" className="logo-img karnish-logo" alt="Karnish Tourism LLC" /></a>
            </div>
            {/* Button */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation"> <span className="navbar-toggler-icon"><i className="ti-menu"></i></span> </button>
            {/* Menu */}
            <div className="collapse navbar-collapse" id="navbar">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><a className="nav-link" href="/"><span className="rolling-text">Home</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/about"><span className="rolling-text">About</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/tours"><span className="rolling-text">Tours</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/destination"><span className="rolling-text">Destinations</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/activities"><span className="rolling-text">Activities</span></a></li>
                <li className="nav-item"><a className="nav-link" href="/services"><span className="rolling-text">Services</span></a></li>
                <li className="nav-item"><a className="nav-link active" href="/contact"><span className="rolling-text">Contact</span></a></li>
              </ul>
            </div>
          </div>
        </nav>
        <div id="smooth-content">
          <main className="o-hidden">
            {/* Header Banner */}
            <header className="pg-hero section-padding">
              <div className="container">
                <div className="row mb-60 justify-content-center">
                  <div className="col-md-6 text-center">
                    <div className="section-subtitle">Talk To Our Team</div>
                    <div className="section-title mb-60">Get personalized travel support <i>today</i>!</div>
                    <div className="post">
                      <div className="date-comment"> <i className="fa-solid fa-phone-volume"></i> +1 123 4567 8910</div>
                      <div className="date-comment"> <i className="fa-solid fa-envelope"></i> info@karnishtourism.com</div>
                      <div className="date-comment"> <i className="fa-solid fa-location-dot"></i> 113893 Noble Blvd. NY, USA </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-fluid">
                <div className="height1">
                  <div className="radius-mask">
                    <div className="bg-img height2" data-background="/images/services-hero.jpg" data-speed="0.5" data-lag="0"></div>
                  </div>
                </div>
              </div>
            </header>
            {/* Contact */}
            <div className="contact section-padding">
              <div className="container">
                <div className="row justify-content-center align-items-center">
                  <div className="col-md-4">
                    <div className="item-img duru-rotate-scale-reveal"><img src="/images/destination-b.jpg" alt="" /></div>
                  </div>
                  <div className="col-md-5 offset-md-1">
                    <div className="contact-form">
                      <Suspense fallback={null}>
                        <ContactForm />
                      </Suspense>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          {/* Footer */}
          <footer className="footer">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-md-7 mb-45 text-center">
                  <div className="subscribe">
                    <div className="section-subtitle wow fadeInRight">Subscribe to travel</div>
                    <div className="section-title d-rotate wow mb-30"><span className="rotate-text text-white">Travel deals to your inbox<i>!</i></span></div>
                    <div className="newsletter">
                      <form action="#">
                        <input type="email" placeholder="Enter your email address" required />
                        <button type="submit"><i className="fa-light fa-arrow-right"></i></button>
                      </form>
                    </div>
                    <p>We are committed to protecting your <a href="#0" className="text-decoration-line-bottom">privacy policy.</a></p>
                  </div>
                </div>
              </div>
              {/* Instagram */}
              <div className="insta">
                <div className="container">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="item">
                        <div className="img">
                          <a href="#0"> <img src="/images/03_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/01_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/02_2.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/04.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/05.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="img">
                          <a href="#0"> <img src="/images/06.jpg" alt="" /> </a> <i className="fa-brands fa-instagram"></i>
                        </div>
                        <div className="follow">
                          <a href="#0" className="text-bg"> <span><i className="fa-brands fa-instagram"></i> / Karnish Tourism</span></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom */}
            <div className="bottom">
              <div className="container">
                <div className="row">
                  <div className="col-lg-3 col-md-12">
                    <p>© All Rights Reserved <a href="https://lexonit.com" target="_blank">lexonit.com</a></p>
                  </div>
                  <div className="col-lg-7 col-md-12 text-center">
                    <div className="links">
                      <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/tours">Tours</a></li>
                        <li><a href="/destination">Destinations</a></li>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/contact">Contact</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-12">
                    <div className="social-icons text-end">
                      <ul className="list-inline">
                        <li><a href="#"><i className="fa-brands fa-instagram"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-dribbble"></i></a></li>
                        <li><a href="#"><i className="fa-brands fa-facebook-f"></i></a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-text-style5">Karnish Tourism</div>
          </footer>
        </div>
      </div>

      <Script id="script-jquery" src="/js/jquery-3.6.0.min.js" strategy="afterInteractive" />
      <Script id="script-jquery-migrate" src="/js/jquery-migrate-3.4.0.min.js" strategy="afterInteractive" />
      <Script id="script-plugins" src="/js/plugins.js" strategy="afterInteractive" />
      <Script id="script-imagesloaded" src="/js/imagesloaded.pkgd.min.js" strategy="afterInteractive" />
      <Script id="script-gsap" src="/js/gsap.min.js" strategy="afterInteractive" />
      <Script id="script-scrollsmoother" src="/js/ScrollSmoother.min.js" strategy="afterInteractive" />
      <Script id="script-scrolltrigger" src="/js/ScrollTrigger.min.js" strategy="afterInteractive" />
      <Script id="script-smoother-script" src="/js/smoother-script.js" strategy="afterInteractive" />
      <Script id="script-springer" src="/js/springer.min.js" strategy="afterInteractive" />
      <Script id="script-lenis" src="/js/lenis.min.js" strategy="afterInteractive" />
      <Script id="script-three" src="/js/three.min.js" strategy="afterInteractive" />
      <Script id="script-hover-effect" src="/js/hover-effect.umd.js" strategy="afterInteractive" />
      <Script id="script-custom" src="/js/custom.js" strategy="afterInteractive" />
    </>
  );
}
