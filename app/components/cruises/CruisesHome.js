"use client";

import Link from "next/link";
import { memo, useEffect, useRef } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CruiseHero from "./CruiseHero";
import YachtHighlightSection from "./YachtHighlightSection";
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

const sectionMap = (sections) => Object.fromEntries((sections || []).map((s) => [s.type, s]));
const isOn = (section) => section && section.enabled !== false && section.data?.show !== false;
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1").replace(/\/api\/v\d+$/, "");
const mediaUrl = (val) => {
  const raw = typeof val === "string" ? val : val?.url || "";
  if (!raw) return "";
  const u = String(raw).trim();
  if (u.startsWith("/api/")) return `${API_ORIGIN}${u}`;
  return u;
};
const bannersFromCms = (items) => (items || []).filter((b) => b.visible !== false).map((b) => ({ ...b,
  image: mediaUrl(b.image), video: mediaUrl(b.video), ctaLabel: b.cta?.label, ctaHref: b.cta?.href,
})).filter((b) => b.image || b.video);
const configuredCards = (live, section) => {
  const edits = section?.data?.items || [];
  if (!edits.length) return live || [];
  return edits.filter((e) => e.visible !== false).map((e) => {
    const item = (live || []).find((candidate) => candidate.name?.toLowerCase() === e.name?.toLowerCase());
    if (item) return { ...item, name: e.label || item.name, image: mediaUrl(e.image) || item.image, video: mediaUrl(e.video) || item.video || "" };

    // A CMS card is an intentional editorial choice. Do not silently discard it merely because its
    // name does not exactly match a current catalogue facet (for example, "America" vs "United States").
    const name = String(e.label || e.name || "").trim();
    const image = mediaUrl(e.image) || "/images/cruise-01.jpg";
    if (!name) return null;
    return {
      name,
      image,
      video: mediaUrl(e.video),
      country: "",
      cities: [String(e.name || name)],
      count: 0,
      startingFrom: null,
    };
  }).filter(Boolean);
};

const CityCard = memo(function CityCard({ city }) {
  return (
    <Link className="cr-city" href={cityHref(city.name)} data-reveal="right">
      <span className="cr-city-img">
        {city.video ? (
          <video
            src={city.video}
            poster={city.image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={city.image} alt="" width="320" height="220" loading="lazy" decoding="async" onError={showFallback} />
        )}
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
        {country.video ? (
          <video
            src={country.video}
            poster={country.image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={country.image} alt="" width="260" height="360" loading="lazy" decoding="async" onError={showFallback} />
        )}
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
  const cms = sectionMap(home?.cmsSections);
  const heroSection = cms.voyagerHero;
  const editedBanners = bannersFromCms(heroSection?.data?.banners);
  const banners = editedBanners.length ? editedBanners : (home?.banners || []);
  const cities = configuredCards(home?.cities, cms.voyagerCities);
  const countries = configuredCards(home?.countries, cms.voyagerCountries);
  const sections = (home?.sections || []).filter((s) => s.items?.length);
  const liveCruises = sections.flatMap((s) => s.items || []);
  const departurePicks = cms.voyagerCities?.data?.cruises || [];
  const departureCruises = departurePicks.map((pick) =>
    liveCruises.find((item) => item.slug === pick.slug) || ({ ...pick, coverImage: mediaUrl(pick.image), priceFallback: pick.price })
  );
  const featured = cms.voyagerCruises;
  const picked = featured?.data?.cruises || [];
  const featuredItems = picked.map((p) => liveCruises.find((item) => item.slug === p.slug) || ({ ...p, coverImage: mediaUrl(p.image), priceFallback: p.price }));
  const empty = !banners.length && !cities.length && !sections.length;

  useReveal(rootRef, "ready");
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={rootRef} className="hol-page cr-page">
      {heroSection?.enabled !== false && banners.length > 0 && <CruiseHero banners={banners} />}
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

      {isOn(cms.voyagerCities) && (departureCruises.length > 0 || cities.length > 0) && (
        <RailSection id="cr-cities" title={cms.voyagerCities.data.heading} subtitle={cms.voyagerCities.data.description} label="departure cities">
          {departureCruises.length > 0
            ? departureCruises.map((item) => <div className="hol-rail-item cr-rail-item" key={item.slug}><CruiseCard item={item} /></div>)
            : cities.map((city) => <div className="hol-rail-item cr-city-item" key={city.name}><CityCard city={city} /></div>)}
        </RailSection>
      )}

      {isOn(cms.voyagerCountries) && countries.length > 0 && (
        <RailSection id="cr-countries" title={cms.voyagerCountries.data.heading} subtitle={cms.voyagerCountries.data.description} label="countries">
          {countries.map((country) => <CountryCard key={country.name} country={country} />)}
        </RailSection>
      )}

      {/* Featured Luxury Yachts & Private Charters Section */}
      {isOn(cms.voyagerYachts) && <YachtHighlightSection section={cms.voyagerYachts} />}

      {featured?.enabled !== false && featuredItems.length > 0 && (
        <RailSection id="cr-featured" title={featured.data.heading} subtitle={featured.data.description} label="featured voyages" href={featured.data.showViewAll ? "/cruises" : undefined} hrefLabel="View all">
          {featuredItems.map((item) => <div className="hol-rail-item cr-rail-item" key={item.slug}><CruiseCard item={item} /></div>)}
        </RailSection>
      )}

      {!picked.length && sections.map((section) => (
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

      {!empty && (cms.voyagerPromise?.enabled !== false || cms.voyagerCta?.enabled !== false) && (
        <>
          {cms.voyagerPromise?.enabled !== false && <section className="cr-promise" aria-labelledby="cr-promise-title">
            <div className="mk-container">
              <h2 id="cr-promise-title" data-reveal>{cms.voyagerPromise.data.heading}</h2>
              <ul className="cr-promise-grid">
                {(cms.voyagerPromise.data.items || []).filter((item) => item.visible !== false).map((item, i) => {
                  const Icon = [IconShip, IconCalendar, IconInfo, IconAnchor][i % 4];
                  return <li key={item.id || item.title} data-reveal>
                    <span className="cr-promise-ico" aria-hidden="true"><Icon width="26" height="26" /></span>
                    <h3>{item.title}</h3><p>{item.description}</p>
                  </li>;
                })}
              </ul>
            </div>
          </section>}

          {cms.voyagerCta?.enabled !== false && <section className="mk-container cr-cta-wrap" aria-labelledby="cr-cta-title">
            <div className="cr-cta" data-reveal style={cms.voyagerCta.data.image?.url ? { backgroundImage: `url(${cms.voyagerCta.data.image.url})` } : undefined}>
              <span className="cr-cta-ico" aria-hidden="true"><IconPlane width="26" height="26" /></span>
              <div>
                <h2 id="cr-cta-title">{cms.voyagerCta.data.heading}</h2>
                <p>{cms.voyagerCta.data.description}</p>
              </div>
              {cms.voyagerCta.data.cta?.label && <Link className="mk-btn cr-cta-btn" href={cms.voyagerCta.data.cta.href || "/contact"}>{cms.voyagerCta.data.cta.label}</Link>}
            </div>
          </section>}
        </>
      )}
    </div>
  );
}
