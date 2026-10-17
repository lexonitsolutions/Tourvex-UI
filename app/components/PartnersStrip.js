"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPartners } from "../lib/partners";
import "../partners.css";

function Logo({ item, hidden = false }) {
  const content = item.logo ? (
    <img src={item.logo} alt={hidden ? "" : item.name} loading="lazy" decoding="async" draggable="false" />
  ) : (
    <span className="pt-word"><strong>{item.name}</strong><small>{item.category}</small></span>
  );
  if (item.href) {
    return <a className="pt-logo" href={item.href} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined} aria-label={hidden ? undefined : item.name}>{content}</a>;
  }
  return <div className="pt-logo" title={hidden ? undefined : item.name}>{content}</div>;
}

/** Shared, CMS-driven partner logo carousel. With no data it loads the global partner catalogue itself. */
export default function PartnersStrip({ data: initialData = null, id = "partners" }) {
  const [data, setData] = useState(initialData);
  const rootRef = useRef(null);

  useEffect(() => {
    if (initialData?.items?.length) return undefined;
    const controller = new AbortController();
    getPartners(undefined, { signal: controller.signal }).then(setData).catch(() => {});
    return () => controller.abort();
  }, [initialData]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => element.classList.toggle("is-offscreen", !entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [data]);

  const items = data?.items || [];
  const logos = useMemo(() => {
    if (!items.length) return [];
    const total = Math.max(8, items.length);
    return Array.from({ length: total }, (_, index) => ({ ...items[index % items.length], carouselKey: `${items[index % items.length].id}-${index}` }));
  }, [items]);
  if (!logos.length) return null;

  return (
    <section className="pt-strip" ref={rootRef} aria-labelledby={`${id}-title`}>
      <div className="mk-container pt-head">
        <h2 id={`${id}-title`}>{data.title}</h2>
        {data.subtitle && <p>{data.subtitle}</p>}
      </div>
      <div className="pt-logo-stage">
        <div className="pt-viewport" style={{ "--pt-duration": `${Math.max(36, logos.length * 5)}s` }}>
          <div className="pt-track">
            <ul className="pt-copy">
              {logos.map((item) => <li key={item.carouselKey}><Logo item={item} /></li>)}
            </ul>
            <ul className="pt-copy" aria-hidden="true">
              {logos.map((item) => <li key={`duplicate-${item.carouselKey}`}><Logo item={item} hidden /></li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
