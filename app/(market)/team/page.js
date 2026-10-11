"use client";

import Link from "next/link";

const TEAM = [
  {
    name: "Jason Walker",
    role: "Senior Adventure Specialist",
    bio: "Over 8 years guiding wilderness trekking, mountain routes, and desert safaris across the Middle East and Africa.",
    image: "/images/team-1.jpg",
    specialty: "Safari & Desert Expeditions",
    destinations: ["Dubai", "Oman", "Kenya"],
  },
  {
    name: "Mia Taylor",
    role: "Customer Success Manager",
    bio: "Dedicated to seamless guest journeys from initial consultation and flight bookings to post-trip follow-up.",
    image: "/images/team-2.jpg",
    specialty: "VIP Hospitality & Family Trips",
    destinations: ["UAE", "Maldives", "Turkey"],
  },
  {
    name: "Frank Mitchell",
    role: "Operations Director",
    bio: "Oversees ground logistics, luxury vehicle fleets, marine operations, and safety standards across all Karnish tours.",
    image: "/images/team-3.jpg",
    specialty: "Ground Operations & Marine Logistics",
    destinations: ["Dubai Marina", "Abu Dhabi", "Ras Al Khaimah"],
  },
  {
    name: "Jesica Brown",
    role: "Lead Travel Designer",
    bio: "Passionate about creating tailor-made itineraries that weave authentic culture, fine dining, and hidden local gems.",
    image: "/images/team-4.jpg",
    specialty: "Bespoke & Honeymoon Itineraries",
    destinations: ["Europe", "Southeast Asia", "Middle East"],
  },
];

export default function TeamPage() {
  return (
    <div className="team-page-wrap">
      {/* Header Banner */}
      <header className="pg-hero section-padding" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="row mb-40 justify-content-center">
            <div className="col-md-8 text-center">
              <div className="section-subtitle">Our Travel Experts</div>
              <div className="section-title">
                Meet the experts behind <i>every journey</i>
              </div>
              <p style={{ maxWidth: 640, margin: "14px auto 0", color: "#6c7a91", fontSize: 16 }}>
                Our team of passionate travel designers, operations directors, and certified guides bring decades of collective experience in luxury travel.
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
                  minHeight: 360,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Team Cards */}
      <section className="team section-padding" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="container">
          <div className="row g-4">
            {TEAM.map((member) => (
              <div key={member.name} className="col-lg-3 col-md-6">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div style={{ height: 280, position: "relative", overflow: "hidden" }}>
                    <img
                      src={member.image}
                      alt={member.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(15, 36, 84, 0.85)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {member.specialty}
                    </div>
                  </div>
                  <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h4 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "var(--mk-navy)" }}>
                      {member.name}
                    </h4>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mk-primary)", marginBottom: 12 }}>
                      {member.role}
                    </div>
                    <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", flexGrow: 1 }}>
                      {member.bio}
                    </p>
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {member.destinations.join(" • ")}
                      </span>
                      <Link
                        href="/contact"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--mk-primary)",
                          textDecoration: "none",
                        }}
                      >
                        Enquire →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Value pillars */}
          <div className="row mt-60 g-4">
            <div className="col-md-4">
              <div style={{ background: "var(--mk-bg-subtle, #f7f9fc)", padding: 28, borderRadius: 16, height: "100%" }}>
                <div style={{ fontSize: 24, color: "var(--mk-primary)", marginBottom: 12 }}>
                  <i className="fa-thin fa-compass"></i>
                </div>
                <h5 style={{ fontSize: 18, color: "var(--mk-navy)", fontWeight: 700, marginBottom: 8 }}>Local Dubai Expertise</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  Our team lives and works in Dubai, providing firsthand recommendations and exclusive access to top venues.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: "var(--mk-bg-subtle, #f7f9fc)", padding: 28, borderRadius: 16, height: "100%" }}>
                <div style={{ fontSize: 24, color: "var(--mk-primary)", marginBottom: 12 }}>
                  <i className="fa-thin fa-shield-check"></i>
                </div>
                <h5 style={{ fontSize: 18, color: "var(--mk-navy)", fontWeight: 700, marginBottom: 8 }}>Certified & Insured</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  Fully licensed with Dubai Department of Economy and Tourism (DET), adhering to international safety protocols.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: "var(--mk-bg-subtle, #f7f9fc)", padding: 28, borderRadius: 16, height: "100%" }}>
                <div style={{ fontSize: 24, color: "var(--mk-primary)", marginBottom: 12 }}>
                  <i className="fa-thin fa-heart-handshake"></i>
                </div>
                <h5 style={{ fontSize: 18, color: "var(--mk-navy)", fontWeight: 700, marginBottom: 8 }}>Personalized Care</h5>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  You receive a dedicated trip manager from first hello until you touch back down at home safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
