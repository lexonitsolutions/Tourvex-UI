"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getVisaHome, listVisas } from "../../lib/visas";
import { ScrollTrigger, useReveal } from "../../lib/motion";
import { useApp } from "../AppProvider";
import VisaHero, { HeroSkeleton } from "./VisaHero";
import {
  CardSkeletons,
  IconClose,
  IconDoc,
  IconInfo,
  IconSearch,
  IconShield,
  StateMessage,
  VisaCard,
  plural,
} from "./VisaParts";

const STEPS = [
  [IconSearch, "Choose your country", "Find the visa you need and read the requirements, documents and typical processing time first."],
  [IconDoc, "Send your details", "Fill in a short enquiry with your nationality, travel dates and number of travellers."],
  [IconShield, "We guide you through", "Our team replies with the exact requirements and fee for your case, then helps you with each step."],
];

const SEARCH_DEBOUNCE_MS = 300;

/** Debounced server-side search; `state` is null while the box is empty. */
function useVisaSearch(query, currency) {
  const [state, setState] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const term = query.trim();

  useEffect(() => {
    if (!term) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(null);
      return undefined;
    }
    const controller = new AbortController();
    setState((prev) => ({ items: prev?.items || [], total: prev?.total || 0, loading: true, error: false, term }));
    const id = setTimeout(() => {
      listVisas({ q: term, limit: 60 }, { signal: controller.signal, currency })
        .then((res) => setState({ items: res.items || [], total: res.pagination?.total ?? res.items?.length ?? 0, loading: false, error: false, term }))
        .catch((err) => err.name !== "AbortError" && setState({ items: [], total: 0, loading: false, error: true, term }));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [term, attempt, currency]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

/** Own memoized component: typing re-renders only the finder and its results, never the sections below. */
const Finder = memo(function Finder({ suggestions, onResults }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const { currency } = useApp();
  const { state, retry } = useVisaSearch(query, currency);

  useEffect(() => {
    onResults(!!state);
  }, [state, onResults]);

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <section className="mk-container vis-finder-wrap" aria-labelledby="vis-finder-title">
      <div className="vis-finder" data-reveal>
        <div className="vis-finder-head">
          <h2 id="vis-finder-title">Visa finder</h2>
          <p>Type a country to see the visas we can help with.</p>
        </div>
        <form className="vis-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="vis-q" className="vis-sr">Where are you travelling to?</label>
          <IconSearch className="vis-search-ico" width="22" height="22" />
          <input
            id="vis-q"
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Where are you travelling to?"
            autoComplete="off"
            enterKeyHint="search"
            aria-controls="vis-results"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && query && clear()}
          />
          {query && (
            <button type="button" className="vis-search-clear" aria-label="Clear search" onClick={clear}>
              <IconClose width="16" height="16" />
            </button>
          )}
        </form>
        {suggestions.length > 0 && !query && (
          <div className="vis-suggest" role="group" aria-label="Popular countries">
            <span>Popular:</span>
            {suggestions.map((name) => (
              <button key={name} type="button" onClick={() => { setQuery(name); inputRef.current?.focus(); }}>{name}</button>
            ))}
          </div>
        )}
      </div>

      <div id="vis-results" className="vis-results" aria-busy={!!state?.loading}>
        <p className="vis-sr" role="status" aria-live="polite">
          {state && !state.loading && !state.error ? `${plural(state.total, "visa")} found for ${state.term}` : ""}
        </p>
        {state && (
          <>
            {!state.error && (
              <div className="vis-results-head">
                <h2>
                  {state.loading && !state.items.length ? "Searching..." : `${plural(state.total, "visa")} for "${state.term}"`}
                </h2>
                <button type="button" className="hol-link vis-link-btn" onClick={clear}>Clear search</button>
              </div>
            )}
            {state.error ? (
              <StateMessage title="We could not search visas" text="Something went wrong while searching. Please try again." action="Try again" onAction={retry} />
            ) : state.loading && !state.items.length ? (
              <div className="vis-grid"><CardSkeletons count={4} /></div>
            ) : state.items.length === 0 ? (
              <StateMessage
                title="No visas found"
                text={`We do not have a visa listed for "${state.term}" yet. Try another country, or ask our team and we will check for you.`}
                href="/contact"
                actionLabel="Ask our team"
              />
            ) : (
              <div className={`vis-grid${state.loading ? " is-busy" : ""}`}>
                {state.items.map((item, i) => (
                  <div className="vis-grid-item" key={item.slug} style={{ "--i": Math.min(i, 8) }}>
                    <VisaCard item={item} reveal={false} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

export default function VisasHome() {
  const { currency } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [searching, setSearching] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getVisaHome({ signal: controller.signal, currency })
      .then((home) => {
        setError(false);
        setData(home);
      })
      .catch((err) => err.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [attempt, currency]);

  useReveal(rootRef, data ? "ready" : "wait");
  useEffect(() => {
    if (!data) return undefined;
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, [data]);

  const retry = () => {
    setError(false);
    setData(null);
    setAttempt((n) => n + 1);
  };

  const suggestions = useMemo(() => {
    const seen = new Set();
    (data?.sections || []).forEach((s) => s.items.forEach((v) => seen.add(v.country)));
    return [...seen].slice(0, 6);
  }, [data]);

  const sections = data?.sections || [];
  const empty = data && !data.banners?.length && !sections.length;

  return (
    <div ref={rootRef} className="hol-page vis-page">
      {data?.banners?.length > 0 ? <VisaHero banners={data.banners} /> : !data && !error ? <HeroSkeleton /> : null}

      {data && !empty && <Finder suggestions={suggestions} onResults={setSearching} />}

      {error && (
        <div className="mk-container vis-section">
          <StateMessage
            title="We could not load visas"
            text="Something went wrong while fetching our visa list. Please check your connection and try again."
            action="Try again"
            onAction={retry}
          />
        </div>
      )}

      {empty && (
        <div className="mk-container vis-section">
          <StateMessage
            title="Visa services are coming soon"
            text="We are preparing our visa guides. In the meantime our team can help with your visa questions directly."
            href="/contact"
            actionLabel="Contact us"
          />
        </div>
      )}

      {!data && !error && (
        <section className="mk-container vis-section" aria-hidden="true">
          <div className="hol-head"><div className="hol-skel hol-skel-title" /></div>
          <div className="vis-grid"><CardSkeletons count={4} /></div>
        </section>
      )}

      {!searching &&
        sections.map((section) => (
          <section key={section.slug} className="mk-container vis-section" aria-labelledby={`vis-sec-${section.slug}`}>
            <div className="hol-head" data-reveal>
              <div>
                <h2 id={`vis-sec-${section.slug}`}>{section.title}</h2>
                {section.subtitle && <p className="hol-sub">{section.subtitle}</p>}
              </div>
            </div>
            <div className="vis-grid">
              {section.items.map((item) => (
                <div className="vis-grid-item" key={item.slug}><VisaCard item={item} /></div>
              ))}
            </div>
          </section>
        ))}

      {data && !empty && !searching && (
        <>
          <section className="vis-how" aria-labelledby="vis-how-title">
            <div className="mk-container">
              <h2 id="vis-how-title" data-reveal>How it works</h2>
              <ol className="vis-how-grid">
                {STEPS.map(([Icon, title, text], i) => (
                  <li key={title} data-reveal>
                    <span className="vis-how-ico" aria-hidden="true"><Icon width="26" height="26" /><b>{i + 1}</b></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mk-container vis-note-wrap" aria-labelledby="vis-note-title">
            <div className="vis-note" data-reveal>
              <span className="vis-note-ico" aria-hidden="true"><IconInfo width="24" height="24" /></span>
              <div>
                <h2 id="vis-note-title">Good to know</h2>
                <p>
                  Fees, requirements and processing times shown here are indicative. Rules change and depend on your
                  nationality, so we confirm the exact details with you when you send an enquiry. The price on each card
                  is our service fee, not the government or embassy fee.
                </p>
                <Link className="vis-note-link" href="/contact">Questions? Talk to our team</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
