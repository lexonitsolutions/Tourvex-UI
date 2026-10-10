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

const WHY = [
  ["Clear starting prices", "Every package shows its per-person starting price, taken straight from our system. Payments are charged in AED."],
  ["Itineraries you can read", "Day-by-day plans, highlights, inclusions and exclusions are listed before you enquire."],
  ["Real people to talk to", "Send an enquiry and our team replies with answers about dates, hotels and changes."],
  ["Ask before you book", "Not sure a package fits? Tell us what you would like different and we will advise."],
];

const CityCard = memo(function CityCard({ city }) {
  return (
    <Link data-reveal="right" className="hol-city" href={destinationHref(city.name, city.country)}>
      <span className="hol-city-panel" aria-hidden="true" />
      <div className="hol-city-body">
        <div className="hol-city-img">
          <img src={city.image} alt="" width="200" height="168" loading="lazy" decoding="async" onError={showFallback} />
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
        <img src={country.image} alt="" width="260" height="360" loading="lazy" decoding="async" onError={showFallback} />
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

export default function HolidaysHome() {
  const { currency } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const rootRef = useRef(null);
  const recent = useRecentlyViewed(currency);

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

  return (
    <div ref={rootRef} className="hol-page">
      {data?.banners?.length > 0 ? (
        <HolidayHero banners={data.banners} />
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

      {recent?.length > 0 && (
        <RailSection id="hol-recent" title="Recently Viewed" subtitle="Pick up where you left off." label="recently viewed">
          {recent.map((item) => (
            <div className="hol-rail-item" key={item.slug}><HolidayCard item={item} /></div>
          ))}
        </RailSection>
      )}

      {data?.cities?.length > 0 && (
        <RailSection id="hol-cities" title="Best Cities to Visit" subtitle="Handpicked destinations with ready-made holiday packages." label="cities">
          {data.cities.map((city) => <CityCard key={`${city.name}-${city.country}`} city={city} />)}
        </RailSection>
      )}

      {data?.countries?.length > 0 && (
        <RailSection id="hol-countries" title="Best Countries to Visit" subtitle="Pick a country and see what is on offer." label="countries">
          {data.countries.map((country) => <CountryCard key={country.name} country={country} />)}
        </RailSection>
      )}

      {data?.collections?.map((collection) => {
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

      {data && !empty && (
        <section className="hol-why" aria-labelledby="hol-why-title">
          <div className="mk-container">
            <h2 id="hol-why-title" data-reveal>Why book holidays with Karnish</h2>
            <div className="hol-why-grid">
              {WHY.map(([title, text], i) => (
                <div key={title} data-reveal>
                  <span className="hol-why-num">0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <Link className="mk-btn mk-btn-light hol-why-cta" href="/contact">Talk to our team</Link>
          </div>
        </section>
      )}
    </div>
  );
}
