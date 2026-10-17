"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { API_BASE_URL } from "../lib/api";

function useCountUp(targetValue, shouldAnimate, durationMs = 1600) {
  const target = Number(targetValue) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return undefined;
    if (prefersReducedMotion()) {
      const frame = requestAnimationFrame(() => setDisplayValue(target));
      return () => cancelAnimationFrame(frame);
    }

    let startedAt = null;
    let frameId = null;
    const step = (time) => {
      if (startedAt === null) startedAt = time;
      const progress = Math.min((time - startedAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, shouldAnimate, target]);

  return displayValue;
}

function StatCount({ item, animate }) {
  const value = useCountUp(item.calculatedValue, animate);
  return (
    <article className="mk-count-stat">
      <strong className="mk-count-stat-value">
        {item.prefix}<span>{value.toLocaleString("en-US")}</span>{item.suffix}
      </strong>
      <h3>{item.title}</h3>
    </article>
  );
}

export default memo(function HomeStats({ content }) {
  const rootRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const uniqueId = useId();
  const heading = content?.heading || "Our Journey in Numbers";
  const foundingYear = Number(content?.foundingYear) || 2011;
  const contentItems = content?.items;

  const rawItems = useMemo(() => {
    if (Array.isArray(contentItems) && contentItems.length > 0) {
      return contentItems.filter((item) => item.enabled !== false);
    }
    return [
      { id: "stat-travelers", key: "travelers", title: "Happy Travelers", autoCalculate: true, manualValue: 25000, prefix: "", suffix: "+" },
      { id: "stat-years", key: "years", title: "Years of Excellence", autoCalculate: true, manualValue: 15, prefix: "", suffix: "+" },
      { id: "stat-trips", key: "trips", title: "Trip Options Available", autoCalculate: true, manualValue: 150, prefix: "", suffix: "+" },
      { id: "stat-places", key: "places", title: "Unique Places to Explore", autoCalculate: true, manualValue: 45, prefix: "", suffix: "+" },
    ];
  }, [contentItems]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/content/stats/homepage?foundingYear=${foundingYear}`, { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data) setLiveStats(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [foundingYear]);

  const items = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return rawItems.map((item) => {
      let calculatedValue = Number(item.manualValue) || 0;
      if (item.autoCalculate && item.key === "years") {
        calculatedValue = Math.max(currentYear - foundingYear, 1);
      } else if (item.autoCalculate && Number(liveStats?.[item.key]) > 0) {
        calculatedValue = Number(liveStats[item.key]);
      }
      return { ...item, calculatedValue };
    });
  }, [foundingYear, liveStats, rawItems]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    if (prefersReducedMotion()) {
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimate(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mk-section mk-count-section" ref={rootRef} aria-labelledby={`stats-title-${uniqueId}`}>
      <div className="mk-container">
        <h2 id={`stats-title-${uniqueId}`} className="mk-sr-only">{heading}</h2>
        <div className="mk-count-grid">
          {items.map((item, index) => <StatCount key={item.id || item.key || index} item={item} animate={animate} />)}
        </div>
      </div>
    </section>
  );
});
