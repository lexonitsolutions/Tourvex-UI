"use client";

import { useState } from "react";
import Link from "next/link";
import PartnersStrip from "../../components/PartnersStrip";

const FAQS = [
  {
    question: "Travel Photography",
    answer: "Capture beautiful and unforgettable travel moments while exploring new places and exciting destinations around the world with our guided photo excursions.",
    icon: "fa-thin fa-camera-retro",
  },
  {
    question: "Mountain Tours & Trekking",
    answer: "Discover breathtaking mountain landscapes and enjoy thrilling excursions with our licensed mountain guides and safety-first support team.",
    icon: "fa-thin fa-mountain-sun",
  },
  {
    question: "Flight & Travel Booking",
    answer: "Book your flights quickly and easily with our access to negotiated airline fares, priority routing, and 24/7 rebooking assistance.",
    icon: "fa-thin fa-plane",
  },
  {
    question: "Visa Processing & Assistance",
    answer: "Our dedicated visa team assists with tourist, transit, and business visas for the UAE, Schengen, UK, US, and other worldwide destinations.",
    icon: "fa-thin fa-passport",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Jason Walker",
    position: "Adventure Specialist",
    image: "/images/team-1.jpg",
  },
  {
    name: "Mia Taylor",
    position: "Customer Success Manager",
    image: "/images/team-2.jpg",
  },
  {
    name: "Frank Mitchell",
    position: "Operations Director",
    image: "/images/team-3.jpg",
  },
  {
    name: "Jesica Brown",
    position: "Travel Designer",
    image: "/images/team-4.jpg",
  },
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState(2); // default third item open

  return (
    <div className="about-page-wrap">
      {/* Header Banner */}
      <header className="pg-hero section-padding" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="row mb-40 justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">About Karnish Tourism</div>
              <div className="section-title">
                Discover the world with <i>Karnish Tourism</i>
              </div>
              <p style={{ maxWidth: 640, margin: "14px auto 0", color: "#6c7a91", fontSize: 16 }}>
                Based in Dubai, we design unforgettable journeys across the UAE and the world—combining local insight, premium hospitality, and seamless service.
              </p>
            </div>
          </div>
        </div>
        <div className="container-fluid" style={{ maxWidth: 1280 }}>
          <div className="height1" style={{ borderRadius: 20, overflow: "hidden" }}>
            <div className="radius-mask">
              <div
                className="bg-img height2"
                style={{
                  backgroundImage: "url('/images/7.jpg')",
                  minHeight: 380,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* About Story */}
      <section className="about2 section-padding" style={{ paddingTop: 60 }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12 mb-40">
              <div className="about2-img" style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                  <img src="/images/a4.jpg" alt="Karnish Tour Experience" style={{ width: "100%", height: 380, objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", marginTop: 40, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                  <img src="/images/a2.jpg" alt="Karnish Tour Journey" style={{ width: "100%", height: 380, objectFit: "cover" }} />
                </div>
              </div>
            </div>
            <div className="col-lg-5 offset-lg-1 col-md-12">
              <div className="section-subtitle">Karnish Tourism</div>
              <div className="section-title mb-20">
                Discover the world <i>with our guide</i>
              </div>
              <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 16, marginBottom: 24 }}>
                Discover the world with comfort and unforgettable experiences. At Karnish Tourism, we craft bespoke holidays, luxury desert safaris, yacht charters, and curated international tours tailored to your travel dreams.
              </p>
              <ul className="listo mb-30" style={{ listStyle: "none", padding: 0 }}>
                <li style={{ padding: "8px 0", fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fa-pro fa-light fa-earth-americas" style={{ color: "var(--mk-primary)" }}></i> Global Destinations
                </li>
                <li style={{ padding: "8px 0", fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fa-pro fa-light fa-route" style={{ color: "var(--mk-primary)" }}></i> Expert Guidance
                </li>
                <li style={{ padding: "8px 0", fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fa-pro fa-light fa-shield-heart" style={{ color: "var(--mk-primary)" }}></i> Safe & Secure Travels
                </li>
                <li style={{ padding: "8px 0", fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fa-pro fa-light fa-hotel" style={{ color: "var(--mk-primary)" }}></i> Luxury Lodging & Transport
                </li>
              </ul>
              <div className="customers d-flex align-items-center" style={{ gap: 24, flexWrap: "wrap" }}>
                <div className="c-img d-flex align-items-center">
                  <ul className="d-flex" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    <li style={{ marginLeft: -10, firstChild: { marginLeft: 0 } }}>
                      <img src="/images/tst1.jpg" alt="Reviewer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff" }} />
                    </li>
                    <li style={{ marginLeft: -12 }}>
                      <img src="/images/tst2.jpg" alt="Reviewer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff" }} />
                    </li>
                    <li style={{ marginLeft: -12 }}>
                      <img src="/images/tst3.jpg" alt="Reviewer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #fff" }} />
                    </li>
                  </ul>
                  <div className="c-text headline pera-content" style={{ marginLeft: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--mk-navy)" }}>9,500+</h3>
                    <span style={{ fontSize: 13, color: "#6c7a91" }}>Positive Reviews</span>
                  </div>
                </div>
                <Link href="/contact" className="mk-btn-primary" style={{ padding: "10px 22px", borderRadius: 999 }}>
                  Talk to an Expert
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Pillars */}
      <section className="services pt-60 pb-60" style={{ background: "var(--mk-bg-subtle, #f7f9fc)" }}>
        <div className="container">
          <div className="row justify-content-center text-center mb-40">
            <div className="col-lg-7">
              <div className="section-subtitle">What We Offer</div>
              <div className="section-title">
                Get ready to explore and discover your world
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <div className="item mb-25" style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                <div className="icon" style={{ fontSize: 32, color: "var(--mk-primary)", marginBottom: 16 }}>
                  <i className="fa-thin fa-earth-americas"></i>
                </div>
                <h5 style={{ fontSize: 20, marginBottom: 8, color: "var(--mk-navy)" }}>Hidden Places</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Uncover secret gems and off-the-beaten-path destinations across the globe.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="item mb-25" style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                <div className="icon" style={{ fontSize: 32, color: "var(--mk-primary)", marginBottom: 16 }}>
                  <i className="fa-thin fa-plane"></i>
                </div>
                <h5 style={{ fontSize: 20, marginBottom: 8, color: "var(--mk-navy)" }}>Travel Adventures</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Exhilarating safaris, mountain expeditions, and thrilling marine sports.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="item mb-25" style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                <div className="icon" style={{ fontSize: 32, color: "var(--mk-primary)", marginBottom: 16 }}>
                  <i className="fa-thin fa-mountain-sun"></i>
                </div>
                <h5 style={{ fontSize: 20, marginBottom: 8, color: "var(--mk-navy)" }}>Nature & Culture</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Immerse yourself in heritage sites, historic architectural wonders, and natural parks.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="item mb-25" style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                <div className="icon" style={{ fontSize: 32, color: "var(--mk-primary)", marginBottom: 16 }}>
                  <i className="fa-thin fa-camera-retro"></i>
                </div>
                <h5 style={{ fontSize: 20, marginBottom: 8, color: "var(--mk-navy)" }}>Travel Stories</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Memorable experiences that turn into lifelong stories and lasting memories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container">
          <div className="row text-center mb-50">
            <div className="col-md-12">
              <div className="section-subtitle">Testimonials</div>
              <div className="section-title">
                Our happy <i>travellers</i>
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div style={{ background: "#fff", borderRadius: 16, padding: 30, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                <div style={{ display: "flex", gap: 4, color: "#f59e0b", marginBottom: 14, fontSize: 14 }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <h6 style={{ fontSize: 18, color: "var(--mk-navy)", marginBottom: 8 }}>Africa Safari Tour</h6>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  &ldquo;This tour was a truly memorable experience. The wildlife encounters and our private guide exceeded all our expectations.&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src="/images/tst1.jpg" alt="Sarah J." style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--mk-navy)" }}>Sarah Jenkins</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>London, UK</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div style={{ background: "#fff", borderRadius: 16, padding: 30, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                <div style={{ display: "flex", gap: 4, color: "#f59e0b", marginBottom: 14, fontSize: 14 }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <h6 style={{ fontSize: 18, color: "var(--mk-navy)", marginBottom: 8 }}>Dubai Luxury Experience</h6>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  &ldquo;From airport transfers to the private yacht tour and desert safari, Karnish Tourism handled every single detail with perfection.&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src="/images/tst2.jpg" alt="David M." style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--mk-navy)" }}>David Miller</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Toronto, Canada</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div style={{ background: "#fff", borderRadius: 16, padding: 30, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                <div style={{ display: "flex", gap: 4, color: "#f59e0b", marginBottom: 14, fontSize: 14 }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <h6 style={{ fontSize: 18, color: "var(--mk-navy)", marginBottom: 8 }}>Cappadocia Balloon Escape</h6>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  &ldquo;This tour was a magical experience. Cappadocia’s fairy chimneys and sunrise balloon flight were highlights of our year!&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src="/images/tst3.jpg" alt="Elena R." style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--mk-navy)" }}>Elena Rostova</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Berlin, Germany</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Advisors */}
      <section className="team section-padding" style={{ paddingTop: 40, paddingBottom: 80, background: "var(--mk-bg-subtle, #f7f9fc)" }}>
        <div className="container">
          <div className="row text-center mb-40">
            <div className="col-md-12">
              <div className="section-subtitle">Travel Advisors</div>
              <div className="section-title">
                Meet the Karnish Tourism Team
              </div>
            </div>
          </div>
          <div className="row g-4">
            {TEAM_MEMBERS.map((m) => (
              <div key={m.name} className="col-lg-3 col-md-6">
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <div style={{ height: 260, overflow: "hidden" }}>
                    <img src={m.image} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <h5 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--mk-navy)" }}>{m.name}</h5>
                    <div style={{ fontSize: 13, color: "var(--mk-primary)" }}>{m.position}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="faqs section-padding" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-5 col-md-12 mb-40">
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
                  <img src="/images/a2.jpg" alt="FAQ travel" style={{ width: "100%", height: 320, objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", marginTop: 30 }}>
                  <img src="/images/a3.jpg" alt="FAQ destinations" style={{ width: "100%", height: 320, objectFit: "cover" }} />
                </div>
              </div>
            </div>
            <div className="col-lg-6 offset-lg-1 col-md-12">
              <div className="section-subtitle">Popular Questions</div>
              <div className="section-title mb-30">
                Frequently asked <i>questions</i>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.question}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: isOpen ? "1px solid var(--mk-primary)" : "1px solid rgba(0,0,0,0.08)",
                        overflow: "hidden",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 16,
                          color: isOpen ? "var(--mk-primary)" : "var(--mk-navy)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <i className={faq.icon} style={{ color: "var(--mk-primary)" }}></i>
                          {faq.question}
                        </span>
                        <span style={{ fontSize: 18, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                          ▾
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 20px 18px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <PartnersStrip id="about-partners" />
    </div>
  );
}
