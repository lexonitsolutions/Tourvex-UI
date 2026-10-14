"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CurrencyNote from "../CurrencyNote";
import PackageCartButton from "../PackageCartButton";
import { StockHead } from "../StockBadge";
import EventEnquiry from "./EventEnquiry";
import {
  EventCard,
  FALLBACK_IMG,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconClock,
  IconInfo,
  IconMap,
  IconPin,
  IconUsers,
  IconX,
  RailSection,
  categoryHref,
  cityHref,
  durationLabel,
  formatDateTime,
  formatDay,
  formatMonth,
  formatTime,
  money,
  showFallback,
} from "./EventParts";

const SESSIONS_COLLAPSED = 12;

/* Gallery ----------------------------------------------------------- */

const Gallery = memo(function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const go = (d) => setActive((a) => (a + d + images.length) % images.length);
  return (
    <div className="ev-gallery" data-reveal="zoom">
      <div className="ev-stage">
        {images.map((img, i) => (
          <img
            key={img.url + i}
            className={i === active ? "is-active" : ""}
            src={img.url}
            alt={img.alt || ""}
            width="1200"
            height="675"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            aria-hidden={i !== active}
            onError={showFallback}
          />
        ))}
        {images.length > 1 && (
          <>
            <button type="button" className="hol-stage-btn is-prev" aria-label="Previous photo" onClick={() => go(-1)}>
              <IconChevron dir="left" />
            </button>
            <button type="button" className="hol-stage-btn is-next" aria-label="Next photo" onClick={() => go(1)}>
              <IconChevron />
            </button>
            <span className="hol-stage-count" aria-live="polite">{active + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="hol-thumbs" role="group" aria-label="Photo thumbnails">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              className={`hol-thumb${i === active ? " is-active" : ""}`}
              aria-label={`Show photo ${i + 1}${img.alt ? `: ${img.alt}` : ""}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
            >
              <img src={img.url} alt="" width="120" height="84" loading="lazy" decoding="async" onError={showFallback} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/* Sessions ---------------------------------------------------------- */

function Sessions({ sessions, value, onChange }) {
  const [all, setAll] = useState(false);
  const shown = useMemo(() => (all ? sessions : sessions.slice(0, SESSIONS_COLLAPSED)), [all, sessions]);
  const groups = useMemo(() => {
    const map = new Map();
    shown.forEach((s) => {
      const m = String(s.startsAt).slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m).push(s);
    });
    return [...map.entries()];
  }, [shown]);
  return (
    <div className="ev-sessions">
      {groups.map(([month, list]) => (
        <div key={month} className="ev-ses-group" role="group" aria-label={formatMonth(month)}>
          <h3>{formatMonth(month)}</h3>
          <div className="ev-chip-row">
            {list.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`ev-chip${value === s.id ? " is-active" : ""}`}
                aria-pressed={value === s.id}
                onClick={() => onChange(value === s.id ? "" : s.id)}
              >
                <b>{formatDay(s.startsAt)}</b>
                <small>{formatTime(s.startsAt)}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
      {sessions.length > SESSIONS_COLLAPSED && (
        <button type="button" className="hol-link ev-link-btn" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer dates" : `Show all ${sessions.length} dates`}
        </button>
      )}
    </div>
  );
}

/* Price card --------------------------------------------------------- */

function PriceCard({ event, session, onStart }) {
  return (
    <div className="ev-price-card" data-reveal>
      <p className="ev-pc-label">Tickets from</p>
      {event.price ? (
        <div className="ev-pc-price"><strong>{money(event.price)}</strong><span>per ticket</span></div>
      ) : (
        <div className="ev-pc-price"><strong className="is-text">Price on request</strong></div>
      )}
      <PackageCartButton item={event} type="event" date={session?.startsAt?.slice(0, 10)} />
      <ul className="ev-pc-facts">
        {event.venue && <li><IconPin width="18" height="18" />{[event.venue, event.city].filter(Boolean).join(", ")}</li>}
        {session ? (
          <li><IconCalendar width="18" height="18" />{formatDateTime(session.startsAt)}</li>
        ) : event.nextDate ? (
          <li><IconCalendar width="18" height="18" />Next: {formatDateTime(event.nextDate)}</li>
        ) : null}
        {event.ageGuidance && <li><IconUsers width="18" height="18" />{event.ageGuidance}</li>}
      </ul>
      <button type="button" className="mk-btn mk-btn-block ev-start" onClick={onStart}>{event.stock?.soldOut ? "Enquire about other dates" : "Request tickets"}</button>
      <p className="ev-pc-note ev-pc-strong">This is an enquiry, not a purchase. Nothing is charged now; our team confirms availability and the final price with you.</p>
      <p className="ev-pc-note"><CurrencyNote /></p>
    </div>
  );
}

/* Page ------------------------------------------------------------------ */

export default function EventDetail({ event, related }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [ticketType, setTicketType] = useState("");
  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const paragraphs = (event.description || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const images = event.images?.length ? event.images : event.coverImage ? [{ url: event.coverImage, alt: event.title }] : [{ url: FALLBACK_IMG, alt: event.title }];
  const ticketTypes = (event.ticketTypes || []).filter((t) => t.type);
  const sessions = event.sessions || [];
  const session = sessions.find((s) => s.id === sessionId) || null;
  const duration = durationLabel(event.durationMinutes);

  useReveal(rootRef, event.slug);
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [event.slug]);

  const requestTicket = (type) => {
    setTicketType(type);
    setOpen(true);
  };

  return (
    <div className="hol-page ev-page ev-detail" ref={rootRef}>
      <div className="mk-container">
        <nav className="hol-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/events">Events</Link></li>
            {event.city && <li><Link href={cityHref(event.city)}>{event.city}</Link></li>}
            <li aria-current="page">{event.title}</li>
          </ol>
        </nav>

        <header className="hol-detail-head">
          {event.category && (
            <p className="ev-eyebrow is-dark">
              <Link href={categoryHref(event.category.toLowerCase())}>{event.category}</Link>
            </p>
          )}
          <h1>{event.title}</h1>
          <StockHead stock={event.stock} />
          <ul className="hol-meta">
            {event.venue && <li><IconPin width="18" height="18" />{[event.venue, event.city, event.country].filter(Boolean).join(", ")}</li>}
            {event.nextDate && <li><IconCalendar width="18" height="18" />{formatDateTime(event.nextDate)}</li>}
            {duration && <li><IconClock width="18" height="18" />{duration}</li>}
            {event.tags?.map((t) => <li key={t} className="hol-tag">{t}</li>)}
          </ul>
        </header>

        <div className="hol-detail-grid">
          <div className="ev-main">
            <Gallery images={images} />

            {(event.summary || paragraphs.length > 0) && (
              <section className="hol-block" aria-labelledby="ev-overview" data-reveal>
                <h2 id="ev-overview">About this event</h2>
                {event.summary && <p className="hol-lead">{event.summary}</p>}
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            <section className="hol-block" aria-labelledby="ev-sessions" data-reveal>
              <h2 id="ev-sessions">Dates and times</h2>
              {sessions.length > 0 ? (
                <>
                  <p className="ev-lede">Choose a date to include it in your request. Times are shown as scheduled by the venue; availability is confirmed when you enquire.</p>
                  <Sessions sessions={sessions} value={sessionId} onChange={setSessionId} />
                  {session?.doorsOpenAt && <p className="ev-doors"><IconClock width="16" height="16" />Doors open at {formatTime(session.doorsOpenAt)} on the selected date.</p>}
                </>
              ) : (
                <p className="ev-lede">There are no upcoming dates listed for this event right now. You can still send us a request and we will let you know what we can find.</p>
              )}
            </section>

            {ticketTypes.length > 0 && (
              <section className="hol-block" aria-labelledby="ev-tickets" data-reveal>
                <h2 id="ev-tickets">Event packages</h2>
                <ul className="ev-tickets">
                  {ticketTypes.map((t) => (
                    <li key={t.type} className="ev-ticket">
                      <div>
                        <h3>{t.type} {t.badge && <span className="ev-package-badge">{t.badge}</span>}</h3>
                        {t.description && <p>{t.description}</p>}
                        {t.benefits?.length > 0 && <ul className="ev-package-benefits">{t.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}
                        <p className="ev-package-rules">
                          {t.availableQuantity !== null && t.availableQuantity !== undefined ? `${t.availableQuantity} available` : "Availability on request"}
                          {t.maxPerBooking ? ` · Max ${t.maxPerBooking} per booking` : ""}
                          {t.refundable ? " · Refundable" : ""}
                        </p>
                      </div>
                      <div className="ev-ticket-side">
                        {t.price ? <p className="ev-ticket-price"><small>From</small>{t.originalPrice && <del>{money(t.originalPrice)}</del>}<strong>{money(t.price)}</strong><small>per ticket</small></p> : <p className="ev-ticket-price"><small>Price on request</small></p>}
                        <button type="button" className="hol-link ev-link-btn" onClick={() => requestTicket(t.type)}>Request this ticket</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="ev-fineprint">Prices are indicative &quot;from&quot; prices per ticket. We confirm the final price and availability with you.</p>
              </section>
            )}

            {event.highlights?.length > 0 && (
              <section className="hol-block" aria-labelledby="ev-highlights" data-reveal>
                <h2 id="ev-highlights">Highlights</h2>
                <ul className="ev-highlights">
                  {event.highlights.map((h) => (
                    <li key={h}><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>{h}</li>
                  ))}
                </ul>
              </section>
            )}

            {(event.inclusions?.length > 0 || event.exclusions?.length > 0) && (
              <section className="hol-block ev-inex" aria-labelledby="ev-inex" data-reveal>
                <h2 id="ev-inex">What is included</h2>
                <div className="ev-inex-grid">
                  {event.inclusions?.length > 0 && (
                    <div>
                      <h3>Included</h3>
                      <ul className="ev-list">
                        {event.inclusions.map((x) => <li key={x}><span className="is-yes" aria-hidden="true"><IconCheck width="13" height="13" strokeWidth="3" /></span>{x}</li>)}
                      </ul>
                    </div>
                  )}
                  {event.exclusions?.length > 0 && (
                    <div>
                      <h3>Not included</h3>
                      <ul className="ev-list">
                        {event.exclusions.map((x) => <li key={x}><span className="is-no" aria-hidden="true"><IconX width="13" height="13" strokeWidth="3" /></span>{x}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {(event.venue || event.venueAddress || event.ageGuidance) && (
              <section className="hol-block" aria-labelledby="ev-venue" data-reveal>
                <h2 id="ev-venue">Venue and guidance</h2>
                <dl className="ev-facts">
                  {event.venue && (
                    <div>
                      <dt><IconMap width="18" height="18" />Venue</dt>
                      <dd>{event.venue}{event.venueAddress ? <><br />{event.venueAddress}</> : null}</dd>
                    </div>
                  )}
                  {event.ageGuidance && (
                    <div>
                      <dt><IconUsers width="18" height="18" />Age guidance</dt>
                      <dd>{event.ageGuidance}</dd>
                    </div>
                  )}
                  {duration && (
                    <div>
                      <dt><IconClock width="18" height="18" />Approximate duration</dt>
                      <dd>{duration}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {event.notes && (
              <aside className="ev-notes" aria-label="Important note" data-reveal>
                <IconInfo width="22" height="22" />
                <p>{event.notes}</p>
              </aside>
            )}
          </div>

          <aside className="hol-detail-aside" aria-label="Price and ticket request">
            <PriceCard event={event} session={session} onStart={openSheet} />
          </aside>
        </div>
      </div>

      {related?.length > 0 && (
        <RailSection id="ev-related" title="You may also like" subtitle="More events in the same city or category." label="related events">
          {related.map((item) => (
            <div className="hol-rail-item ev-rail-item" key={item.slug}><EventCard item={item} /></div>
          ))}
        </RailSection>
      )}

      <div className="ev-mobile-bar">
        <div>
          <span>Tickets from</span>
          <strong>{event.price ? money(event.price) : "On request"}</strong>
        </div>
        <button type="button" className="mk-btn" onClick={openSheet}>Request tickets</button>
      </div>

      <EventEnquiry event={event} open={open} onClose={closeSheet} session={sessionId} ticketType={ticketType} />
    </div>
  );
}
