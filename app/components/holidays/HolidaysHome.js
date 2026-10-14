"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { getHoliday, getHolidayHome, getRecentHolidaySlugs } from "../../lib/holidays";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import { useApp } from "../AppProvider";
import HolidayHero, { HeroSkeleton } from "./HolidayHero";
import {
  CardSkeletons,
  HolidayCard,
  IconChevron,
  RailSection,
  StateMessage,
  destinationHref,
  money,
  plural,
  showFallback,
} from "./HolidayParts";

const CityCard = memo(function CityCard({ city }) {
  return (
    <Link data-reveal="right" className="hol-city" href={destinationHref(city.name, city.country)}>
      <span className="hol-city-panel" aria-hidden="true" />
      <div className="hol-city-body">
        <div className="hol-city-img">
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
            <img src={city.image} alt="" width="200" height="168" loading="lazy" decoding="async" onError={showFallback} />
          )}
        </div>
        <h3>Holidays Packages in {city.name}</h3>
        <p>{[city.country, plural(city.count, "package")].filter(Boolean).join(" · ")}</p>
        {city.startingFrom && <p className="hol-city-price">From <strong>{money(city.startingFrom)}</strong></p>}
        <span className="hol-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
      </div>
    </Link>
  );
});

const CountryCard = memo(function CountryCard({ country }) {
  const first = country.cities?.[0];
  const href = first
    ? destinationHref(first, country.name)
    : destinationHref(country.name, country.name);
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
        <span>{plural(country.count, "holiday package")}</span>
      </span>
      <span className="hol-city-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
    </Link>
  );
});

/** Slugs the visitor opened, resolved through the detail endpoint; 404s (removed packages) are skipped. */
function useRecentlyViewed(currency) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    const slugs = getRecentHolidaySlugs();
    if (!slugs.length) return undefined;
    const controller = new AbortController();
    Promise.allSettled(slugs.map((slug) => getHoliday(slug, { signal: controller.signal, currency }))).then((results) => {
      if (controller.signal.aborted) return;
      setItems(results.filter((r) => r.status === "fulfilled").map((r) => (r.value.package.stock || !r.value.stock ? r.value.package : { ...r.value.package, stock: r.value.stock })));
    });
    return () => controller.abort();
  }, [currency]);
  return items;
}

const sectionMap = (sections) => Object.fromEntries((sections || []).map((s) => [s.type, s]));
const isOn = (section) => section && section.enabled !== false && section.data?.show !== false;
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api/v1").replace(/\/api\/v\d+$/, "");
const cmsMedia = (val) => {
  const raw = typeof val === "string" ? val : val?.url || "";
  if (!raw) return "";
  const u = String(raw).trim();
  if (u.startsWith("/api/")) return `${API_ORIGIN}${u}`;
  return u;
};
const cmsBanners = (items) => (items || []).filter((b) => b.visible !== false).map((b) => ({
  ...b, image: cmsMedia(b.image), video: cmsMedia(b.video), ctaLabel: b.cta?.label, ctaHref: b.cta?.href,
})).filter((b) => b.image || b.video);
const configuredCards = (live, config) => {
  const edits = config?.data?.items || [];
  if (!edits.length) return live || [];
  return edits.filter((edit) => edit.visible !== false).map((edit) => {
    const item = (live || []).find((candidate) => candidate.name?.toLowerCase() === edit.name?.toLowerCase());
    return item ? { ...item, name: edit.label || item.name, image: cmsMedia(edit.image) || item.image, video: cmsMedia(edit.video) || item.video || "" } : null;
  }).filter(Boolean);
};

export default function HolidaysHome({ content }) {
  const { currency } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const rootRef = useRef(null);
  const recent = useRecentlyViewed(currency);
  const cms = sectionMap(content?.sections);
  const heroSection = cms.holidaysHero;
  const recentSection = cms.holidaysRecent;
  const citiesSection = cms.holidaysCities;
  const countriesSection = cms.holidaysCountries;
  const packagesSection = cms.holidaysPackages;
  const whySection = cms.holidaysWhy;

  useEffect(() => {
    const controller = new AbortController();
    getHolidayHome({ signal: controller.signal, currency })
      .then((home) => {
        setError(false);
        setData(home);
      })
      .catch((err) => err.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [attempt, currency]);

  const revealKey = `${data ? "ready" : "wait"}-${recent?.length || 0}`;
  useReveal(rootRef, revealKey);
  useEffect(() => {
    if (!data) return undefined;
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, [revealKey, data]);

  const retry = () => {
    setError(false);
    setData(null);
    setAttempt((n) => n + 1);
  };

  const empty =
    data &&
    !data.banners?.length &&
    !data.cities?.length &&
    !data.countries?.length &&
    !data.collections?.length;
  const editedBanners = cmsBanners(heroSection?.data?.banners);
  const banners = editedBanners.length ? editedBanners : (data?.banners || []).map((b) => ({
    ...b,
    image: cmsMedia(b.image),
    video: cmsMedia(b.video),
  }));
  const chosenPackages = packagesSection?.data?.packages || [];
  const livePackages = data ? [...(data.featured || []), ...(data.recent || []), ...(data.collections || []).flatMap((c) => c.items || [])] : [];
  const packageCards = chosenPackages.map((picked) => livePackages.find((item) => item.slug === picked.slug) || ({
    ...picked, coverImage: cmsMedia(picked.image), priceFallback: picked.price,
  }));
  const cityCards = configuredCards(data?.cities, citiesSection);
  const countryCards = configuredCards(data?.countries, countriesSection);

  return (
    <div ref={rootRef} className="hol-page">
      {heroSection?.enabled !== false && banners.length > 0 ? (
        <HolidayHero banners={banners} />
      ) : !data && !error ? (
        <HeroSkeleton />
      ) : null}

      {error && (
        <div className="mk-container hol-section">
          <StateMessage
            title="We could not load holidays"
            text="Something went wrong while fetching our holiday packages. Please check your connection and try again."
            action="Try again"
            onAction={retry}
          />
        </div>
      )}

      {empty && (
        <div className="mk-container hol-section">
          <StateMessage
            title="Holiday packages are coming soon"
            text="We are putting the finishing touches on our holiday collection. Meanwhile, explore experiences across the UAE."
            href="/activities"
            actionLabel="Browse activities"
          />
        </div>
      )}

      {!data && !error && (
        <>
          <section className="mk-container hol-section" aria-hidden="true">
            <div className="hol-head"><div className="hol-skel hol-skel-title" /></div>
            <div className="hol-rail">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="hol-city hol-skel" />)}
            </div>
          </section>
          <section className="mk-container hol-section" aria-hidden="true">
            <div className="hol-head"><div className="hol-skel hol-skel-title" /></div>
            <div className="hol-rail"><CardSkeletons count={4} rail /></div>
          </section>
        </>
      )}

      {isOn(recentSection) && recent?.length > 0 && (
        <RailSection id="hol-recent" title={recentSection.data.heading} subtitle={recentSection.data.description} label="recently viewed">
          {recent.map((item) => (
            <div className="hol-rail-item" key={item.slug}><HolidayCard item={item} /></div>
          ))}
        </RailSection>
      )}

      {isOn(citiesSection) && cityCards.length > 0 && (
        <RailSection id="hol-cities" title={citiesSection.data.heading} subtitle={citiesSection.data.description} label="cities">
          {cityCards.map((city) => <CityCard key={`${city.name}-${city.country}`} city={city} />)}
        </RailSection>
      )}

      {isOn(countriesSection) && countryCards.length > 0 && (
        <RailSection id="hol-countries" title={countriesSection.data.heading} subtitle={countriesSection.data.description} label="countries">
          {countryCards.map((country) => <CountryCard key={country.name} country={country} />)}
        </RailSection>
      )}

      {packagesSection?.enabled !== false && packageCards.length > 0 && (
        <RailSection id="hol-featured" title={packagesSection.data.heading} subtitle={packagesSection.data.description} label="featured holidays" href={packagesSection.data.showViewAll ? "/holidays" : undefined} hrefLabel="View all">
          {packageCards.map((item) => <div className="hol-rail-item" key={item.slug}><HolidayCard item={item} /></div>)}
        </RailSection>
      )}

      {packagesSection?.enabled !== false && !chosenPackages.length && data?.collections?.map((collection) => {
        const destCity = collection.slug.includes("dubai")
          ? "Dubai"
          : collection.items?.[0]?.destinations?.[0] || "";
        const href = destCity ? `/holidays/destination/${encodeURIComponent(destCity)}` : undefined;

        return (
          <RailSection
            key={collection.slug}
            id={`hol-col-${collection.slug}`}
            title={collection.title}
            subtitle={collection.subtitle}
            label={collection.title}
            href={href}
            hrefLabel="View all"
          >
            {collection.items.map((item) => (
              <div className="hol-rail-item" key={item.slug}><HolidayCard item={item} /></div>
            ))}
          </RailSection>
        );
      })}

      {whySection?.enabled !== false && data && !empty && (
        <section className="hol-why" aria-labelledby="hol-why-title">
          <div className="mk-container">
            <h2 id="hol-why-title" data-reveal>{whySection.data.heading}</h2>
            <div className="hol-why-grid">
              {(whySection.data.items || []).filter((item) => item.visible !== false).map((item, i) => (
                <div key={item.id || item.title} data-reveal>
                  <span className="hol-why-num">0{i + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
            {whySection.data.cta?.label && <Link className="mk-btn mk-btn-light hol-why-cta" href={whySection.data.cta.href || "/contact"}>{whySection.data.cta.label}</Link>}
          </div>
        </section>
      )}
    </div>
  );
}
