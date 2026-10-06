"use client";

import { useEffect, useRef } from "react";
import "../partners.css";

const MIN_TILES_PER_COPY = 8;

function Tile({ item, hidden }) {
  const inner = item.logo ? (
    <img src={item.logo} alt={hidden ? "" : item.name} loading="lazy" decoding="async" draggable="false" />
  ) : (
    <span className="pt-word">
      <strong>{item.name}</strong>
      {item.category && <small>{item.category}</small>}
    </span>
  );
  if (item.href) {
    return (
      <a
        className="pt-tile is-link"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={hidden ? -1 : undefined}
        aria-label={hidden ? undefined : item.logo ? item.name : `${item.name}${item.category ? `, ${item.category}` : ""}`}
        title={item.name}
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="pt-tile" title={item.name}>
      {inner}
    </div>
  );
}

/**
 * "In partnership with" logo marquee. Data is fetched on the server (lib/partners.js) and passed in, so the section is
 * in the first HTML. Empty or missing data hides it entirely.
 * Desktop: the track holds two identical copies and slides by exactly one copy (transform only), so the loop is seamless.
 * The second copy and any repeats that pad a short list are aria-hidden and out of the tab order.
 * Phones and reduced motion: a static scroll-snap row (see partners.css).
 *
 * @param {{ data: { title: string, subtitle?: string, items: Array<{ id: string, name: string, logo: string | null, category?: string, href: string | null }> } | null, id?: string }} props
 */
export default function PartnersStrip({ data, id = "partners" }) {
  const rootRef = useRef(null);
  const items = data?.items || [];
  const has = items.length > 0;

  // Pause the marquee while it is off screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => el.classList.toggle("is-offscreen", !entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [has]);

  if (!has) return null;

  const repeats = Math.max(1, Math.ceil(MIN_TILES_PER_COPY / items.length));
  const copy = Array.from({ length: repeats }, (_, r) => items.map((item) => ({ item, hidden: r > 0, key: `${r}-${item.id}` }))).flat();
  const duration = Math.max(24, copy.length * 5);

  return (
    <section className="pt-strip" ref={rootRef} aria-labelledby={`${id}-title`}>
      <div className="mk-container">
        <div className="pt-head">
          <h2 id={`${id}-title`}>{data.title}</h2>
          {data.subtitle && <p>{data.subtitle}</p>}
        </div>
      </div>
      <div className="pt-viewport" style={{ "--pt-dur": `${duration}s` }}>
        <div className="pt-track">
          <ul className="pt-copy">
            {copy.map(({ item, hidden, key }) => (
              <li key={key} className={hidden ? "pt-dup" : undefined} aria-hidden={hidden ? true : undefined}>
                <Tile item={item} hidden={hidden} />
              </li>
            ))}
          </ul>
          <ul className="pt-copy pt-dup" aria-hidden="true">
            {copy.map(({ item, key }) => (
              <li key={`b-${key}`}>
                <Tile item={item} hidden />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
