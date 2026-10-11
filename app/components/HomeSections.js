"use client";

import { CmsLink } from "./CmsLink";
import { fmt } from "../lib/format";
import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import { getActivities } from "../lib/api";
import { useInView } from "../lib/useInView";
import { getHolidayHome } from "../lib/holidays";
import { getCruiseHome } from "../lib/cruises";
import { getEventHome } from "../lib/events";
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect, useReveal } from "../lib/motion";
import { useApp } from "./AppProvider";
import { useMotion } from "./MotionShell";
import dynamic from "next/dynamic";
import { preload } from "react-dom";
import ShowcaseCard, { ShowcaseSkeleton } from "./ShowcaseCard";
import MobileHero from "./MobileHero";
import { useIsMobile } from "../lib/useIsMobile";
import { HolidayCard, CardSkeletons as HolidaySkeletons } from "./holidays/HolidayParts";

// Everything below the fold is its own chunk: it is still server-rendered, but its JavaScript loads separately
// from the hero, so the first screen becomes interactive sooner.
const BestSellerCards = dynamic(() => import("./BestSellerCards"));
const ExperienceCards = dynamic(() => import("./ExperienceCards"));
const PartnersStrip = dynamic(() => import("./PartnersStrip"));
const CruiseCard = dynamic(() => import("./cruises/CruiseParts").then((m) => m.CruiseCard));
const EventCard = dynamic(() => import("./events/EventParts").then((m) => m.EventCard));

const SLIDE_MS = 6500;

const FALLBACK_IMG = "/images/destination-a.jpg";

function showFallback(e) {
  if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG;
}

function priceOf(item) {
  const p = item.salePrice || item.price;
  return p ? { amount: p.amount, currency: p.currency, was: item.salePrice ? item.price : null } : null;
}

/** Splits text into per-letter spans so GSAP can stagger them. */
function Letters({ text }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, w) => (
        // Words are separated by a trailing margin (see .mk-word in CSS), not a space character: the space was
        // collapsed in this heading, and a trailing gap never indents a wrapped line.
        <span className="mk-word" key={w} aria-hidden="true">
          {word.split("").map((ch, i) => (
            <span className="mk-char-mask" key={i}>
              <span className="mk-char">{ch}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActivityCard({ item }) {
  const price = priceOf(item);
  return (
    <ShowcaseCard
      reveal
      href={`/activities/${item.slug}`}
      title={item.title}
      image={item.imageUrl}
      fallbackImage={FALLBACK_IMG}
      tag={item.categories?.[0]}
      stock={item.stock}
      location={(item.destinations || []).join(", ") || undefined}
      price={price}
      priceFallback="Price on request"
    />
  );
}

function toHolidayCardItem(pkg, liveItems) {
  const live = (liveItems || []).find((it) => (it.slug && it.slug === pkg.slug) || (it.id && it.id === pkg.packageId));
  if (live) return live;

  const nights = pkg.durationNights || parseInt(pkg.duration) || 2;
  const days = pkg.durationDays || nights + 1;
  const numPrice = pkg.price ? parseFloat(String(pkg.price).replace(/[^0-9.]/g, "")) : null;

  return {
    id: pkg.packageId || pkg.id || pkg.slug,
    slug: pkg.slug,
    title: pkg.title,
    coverImage: (typeof pkg.image === "object" ? pkg.image?.url : pkg.image) || pkg.coverImage || FALLBACK_IMG,
    country: pkg.country,
    destinations: pkg.destinations || (pkg.country ? [pkg.country] : []),
    durationNights: nights,
    durationDays: days,
    price: numPrice ? { amount: numPrice, currency: "AED" } : null,
    salePrice: null,
  };
}

function Skeletons({ count }) {
  return <ShowcaseSkeleton count={count} />;
}

/**
 * Hero lives in its own memoized component so the slide timer only re-renders the hero,
 * never the card grids below it. Its ambient loops pause whenever it is off screen.
 */
const Hero = memo(function Hero({ content }) {
  const SLIDES = content.slides;
  // The first slide is the largest paint on the page: fetch it at high priority, before the hero JS runs.
  if (SLIDES[0]?.image?.url) preload(SLIDES[0].image.url, { as: "image", fetchPriority: "high" });
  const { loaded } = useMotion();
  const [slide, setSlide] = useState(0);
  const heroRef = useRef(null);

  // Auto-advance; restarts on every slide change so a manual click resets the timer.
  useEffect(() => {
    if (!loaded) return undefined;
    const id = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [slide, loaded]);

  // Hide the hero pieces before paint so they can animate in once the preloader lifts.
  useIsoLayoutEffect(() => {
    if (loaded) return;
    const el = heroRef.current;
    if (el) gsap.set(el.querySelectorAll(".mk-hero-copy, .mk-plane, .mk-compass"), { autoAlpha: 0 });
  }, [loaded]);

  // Hero intro, ambient motion and scroll parallax.
  useEffect(() => {
    if (!loaded) return undefined;
    const reduced = prefersReducedMotion();
    const hero = heroRef.current;
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.fromTo(".mk-hero", { clipPath: "inset(6% 4% 6% 4% round 40px)", scale: 0.97 }, { clipPath: "inset(0% 0% 0% 0% round 22px)", scale: 1, duration: 1.4, ease: "power4.out", clearProps: "clipPath,transform" });
      gsap.fromTo(".mk-compass", { rotate: -40, autoAlpha: 0 }, { rotate: 0, autoAlpha: 0.22, duration: 2, delay: 0.4, ease: "power3.out" });
      const spin = gsap.to(".mk-compass", { rotate: 360, duration: 90, repeat: -1, ease: "none", delay: 2.4 });
      gsap.set(".mk-plane", { autoAlpha: 1, x: "-20vw", y: 40 });
      const fly = gsap.to(".mk-plane", { x: "110vw", y: -60, duration: 22, repeat: -1, ease: "none", delay: 1.5 });
      // Ambient loops cost frames even when scrolled away; run them only while the hero is visible.
      ScrollTrigger.create({
        trigger: hero,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          [spin, fly].forEach((t) => (self.isActive ? t.resume() : t.pause()));
          hero.classList.toggle("is-offscreen", !self.isActive);
        },
      });
      gsap.to(".mk-hero-bg-wrap", {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: ".mk-hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".mk-hero-copy", {
        yPercent: -20,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: ".mk-hero", start: "top top", end: "bottom 30%", scrub: true },
      });
    }, heroRef);
    return () => ctx.revert();
  }, [loaded]);

  // Hero copy: letter-by-letter reveal on every slide change.
  useEffect(() => {
    if (!loaded) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: slide === 0 ? 0.55 : 0.1 });
      tl.set(".mk-hero-copy", { autoAlpha: 1 })
        .fromTo(".mk-hero-copy .mk-char", { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.035, ease: "power4.out" })
        .fromTo(".mk-hero-tag, .mk-hero-sub, .mk-eyebrow", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }, "-=0.6")
        .fromTo(".mk-hero-copy .mk-btn", { y: 20, autoAlpha: 0, scale: 0.9 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, "-=0.5");
    }, heroRef);
    return () => ctx.revert();
  }, [slide, loaded]);

  return (
    <section className="mk-container mk-hero-wrap" ref={heroRef}>
      <div className="mk-hero">
        <div className="mk-hero-bg-wrap">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`mk-slide${i === slide ? " is-active" : ""}`}
              style={{ backgroundImage: `url(${s.image.url})` }}
              aria-hidden={i !== slide}
            />
          ))}
        </div>
        <div className="mk-hero-shade" />
        {/* Wrappers move; the filtered images inside stay static so the filter is rasterized once. */}
        <span className="mk-compass" aria-hidden="true"><img src="/images/bg-compass.png" alt="" /></span>
        <span className="mk-plane" aria-hidden="true"><img src="/images/flight-up.png" alt="" /></span>
        <div className="mk-hero-copy" key={slide}>
          <p className="mk-eyebrow">{content.eyebrow}</p>
          <h1><Letters text={SLIDES[slide].title} /></h1>
          <p className="mk-hero-tag">{SLIDES[slide].tagline}</p>
          <p className="mk-hero-sub">{SLIDES[slide].sub}</p>
          <CmsLink className="mk-btn mk-btn-light" href={SLIDES[slide].cta.href}>{SLIDES[slide].cta.label}</CmsLink>
        </div>
        <div className="mk-dots" role="tablist" aria-label={content.slidesAriaLabel}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === slide}
              aria-label={s.title}
              className={i === slide ? "is-active" : ""}
              onClick={() => setSlide(i)}
            >
              <i style={i === slide && loaded ? { animationDuration: `${SLIDE_MS}ms` } : undefined} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

export default function HomeSections({ sections = [], partners = null }) {
  const { currency } = useApp();
  const isMobile = useIsMobile();

  // ── Activities ─────────────────────────────────────────────────────────────
  const [items, setItems] = useState(null);
  const [actError, setActError] = useState(false);

  // ── Holidays ───────────────────────────────────────────────────────────────
  const [holidayData, setHolidayData] = useState(null);

  // ── Cruises ────────────────────────────────────────────────────────────────
  const [cruiseData, setCruiseData] = useState(null);

  // ── Events ─────────────────────────────────────────────────────────────────
  const [eventData, setEventData] = useState(null);

  const rail = useRef(null);
  const citiesRef = useRef(null);
  const bestRef = useRef(null);
  const brandsRef = useRef(null);
  const holidaysRef = useRef(null);
  const cruisesRef = useRef(null);
  const eventsRef = useRef(null);
  const whyRef = useRef(null);

  // Each group of sections loads its data only when it is about to scroll into view (700px ahead), so the first
  // paint (hero + categories) never waits on the catalog, holiday, cruise or event requests. Results are
  // cached in lib/clientCache, so revisiting the home page or opening search reuses them.
  const activitiesNear = useInView([citiesRef, bestRef, brandsRef]);
  const holidaysNear = useInView([holidaysRef]);
  const cruisesNear = useInView([cruisesRef]);
  const eventsNear = useInView([eventsRef]);

  // Fetch activities
  useEffect(() => {
    if (!activitiesNear) return undefined;
    const controller = new AbortController();
    getActivities(currency, { signal: controller.signal })
      .then((data) => { setActError(false); setItems(data); })
      .catch((err) => err.name !== "AbortError" && setActError(true));
    return () => controller.abort();
  }, [currency, activitiesNear]);

  // Fetch holidays home data
  useEffect(() => {
    if (!holidaysNear) return undefined;
    const controller = new AbortController();
    getHolidayHome({ currency, signal: controller.signal })
      .then((data) => setHolidayData(data))
      .catch((err) => err.name !== "AbortError" && setHolidayData(null));
    return () => controller.abort();
  }, [currency, holidaysNear]);

  // Fetch cruises home data
  useEffect(() => {
    if (!cruisesNear) return undefined;
    const controller = new AbortController();
    getCruiseHome({ currency, signal: controller.signal })
      .then((data) => setCruiseData(data))
      .catch((err) => err.name !== "AbortError" && setCruiseData(null));
    return () => controller.abort();
  }, [currency, cruisesNear]);

  // Fetch events home data
  useEffect(() => {
    if (!eventsNear) return undefined;
    const controller = new AbortController();
    getEventHome({ currency, signal: controller.signal })
      .then((data) => setEventData(data))
      .catch((err) => err.name !== "AbortError" && setEventData(null));
    return () => controller.abort();
  }, [currency, eventsNear]);

  // ── Derived activity data ──────────────────────────────────────────────────
  const cities = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) =>
      (it.destinations || []).forEach((d) => {
        const entry = map.get(d) || { name: d, count: 0, image: null };
        entry.count += 1;
        entry.image = entry.image || it.imageUrl;
        map.set(d, entry);
      })
    );
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [items]);

  const bestSelling = useMemo(() => {
    const list = items || [];
    return [...list.filter((it) => it.salePrice), ...list.filter((it) => !it.salePrice)].slice(0, 9);
  }, [items]);

  // Featured holidays: pick up to 4 featured/recent packages
  const featuredHolidays = useMemo(() => (holidayData?.featured || holidayData?.recent || []).slice(0, 4), [holidayData]);

  // Featured cruises: pick up to 4
  const featuredCruises = useMemo(() => (cruiseData?.featured || cruiseData?.recent || []).slice(0, 4), [cruiseData]);

  // Featured events: pick up to 4
  const featuredEvents = useMemo(() => (eventData?.featured || eventData?.upcoming || []).slice(0, 4), [eventData]);

  // ── Scroll reveals ─────────────────────────────────────────────────────────
  const reveal = { enabled: !isMobile };
  useReveal(citiesRef, items ? "cities" : "wait", reveal);
  useReveal(bestRef, items ? "best" : "wait", reveal);
  useReveal(brandsRef, items ? "brands" : "wait", reveal);
  useReveal(holidaysRef, holidayData ? "holidays" : "wait", reveal);
  useReveal(cruisesRef, cruiseData ? "cruises" : "wait", reveal);
  useReveal(eventsRef, eventData ? "events" : "wait", reveal);
  useReveal(whyRef, "why", reveal);

  useEffect(() => {
    const allLoaded = items || holidayData || cruiseData || eventData;
    if (!allLoaded) return undefined;
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, [items, holidayData, cruiseData, eventData]);

  const scrollRail = (dir) => rail.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  const renderers = {
    hero: (c) => (isMobile ? <MobileHero slides={c.slides} content={c} /> : <Hero content={c} />),

    categoryTiles: (c) => (
      <section className="mk-container mk-section mk-cat-banner">
        <div className="mk-section-head" data-reveal>
          <div>
            <h2>{c.heading}</h2>
            <p className="mk-sub">{c.subheading}</p>
          </div>
        </div>
        <div className="mk-cat-tiles">
          {c.tiles.map((tile) => (
            <CmsLink
              key={tile.id}
              href={tile.link.href}
              className="mk-cat-tile"
              style={{ background: `linear-gradient(145deg, ${tile.gradientFrom} 0%, ${tile.gradientMid} 55%, ${tile.gradientTo} 100%)` }}
              aria-label={tile.link.label}
            >
              {/* Icon bubble — top-right */}
              <span className="mk-cat-icon" aria-hidden="true">{tile.emoji}</span>

              {/* Text block — bottom-left */}
              <span className="mk-cat-body">
                <strong className="mk-cat-label">{tile.link.label}</strong>
                <span className="mk-cat-sub">{tile.sub}</span>
                {/* Arrow pill slides up on hover */}
                <span className="mk-cat-arrow">
                  {c.arrowLabel}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </span>
            </CmsLink>
          ))}
        </div>
      </section>
    ),

    bestCities: (c) => (
      <section className="mk-container mk-section" ref={citiesRef}>
        <div className="mk-section-head" data-reveal>
          <h2>{c.heading}</h2>
          <div className="mk-rail-controls">
            <CmsLink className="mk-link" href={c.viewAll.href}>{c.viewAll.label}</CmsLink>
            <button aria-label={c.previousLabel} onClick={() => scrollRail(-1)}>‹</button>
            <button aria-label={c.nextLabel} onClick={() => scrollRail(1)}>›</button>
          </div>
        </div>
        <div className="mk-rail" ref={rail}>
          {items
            ? cities.map((city) => (
                <CmsLink
                  key={city.name}
                  data-reveal="right"
                  className="mk-city"
                  href={`/activities?destination=${encodeURIComponent(city.name)}`}
                >
                  <span className="mk-city-panel" aria-hidden="true" />
                  <div className="mk-city-body">
                    <div className="mk-city-img">
                      <img src={city.image} alt="" loading="lazy" onError={showFallback} />
                    </div>
                    <h3>{fmt(c.cityTitle, { city: city.name })}</h3>
                    <p>{fmt(c.cityCount, { count: city.count })}</p>
                    <span className="mk-city-go" aria-hidden="true">→</span>
                  </div>
                </CmsLink>
              ))
            : Array.from({ length: 4 }, (_, i) => <div key={i} className="mk-city mk-skeleton" aria-hidden="true" />)}
        </div>
      </section>
    ),

    bestSellers: (c) => (
      <section className="mk-container mk-section" ref={bestRef}>
        <div className="mk-section-head" data-reveal>
          <h2>{c.heading}</h2>
          <CmsLink className="mk-link" href={c.viewAll?.href || "/activities"}>{c.viewAll?.label || "View all activities"}</CmsLink>
        </div>
        {actError && !c.cards?.length && <p className="mk-error">{c.errorMessage}</p>}
        {(!actError || c.cards?.length) && (
          <BestSellerCards items={c.cards && c.cards.length > 0 ? c.cards : (items ? bestSelling : null)} content={c} />
        )}
      </section>
    ),

    holidays: (c) => {
      const liveItems = holidayData?.featured || holidayData?.recent || [];
      const hasChosen = Array.isArray(c.packages) && c.packages.length > 0;
      const itemsToShow = hasChosen
        ? c.packages.map((p) => toHolidayCardItem(p, liveItems))
        : (holidayData ? featuredHolidays : null);

      return (
        <section className="mk-container mk-section" ref={holidaysRef}>
          <div className="mk-section-head" data-reveal>
            <div>
              <h2>{c.heading}</h2>
              <p className="mk-sub">{c.subheading}</p>
            </div>
            <CmsLink className="mk-link" href={c.viewAll.href}>{c.viewAll.label}</CmsLink>
          </div>
          <div className="mk-grid mk-grid-4">
            {itemsToShow
              ? itemsToShow.length > 0
                ? itemsToShow.map((it) => <HolidayCard key={it.id || it.slug} item={it} reveal />)
                : <p className="mk-empty">{c.emptyMessage}</p>
              : <HolidaySkeletons count={4} />}
          </div>
        </section>
      );
    },

    cruises: (c) =>
      (cruiseData === null || featuredCruises.length > 0) && (
        <section className="mk-container mk-section" ref={cruisesRef}>
          <div className="mk-section-head" data-reveal>
            <div>
              <h2>{c.heading}</h2>
              <p className="mk-sub">{c.subheading}</p>
            </div>
            <CmsLink className="mk-link" href={c.viewAll.href}>{c.viewAll.label}</CmsLink>
          </div>
          <div className="mk-grid mk-grid-4">
            {cruiseData
              ? featuredCruises.map((it) => <CruiseCard key={it.id || it.slug} item={it} reveal />)
              : Array.from({ length: 4 }, (_, i) => <div key={i} className="sc-card mk-skeleton" aria-hidden="true" style={{ minHeight: 280 }} />)}
          </div>
        </section>
      ),

    events: (c) =>
      (eventData === null || featuredEvents.length > 0) && (
        <section className="mk-container mk-section" ref={eventsRef}>
          <div className="mk-section-head" data-reveal>
            <div>
              <h2>{c.heading}</h2>
              <p className="mk-sub">{c.subheading}</p>
            </div>
            <CmsLink className="mk-link" href={c.viewAll.href}>{c.viewAll.label}</CmsLink>
          </div>
          <div className="mk-grid mk-grid-4">
            {eventData
              ? featuredEvents.map((it) => <EventCard key={it.id || it.slug} item={it} reveal />)
              : Array.from({ length: 4 }, (_, i) => <div key={i} className="sc-card mk-skeleton" aria-hidden="true" style={{ minHeight: 280 }} />)}
          </div>
        </section>
      ),

    exploreByExperience: (c) => (
      <section className="mk-container mk-section" ref={brandsRef}>
        <div className="mk-section-head" data-reveal>
          <div>
            <h2>{c.heading}</h2>
            <p className="mk-sub">{c.subheading}</p>
          </div>
          <CmsLink className="mk-link mk-only-mobile" href={c.viewAll.href}>{c.viewAll.label}</CmsLink>
        </div>
        <ExperienceCards items={items} content={c} />
      </section>
    ),

    partners: () => <PartnersStrip data={partners} id="home-partners" />,

    why: (c) => (
      <section className="mk-why" ref={whyRef}>
        <div className="mk-container">
          <h2 data-reveal>{c.heading}</h2>
          <div className="mk-why-grid">
            {c.items.map((item, i) => (
              <div key={item.id} data-reveal>
                <span className="mk-why-num">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      {sections.map((section) => {
        const render = renderers[section.type];
        return render ? <Fragment key={section.id}>{render(section.data)}</Fragment> : null;
      })}
    </>
  );
}
