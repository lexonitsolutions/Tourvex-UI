"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CurrencyNote from "../CurrencyNote";
import PackageCartButton from "../PackageCartButton";
import { StockHead } from "../StockBadge";
import CruiseEnquiry from "./CruiseEnquiry";
import {
  CruiseCard,
  FALLBACK_IMG,
  IconAnchor,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconInfo,
  IconMoon,
  IconPin,
  IconShip,
  IconWave,
  IconX,
  RailSection,
  cityHref,
  formatDate,
  formatMonth,
  formatWeekday,
  money,
  nightsLabel,
  showFallback,
} from "./CruiseParts";

const STOP_LABEL = { embark: "Embark", port: "Port", sea: "At sea", disembark: "Disembark" };
const STOP_ICON = { embark: IconShip, port: IconAnchor, sea: IconWave, disembark: IconPin };
const DATES_COLLAPSED = 12;

/* Gallery ----------------------------------------------------------- */

const Gallery = memo(function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const go = (d) => setActive((a) => (a + d + images.length) % images.length);
  return (
    <div className="cr-gallery" data-reveal="zoom">
      <div className="cr-stage">
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

/* Departures -------------------------------------------------------- */

function Departures({ dates, value, onChange }) {
  const [all, setAll] = useState(false);
  const shown = useMemo(() => (all ? dates : dates.slice(0, DATES_COLLAPSED)), [all, dates]);
  const groups = useMemo(() => {
    const map = new Map();
    shown.forEach((d) => {
      const m = d.slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m).push(d);
    });
    return [...map.entries()];
  }, [shown]);
  return (
    <div className="cr-departures">
      {groups.map(([month, list]) => (
        <div key={month} className="cr-dep-group" role="group" aria-label={formatMonth(month)}>
          <h3>{formatMonth(month)}</h3>
          <div className="cr-chip-row">
            {list.map((d) => (
              <button
                key={d}
                type="button"
                className={`cr-date${value === d ? " is-active" : ""}`}
                aria-pressed={value === d}
                onClick={() => onChange(value === d ? "" : d)}
              >
                <small>{formatWeekday(d)}</small>
                <b>{formatDate(d)}</b>
              </button>
            ))}
          </div>
        </div>
      ))}
      {dates.length > DATES_COLLAPSED && (
        <button type="button" className="hol-link cr-link-btn" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer dates" : `Show all ${dates.length} dates`}
        </button>
      )}
    </div>
  );
}

/* Price card --------------------------------------------------------- */

function PriceCard({ cruise, departure, onStart }) {
  return (
    <div className="cr-price-card" data-reveal>
      <p className="cr-pc-label">Fare from</p>
      {cruise.price ? (
        <div className="cr-pc-price"><strong>{money(cruise.price)}</strong><span>per person</span></div>
      ) : (
        <div className="cr-pc-price"><strong className="is-text">Fare on request</strong></div>
      )}
      <PackageCartButton item={cruise} type="cruise" date={departure || undefined} />
      <ul className="cr-pc-facts">
        <li><IconMoon width="18" height="18" />{nightsLabel(cruise.durationNights)}{cruise.durationDays ? ` / ${cruise.durationDays} days` : ""}</li>
        {cruise.shipName && <li><IconShip width="18" height="18" />{cruise.shipName}</li>}
        {cruise.departureCity && <li><IconPin width="18" height="18" />Departs {cruise.departureCity}</li>}
        {departure && <li><IconCalendar width="18" height="18" />Selected: {formatDate(departure)}</li>}
      </ul>
      <button type="button" className="mk-btn mk-btn-block cr-start" onClick={onStart}>{cruise.stock?.soldOut ? "Enquire about other dates" : "Start enquiry"}</button>
      <p className="cr-pc-note">Fares are indicative per person. Availability and the final fare are confirmed when you enquire.</p>
      <p className="cr-pc-note"><CurrencyNote /></p>
    </div>
  );
}

/* Page ------------------------------------------------------------------ */

export default function CruiseDetail({ cruise, related }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [departure, setDeparture] = useState("");
  const [cabin, setCabin] = useState("");
  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const paragraphs = (cruise.description || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const images = cruise.images?.length ? cruise.images : cruise.coverImage ? [{ url: cruise.coverImage, alt: cruise.title }] : [{ url: FALLBACK_IMG, alt: cruise.title }];
  const cabins = (cruise.cabins || []).filter((c) => c.type);
  const departures = cruise.departures || [];

  useReveal(rootRef, cruise.slug);
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [cruise.slug]);

  const enquireCabin = (type) => {
    setCabin(type);
    setOpen(true);
  };

  return (
    <div className="hol-page cr-page cr-detail" ref={rootRef}>
      <div className="mk-container">
        <nav className="hol-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/cruises">Cruises</Link></li>
            {cruise.departureCity && <li><Link href={cityHref(cruise.departureCity)}>From {cruise.departureCity}</Link></li>}
            <li aria-current="page">{cruise.title}</li>
          </ol>
        </nav>

        <header className="hol-detail-head">
          {cruise.cruiseLine && <p className="cr-eyebrow is-dark">{cruise.cruiseLine}</p>}
          <h1>{cruise.title}</h1>
          <StockHead stock={cruise.stock} />
          <ul className="hol-meta">
            {cruise.shipName && <li><IconShip width="18" height="18" />{cruise.shipName}</li>}
            {cruise.departureCity && <li><IconPin width="18" height="18" />From {[cruise.departureCity, cruise.departureCountry].filter(Boolean).join(", ")}</li>}
            {cruise.durationNights > 0 && <li><IconMoon width="18" height="18" />{nightsLabel(cruise.durationNights)}</li>}
            {cruise.region && <li><IconWave width="18" height="18" />{cruise.region}</li>}
            {cruise.tags?.map((t) => <li key={t} className="hol-tag">{t}</li>)}
          </ul>
        </header>

        <div className="hol-detail-grid">
          <div className="cr-main">
            <Gallery images={images} />

            {(cruise.summary || paragraphs.length > 0) && (
              <section className="hol-block" aria-labelledby="cr-overview" data-reveal>
                <h2 id="cr-overview">Overview</h2>
                {cruise.summary && <p className="hol-lead">{cruise.summary}</p>}
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            {cruise.highlights?.length > 0 && (
              <section className="hol-block" aria-labelledby="cr-highlights" data-reveal>
                <h2 id="cr-highlights">Highlights</h2>
                <ul className="cr-highlights">
                  {cruise.highlights.map((h) => (
                    <li key={h}><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>{h}</li>
                  ))}
                </ul>
              </section>
            )}

            {departures.length > 0 && (
              <section className="hol-block" aria-labelledby="cr-departures" data-reveal>
                <h2 id="cr-departures">Departure dates</h2>
                <p className="cr-lede">Choose a date to include it in your enquiry. Dates shown are upcoming sailings; availability is confirmed when you enquire.</p>
                <Departures dates={departures} value={departure} onChange={setDeparture} />
              </section>
            )}

            {cruise.itinerary?.length > 0 && (
              <section className="hol-block" aria-labelledby="cr-itinerary" data-reveal>
                <h2 id="cr-itinerary">Day-by-day itinerary</h2>
                <ol className="cr-timeline">
                  {cruise.itinerary.map((stop, i) => {
                    const Icon = STOP_ICON[stop.type] || IconPin;
                    return (
                      <li key={`${stop.day}-${i}`} className={`cr-stop is-${stop.type || "port"}`}>
                        <span className="cr-stop-dot" aria-hidden="true"><Icon width="16" height="16" /></span>
                        <div className="cr-stop-body">
                          <p className="cr-stop-meta">
                            <b>Day {stop.day}</b>
                            <span className="cr-stop-type">{STOP_LABEL[stop.type] || "Port"}</span>
                          </p>
                          <h3>{stop.port}{stop.country ? <small>, {stop.country}</small> : null}</h3>
                          {stop.description && <p>{stop.description}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {cabins.length > 0 && (
              <section className="hol-block" aria-labelledby="cr-cabins" data-reveal>
                <h2 id="cr-cabins">Cabin categories</h2>
                <ul className="cr-cabins">
                  {cabins.map((c) => (
                    <li key={c.type} className="cr-cabin">
                      <div>
                        <h3>{c.type}</h3>
                        {c.description && <p>{c.description}</p>}
                      </div>
                      <div className="cr-cabin-side">
                        {c.fromPrice ? <p className="cr-cabin-price"><small>From</small><strong>{money(c.fromPrice)}</strong><small>per person</small></p> : <p className="cr-cabin-price"><small>Fare on request</small></p>}
                        <button type="button" className="hol-link cr-link-btn" onClick={() => enquireCabin(c.type)}>Enquire about this cabin</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(cruise.inclusions?.length > 0 || cruise.exclusions?.length > 0) && (
              <section className="hol-block cr-inex" aria-labelledby="cr-inex" data-reveal>
                <h2 id="cr-inex">What is included</h2>
                <div className="cr-inex-grid">
                  {cruise.inclusions?.length > 0 && (
                    <div>
                      <h3>Included</h3>
                      <ul className="cr-list">
                        {cruise.inclusions.map((x) => <li key={x}><span className="is-yes" aria-hidden="true"><IconCheck width="13" height="13" strokeWidth="3" /></span>{x}</li>)}
                      </ul>
                    </div>
                  )}
                  {cruise.exclusions?.length > 0 && (
                    <div>
                      <h3>Not included</h3>
                      <ul className="cr-list">
                        {cruise.exclusions.map((x) => <li key={x}><span className="is-no" aria-hidden="true"><IconX width="13" height="13" strokeWidth="3" /></span>{x}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {cruise.notes && (
              <aside className="cr-notes" aria-label="Important note" data-reveal>
                <IconInfo width="22" height="22" />
                <p>{cruise.notes}</p>
              </aside>
            )}
          </div>

          <aside className="hol-detail-aside" aria-label="Fare and enquiry">
            <PriceCard cruise={cruise} departure={departure} onStart={openSheet} />
          </aside>
        </div>
      </div>

      {related?.length > 0 && (
        <RailSection id="cr-related" title="Similar cruises" subtitle="Other sailings you may like." label="similar cruises">
          {related.map((item) => (
            <div className="hol-rail-item cr-rail-item" key={item.slug}><CruiseCard item={item} /></div>
          ))}
        </RailSection>
      )}

      <div className="cr-mobile-bar">
        <div>
          <span>Fare from</span>
          <strong>{cruise.price ? money(cruise.price) : "On request"}</strong>
        </div>
        <button type="button" className="mk-btn" onClick={openSheet}>Start enquiry</button>
      </div>

      <CruiseEnquiry cruise={cruise} open={open} onClose={closeSheet} departure={departure} cabin={cabin} />
    </div>
  );
}
