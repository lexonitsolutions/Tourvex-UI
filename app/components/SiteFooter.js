import Link from "next/link";
import { cacheLife } from "next/cache";
import { fmt } from "../lib/format";

/* Inline SVG social icons — clean, accessible, zero extra dependency */
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l1.23-1.23a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SocialIcon({ platform }) {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram")) return <IconInstagram />;
  if (p === "x" || p.includes("twitter") || p.includes("x.com")) return <IconX />;
  if (p.includes("facebook")) return <IconFacebook />;
  if (p.includes("youtube")) return <IconYouTube />;
  if (p.includes("linkedin")) return <IconLinkedIn />;
  return null;
}

const DEFAULT_SOCIALS = [
  { id: "s-instagram", platform: "instagram", label: "Instagram", href: "https://instagram.com" },
  { id: "s-x", platform: "x", label: "X (Twitter)", href: "https://x.com" },
  { id: "s-facebook", platform: "facebook", label: "Facebook", href: "https://facebook.com" },
  { id: "s-youtube", platform: "youtube", label: "YouTube", href: "https://youtube.com" },
  { id: "s-linkedin", platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
];

const EXPERIENCES_LINKS = [
  { label: "Activities & Attractions", href: "/activities" },
  { label: "Holiday Packages", href: "/holidays" },
  { label: "Destinations", href: "/destination" },
  { label: "Cruises & Sailings", href: "/cruises" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Visa Services", href: "/visas" },
  { label: "Explore Tours", href: "/tours" },
];

const COMPANY_LINKS = [
  { label: "About Karnish", href: "/about" },
  { label: "Our Services", href: "/services" },
  { label: "Our Team", href: "/team" },
  { label: "Travel Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "Partner with Us", href: "/partners" },
];

const SUPPORT_LINKS = [
  { label: "Help & Support", href: "/support" },
  { label: "My Bookings", href: "/bookings" },
  { label: "Saved Wishlist", href: "/wishlist" },
  { label: "Search All", href: "/search" },
  { label: "Sign In", href: "/login" },
  { label: "Create Account", href: "/register" },
];

const DESTINATIONS_LINKS = [
  { label: "Dubai Experiences", href: "/activities?destination=Dubai" },
  { label: "Abu Dhabi Packages", href: "/activities?destination=Abu%20Dhabi" },
  { label: "Sharjah Sightseeing", href: "/activities?destination=Sharjah" },
  { label: "Ras Al Khaimah Tours", href: "/activities?destination=Ras%20Al%20Khaimah" },
  { label: "Featured Holidays", href: "/holidays" },
  { label: "Concerts & Shows", href: "/events" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "Partner with Us", href: "/partners" },
];

export default async function SiteFooter({ content }) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const contact = content?.contact || {};
  const phone = contact.phone || "+971 4 222 3456";
  const email = contact.email || "info@karnishtourism.com";
  const address = contact.address || "Dubai, United Arab Emirates";

  // Use CMS socials if provided, otherwise standard complete set with Instagram, X, Facebook, YouTube, LinkedIn
  const socialsList = Array.isArray(content?.socials) && content.socials.length > 0
    ? content.socials.map((s) => ({
        id: s.id || s.platform,
        platform: s.platform,
        label: s.link?.label || s.platform,
        href: s.link?.href || "#",
      }))
    : DEFAULT_SOCIALS;

  return (
    <footer className="mk-footer">
      {/* ── Top CTA bar ── */}
      <div className="mk-footer-cta-bar">
        <div className="mk-container mk-footer-cta-inner">
          <div className="mk-footer-cta-text">
            <span className="mk-footer-cta-label">✦ Your next adventure awaits</span>
            <p>Holidays, cruises, events &amp; more — all in one place.</p>
          </div>
          <div className="mk-footer-cta-actions">
            <Link href="/holidays" className="mk-footer-cta-btn is-primary">Explore Packages</Link>
            <Link href="/contact" className="mk-footer-cta-btn is-outline">Talk to an Expert</Link>
          </div>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="mk-container mk-footer-grid">

        {/* Brand column */}
        <div className="mk-footer-brand">
          <Link href="/" className="mk-footer-logo-link" aria-label="Karnish Tourism — Home">
            <img
              src={content?.logo?.url || "/images/karnish-logo.png"}
              alt={content?.logo?.alt || "Karnish Tourism"}
              className="mk-footer-logo"
            />
          </Link>
          <p className="mk-footer-about">
            {content?.about || "Your trusted gateway to unforgettable experiences, luxury holidays, cruises, and visa services across the UAE and worldwide."}
          </p>

          {/* Contact details */}
          <address className="mk-footer-contact" style={{ fontStyle: "normal" }}>
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="mk-footer-contact-row">
              <IconPhone /><span>{phone}</span>
            </a>
            <a href={`mailto:${email}`} className="mk-footer-contact-row">
              <IconMail /><span>{email}</span>
            </a>
            <span className="mk-footer-contact-row" style={{ alignItems: "flex-start" }}>
              <IconPin /><span>{address}</span>
            </span>
          </address>

          {/* Social icons */}
          <div className="mk-footer-socials" aria-label="Follow us">
            {socialsList.map((s) => (
              <a
                key={s.id}
                href={s.href}
                className="mk-footer-social-btn"
                aria-label={s.label || s.platform}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
          </div>
        </div>

        {/* Column 1: Experiences */}
        <div className="mk-footer-col">
          <h4 className="mk-footer-col-title">Experiences</h4>
          <ul className="mk-footer-links" role="list">
            {EXPERIENCES_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="mk-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Company */}
        <div className="mk-footer-col">
          <h4 className="mk-footer-col-title">Company</h4>
          <ul className="mk-footer-links" role="list">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="mk-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Customer Care & Account */}
        <div className="mk-footer-col">
          <h4 className="mk-footer-col-title">Account &amp; Help</h4>
          <ul className="mk-footer-links" role="list">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="mk-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Destinations & Highlights */}
        <div className="mk-footer-col">
          <h4 className="mk-footer-col-title">Destinations</h4>
          <ul className="mk-footer-links" role="list">
            {DESTINATIONS_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="mk-footer-link">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mk-footer-divider" />

      {/* ── Bottom bar ── */}
      <div className="mk-container mk-footer-bottom">
        <span className="mk-footer-copy">
          {fmt(content?.copyright || "© {year} Karnish Tourism LLC. All rights reserved.", { year: new Date().getFullYear() })}
        </span>
        <nav className="mk-footer-legal" aria-label="Legal">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="mk-footer-legal-link">{l.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
