"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import CurrencyNote from "../CurrencyNote";
import { RailSection } from "../holidays/HolidayParts";
import VisaEnquiry from "./VisaEnquiry";
import {
  ENTRIES_LABEL,
  Flag,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconClock,
  IconInfo,
  IconRepeat,
  IconShield,
  KIND_LABEL,
  VisaCard,
  money,
  tintFor,
} from "./VisaParts";

/* FAQ accordion ------------------------------------------------------- */

const FaqItem = memo(function FaqItem({ item, open, onToggle, id }) {
  return (
    <li className={`vis-faq${open ? " is-open" : ""}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-btn`} onClick={onToggle}>
          <span className="vis-faq-q">{item.question}</span>
          <IconChevron dir="down" className="vis-faq-chev" width="20" height="20" />
        </button>
      </h3>
      <div className="vis-faq-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}>
        <div className="vis-faq-clip">
          <p>{item.answer}</p>
        </div>
      </div>
    </li>
  );
});

function Faqs({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <ul className="vis-faqs">
      {faqs.map((item, i) => (
        <FaqItem key={item.question} id={`vis-faq-${i}`} item={item} open={openIndex === i} onToggle={() => setOpenIndex((o) => (o === i ? null : i))} />
      ))}
    </ul>
  );
}

/* Price card ------------------------------------------------------------ */

function PriceCard({ visa, onStart }) {
  return (
    <div className="vis-price-card" data-reveal>
      <p className="vis-pc-label">Our service fee, from</p>
      {visa.startingPrice ? (
        <div className="vis-pc-price"><strong>{money(visa.startingPrice)}</strong><span>per traveller</span></div>
      ) : (
        <div className="vis-pc-price"><strong className="is-text">Fee on request</strong></div>
      )}
      <ul className="vis-pc-facts">
        {visa.processing && <li><IconClock width="18" height="18" />Processing: {visa.processing}</li>}
        {visa.validity && <li><IconCalendar width="18" height="18" />Validity: {visa.validity}</li>}
        <li><IconShield width="18" height="18" />{KIND_LABEL[visa.kind] || visa.kind} visa</li>
      </ul>
      <button type="button" className="mk-btn mk-btn-block vis-start" onClick={onStart}>Start enquiry</button>
      <p className="vis-pc-note">Government or embassy fees are separate and confirmed when you enquire. Amounts are indicative.</p>
      <p className="vis-pc-note"><CurrencyNote /></p>
    </div>
  );
}

/* Page ------------------------------------------------------------------ */

export default function VisaDetail({ visa, related }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const paragraphs = (visa.description || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  useReveal(rootRef, visa.slug);
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [visa.slug]);

  return (
    <div className="hol-page vis-page vis-detail" ref={rootRef}>
      <div className="mk-container">
        <nav className="hol-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/visas">Visas</Link></li>
            <li aria-current="page">{visa.title}</li>
          </ol>
        </nav>

        <header className="vis-banner" style={{ "--vh": tintFor(visa.countryCode) }} data-reveal>
          <span className="vis-banner-mark" aria-hidden="true">{String(visa.countryCode || "").toUpperCase()}</span>
          <Flag code={visa.countryCode} className="is-banner" />
          <div className="vis-banner-copy">
            <p className="vis-eyebrow">{visa.country} · {KIND_LABEL[visa.kind] || visa.kind}</p>
            <h1>{visa.title}</h1>
            <ul className="vis-banner-chips">
              {visa.processing && <li><IconClock width="16" height="16" /><span><small>Processing</small>{visa.processing}</span></li>}
              {visa.validity && <li><IconCalendar width="16" height="16" /><span><small>Validity</small>{visa.validity}</span></li>}
              {visa.entries && <li><IconRepeat width="16" height="16" /><span><small>Entries</small>{ENTRIES_LABEL[visa.entries] || visa.entries}</span></li>}
              {visa.stay && <li><IconShield width="16" height="16" /><span><small>Stay</small>{visa.stay}</span></li>}
            </ul>
          </div>
        </header>

        <div className="vis-detail-grid">
          <div className="vis-detail-main">
            {(visa.summary || paragraphs.length > 0) && (
              <section className="hol-block vis-first" aria-labelledby="vis-overview" data-reveal>
                <h2 id="vis-overview">Overview</h2>
                {visa.summary && <p className="hol-lead">{visa.summary}</p>}
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </section>
            )}

            {visa.highlights?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-highlights" data-reveal>
                <h2 id="vis-highlights">Highlights</h2>
                <ul className="vis-highlights">
                  {visa.highlights.map((h) => (
                    <li key={h}><span aria-hidden="true"><IconCheck width="14" height="14" strokeWidth="3" /></span>{h}</li>
                  ))}
                </ul>
              </section>
            )}

            {visa.requirements?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-requirements" data-reveal>
                <h2 id="vis-requirements">Requirements</h2>
                <ul className="vis-list">
                  {visa.requirements.map((r) => (
                    <li key={r}><span aria-hidden="true"><IconChevron width="13" height="13" strokeWidth="3" /></span>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {visa.documents?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-documents" data-reveal>
                <h2 id="vis-documents">Documents checklist</h2>
                <ul className="vis-docs">
                  {visa.documents.map((d) => (
                    <li key={d}><span aria-hidden="true" /> {d}</li>
                  ))}
                </ul>
              </section>
            )}

            {visa.steps?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-steps" data-reveal>
                <h2 id="vis-steps">How it works</h2>
                <ol className="vis-steps">
                  {visa.steps.map((s, i) => (
                    <li key={s.title}>
                      <span className="vis-step-num" aria-hidden="true">{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {visa.faqs?.length > 0 && (
              <section className="hol-block" aria-labelledby="vis-faqs" data-reveal>
                <h2 id="vis-faqs">Frequently asked questions</h2>
                <Faqs faqs={visa.faqs} />
              </section>
            )}

            {visa.notes && (
              <aside className="vis-notes" aria-label="Important note" data-reveal>
                <IconInfo width="22" height="22" />
                <p>{visa.notes}</p>
              </aside>
            )}
          </div>

          <aside className="vis-detail-aside" aria-label="Fee and enquiry">
            <PriceCard visa={visa} onStart={openSheet} />
          </aside>
        </div>
      </div>

      {related?.length > 0 && (
        <RailSection id="vis-related" title="Similar visas" subtitle="Other visas you may be looking for." label="similar visas">
          {related.map((item) => (
            <div className="hol-rail-item vis-rail-item" key={item.slug}><VisaCard item={item} /></div>
          ))}
        </RailSection>
      )}

      <div className="vis-mobile-bar">
        <div>
          <span>Service fee from</span>
          <strong>{visa.startingPrice ? money(visa.startingPrice) : "On request"}</strong>
        </div>
        <button type="button" className="mk-btn" onClick={openSheet}>Start enquiry</button>
      </div>

      <VisaEnquiry visa={visa} open={open} onClose={closeSheet} />
    </div>
  );
}
