"use client";

import Link from "next/link";
import { memo, useEffect, useRef } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import EventHero from "./EventHero";
import {
  EventCard,
  IconCalendar,
  IconChevron,
  IconHeadset,
  IconInfo,
  IconTicket,
  RailSection,
  StateMessage,
  categoryHref,
  cityHref,
  money,
  plural,
  showFallback,
} from "./EventParts";

const COMMITMENTS = [
  [IconHeadset, "Plan with our team", "Tell us the date, group size and ticket type you prefer and our team helps you choose."],
  [IconTicket, "Enquiry, not a purchase", "Send a ticket request and we reply to you. Nothing is charged when you enquire."],
  [IconInfo, "Transparent \"from\" prices", "Every card shows an indicative per-ticket price. We confirm the final price and availability with you."],
  [IconCalendar, "Help before the day", "Questions about doors, age guidance or the venue? Reach our team before you decide and before the event."],
];

const CategoryCard = memo(function CategoryCard({ category }) {
  return (
    <Link data-reveal="right" className="hol-country" href={categoryHref(category.slug)}>
      <span className="hol-country-img">
        <img src={category.image} alt="" width="260" height="360" loading="lazy" decoding="async" onError={showFallback} />
      </span>
      <span className="hol-country-shade" aria-hidden="true" />
      <span className="hol-country-text">
        <strong>{category.name}</strong>
        <span>{plural(category.count, "event")}</span>
        {category.startingFrom && <span>From {money(category.startingFrom)}</span>}
      </span>
      <span className="hol-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
    </Link>
  );
});

const CityCard = memo(function CityCard({ city }) {
  return (
    <Link className="ev-city" href={cityHref(city.name)} data-reveal="right">
      <span className="ev-city-img">
        <img src={city.image} alt="" width="320" height="220" loading="lazy" decoding="async" onError={showFallback} />
      </span>
      <span className="ev-city-body">
        <strong>{city.name}</strong>
        <span>{[city.country, plural(city.count, "event")].filter(Boolean).join(" · ")}</span>
        {city.startingFrom && <span className="ev-city-price">From <b>{money(city.startingFrom)}</b></span>}
      </span>
      <span className="ev-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
    </Link>
  );
});

export default function EventsHome({ home }) {
  const rootRef = useRef(null);
  const banners = home?.banners || [];
  const categories = home?.categories || [];
  const cities = home?.cities || [];
  const sections = (home?.sections || []).filter((s) => s.items?.length);
  const empty = !banners.length && !categories.length && !cities.length && !sections.length;

  useReveal(rootRef, "ready");
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={rootRef} className="hol-page ev-page">
      {banners.length > 0 && <EventHero banners={banners} />}
      {!banners.length && !empty && (
        <header className="mk-container ev-plain-head">
          <h1>Events</h1>
        </header>
      )}

      {empty && (
        <div className="mk-container ev-section">
          <StateMessage
            title="Events are coming soon"
            text="We are preparing our event listings. In the meantime our team can help you find tickets directly."
            href="/contact"
            actionLabel="Contact us"
          />
        </div>
      )}

      {categories.length > 0 && (
        <RailSection id="ev-categories" title="Explore by Category" subtitle="Concerts, sport, comedy and more. Pick what you are in the mood for." label="categories">
          {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
        </RailSection>
      )}

      {cities.length > 0 && (
        <RailSection id="ev-cities" title="Explore Events by City" subtitle="See what is coming up where you are, or where you are headed." label="cities">
          {cities.map((city) => (
            <div className="hol-rail-item ev-city-item" key={city.name}><CityCard city={city} /></div>
          ))}
        </RailSection>
      )}

      {sections.map((section) => (
        <RailSection
          key={section.slug}
          id={`ev-sec-${section.slug}`}
          title={section.title}
          subtitle={section.subtitle}
          label={section.title}
          href={section.city ? cityHref(section.city) : undefined}
          hrefLabel={section.city ? `View all in ${section.city}` : "View all"}
        >
          {section.items.map((item) => (
            <div className="hol-rail-item ev-rail-item" key={item.slug}><EventCard item={item} /></div>
          ))}
        </RailSection>
      ))}

      {!empty && (
        <>
          <section className="ev-promise" aria-labelledby="ev-promise-title">
            <div className="mk-container">
              <h2 id="ev-promise-title" data-reveal>Why book with us</h2>
              <ul className="ev-promise-grid">
                {COMMITMENTS.map(([Icon, title, text]) => (
                  <li key={title} data-reveal>
                    <span className="ev-promise-ico" aria-hidden="true"><Icon width="26" height="26" /></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mk-container ev-cta-wrap" aria-labelledby="ev-cta-title">
            <div className="ev-cta" data-reveal>
              <span className="ev-cta-ico" aria-hidden="true"><IconTicket width="26" height="26" /></span>
              <div>
                <h2 id="ev-cta-title">Looking for something specific?</h2>
                <p>Tell us the event, date and how many tickets you need and our team will help you from there.</p>
              </div>
              <Link className="mk-btn ev-cta-btn" href="/contact">Talk to our team</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
