"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { API_BASE_URL } from "../lib/api";

function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("en-US");
}

/* ------------------------------------------------------------------ Icons */

function TravelersIcon() {
  return (
    <div className="mk-stats-icon mk-stats-icon--travelers" aria-hidden="true">
      <div className="mk-stats-pulse-ring" />
      <svg viewBox="0 0 40 40" fill="none" className="mk-stats-svg">
        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
        <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="20" cy="14" r="4.5" fill="currentColor" />
        <path
          d="M11.5 28C11.5 23.5 15.3 20.5 20 20.5C24.7 20.5 28.5 23.5 28.5 28C28.5 29 27.8 29.5 26.8 29.5H13.2C12.2 29.5 11.5 29 11.5 28Z"
          fill="currentColor"
        />
        <polygon points="20,4 21.5,7 18.5,7" fill="var(--mk-primary)" />
        <polygon points="20,36 18.5,33 21.5,33" fill="var(--mk-primary)" opacity="0.6" />
        <polygon points="4,20 7,18.5 7,21.5" fill="var(--mk-primary)" opacity="0.6" />
        <polygon points="36,20 33,21.5 33,18.5" fill="var(--mk-primary)" opacity="0.6" />
      </svg>
    </div>
  );
}

function YearsIcon() {
  return (
    <div className="mk-stats-icon mk-stats-icon--years" aria-hidden="true">
      <div className="mk-stats-pulse-ring" />
      <svg viewBox="0 0 40 40" fill="none" className="mk-stats-svg">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <line x1="20" y1="6" x2="20" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="20" x2="31" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="34" x2="20" y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="20" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 20L20 12" stroke="var(--mk-primary)" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 20L26 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2.5" fill="var(--mk-primary)" />
        <path d="M12 28C14.5 30.5 17 31 20 31C23 31 25.5 30.5 28 28" stroke="var(--mk-primary)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 2" />
      </svg>
    </div>
  );
}

function TripsIcon() {
  return (
    <div className="mk-stats-icon mk-stats-icon--trips" aria-hidden="true">
      <div className="mk-stats-pulse-ring" />
      <svg viewBox="0 0 40 40" fill="none" className="mk-stats-svg">
        <rect x="9" y="14" width="22" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15 14V10C15 8.9 15.9 8 17 8H23C24.1 8 25 8.9 25 10V14" stroke="var(--mk-primary)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="16" y1="14" x2="16" y2="31" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <line x1="24" y1="14" x2="24" y2="31" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="13" cy="32" r="1.5" fill="currentColor" />
        <circle cx="27" cy="32" r="1.5" fill="currentColor" />
        <path d="M26 18L30 21L28 23L24 20" stroke="var(--mk-primary)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

function PlacesIcon() {
  return (
    <div className="mk-stats-icon mk-stats-icon--places" aria-hidden="true">
      <div className="mk-stats-pulse-ring" />
      <svg viewBox="0 0 40 40" fill="none" className="mk-stats-svg">
        <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <ellipse cx="20" cy="20" rx="7" ry="15" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        <line x1="5" y1="20" x2="35" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        <path d="M7.5 12.5C11 14.5 15.5 15.5 20 15.5C24.5 15.5 29 14.5 32.5 12.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M7.5 27.5C11 25.5 15.5 24.5 20 24.5C24.5 24.5 29 25.5 32.5 27.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path
          d="M27 9C27 12.3 23.5 16.5 23.5 16.5C23.5 16.5 20 12.3 20 9C20 7.1 21.6 5.5 23.5 5.5C25.4 5.5 27 7.1 27 9Z"
          fill="var(--mk-primary)"
          stroke="#fff"
          strokeWidth="1"
        />
        <circle cx="23.5" cy="9" r="1.3" fill="#fff" />
      </svg>
    </div>
  );
}

function getStatIcon(key) {
  switch (key) {
    case "travelers":
      return <TravelersIcon />;
    case "years":
      return <YearsIcon />;
    case "trips":
      return <TripsIcon />;
    case "places":
      return <PlacesIcon />;
    default:
      return <TravelersIcon />;
  }
}

/* ------------------------------------------------------------------ Smooth Count-Up Hook */

function useCountUp(targetValue, shouldAnimate, durationMs = 2000) {
  const target = Number(targetValue) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate || prefersReducedMotion()) return undefined;

    let startTime = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(ease * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [shouldAnimate, target, durationMs]);

  if (typeof window !== "undefined" && prefersReducedMotion()) return target;
  return shouldAnimate ? displayValue : 0;
}

/* ------------------------------------------------------------------ 1. Happy Travelers Counter */

function TravelersCounter({ value, prefix = "", suffix = "", shouldAnimate }) {
  const animatedNumber = useCountUp(value, shouldAnimate, 2000);

  return (
    <div className="mk-stat-number-wrap">
      <span className="mk-stat-num">
        {prefix && <span className="mk-stat-prefix">{prefix}</span>}
        <span>{formatNumber(animatedNumber)}</span>
        {suffix && <span className="mk-stat-suffix">{suffix}</span>}
      </span>
      <div className="mk-stats-traveler-stamp" aria-hidden="true">
        <span>Verified Guest Reviews</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 2. Rolling Odometer Component */

function OdometerDigit({ digit, shouldAnimate, index }) {
  const targetDigit = Number(digit);
  const isNumber = !Number.isNaN(targetDigit);
  const digitList = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], []);

  if (!isNumber) {
    return <span className="mk-odometer-char">{digit}</span>;
  }

  const rollIndex = 10 + targetDigit;
  // 20 items in total; each item is exactly 5% (100 / 20) of the strip height
  const targetPct = -(rollIndex * 5);
  const isReduced = typeof window !== "undefined" && prefersReducedMotion();
  const rollPercentage = shouldAnimate || isReduced ? targetPct : -(targetDigit * 5);
  const transitionDelay = `${index * 140 + 60}ms`;

  return (
    <div className="mk-odometer-col" aria-hidden="true">
      <div
        className="mk-odometer-strip"
        style={{
          transform: `translate3d(0, ${rollPercentage}%, 0)`,
          transition: shouldAnimate && !isReduced ? `transform 1.8s cubic-bezier(0.16, 1, 0.3, 1) ${transitionDelay}` : "none",
        }}
      >
        {digitList.map((d, i) => (
          <span key={i} className="mk-odometer-num">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function OdometerCounter({ value, prefix = "", suffix = "", shouldAnimate, foundingYear = 2011 }) {
  const numString = String(value ?? 0);
  const currentYear = new Date().getFullYear();

  return (
    <div className="mk-stat-number-wrap">
      <span className="mk-sr-only" aria-live="polite">
        {prefix}
        {numString}
        {suffix}
      </span>
      <div className="mk-odometer-display" aria-hidden="true">
        {prefix && <span className="mk-stat-prefix">{prefix}</span>}
        <div className="mk-odometer-digits">
          {numString.split("").map((ch, idx) => (
            <OdometerDigit key={idx} digit={ch} shouldAnimate={shouldAnimate} index={idx} />
          ))}
        </div>
        {suffix && <span className="mk-stat-suffix">{suffix}</span>}
      </div>

      <div className="mk-stats-timeline-detail" aria-hidden="true">
        <span className="mk-stats-timeline-tag">EST. {foundingYear}</span>
        <div className="mk-stats-timeline-line">
          <span className="mk-stats-timeline-tick" />
          <span className="mk-stats-timeline-tick is-active" />
          <span className="mk-stats-timeline-tick is-active" />
          <span className="mk-stats-timeline-tick is-end" />
        </div>
        <span className="mk-stats-timeline-now">{currentYear}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 3. Upward Reveal Counter */

function UpwardRevealCounter({ value, prefix = "", suffix = "", shouldAnimate }) {
  const animatedNumber = useCountUp(value, shouldAnimate, 1900);

  return (
    <div className="mk-stat-number-wrap">
      <div className={`mk-upward-reveal${shouldAnimate ? " is-active" : ""}`}>
        <span className="mk-stat-num">
          {prefix && <span className="mk-stat-prefix">{prefix}</span>}
          <span className="mk-upward-text">{formatNumber(animatedNumber)}</span>
          {suffix && <span className="mk-stat-suffix">{suffix}</span>}
        </span>
      </div>
      <div className="mk-stats-subtle-luggage-tag" aria-hidden="true">
        <span className="mk-stats-tag-dot" />
        <span>Curated & Verified Options</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 4. Globe Marker Counter */

function GlobeMarkerCounter({ value, prefix = "", suffix = "", shouldAnimate }) {
  const animatedNumber = useCountUp(value, shouldAnimate, 2100);

  return (
    <div className="mk-stat-number-wrap">
      <div className="mk-globe-counter">
        <span className="mk-stat-num">
          {prefix && <span className="mk-stat-prefix">{prefix}</span>}
          <span>{formatNumber(animatedNumber)}</span>
          {suffix && <span className="mk-stat-suffix">{suffix}</span>}
        </span>
      </div>
      <div className="mk-stats-globe-pin-detail" aria-hidden="true">
        <span className="mk-stats-coords">Global & Regional Hubs</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Main Section */

export default memo(function HomeStats({ content }) {
  const rootRef = useRef(null);
  const [hasScrolledIn, setHasScrolledIn] = useState(false);
  const [airplaneProgress, setAirplaneProgress] = useState(0);
  const [activeCards, setActiveCards] = useState([false, false, false, false]);
  const [liveStats, setLiveStats] = useState(null);
  const uniqueId = useId();

  const eyebrow = content?.eyebrow || "PROVEN EXCELLENCE";
  const heading = content?.heading || "Our Journey in Numbers";
  const subheading = content?.subheading || "A legacy of trust, remarkable journeys, and unforgettable experiences across the globe.";
  const foundingYear = Number(content?.foundingYear) || 2011;
  const contentItems = content?.items;

  const rawItems = useMemo(() => {
    if (Array.isArray(contentItems) && contentItems.length > 0) {
      return contentItems.filter((item) => item.enabled !== false);
    }
    return [
      {
        id: "stat-travelers",
        key: "travelers",
        title: "Happy Travelers",
        description: "Satisfied guests hosted with 5-star service worldwide.",
        autoCalculate: true,
        manualValue: 25000,
        prefix: "",
        suffix: "+",
        enabled: true,
      },
      {
        id: "stat-years",
        key: "years",
        title: "Years of Excellence",
        description: "Crafting extraordinary tourism & journeys since 2011.",
        autoCalculate: true,
        manualValue: Math.max(new Date().getFullYear() - foundingYear, 1),
        prefix: "",
        suffix: "+",
        enabled: true,
      },
      {
        id: "stat-trips",
        key: "trips",
        title: "Trip Options Available",
        description: "Curated holiday packages, activities & bespoke tours.",
        autoCalculate: true,
        manualValue: 150,
        prefix: "",
        suffix: "+",
        enabled: true,
      },
      {
        id: "stat-places",
        key: "places",
        title: "Unique Places to Explore",
        description: "Handpicked worldwide destinations & iconic cities.",
        autoCalculate: true,
        manualValue: 45,
        prefix: "",
        suffix: "+",
        enabled: true,
      },
    ];
  }, [contentItems, foundingYear]);

  // Fetch dynamic verified counts from API on mount
  useEffect(() => {
    let unmounted = false;
    const fetchStats = async () => {
      try {
        const url = `${API_BASE_URL}/content/stats/homepage?foundingYear=${foundingYear}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          if (!unmounted && data) setLiveStats(data);
        }
      } catch {
        // Falls back to admin configured manualValue
      }
    };
    fetchStats();
    return () => {
      unmounted = true;
    };
  }, [foundingYear]);

  // Merge live dynamic values when autoCalculate is enabled
  const items = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return rawItems.map((item) => {
      let finalValue = Number(item.manualValue) || 0;

      if (item.autoCalculate) {
        if (item.key === "years") {
          finalValue = Math.max(currentYear - foundingYear, 1);
        } else if (liveStats && typeof liveStats[item.key] === "number" && liveStats[item.key] > 0) {
          finalValue = liveStats[item.key];
        }
      }

      return {
        ...item,
        calculatedValue: finalValue,
      };
    });
  }, [rawItems, liveStats, foundingYear]);

  // Scroll trigger with IntersectionObserver (fires only once per page load)
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    if (prefersReducedMotion()) {
      const animFrame = requestAnimationFrame(() => {
        setHasScrolledIn(true);
        setAirplaneProgress(100);
        setActiveCards([true, true, true, true]);
      });
      return () => cancelAnimationFrame(animFrame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasScrolledIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // "The Journey of Numbers" Flight Path & Airplane Travel Animation
  useEffect(() => {
    if (!hasScrolledIn) return undefined;

    if (prefersReducedMotion()) {
      const animFrame = requestAnimationFrame(() => {
        setAirplaneProgress(100);
        setActiveCards([true, true, true, true]);
      });
      return () => cancelAnimationFrame(animFrame);
    }

    let start = null;
    let reqId = null;
    const duration = 2400;

    const checkpoints = [
      { progress: 12, index: 0 },
      { progress: 38, index: 1 },
      { progress: 63, index: 2 },
      { progress: 88, index: 3 },
    ];

    const frame = (time) => {
      if (!start) start = time;
      const elapsed = time - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const currentPct = ease * 100;
      setAirplaneProgress(currentPct);

      checkpoints.forEach((cp) => {
        if (currentPct >= cp.progress) {
          setActiveCards((prev) => {
            if (prev[cp.index]) return prev;
            const next = [...prev];
            next[cp.index] = true;
            return next;
          });
        }
      });

      if (t < 1) {
        reqId = requestAnimationFrame(frame);
      } else {
        setAirplaneProgress(100);
        setActiveCards([true, true, true, true]);
      }
    };

    const delayId = setTimeout(() => {
      reqId = requestAnimationFrame(frame);
    }, 180);

    return () => {
      clearTimeout(delayId);
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [hasScrolledIn]);

  const desktopNodes = [12.5, 37.5, 62.5, 87.5];

  return (
    <section className="mk-section mk-stats-section" ref={rootRef} aria-labelledby={`stats-title-${uniqueId}`}>
      <div className="mk-container">
        {/* Section Header */}
        <div className="mk-stats-head">
          {eyebrow && <span className="mk-stats-eyebrow">{eyebrow}</span>}
          <h2 id={`stats-title-${uniqueId}`} className="mk-stats-title">
            {heading}
          </h2>
          {subheading && <p className="mk-stats-sub">{subheading}</p>}
        </div>

        {/* "The Journey of Numbers" Flight Path (Desktop & Tablet) */}
        <div className="mk-stats-flight-track" aria-hidden="true">
          <svg className="mk-stats-flight-svg" viewBox="0 0 1000 50" fill="none" preserveAspectRatio="none">
            <path
              d="M 20 25 Q 250 12, 500 25 T 980 25"
              stroke="var(--mk-line)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="mk-stats-flight-bg-line"
            />
            <path
              d="M 20 25 Q 250 12, 500 25 T 980 25"
              stroke="var(--mk-primary)"
              strokeWidth="2"
              strokeDasharray="1000"
              strokeDashoffset={1000 - (airplaneProgress / 100) * 1000}
              className="mk-stats-flight-drawn-line"
            />
            {desktopNodes.map((pct, idx) => {
              const xPos = pct * 10;
              const isActive = activeCards[idx];
              return (
                <g key={idx} className={`mk-stats-waypoint-group${isActive ? " is-active" : ""}`}>
                  <circle cx={xPos} cy="25" r="7" className="mk-stats-waypoint-halo" />
                  <circle cx={xPos} cy="25" r="4.5" className="mk-stats-waypoint-core" />
                  <circle cx={xPos} cy="25" r="2" fill="#fff" />
                </g>
              );
            })}
          </svg>

          {/* Small, subtle and elegant airplane traveling along the route */}
          <div
            className={`mk-stats-airplane-wrap${airplaneProgress >= 100 ? " is-docked" : ""}`}
            style={{
              left: `${Math.min(airplaneProgress, 98)}%`,
              top: `${25 + Math.sin((airplaneProgress / 100) * Math.PI * 2) * 4}px`,
              opacity: hasScrolledIn ? 1 : 0,
            }}
          >
            <div className="mk-stats-airplane-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path
                  d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                  fill="var(--mk-navy)"
                />
                <path
                  d="M11.5 2C12.33 2 13 2.67 13 3.5V9L21 14V16L13 13.5V19L15 20.5V22L11.5 21L8 22V20.5L10 19V13.5L2 16V14L10 9V3.5C10 2.67 10.67 2 11.5 2Z"
                  stroke="var(--mk-primary)"
                  strokeWidth="0.8"
                />
              </svg>
              <div className="mk-stats-contrail" />
            </div>
          </div>
        </div>

        {/* Four Statistics Cards Grid */}
        <div className="mk-stats-grid">
          {items.map((item, idx) => {
            const isActive = activeCards[idx];
            const key = item.key || "travelers";

            let counterBody = null;
            if (key === "years") {
              counterBody = (
                <OdometerCounter
                  value={item.calculatedValue}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  shouldAnimate={isActive}
                  foundingYear={foundingYear}
                />
              );
            } else if (key === "trips") {
              counterBody = (
                <UpwardRevealCounter
                  value={item.calculatedValue}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  shouldAnimate={isActive}
                />
              );
            } else if (key === "places") {
              counterBody = (
                <GlobeMarkerCounter
                  value={item.calculatedValue}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  shouldAnimate={isActive}
                />
              );
            } else {
              counterBody = (
                <TravelersCounter
                  value={item.calculatedValue}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  shouldAnimate={isActive}
                />
              );
            }

            return (
              <div
                key={item.id || item.key || idx}
                className={`mk-stats-card${isActive ? " is-revealed" : ""}`}
                style={{
                  transitionDelay: `${idx * 140}ms`,
                }}
              >
                {/* Mobile Waypoint Indicator */}
                <div className="mk-stats-mobile-waypoint" aria-hidden="true">
                  <span className={`mk-stats-mobile-dot${isActive ? " is-active" : ""}`} />
                  <span className="mk-stats-mobile-num">0{idx + 1}</span>
                </div>

                {/* Card Icon & Header */}
                <div className="mk-stats-card-top">
                  {getStatIcon(key)}
                  <span className="mk-stats-step-badge" aria-hidden="true">
                    0{idx + 1}
                  </span>
                </div>

                {/* Dynamic Animated Value */}
                <div className="mk-stats-value-box">{counterBody}</div>

                {/* Label and Description */}
                <h3 className="mk-stats-card-title">{item.title}</h3>
                <p className="mk-stats-card-desc">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
