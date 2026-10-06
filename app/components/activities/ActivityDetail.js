"use client";

import Link from "next/link";
import { useCallback, useId, useState } from "react";
import { money, priceInfo, TRANSFER_LABEL } from "../../lib/actFormat";
import ShowcaseCard from "../ShowcaseCard";
import ActivityBooking from "./ActivityBooking";
import ActivityGallery from "./ActivityGallery";
import ActivityReviews from "./ActivityReviews";
import { IconBolt, IconCar, IconCheck, IconChevron, IconClock, IconGlobe, IconInfo, IconMap, IconPhone, IconPin, IconShare, IconShield, IconX, Stars } from "./ActivityParts";

const osmLink = (loc) =>
  loc.lat != null && loc.lng != null
    ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent([loc.name, loc.address].filter(Boolean).join(", "))}`;

const osmEmbed = (loc) => {
  const d = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - d}%2C${loc.lat - d}%2C${loc.lng + d}%2C${loc.lat + d}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`;
};

function Accordion({ title, items, kind, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`act-acc${open ? " is-open" : ""}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-p`} id={`${id}-b`} onClick={() => setOpen((v) => !v)}>
          <span>{title}</span>
          <IconChevron dir="down" width="20" height="20" />
        </button>
      </h3>
      <div className="act-acc-panel" id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} hidden={!open}>
        <div className="act-acc-clip">
          <ul className="act-list">
            {items.map((x, i) => (
              <li key={i}>
                {kind === "yes" && <span className="is-yes" aria-hidden="true"><IconCheck width="13" height="13" strokeWidth="3" /></span>}
                {kind === "no" && <span className="is-no" aria-hidden="true"><IconX width="13" height="13" strokeWidth="3" /></span>}
                {kind === "dot" && <span className="is-dot" aria-hidden="true" />}
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ShareButton({ title }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
    } catch {
      setMsg("");
    }
    setTimeout(() => setMsg(""), 2200);
  };
  return (
    <span className="act-share">
      <button type="button" className="act-ghost" onClick={share}><IconShare width="18" height="18" />Share</button>
      <span className="act-sr" role="status">{msg}</span>
      {msg && <span className="act-toast" aria-hidden="true">{msg}</span>}
    </span>
  );
}

function Facts({ a }) {
  const transfers = [...new Set((a.options || []).map((o) => o.transferType).filter(Boolean))].map((t) => TRANSFER_LABEL[t] || t);
  const cancel = a.freeCancellationHours;
  const facts = [
    a.operatingHours && { icon: <IconClock />, label: "Operating hours", value: a.operatingHours },
    a.duration && { icon: <IconClock />, label: "Duration", value: a.duration },
    a.instantConfirmation && { icon: <IconBolt />, label: "Confirmation", value: "Instant confirmation" },
    a.mobileVoucher && { icon: <IconPhone />, label: "Voucher", value: "Mobile voucher accepted" },
    cancel > 0 && { icon: <IconShield />, label: "Cancellation", value: `Free cancellation up to ${cancel} hour${cancel === 1 ? "" : "s"} before` },
    transfers.length > 0 && { icon: <IconCar />, label: "Transfer options", value: transfers.join(", ") },
    a.languages?.length > 0 && { icon: <IconGlobe />, label: "Languages", value: a.languages.join(", ") },
    a.location && (a.location.name || a.location.address) && {
      icon: <IconMap />,
      label: "Map",
      value: <a href={osmLink(a.location)} target="_blank" rel="noopener noreferrer">View on map</a>,
    },
  ].filter(Boolean);
  if (!facts.length) return null;
  return (
    <ul className="act-facts" aria-label="Key facts">
      {facts.map((f) => (
        <li key={f.label}>
          <span className="act-fact-ico" aria-hidden="true">{f.icon}</span>
          <span><small>{f.label}</small><b>{f.value}</b></span>
        </li>
      ))}
    </ul>
  );
}

function Description({ text }) {
  const [more, setMore] = useState(false);
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const long = text.length > 900;
  const shown = long && !more ? paragraphs.slice(0, 2) : paragraphs;
  return (
    <section className="hol-block" aria-labelledby="act-about">
      <h2 id="act-about">About this activity</h2>
      {shown.map((p, i) => <p key={i}>{p}</p>)}
      {long && paragraphs.length > 2 && (
        <button type="button" className="act-linkbtn act-readmore" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? "Read less" : "Read more"}</button>
      )}
    </section>
  );
}

/** Shown instead of the booking card for activities that have no bookable options (enquiry only). */
function EnquiryCard({ activity, price }) {
  return (
    <div className="act-book act-enquiry">
      {price && (
        <div className="act-price">
          <small>From</small><strong>{money(price.current)}</strong>{price.was && <s>{money(price.was)}</s>}
          {price.save > 0 && <span className="act-save">Save {price.save}%</span>}
        </div>
      )}
      <p className="act-enq-text"><IconInfo width="18" height="18" /> Online booking is not open for this activity yet. Ask our team and we will arrange it for you.</p>
      <Link className="mk-btn mk-btn-block" href={`/contact?activity=${encodeURIComponent(activity.slug)}`}>Ask about this activity</Link>
    </div>
  );
}

export default function ActivityDetail({ activity, related, reviews, initial }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const a = activity;
  const bookable = Array.isArray(a.options) && a.options.length > 0;
  const price = priceInfo(a);
  const city = a.destinations?.[0];
  const category = a.categories?.[0];
  const images = a.gallery?.length ? a.gallery.slice(0, 12) : a.imageUrl ? [{ url: a.imageUrl, alt: a.title }] : [];
  const where = a.location?.name || a.destinations?.join(", ");
  const rating = a.rating && a.rating.count > 0 ? a.rating : null;
  const sections = [
    ["Highlights", a.highlights, "yes", true],
    ["Inclusions", a.inclusions, "yes"],
    ["Exclusions", a.exclusions, "no"],
    ["How to redeem", a.howToRedeem, "dot"],
    ["Important information", a.importantInfo, "dot"],
  ].filter(([, items]) => items?.length > 0);

  return (
    <div className="hol-page act-page">
      <div className="mk-container">
        <nav className="hol-crumbs act-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/activities">Activities</Link></li>
            {city && <li><Link href={`/activities?destination=${encodeURIComponent(city)}`}>{city}</Link></li>}
            {category && <li><Link href={`/activities?activity=${encodeURIComponent(category)}`}>{category}</Link></li>}
            <li aria-current="page">{a.title}</li>
          </ol>
        </nav>

        <header className="act-head">
          <h1>{a.title}</h1>
          <div className="act-head-row">
            <ul className="hol-meta act-meta">
              {rating && (
                <li><Stars value={rating.average} size={16} /><b>{Number(rating.average).toFixed(1)}</b><span className="act-muted">({rating.count} review{rating.count === 1 ? "" : "s"})</span></li>
              )}
              {where && <li><IconPin width="18" height="18" />{where}</li>}
            </ul>
            <ShareButton title={a.title} />
          </div>
        </header>

        <ActivityGallery images={images} title={a.title} />

        <div className="act-grid">
          <div className="act-main">
            <Facts a={a} />
            {a.description && <Description text={a.description} />}
            {sections.length > 0 && (
              <section className="hol-block act-accs" aria-label="Activity details">
                {sections.map(([title, items, kind, open]) => <Accordion key={title} title={title} items={items} kind={kind} defaultOpen={!!open} />)}
              </section>
            )}
            {a.location && (a.location.name || a.location.address) && (
              <section className="hol-block" aria-labelledby="act-loc">
                <h2 id="act-loc">Location</h2>
                <p className="act-loc-text"><IconPin width="18" height="18" /><span>{[a.location.name, a.location.address].filter(Boolean).join(" · ")}</span></p>
                {a.location.lat != null && a.location.lng != null && (
                  <iframe className="act-map" title={`Map of ${a.location.name || a.title}`} src={osmEmbed(a.location)} loading="lazy" referrerPolicy="no-referrer" />
                )}
                <a className="act-linkbtn" href={osmLink(a.location)} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a>
              </section>
            )}
            <ActivityReviews slug={a.slug} initial={reviews} />
            {a.detailsAreSample && <p className="act-sample">Sample details shown for demonstration.</p>}
          </div>

          {bookable ? (
            <ActivityBooking activity={a} initial={initial} sheetOpen={sheetOpen} onSheetClose={closeSheet} />
          ) : (
            <aside className="act-aside act-aside-enquiry" aria-label="Booking"><EnquiryCard activity={a} price={price} /></aside>
          )}
        </div>

        {related.length > 0 && (
          <section className="hol-block act-related" aria-labelledby="act-rel">
            <h2 id="act-rel">You might also like</h2>
            <div className="hol-rail" tabIndex={0} role="region" aria-label="Related activities">
              {related.map((r) => {
                const p = r.salePrice || r.price;
                const was = r.salePrice && r.price && r.price.amount > r.salePrice.amount ? r.price : null;
                return (
                  <div className="hol-rail-item" key={r.slug}>
                    <ShowcaseCard
                      href={`/activities/${r.slug}`}
                      title={r.title}
                      image={r.imageUrl}
                      tag={r.categories?.[0]}
                      location={(r.destinations || []).join(", ") || undefined}
                      price={p ? { amount: p.amount, currency: p.currency, was } : null}
                      priceFallback="Price on request"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="act-bar">
        <div>
          <span>{price ? "From" : ""}</span>
          <strong>{price ? money(price.current) : "On request"}</strong>
        </div>
        {bookable ? (
          <button type="button" className="mk-btn" onClick={openSheet}>Check Availability</button>
        ) : (
          <Link className="mk-btn" href={`/contact?activity=${encodeURIComponent(a.slug)}`}>Ask about this activity</Link>
        )}
      </div>
    </div>
  );
}
