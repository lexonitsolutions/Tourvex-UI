"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CurrencyNote from "../CurrencyNote";
import { RailSection } from "../holidays/HolidayParts";
import VisaEnquiry from "./VisaEnquiry";
import VisaBooking from "./VisaBooking";
import VisaReviews from "./VisaReviews";
import {
  ENTRIES_LABEL,
  Flag,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconClock,
  IconInfo,
  IconPin,
  IconRepeat,
  IconShield,
  KIND_LABEL,
  VisaCard,
  money,
  tintFor,
} from "./VisaParts";

const VISA_COUNTRY_CENTERS = {
  ae: [23.4241, 53.8478, 4], sa: [23.8859, 45.0792, 10], vn: [14.0583, 108.2772, 7],
  om: [21.4735, 55.9754, 5], in: [20.5937, 78.9629, 12], id: [-0.7893, 113.9213, 18],
  tr: [38.9637, 35.2433, 8], th: [15.87, 100.9925, 7], sg: [1.3521, 103.8198, 0.35],
  my: [4.2105, 101.9758, 7], az: [40.1431, 47.5769, 3.5], ke: [-0.0236, 37.9062, 7],
  eg: [26.8206, 30.8025, 8], jp: [36.2048, 138.2529, 9], lk: [7.8731, 80.7718, 3],
  bh: [26.0667, 50.5577, 0.35], kw: [29.3117, 47.4818, 1.5], uz: [41.3775, 64.5853, 6],
  am: [40.0691, 45.0382, 2.5], za: [-30.5595, 22.9375, 10], us: [39.8283, -98.5795, 28],
  gb: [55.3781, -3.436, 6], ca: [56.1304, -106.3468, 32], au: [-25.2744, 133.7751, 22],
};

function countryMapEmbed(countryCode) {
  const [lat, lng, span] = VISA_COUNTRY_CENTERS[String(countryCode || "").toLowerCase()] || [20, 0, 35];
  const verticalSpan = span * 0.68;
  const bbox = [lng - span, lat - verticalSpan, lng + span, lat + verticalSpan].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/* FAQ accordion ------------------------------------------------------- */

const FaqItem = memo(function FaqItem({ item, open, onToggle, id }) {
  return (
    <li className={`vis-faq${open ? " is-open" : ""}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-btn`} onClick={onToggle}>
          <span className="vis-faq-q">{item.question}</span>
          <IconChevron dir="down" className="vis-faq-chev" width="20" height="20" />
        </button>
      </h3>
      <div className="vis-faq-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}>
        <div className="vis-faq-clip">
          <p>{item.answer}</p>
        </div>
      </div>
    </li>
  );
});

function Faqs({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <ul className="vis-faqs">
      {faqs.map((item, i) => (
        <FaqItem key={item.question} id={`vis-faq-${i}`} item={item} open={openIndex === i} onToggle={() => setOpenIndex((o) => (o === i ? null : i))} />
      ))}
    </ul>
  );
}

/* Price card ------------------------------------------------------------ */

function PriceCard({ visa, onStart, onApply }) {
  return (
    <div className="vis-price-card" data-reveal>
      <p className="vis-pc-label">Our service fee, from</p>
      {visa.startingPrice ? (
        <div className="vis-pc-price"><strong>{money(visa.startingPrice)}</strong><span>per traveller</span></div>
      ) : (
        <div className="vis-pc-price"><strong className="is-text">Fee on request</strong></div>
      )}
      <a href="#vis-reviews" className="vis-pc-rating-link">
        <span className="vis-pc-stars">★★★★★</span> <strong>4.9/5</strong> · <span>(140+ Reviews)</span>
      </a>
      <ul className="vis-pc-facts">
        {visa.processing && <li><IconClock width="18" height="18" />Processing: {visa.processing}</li>}
        {visa.validity && <li><IconCalendar width="18" height="18" />Validity: {visa.validity}</li>}
        <li><IconShield width="18" height="18" />{KIND_LABEL[visa.kind] || visa.kind} visa</li>
      </ul>
      <button type="button" className="mk-btn mk-btn-block vis-start" onClick={onStart}>Start enquiry</button>
      <button type="button" className="mk-btn mk-btn-block vis-apply-secondary" onClick={onApply}>Apply now</button>
      <p className="vis-pc-note"><CurrencyNote showAttribution={false} /></p>
    </div>
  );
}

/* Page ------------------------------------------------------------------ */

export default function VisaDetail({ visa, related }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(null);
  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const showBooking = useCallback(() => setBookingVisible(true), []);
  const paragraphs = (visa.description || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const countryMapUrl = countryMapEmbed(visa.countryCode);

  useReveal(rootRef, visa.slug);
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [visa.slug]);

  useEffect(() => {
    if (!mapInteractive) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMapInteractive(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mapInteractive]);

  useEffect(() => {
    const modify = () => setApplyOpen(true);
    window.addEventListener("visa-modify", modify);
    return () => window.removeEventListener("visa-modify", modify);
  }, []);

  return (
    <div className="hol-page vis-page vis-detail" ref={rootRef}>
      <div className="mk-container">
        <nav className="hol-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/visas">Visas</Link></li>
            <li aria-current="page">{visa.title}</li>
          </ol>
        </nav>

        <header className="vis-banner" style={{ "--vh": tintFor(visa.countryCode) }} data-reveal>
          <span className="vis-banner-mark" aria-hidden="true">{String(visa.countryCode || "").toUpperCase()}</span>
          <Flag code={visa.countryCode} className="is-banner" />
          <div className="vis-banner-copy">
            <p className="vis-eyebrow">{visa.country} · {KIND_LABEL[visa.kind] || visa.kind}</p>
            <h1>{visa.title}</h1>
            <ul className="vis-banner-chips">
              {visa.processing && <li><IconClock width="16" height="16" /><span><small>Processing</small>{visa.processing}</span></li>}
              {visa.validity && <li><IconCalendar width="16" height="16" /><span><small>Validity</small>{visa.validity}</span></li>}
              {visa.entries && <li><IconRepeat width="16" height="16" /><span><small>Entries</small>{ENTRIES_LABEL[visa.entries] || visa.entries}</span></li>}
              {visa.stay && <li><IconShield width="16" height="16" /><span><small>Stay</small>{visa.stay}</span></li>}
              <li>
                <a href="#vis-reviews" className="vis-banner-chip-link">
                  <span style={{ color: "#f59e0b" }}>★</span>
                  <span><small>Reviews</small>4.9 (140+)</span>
                </a>
              </li>
            </ul>
          </div>
        </header>

        {visa.gallery?.length > 0 && (
          <section className="vis-destination-gallery" aria-labelledby="vis-gallery-title" data-reveal>
            <div className="vis-destination-gallery-head">
              <div>
                <p>Discover the destination</p>
                <h2 id="vis-gallery-title">Famous places in {visa.country}</h2>
              </div>
              <span>{visa.gallery.length} {visa.gallery.length === 1 ? "place" : "places"}</span>
            </div>
            <div className="vis-destination-gallery-grid">
              {visa.gallery.map((image, index) => (
                <button type="button" key={`${image.url}-${index}`} onClick={() => setGalleryOpen(index)} aria-label={`View ${image.alt || `${visa.country} tourist place ${index + 1}`}`}>
                  <img src={image.url} alt={image.alt || `${visa.country} tourist place`} loading={index < 3 ? "eager" : "lazy"} decoding="async" />
                  {image.alt && <span>{image.alt}</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        <VisaBooking visa={visa} open={applyOpen} onClose={(modify) => setApplyOpen(modify === false)} onConfigured={showBooking} />
        <div className={`vis-detail-grid${bookingVisible ? " is-booking" : ""}`}>
          <div className="vis-detail-main">
            {(visa.summary || paragraphs.length > 0) && (
              <section className="hol-block vis-first" aria-labelledby="vis-overview" data-reveal>
                <h2 id="vis-overview">Overview</h2>
                {visa.summary && <p className="hol-lead">{visa.summary}</p>}
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            {(
              <section className="hol-block" aria-labelledby="vis-highlights" data-reveal>
                <h2 id="vis-highlights">Highlights</h2>
                <ul className="vis-highlights">
                  {(visa.highlights || []).map((h) => (
                    <li key={h}><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>{h}</li>
                  ))}
                  <li><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>Transparent pricing with no hidden service charges</li>
                  <li><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>Embassy charges confirmed before you proceed</li>
                  <li><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>Secure AED payment with a clearly confirmed final amount</li>
                </ul>
              </section>
            )}

            {visa.requirements?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-requirements" data-reveal>
                <h2 id="vis-requirements">Requirements</h2>
                <ul className="vis-list">
                  {visa.requirements.map((r) => (
                    <li key={r}><span aria-hidden="true"><IconChevron width="13" height="13" strokeWidth="3" /></span>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {visa.documents?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-documents" data-reveal>
                <h2 id="vis-documents">Documents checklist</h2>
                <ul className="vis-docs">
                  {visa.documents.map((d) => (
                    <li key={d}><span aria-hidden="true" /> {d}</li>
                  ))}
                </ul>
              </section>
            )}

            {visa.steps?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-steps" data-reveal>
                <h2 id="vis-steps">How it works</h2>
                <ol className="vis-steps">
                  {visa.steps.map((s, i) => (
                    <li key={s.title}>
                      <span className="vis-step-num" aria-hidden="true">{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <VisaReviews country={visa.country} kind={visa.kind} />

            {visa.faqs?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-faqs" data-reveal>
                <h2 id="vis-faqs">Frequently asked questions</h2>
                <Faqs faqs={visa.faqs} />
              </section>
            )}

            {visa.notes && (
              <aside className="vis-notes" aria-label="Important note" data-reveal>
                <IconInfo width="22" height="22" />
                <p>{visa.notes}</p>
              </aside>
            )}
          </div>

          {!bookingVisible && <aside className="vis-detail-aside" aria-label="Fee and enquiry"><PriceCard visa={visa} onStart={openSheet} onApply={() => setApplyOpen(true)} /></aside>}
        </div>
      </div>

      <section className="vis-country-location" aria-labelledby="vis-country-location-title" data-reveal>
        <div className="mk-container vis-country-location-heading">
          <p className="vis-country-location-eyebrow">Destination</p>
          <h2 id="vis-country-location-title">Explore {visa.country}</h2>
          <p className="vis-country-location-name"><IconPin width="18" height="18" /> {visa.country}</p>
        </div>
        <div className={`vis-country-map-stage${mapInteractive ? " is-interactive" : ""}`}>
          <iframe
            className="vis-country-map"
            src={countryMapUrl}
            title={`Map showing ${visa.country}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            tabIndex={mapInteractive ? 0 : -1}
          />
          <div className="vis-country-map-controls">
            {!mapInteractive ? (
              <button type="button" className="vis-country-map-activate" onClick={() => setMapInteractive(true)}>
                <IconPin width="20" height="20" />
                <span>Explore {visa.country} map</span>
              </button>
            ) : (
              <button type="button" className="vis-country-map-release" onClick={() => setMapInteractive(false)}>
                Stop exploring map
              </button>
            )}
          </div>
        </div>
      </section>

      {related?.length > 0 && (
        <RailSection id="vis-related" title="Similar visas" subtitle="Other visas you may be looking for." label="similar visas">
          {related.map((item) => (
            <div className="hol-rail-item vis-rail-item" key={item.slug}><VisaCard item={item} /></div>
          ))}
        </RailSection>
      )}

      {!bookingVisible && <div className="vis-mobile-bar">
        <div>
          <span>Service fee from</span>
          <strong>{visa.startingPrice ? money(visa.startingPrice) : "On request"}</strong>
        </div>
        <button type="button" className="mk-btn" onClick={() => setApplyOpen(true)}>Apply now</button>
      </div>}

      <VisaEnquiry visa={visa} open={open} onClose={closeSheet} />

      {galleryOpen != null && visa.gallery?.[galleryOpen] && (
        <div className="vis-gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${visa.country} gallery`}>
          <button type="button" className="vis-gallery-lightbox-scrim" aria-label="Close gallery" onClick={() => setGalleryOpen(null)} />
          <div className="vis-gallery-lightbox-content">
            <button type="button" className="vis-gallery-lightbox-close" onClick={() => setGalleryOpen(null)} aria-label="Close gallery">×</button>
            <img src={visa.gallery[galleryOpen].url} alt={visa.gallery[galleryOpen].alt || `${visa.country} tourist place`} />
            <div className="vis-gallery-lightbox-footer">
              <p>{visa.gallery[galleryOpen].alt || visa.country}</p>
              <span>{galleryOpen + 1} / {visa.gallery.length}</span>
            </div>
            {visa.gallery.length > 1 && <>
              <button type="button" className="vis-gallery-lightbox-prev" onClick={() => setGalleryOpen((galleryOpen - 1 + visa.gallery.length) % visa.gallery.length)} aria-label="Previous image">‹</button>
              <button type="button" className="vis-gallery-lightbox-next" onClick={() => setGalleryOpen((galleryOpen + 1) % visa.gallery.length)} aria-label="Next image">›</button>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
