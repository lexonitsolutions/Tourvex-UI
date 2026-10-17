"use client";

import { useState } from "react";
import { CmsLink } from "./CmsLink";
import PartnersStrip from "./PartnersStrip";
import { AboutAchievements, AboutDestinations, AboutEcosystem, AboutFounder, AboutLocations, AboutPartners, AboutServices, AboutStats, AboutTestimonials, AboutValues, AboutWhy } from "./AboutSections";
import "../company-pages.css";
import "../company-interactions.css";

const img = (value, fallback = "/images/7.jpg") => typeof value === "string" ? value : value?.url || fallback;
const alt = (value, fallback = "") => typeof value === "object" ? value?.alt || fallback : fallback;

function partnerCtaHref(page, href) {
  return page === "partners" && href ? "/partner-form" : href;
}

function Hero({ data, page }) {
  return <header className="co-hero">
    <img src={img(data.image)} alt={alt(data.image)} />
    <span className="co-hero-shade" />
    <div className="mk-container co-hero-copy" data-reveal>
      {data.eyebrow && <span className="co-kicker is-light">{data.eyebrow}</span>}
      <h1>{data.heading}</h1><p>{data.description}</p>
      <div className="co-actions">
        {data.primaryCta?.href && <CmsLink className="co-btn is-primary" href={partnerCtaHref(page, data.primaryCta.href)}>{data.primaryCta.label}</CmsLink>}
        {data.secondaryCta?.href && <CmsLink className="co-btn is-ghost" href={data.secondaryCta.href}>{data.secondaryCta.label}</CmsLink>}
      </div>
    </div>
  </header>;
}

function Heading({ data }) { return <div className="co-heading" data-reveal>{data.eyebrow && <span className="co-kicker">{data.eyebrow}</span>}<h2>{data.heading}</h2>{data.description && <p>{data.description}</p>}</div>; }

function Story({ data }) {
  return <section className="mk-container co-section co-story"><div className="co-story-media" data-reveal><img src={img(data.image, "/images/a4.jpg")} alt={alt(data.image)} /></div><div className="co-story-copy" data-reveal><Heading data={{ ...data, description: "" }}/><p className="co-longcopy">{data.description}</p><div className="co-mini-grid">{(data.highlights || []).map((x) => <article key={x.id || x.title}><span>✓</span><div><h3>{x.title}</h3><p>{x.text}</p></div></article>)}</div></div></section>;
}

function Cards({ data }) {
  return <section className="co-section co-soft" id="services"><div className="mk-container"><Heading data={data}/><div className="co-card-grid">{(data.items || []).map((x, i) => <article className="co-card" key={x.id || x.title} data-reveal><span className="co-card-num">{String(i + 1).padStart(2,"0")}</span>{x.image?.url && <img src={img(x.image)} alt={alt(x.image)} />}<h3>{x.title}</h3><p>{x.text}</p>{x.link?.href && <CmsLink href={x.link.href}>{x.link.label}<span aria-hidden="true"> →</span></CmsLink>}</article>)}</div></div></section>;
}

function Split({ data }) { return <section className="mk-container co-section co-split">{(data.items || []).map((x, i) => <article key={x.id || x.title} className={i % 2 ? "is-reverse" : ""} data-reveal><img src={img(x.image, "/images/a2.jpg")} alt={alt(x.image)}/><div>{x.eyebrow && <span className="co-kicker">{x.eyebrow}</span>}<h2>{x.title}</h2><p>{x.text}</p></div></article>)}</section>; }

function Timeline({ data }) { return <section className="mk-container co-section"><Heading data={data}/><ol className="co-timeline">{(data.items || []).map((x) => <li key={x.id || x.title} data-reveal><span>{x.marker}</span><div><h3>{x.title}</h3><p>{x.text}</p></div></li>)}</ol></section>; }

function Team({ data, page }) { const members = data.members || []; return <section className="mk-container co-section" id="team"><Heading data={data}/>{members.length ? <><div className="co-team-grid">{members.map((m) => <article key={m.id || m.name} className="co-team-card" data-reveal><img src={img(m.photo)} alt={alt(m.photo, m.name)}/><div><h3>{m.name}</h3><strong>{m.designation}</strong><p>{m.bio}</p><div className="co-socials">{m.linkedin?.href && <a href={m.linkedin.href} target="_blank" rel="noreferrer">LinkedIn</a>}{m.email?.href && <a href={m.email.href}>Email</a>}</div></div></article>)}</div>{page === "about" && <div className="co-team-action"><CmsLink className="co-btn is-primary" href="/team">Meet our team</CmsLink></div>}</> : <div className="co-empty" data-reveal><h3>Team profiles are being prepared</h3><p>Verified employee profiles will appear here once published by Karnish Tourism.</p></div>}</section>; }

function Faq({ data }) { const [open, setOpen] = useState(0); return <section className="co-section co-soft"><div className="mk-container co-faq-layout"><Heading data={data}/><div className="co-faqs">{(data.items || []).map((x,i) => <article key={x.id || x.question} className={open === i ? "is-open" : ""}><button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{x.question}</span><b>{open === i ? "−" : "+"}</b></button><div><p>{x.answer}</p></div></article>)}</div></div></section>; }

function Cta({ data, page }) { return <section className="mk-container co-section"><div className="co-cta" style={{"--co-bg": `url('${img(data.image)}')`}} data-reveal><div>{data.eyebrow && <span className="co-kicker is-light">{data.eyebrow}</span>}<h2>{data.heading}</h2><p>{data.description}</p><div className="co-actions">{data.primaryCta?.href && <CmsLink className="co-btn is-primary" href={partnerCtaHref(page, data.primaryCta.href)}>{data.primaryCta.label}</CmsLink>}{data.secondaryCta?.href && <CmsLink className="co-btn is-ghost" href={data.secondaryCta.href}>{data.secondaryCta.label}</CmsLink>}</div></div></div></section>; }

const renderers = { companyHero: Hero, companyStory: Story, companyCards: Cards, companySplit: Split, companyTimeline: Timeline, companyTeam: Team, companyFaq: Faq, companyCta: Cta, aboutStats: AboutStats, aboutFounder: AboutFounder, aboutAchievements: AboutAchievements, aboutTestimonials: AboutTestimonials, aboutLocations: AboutLocations, aboutPartners: AboutPartners, aboutServices: AboutServices, aboutDestinations: AboutDestinations, aboutValues: AboutValues, aboutEcosystem: AboutEcosystem, aboutWhy: AboutWhy };

export default function CompanyPage({ sections, page }) {
  return <main className={`co-page co-page-${page}`}>{(sections || []).filter((s) => s.enabled !== false).map((section) => { const Component = renderers[section.type]; return Component ? <Component key={section.id} data={section.data || {}} page={page} /> : null; })}{page === "partners" && <div id="existing-partners"><PartnersStrip id="company-partners" /></div>}</main>;
}
