import { CmsLink } from "./CmsLink";
import { fmt } from "../lib/format";

/** Footer: every text, link and the logo come from the CMS (global.footer). Server component. */
export default function SiteFooter({ content }) {
  const contact = content.contact || {};
  const hasContact = [contact.phone, contact.email, contact.address, contact.hours].some(Boolean);
  const socials = content.socials || [];
  return (
    <footer className="mk-footer">
      <div className="mk-container mk-footer-grid">
        <div>
          <img src={content.logo.url} alt={content.logo.alt} className="mk-footer-logo" />
          <p>{content.about}</p>
          {hasContact && (
            <address className="mk-footer-contact" style={{ fontStyle: "normal" }}>
              {contact.phone && <p><CmsLink href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</CmsLink></p>}
              {contact.email && <p><CmsLink href={`mailto:${contact.email}`}>{contact.email}</CmsLink></p>}
              {contact.address && <p style={{ whiteSpace: "pre-line" }}>{contact.address}</p>}
              {contact.hours && <p>{contact.hours}</p>}
            </address>
          )}
          {socials.length > 0 && (
            <p className="mk-footer-social">
              {socials.map((social, i) => (
                <span key={social.id}>
                  {i > 0 && " · "}
                  <CmsLink href={social.link.href} aria-label={social.platform}>{social.link.label}</CmsLink>
                </span>
              ))}
            </p>
          )}
        </div>
        {content.groups.map((group) => (
          <div key={group.id}>
            <h4>{group.title}</h4>
            {group.links.map((item) => (
              <CmsLink key={item.id} href={item.link.href}>{item.link.label}</CmsLink>
            ))}
          </div>
        ))}
      </div>
      <div className="mk-container mk-footer-bottom">
        {fmt(content.copyright, { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
