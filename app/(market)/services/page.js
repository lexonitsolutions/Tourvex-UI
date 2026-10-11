"use client";

import Link from "next/link";

const SERVICES = [
  {
    icon: "fa-thin fa-route",
    title: "Custom Tour Packages",
    description: "Personalized holiday plans tailored to your timeline, interests, and budget with dedicated trip planners.",
    href: "/holidays",
    badge: "Bespoke",
  },
  {
    icon: "fa-thin fa-plane-departure",
    title: "Flight Booking & Charters",
    description: "Fast, reliable flight reservations and group bookings with access to preferred commercial and private options.",
    href: "/contact",
    badge: "Global",
  },
  {
    icon: "fa-thin fa-hotel",
    title: "Hotel & Luxury Resorts",
    description: "Curated partner hotels, private beachfront villas, and five-star luxury suites across Dubai and worldwide.",
    href: "/holidays",
    badge: "5-Star",
  },
  {
    icon: "fa-thin fa-passport",
    title: "Visa Assistance & Concierge",
    description: "Comprehensive visa processing support for UAE tourist visas, transit permits, and overseas travel documentation.",
    href: "/visas",
    badge: "Express",
  },
  {
    icon: "fa-thin fa-ship",
    title: "Cruises & Luxury Yachts",
    description: "Sunset Dubai Marina yacht rentals, Arabian Gulf sailings, and Mediterranean luxury cruise expeditions.",
    href: "/cruises",
    badge: "Maritime",
  },
  {
    icon: "fa-thin fa-van-shuttle",
    title: "Private Airport & City Transfers",
    description: "Punctual airport meet-and-greet, luxury chauffeur fleet, and comfortable coach transfers for groups.",
    href: "/contact",
    badge: "Chauffeur",
  },
  {
    icon: "fa-thin fa-ticket",
    title: "Attractions & Desert Safaris",
    description: "Instant access tickets to Burj Khalifa, desert dune bashing, theme parks, and exclusive cultural spectacles.",
    href: "/activities",
    badge: "Popular",
  },
  {
    icon: "fa-thin fa-briefcase",
    title: "MICE & Corporate Travel",
    description: "Seamless incentive trips, corporate retreats, conference logistics, and VIP hospitality services.",
    href: "/partners",
    badge: "Corporate",
  },
  {
    icon: "fa-thin fa-headset",
    title: "24/7 Dedicated Support",
    description: "Multilingual emergency travel support and in-destination concierge to assist you throughout your entire trip.",
    href: "/contact",
    badge: "24/7 Care",
  },
];

export default function ServicesPage() {
  return (
    <div className="services-page-wrap">
      {/* Header Banner */}
      <header className="pg-hero section-padding" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="row mb-40 justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">Premium Travel Services</div>
              <div className="section-title">
                Discover services that make <i>travel effortless</i>
              </div>
              <p style={{ maxWidth: 640, margin: "14px auto 0", color: "#6c7a91", fontSize: 16 }}>
                From custom tour itineraries and luxury stays to visa processing and round-the-clock concierge, we handle every detail so you can focus on the journey.
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
                  backgroundImage: "url('/images/5.jpg')",
                  minHeight: 360,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <section className="services section-padding" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="container">
          <div className="row g-4">
            {SERVICES.map((s) => (
              <div key={s.title} className="col-lg-4 col-md-6">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    padding: "36px 30px",
                    border: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: "rgba(32, 149, 174, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        color: "var(--mk-primary)",
                      }}
                    >
                      <i className={s.icon}></i>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "var(--mk-bg-subtle, #f1f5f9)",
                        color: "var(--mk-navy)",
                      }}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, color: "var(--mk-navy)", marginBottom: 12 }}>
                    {s.title}
                  </h4>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, flexGrow: 1, marginBottom: 24 }}>
                    {s.description}
                  </p>
                  <div>
                    <Link
                      href={s.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--mk-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Learn more
                      <i className="fa-thin fa-arrow-up-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Banner Callout */}
          <div className="row mt-60">
            <div className="col-12">
              <div
                style={{
                  background: "linear-gradient(135deg, var(--mk-navy) 0%, #153b70 100%)",
                  borderRadius: 20,
                  padding: "48px 40px",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 24,
                }}
              >
                <div>
                  <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--mk-primary-light, #8fd3e3)" }}>
                    Ready to plan?
                  </span>
                  <h3 style={{ fontSize: 28, margin: "8px 0 6px", color: "#fff", fontWeight: 700 }}>
                    Need a bespoke travel itinerary?
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.75)", margin: 0, fontSize: 15, maxWidth: 560 }}>
                    Speak directly with one of our Dubai travel specialists to design your custom itinerary or group package.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Link href="/contact" className="mk-btn-primary" style={{ padding: "12px 28px", borderRadius: 999 }}>
                    Contact Our Team
                  </Link>
                  <Link href="/partners" className="mk-btn-outline" style={{ padding: "12px 24px", borderRadius: 999, borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                    Partner With Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
