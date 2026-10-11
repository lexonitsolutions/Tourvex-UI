import Link from "next/link";
import { CmsLink } from "./CmsLink";
import { cacheLife } from "next/cache";
import { fmt } from "../lib/format";

/* Inline SVG social icons — zero extra dependency */
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconTwitter() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M4 4l4.5 6L4 20h2.5l3.5-4.5L14 20h4l-5-6.5L17.5 4H15l-3 4L9 4H4z" />
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.528 5.843L0 24l6.342-1.505A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.669-.508-5.198-1.393l-.374-.222-3.865.918.978-3.768-.243-.39A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}
function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.955-1.966C18.88 4 12 4 12 4s-6.88 0-8.585.453A2.78 2.78 0 0 0 1.46 6.42 29.002 29.002 0 0 0 1 12a29.002 29.002 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.955 1.966C5.12 20 12 20 12 20s6.88 0 8.585-.453a2.78 2.78 0 0 0 1.955-1.967A29.002 29.002 0 0 0 23 12a29.002 29.002 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l1.23-1.23a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Pick a social icon by platform name slug. Falls back to a generic link label. */
function SocialIcon({ platform }) {
  const p = (platform || "").toLowerCase();
  if (p.includes("facebook")) return <IconFacebook />;
  if (p.includes("instagram")) return <IconInstagram />;
  if (p.includes("twitter") || p.includes("x.com")) return <IconTwitter />;
  if (p.includes("whatsapp")) return <IconWhatsApp />;
  if (p.includes("youtube")) return <IconYouTube />;
  return null;
}

/** Hard-coded extra links not yet in the CMS but needed for a complete footer */
const EXTRA_LINKS = [
  { label: "Cruises", href: "/cruises" },
  { label: "Events", href: "/events" },
  { label: "Visas", href: "/visas" },
  { label: "Tours", href: "/tours" },
  { label: "Search", href: "/search" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "Partner with Us", href: "/partners" },
];

/** Footer: every text, link and the logo come from the CMS (global.footer). Server component. */
export default async function SiteFooter({ content }) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const contact = content?.contact || {};
  const hasContact = [contact.phone, contact.email, contact.address].some(Boolean);
  const socials = content?.socials || [];
  const groups = content?.groups || [];

  return (
    <footer className="mk-footer">
      {/* ── Top newsletter / CTA strip ── */}
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
          {content?.logo?.url && (
            <Link href="/" className="mk-footer-logo-link" aria-label="Karnish Tourism — Home">
              <img
                src={content.logo.url}
                alt={content.logo.alt || "Karnish Tourism"}
                className="mk-footer-logo"
              />
            </Link>
          )}
          {content?.about && <p className="mk-footer-about">{content.about}</p>}

          {/* Contact details */}
          {hasContact && (
            <address className="mk-footer-contact" style={{ fontStyle: "normal" }}>
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="mk-footer-contact-row">
                  <IconPhone /><span>{contact.phone}</span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="mk-footer-contact-row">
                  <IconMail /><span>{contact.email}</span>
                </a>
              )}
              {contact.address && (
                <span className="mk-footer-contact-row" style={{ alignItems: "flex-start" }}>
                  <IconPin /><span style={{ whiteSpace: "pre-line" }}>{contact.address}</span>
                </span>
              )}
            </address>
          )}

          {/* Social icons */}
          {socials.length > 0 && (
            <div className="mk-footer-socials" aria-label="Follow us">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.link?.href || "#"}
                  className="mk-footer-social-btn"
                  aria-label={s.platform}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon platform={s.platform} />
                  {!SocialIcon({ platform: s.platform }) && (
                    <span>{s.link?.label || s.platform}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* CMS link groups (Explore Karnish, Company, Account) */}
        {groups.map((group) => (
          <div key={group.id} className="mk-footer-col">
            <h4 className="mk-footer-col-title">{group.title}</h4>
            <ul className="mk-footer-links" role="list">
              {group.links.map((item) => (
                <li key={item.id}>
                  <CmsLink href={item.link.href} className="mk-footer-link">
                    {item.link.label}
                  </CmsLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Extra "Catalog" column with links not in CMS yet */}
        <div className="mk-footer-col">
          <h4 className="mk-footer-col-title">Catalog</h4>
          <ul className="mk-footer-links" role="list">
            {EXTRA_LINKS.map((l) => (
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
