import Link from "next/link";
import { cacheLife } from "next/cache";
import { fmt } from "../lib/format";

/* Official brand SVG social icons — pixel-perfect authentic logos */
function IconFacebook() {
  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="8" fill="#1877F2" />
      <path
        d="M23 17.5h-3.8v10h-4.2v-10h-2v-3.6h2v-2.3c0-2.8 1.7-4.4 4.3-4.4 1.2 0 2.3.1 2.6.1v3h-1.8c-1.3 0-1.6.6-1.6 1.6v2h3.4l-.5 3.6z"
        fill="#ffffff"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="mk-ig-grad" cx="20%" cy="115%" r="130%" fx="20%" fy="115%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="34" height="34" rx="8" fill="url(#mk-ig-grad)" />
      <rect x="7.5" y="7.5" width="19" height="19" rx="5.5" stroke="#ffffff" strokeWidth="2" fill="none" />
      <circle cx="17" cy="17" r="4.5" stroke="#ffffff" strokeWidth="2" fill="none" />
      <circle cx="22.5" cy="11.5" r="1.3" fill="#ffffff" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="8" fill="#000000" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <path
        d="M23.1 7.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.6-6-5.2 6H8.6l6.8-7.7L8.2 7.5h6l4.1 5.5 4.8-5.5zm-1 15.3h1.6L13.5 9h-1.7l10.3 13.8z"
        fill="#ffffff"
      />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="8" fill="#FF0000" />
      <path
        d="M26.2 12.3a2.5 2.5 0 0 0-1.8-1.8C22.8 10 17 10 17 10s-5.8 0-7.4.5a2.5 2.5 0 0 0-1.8 1.8A26.5 26.5 0 0 0 7.3 17c0 1.6.2 3.1.5 4.7a2.5 2.5 0 0 0 1.8 1.8c1.6.5 7.4.5 7.4.5s5.8 0 7.4-.5a2.5 2.5 0 0 0 1.8-1.8c.3-1.6.5-3.1.5-4.7 0-1.6-.2-3.1-.5-4.7z"
        fill="#FF0000"
      />
      <path d="M15 20.5V13.5l6 3.5-6 3.5z" fill="#ffffff" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 34 34" width="34" height="34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="8" fill="#0A66C2" />
      <path
        d="M11.5 13.8H8.5v9.8h3v-9.8zM10 8.8c-1 0-1.7.7-1.7 1.7 0 .9.7 1.7 1.7 1.7s1.7-.8 1.7-1.7c0-1-.7-1.7-1.7-1.7zm14.5 7.7c0-2.7-1.4-4-3.4-4-1.6 0-2.3.9-2.7 1.5V13.8h-3v9.8h3v-5.5c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3v5.4h3.1v-6.1z"
        fill="#ffffff"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l1.23-1.23a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  { label: "Visa Services", href: "/visas" },
];

const COMPANY_LINKS = [
  { label: "About Karnish", href: "/about" },
  { label: "Our Services", href: "/services" },
  { label: "Our Team", href: "/team" },
  { label: "Partner with Us", href: "/partners" },
];

const SUPPORT_LINKS = [
  { label: "Help & Support", href: "/support" },
  { label: "My Bookings", href: "/bookings" },
  { label: "Saved Wishlist", href: "/wishlist" },
];

const DESTINATIONS_LINKS = [
  { label: "Dubai Experiences", href: "/activities?destination=Dubai" },
  { label: "Abu Dhabi Packages", href: "/activities?destination=Abu%20Dhabi" },
  { label: "Ras Al Khaimah Tours", href: "/activities?destination=Ras%20Al%20Khaimah" },
  { label: "Featured Holidays", href: "/holidays" },
  { label: "Concerts & Shows", href: "/events" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
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
      <img
        src="/footer-assets/footer-travel-bg.png"
        alt=""
        className="mk-footer-bg"
        aria-hidden="true"
      />
      {/* ── Top CTA bar ── */}
      <div className="mk-footer-cta-bar">
        <div className="mk-container mk-footer-cta-inner">
          <div className="mk-footer-cta-text">
            <span className="mk-footer-cta-label">✦ Your next adventure awaits</span>
            <p>Holidays, cruises, events &amp; more — all in one place.</p>
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
            <span className="mk-footer-contact-row">
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
