"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "../../lib/motion";
import { useMotion } from "../MotionShell";
import { Flag } from "./VisaParts";

const SLIDE_MS = 6500;

/** Splits text into per-letter spans so GSAP can stagger them (words get a margin, not a space character). */
function Letters({ text }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span className="vis-word" key={w} aria-hidden="true">
          {word.split("").map((ch, i) => (
            <span className="vis-char-mask" key={i}>
              <span className="vis-char">{ch}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function HeroSkeleton() {
  return (
    <section className="mk-container vis-hero-wrap" aria-hidden="true">
      <div className="vis-slide hol-skel vis-hero-skel" />
    </section>
  );
}

/**
 * Scroll-snap carousel of brand-gradient cards (the next card peeks on phones). Own memoized component so the
 * timer re-renders only the hero. Auto-advance pauses while off screen, hovered, focused or touched.
 */
const VisaHero = memo(function VisaHero({ banners }) {
  const { loaded } = useMotion();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const slideRef = useRef(0);
  const introDone = useRef(false);
  const count = banners.length;

  const goTo = useCallback((i) => {
    const track = trackRef.current;
    const el = track?.children[i];
    if (!el) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    track.scrollTo({ left: el.offsetLeft - pad, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  // The track is the source of truth: dots follow whatever the scroll position (drag, swipe, timer) lands on.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    const measure = () => {
      const kids = Array.from(track.children);
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      let best = 0;
      let bestD = Infinity;
      kids.forEach((k, i) => {
        const d = Math.abs(k.offsetLeft - pad - track.scrollLeft);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best !== slideRef.current) {
        slideRef.current = best;
        setSlide(best);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  const running = loaded && visible && !paused && count > 1;

  useEffect(() => {
    if (!running) return undefined;
    const id = setTimeout(() => goTo((slideRef.current + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [running, slide, tick, count, goTo]);

  // Hide the copy before paint so it can animate in once the preloader lifts.
  useIsoLayoutEffect(() => {
    if (loaded) return;
    const el = wrapRef.current;
    if (el) gsap.set(el.querySelectorAll(".vis-copy, .vis-art"), { autoAlpha: 0 });
  }, [loaded]);

  // Intro (first slide) and letter-by-letter reveal whenever a slide becomes the active one.
  useEffect(() => {
    if (!loaded) return undefined;
    const wrap = wrapRef.current;
    const reduced = prefersReducedMotion();
    const first = !introDone.current;
    introDone.current = true;
    // On phones the next card is already visible, so replaying its title would flash; animate on intro only.
    const phone = window.matchMedia("(max-width: 760px)").matches;
    const ctx = gsap.context(() => {
      gsap.set(".vis-copy, .vis-art", { autoAlpha: 1 });
      if (reduced || (!first && phone)) return;
      const active = `.vis-slide:nth-child(${slide + 1})`;
      const tl = gsap.timeline({ delay: first ? 0.45 : 0.05 });
      if (first) tl.fromTo(`${active}`, { scale: 0.97, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: "power4.out", clearProps: "transform,opacity" }, 0);
      tl.fromTo(`${active} .vis-char`, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.035, ease: "power4.out" }, first ? 0.2 : 0)
        .fromTo(`${active} .vis-eyebrow, ${active} .vis-hero-tag, ${active} .vis-hero-sub`, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.6")
        .fromTo(`${active} .mk-btn`, { y: 18, autoAlpha: 0, scale: 0.92 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, "-=0.5")
        .fromTo(`${active} .vis-art`, { y: 30, rotate: 5, autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out" }, 0.1);
    }, wrap);
    return () => ctx.revert();
  }, [slide, loaded]);

  if (!count) return null;

  return (
    <section
      className={`mk-container vis-hero-wrap${running ? "" : " is-idle"}`}
      ref={wrapRef}
      aria-roledescription="carousel"
      aria-label="Featured visas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setTick((t) => t + 1); }}
      onFocus={() => setPaused(true)}
      onBlur={() => { setPaused(false); setTick((t) => t + 1); }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => { setPaused(false); setTick((t) => t + 1); }}
    >
      <div className="vis-track" ref={trackRef}>
        {banners.map((b, i) => (
          <div
            key={b.id || i}
            className={`vis-slide is-v${i % 3}${i === slide ? " is-active" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            <span className="vis-slide-mark" aria-hidden="true">{String(b.countryCode || "").toUpperCase()}</span>
            <div className="vis-copy">
              <p className="vis-eyebrow">{b.eyebrow || "Karnish Visas"}</p>
              <h1 className="vis-hero-title"><Letters text={b.title} /></h1>
              {b.subtitle && <p className="vis-hero-tag">{b.subtitle}</p>}
              {b.description && <p className="vis-hero-sub">{b.description}</p>}
              <Link className="mk-btn mk-btn-light vis-hero-cta" href={b.ctaHref || "/visas"} tabIndex={i === slide ? undefined : -1}>
                {b.ctaLabel || "Check requirements"}
              </Link>
            </div>
            <div className="vis-art" aria-hidden="true"><Flag code={b.countryCode} className="is-hero" /></div>
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="vis-dots" role="group" aria-label="Choose banner">
          {banners.map((b, i) => (
            <button
              key={b.id || i}
              type="button"
              aria-current={i === slide}
              aria-label={`Show banner ${i + 1}: ${b.title}`}
              className={i === slide ? "is-active" : ""}
              onClick={() => goTo(i)}
            >
              <i key={i === slide ? tick : 0} style={i === slide && loaded ? { animationDuration: `${SLIDE_MS}ms` } : undefined} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
});

export default VisaHero;
