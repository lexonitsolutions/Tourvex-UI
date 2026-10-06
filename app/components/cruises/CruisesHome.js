"use client";

import Link from "next/link";
import { memo, useEffect, useRef } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CruiseHero from "./CruiseHero";
import {
  CruiseCard,
  IconAnchor,
  IconCalendar,
  IconChevron,
  IconInfo,
  IconPlane,
  IconShip,
  RailSection,
  StateMessage,
  cityHref,
  money,
  plural,
  showFallback,
} from "./CruiseParts";

const COMMITMENTS = [
  [IconShip, "Plan with a specialist", "Tell us what you enjoy and our team helps you compare sailings, cabins and routes."],
  [IconCalendar, "Flexible enquiry", "Send an enquiry for the dates and cabin you prefer. Nothing is charged when you enquire."],
  [IconInfo, "Transparent \"from\" fares", "Every card shows an indicative per-person fare. We confirm the final fare and availability with you."],
  [IconAnchor, "Support before you sail", "Questions about ports, documents or timings? Reach our team before you decide and before you travel."],
];

const CityCard = memo(function CityCard({ city }) {
  return (
    <Link className="cr-city" href={cityHref(city.name)} data-reveal="right">
      <span className="cr-city-img">
        <img src={city.image} alt="" width="320" height="220" loading="lazy" decoding="async" onError={showFallback} />
      </span>
      <span className="cr-city-body">
        <strong>{city.name}</strong>
        <span>{[city.country, plural(city.count, "cruise")].filter(Boolean).join(" · ")}</span>
        {city.startingFrom && <span className="cr-city-price">From <b>{money(city.startingFrom)}</b></span>}
      </span>
      <span className="cr-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
    </Link>
  );
});

const CountryCard = memo(function CountryCard({ country }) {
  const href = cityHref(country.cities?.[0] || country.name);
  return (
    <Link data-reveal="right" className="hol-country" href={href}>
      <span className="hol-country-img">
        <img src={country.image} alt="" width="260" height="360" loading="lazy" decoding="async" onError={showFallback} />
      </span>
      <span className="hol-country-shade" aria-hidden="true" />
      <span className="hol-country-text">
        <strong>{country.name}</strong>
        <span>{plural(country.count, "cruise")}</span>
      </span>
      <span className="hol-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
    </Link>
  );
});

export default function CruisesHome({ home }) {
  const rootRef = useRef(null);
  const banners = home?.banners || [];
  const cities = home?.cities || [];
  const countries = home?.countries || [];
  const sections = (home?.sections || []).filter((s) => s.items?.length);
  const empty = !banners.length && !cities.length && !sections.length;

  useReveal(rootRef, "ready");
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={rootRef} className="hol-page cr-page">
      {banners.length > 0 && <CruiseHero banners={banners} />}
      {!banners.length && !empty && (
        <header className="mk-container cr-plain-head">
          <h1>Cruises</h1>
        </header>
      )}

      {empty && (
        <div className="mk-container cr-section">
          <StateMessage
            title="Cruises are coming soon"
            text="We are preparing our cruise listings. In the meantime our team can help you plan a sailing directly."
            href="/contact"
            actionLabel="Contact us"
          />
        </div>
      )}

      {cities.length > 0 && (
        <RailSection id="cr-cities" title="Explore Cruises by Departure City" subtitle="Choose where you would like to set sail from." label="departure cities">
          {cities.map((city) => (
            <div className="hol-rail-item cr-city-item" key={city.name}><CityCard city={city} /></div>
          ))}
        </RailSection>
      )}

      {countries.length > 0 && (
        <RailSection id="cr-countries" title="Best Countries to Visit" subtitle="Pick a country and see the sailings departing from it." label="countries">
          {countries.map((country) => <CountryCard key={country.name} country={country} />)}
        </RailSection>
      )}

      {sections.map((section) => (
        <RailSection
          key={section.slug}
          id={`cr-sec-${section.slug}`}
          title={section.title}
          subtitle={section.subtitle}
          label={section.title}
          href={section.city ? cityHref(section.city) : undefined}
          hrefLabel={section.city ? `View all from ${section.city}` : "View all"}
        >
          {section.items.map((item) => (
            <div className="hol-rail-item cr-rail-item" key={item.slug}><CruiseCard item={item} /></div>
          ))}
        </RailSection>
      ))}

      {!empty && (
        <>
          <section className="cr-promise" aria-labelledby="cr-promise-title">
            <div className="mk-container">
              <h2 id="cr-promise-title" data-reveal>Your journey, our commitment</h2>
              <ul className="cr-promise-grid">
                {COMMITMENTS.map(([Icon, title, text]) => (
                  <li key={title} data-reveal>
                    <span className="cr-promise-ico" aria-hidden="true"><Icon width="26" height="26" /></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mk-container cr-cta-wrap" aria-labelledby="cr-cta-title">
            <div className="cr-cta" data-reveal>
              <span className="cr-cta-ico" aria-hidden="true"><IconPlane width="26" height="26" /></span>
              <div>
                <h2 id="cr-cta-title">Not sure which cruise suits you?</h2>
                <p>Tell us your preferred dates, budget and travelling party and our team will suggest sailings to look at.</p>
              </div>
              <Link className="mk-btn cr-cta-btn" href="/contact">Talk to our team</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
