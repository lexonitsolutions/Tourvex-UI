"use client";

import { useEffect, useRef, useState } from "react";
import { CmsLink } from "./CmsLink";
import PartnersStrip from "./PartnersStrip";
import "../about-page.css";

const media = (value, fallback = "") => typeof value === "string" ? value : value?.url || fallback;

function SectionHeading({ data, light = false }) {
  return <header className={`ab-heading${light ? " is-light" : ""}`}><span className="co-kicker">{data.eyebrow}</span><h2>{data.heading}</h2>{data.description && <p>{data.description}</p>}</header>;
}

export function AboutServices({ data }) {
  if (!data.items?.length) return null;
  return <section className="co-section ab-services"><div className="mk-container"><SectionHeading data={data}/><div className="ab-service-grid">{data.items.map((item, index) => <article className={index < 2 ? "is-featured" : ""} key={item.id || item.title} data-reveal><img src={media(item.image, "/images/destination-a.jpg")} alt={item.image?.alt || item.title}/><span className="ab-card-shade"/><div><small>0{index + 1}</small><h3>{item.title}</h3><p>{item.text}</p>{item.link?.href && <CmsLink href={item.link.href}>{item.link.label}<b>→</b></CmsLink>}</div></article>)}</div></div></section>;
}

export function AboutDestinations({ data }) {
  if (!data.items?.length) return null;
  return <section className="co-section ab-destinations"><div className="mk-container"><SectionHeading data={data}/><div className="ab-destination-grid">{data.items.map((item, index) => <CmsLink className={index === 0 ? "is-lead" : ""} href={item.link?.href || "/holidays"} key={item.id || item.title} data-reveal><img src={media(item.image, "/images/destination-hero.jpg")} alt={item.image?.alt || item.title}/><span/><div><h3>{item.title}</h3><p>{item.text}</p><b>Explore →</b></div></CmsLink>)}</div></div></section>;
}

export function AboutValues({ data }) {
  if (!data.items?.length) return null;
  return <section className="co-section ab-values"><div className="mk-container"><SectionHeading data={data}/><div className="ab-value-grid">{data.items.map((item, index) => <article key={item.id || item.title} data-reveal><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></div></section>;
}

export function AboutEcosystem({ data }) {
  if (!data.items?.length) return null;
  return <section className="co-section ab-ecosystem"><div className="mk-container"><SectionHeading data={data} light/><div className="ab-ecosystem-grid">{data.items.map((item, index) => <article key={item.id || item.title} data-reveal><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.text}</p>{item.link?.href && <CmsLink href={item.link.href}>{item.link.label} →</CmsLink>}</article>)}</div></div></section>;
}

export function AboutWhy({ data }) {
  if (!data.items?.length) return null;
  return <section className="mk-container co-section ab-why"><SectionHeading data={data}/><div className="ab-why-list">{data.items.map((item) => <article key={item.id || item.title} data-reveal><span>✓</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></section>;
}

export function AboutStats({ data }) {
  const root = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.25 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  if (!data.items?.length) return null;
  return <section className="ab-stats" ref={root}><div className="mk-container"><header><span>{data.eyebrow}</span><h2>{data.heading}</h2><p>{data.description}</p></header><div className="ab-stat-grid">{data.items.map((item) => <article key={item.id || item.label}><strong>{visible ? Number(item.value || 0).toLocaleString() : "0"}{item.suffix}</strong><span>{item.label}</span></article>)}</div></div></section>;
}

export function AboutFounder({ data }) {
  if (!data.name || !data.message || !media(data.photo)) return null;
  return <section className="mk-container co-section ab-founder"><div className="ab-founder-photo" data-reveal><img src={media(data.photo)} alt={data.photo?.alt || data.name}/></div><div data-reveal><span className="co-kicker">{data.eyebrow}</span><h2>{data.heading}</h2><blockquote>{data.message}</blockquote><h3>{data.name}</h3><p>{data.designation}</p>{media(data.signature) && <img className="ab-signature" src={media(data.signature)} alt=""/>}{data.link?.href && <CmsLink className="ab-text-link" href={data.link.href}>{data.link.label || "Read more"} →</CmsLink>}</div></section>;
}

export function AboutAchievements({ data }) {
  if (!data.items?.length) return null;
  return <section className="co-section ab-achievements"><div className="mk-container"><span className="co-kicker">{data.eyebrow}</span><h2>{data.heading}</h2><div className="ab-achievement-track">{data.items.map((item) => <article key={item.id || `${item.year}-${item.title}`} data-reveal>{media(item.image) && <img src={media(item.image)} alt={item.image?.alt || item.title}/>}<span>{item.year}</span><h3>{item.title}</h3><p>{item.description}</p>{item.issuer && <small>{item.issuer}</small>}</article>)}</div></div></section>;
}

export function AboutTestimonials({ data }) {
  const [active, setActive] = useState(0);
  if (!data.items?.length) return null;
  const item = data.items[Math.min(active, data.items.length - 1)];
  return <section className="mk-container co-section ab-testimonials"><div><span className="co-kicker">{data.eyebrow}</span><h2>{data.heading}</h2><div className="ab-review-controls"><button type="button" onClick={() => setActive((active - 1 + data.items.length) % data.items.length)} aria-label="Previous review">←</button><span>{active + 1} / {data.items.length}</span><button type="button" onClick={() => setActive((active + 1) % data.items.length)} aria-label="Next review">→</button></div></div><article aria-live="polite"><div className="ab-stars" aria-label={`${item.rating} out of 5 stars`}>{"★".repeat(item.rating || 5)}</div><blockquote>“{item.review}”</blockquote><footer>{media(item.photo) && <img src={media(item.photo)} alt=""/>}<div><strong>{item.name}</strong>{item.journey && <span>{item.journey}</span>}</div></footer></article></section>;
}

function mapPosition(location) {
  return { left: `${((Number(location.longitude) + 180) / 360) * 100}%`, top: `${((90 - Number(location.latitude)) / 180) * 100}%` };
}

export function AboutLocations({ data }) {
  const [active, setActive] = useState(0);
  if (!data.items?.length) return null;
  const office = data.items[Math.min(active, data.items.length - 1)];
  return <section className="ab-locations"><div className="ab-map-sticky"><div className="mk-container ab-map-head"><span className="co-kicker is-light">{data.eyebrow}</span><h2>{data.heading}</h2><p>{data.description}</p></div><div className="ab-world-map" role="group" aria-label="Karnish Tourism office locations"><iframe title="World map" loading="lazy" tabIndex="-1" src="https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-70%2C180%2C80&amp;layer=mapnik"/>{data.items.map((item, index) => <button key={item.id || `${item.city}-${index}`} type="button" className={index === active ? "is-active" : ""} style={mapPosition(item)} onClick={() => setActive(index)} aria-label={`Show ${item.city} office`}><i/><span>{item.city}</span></button>)}</div><article className="ab-office-card" key={office.id || office.city}>{media(office.image) && <img src={media(office.image)} alt={office.image?.alt || office.officeName}/>}<div><span>{office.country}</span><h3>{office.city}</h3><strong>{office.officeName}</strong><p>{office.address}</p>{office.phone && <a href={`tel:${office.phone}`}>{office.phone}</a>}{office.email && <a href={`mailto:${office.email}`}>{office.email}</a>}{office.hours && <small>{office.hours}</small>}{office.directions?.href && <a className="ab-directions" href={office.directions.href} target="_blank" rel="noreferrer">{office.directions.label || "Get directions"} →</a>}</div></article></div></section>;
}

export function AboutPartners() {
  return <PartnersStrip id="about-partners"/>;
}
