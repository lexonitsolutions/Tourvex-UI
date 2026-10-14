"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
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

const CATEGORY_COPY = {
  Concerts: "Live shows, DJs and more",
  Sports: "Races, matches and tournaments",
  Festivals: "Culture, food and seasonal fun",
  Comedy: "Stand-up and live entertainment",
  Family: "Fun for every age",
  Theatre: "Plays, musicals and performances",
  Exhibitions: "Trade shows and expos",
};

const CategoryCard = memo(function CategoryCard({ category, active, muted, onActivate, onDeactivate }) {
  return (
    <Link
      data-reveal="right"
      className={`ev-category${active ? " is-active" : ""}${muted ? " is-muted" : ""}`}
      href={categoryHref(category.slug)}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
    >
      <span className="ev-category-img">
        <img src={category.image} alt="" width="260" height="360" loading="lazy" decoding="async" onError={showFallback} />
        {active && category.video && <video className="ev-category-video" src={category.video} poster={category.image} muted loop autoPlay playsInline preload="metadata" />}
      </span>
      <span className="ev-category-shade" aria-hidden="true" />
      <span className="ev-category-text">
        <strong>{category.name}</strong>
        <span>{category.description || CATEGORY_COPY[category.name] || plural(category.count, "event")}</span>
      </span>
      <span className="ev-category-go" aria-hidden="true"><IconChevron width="15" height="15" /></span>
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

export default function EventsHome({ home, contentSections = [] }) {
  const rootRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const cms = Object.fromEntries((contentSections || []).filter((section) => section.enabled !== false).map((section) => [section.type, section.data || {}]));
  const configuredBanners = (cms.eventsHero?.banners || []).filter((banner) => banner.visible !== false && banner.image?.url).map((banner) => ({
    id: banner.id, eyebrow: banner.eyebrow, title: banner.title, subtitle: banner.subtitle,
    description: banner.description, image: banner.image.url, video: banner.video?.url || "", ctaLabel: banner.cta?.label, ctaHref: banner.cta?.href,
  }));
  const banners = configuredBanners.length ? configuredBanners : (home?.banners || []);
  const liveCategories = home?.categories || [];
  const configuredCategories = (cms.eventsCategories?.categories || []).filter((item) => item.visible !== false);
  const categories = configuredCategories.length ? configuredCategories.map((item) => {
    const live = liveCategories.find((category) => category.name.toLowerCase() === String(item.category).toLowerCase());
    if (!live) return null;
    return { ...live, name: item.label || live.name, description: item.description, image: item.image?.url || live.image, video: item.video?.url || "" };
  }).filter(Boolean) : liveCategories;
  const cities = home?.cities || [];
  const liveSections = (home?.sections || []).filter((s) => s.items?.length);
  const soonConfig = cms.eventsHappeningSoon || {};
  const seenTrendingCities = new Set();
  const trendingConfig = (cms.eventsTrendingCities?.cities || []).filter((item) => {
    if (item.visible === false) return false;
    const city = String(item.city || "").trim().toLowerCase();
    if (!city || seenTrendingCities.has(city)) return false;
    seenTrendingCities.add(city);
    return true;
  });
  const soon = liveSections.find((section) => section.slug === "happening-soon");
  const liveTrending = liveSections.filter((section) => section.city);
  const trending = trendingConfig.length ? trendingConfig.map((item) => {
    const live = liveTrending.find((section) => section.city.toLowerCase() === String(item.city).toLowerCase());
    if (!live) return null;
    return { ...live, title: item.heading || live.title, subtitle: item.description || live.subtitle, items: live.items.slice(0, item.limit || 12), showViewAll: item.showViewAll !== false };
  }).filter(Boolean) : liveTrending;
  const sectionCandidates = [soon ? { ...soon, title: soonConfig.heading || "Upcoming Events", subtitle: soonConfig.description || soon.subtitle, items: soon.items.slice(0, soonConfig.limit || 12), showViewAll: soonConfig.showViewAll !== false } : null, ...trending].filter(Boolean);
  const sections = Array.from(new Map(sectionCandidates.map((section) => [section.slug, section])).values());
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
        <RailSection id="ev-categories" className={activeCategory ? "has-category-active" : ""} title={cms.eventsCategories?.heading || "Events by Category"} subtitle={cms.eventsCategories?.description || "Explore events that match your interests."} label="categories">
          {categories.map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              active={activeCategory === category.slug}
              muted={Boolean(activeCategory && activeCategory !== category.slug)}
              onActivate={() => setActiveCategory(category.slug)}
              onDeactivate={() => setActiveCategory(null)}
            />
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
          href={section.showViewAll === false ? undefined : (section.city ? cityHref(section.city) : "/events")}
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
            <div className="ev-cta ev-newsletter" data-reveal>
              <span className="ev-cta-ico" aria-hidden="true">✈</span>
              <div>
                <h2 id="ev-cta-title">Stay updated with <em>upcoming events</em></h2>
                <p>Get the latest event updates, early access and exclusive offers.</p>
              </div>
              <form className="ev-subscribe" action="/contact">
                <label className="sr-only" htmlFor="event-email">Email address</label>
                <input suppressHydrationWarning id="event-email" name="email" type="email" placeholder="Enter your email address" required />
                <button suppressHydrationWarning type="submit">Subscribe</button>
              </form>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
