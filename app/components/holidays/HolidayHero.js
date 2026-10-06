"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from "../../lib/motion";
import { useMotion } from "../MotionShell";
import "../../holidays.css";

const SLIDE_MS = 6500;

/** Splits text into per-letter spans so GSAP can stagger them. */
function Letters({ text }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, w) => (
        // Words are separated by a trailing margin (see .hol-word in CSS), not a space character: the space was
        // collapsed in this heading, and a trailing gap never indents a wrapped line.
        <span className="hol-word" key={w} aria-hidden="true">
          {word.split("").map((ch, i) => (
            <span className="hol-char-mask" key={i}>
              <span className="hol-char">{ch}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function HeroSkeleton() {
  return (
    <section className="mk-container hol-hero-wrap" aria-hidden="true">
      <div className="hol-hero hol-skel" />
    </section>
  );
}

/**
 * Own memoized component: the slide timer re-renders only the hero, never the sections below.
 * The slow zoom and the progress animation pause while the hero is off screen.
 */
const HolidayHero = memo(function HolidayHero({ banners }) {
  const { loaded } = useMotion();
  const [slide, setSlide] = useState(0);
  const heroRef = useRef(null);
  const count = banners.length;
  const banner = banners[slide] || banners[0];

  useEffect(() => {
    if (!loaded || count < 2) return undefined;
    const id = setTimeout(() => setSlide((s) => (s + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [slide, loaded, count]);

  // Hide the copy before paint so it can animate in once the preloader lifts.
  useIsoLayoutEffect(() => {
    if (loaded) return;
    const el = heroRef.current;
    if (el) gsap.set(el.querySelectorAll(".hol-hero-copy"), { autoAlpha: 0 });
  }, [loaded]);

  // Frame reveal, scroll parallax, and off-screen pausing.
  useEffect(() => {
    if (!loaded) return undefined;
    const reduced = prefersReducedMotion();
    const hero = heroRef.current;
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.fromTo(
        ".hol-hero",
        { clipPath: "inset(6% 4% 6% 4% round 40px)", scale: 0.97 },
        { clipPath: "inset(0% 0% 0% 0% round 22px)", scale: 1, duration: 1.4, ease: "power4.out", clearProps: "clipPath,transform" }
      );
      gsap.to(".hol-hero-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".hol-hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hol-hero-copy", {
        yPercent: -16,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: ".hol-hero", start: "top top", end: "bottom 30%", scrub: true },
      });
    }, heroRef);
    const io = new IntersectionObserver(([entry]) => hero.classList.toggle("is-offscreen", !entry.isIntersecting));
    io.observe(hero);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [loaded]);

  // Letter-by-letter title reveal on every slide change.
  useEffect(() => {
    if (!loaded) return undefined;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: slide === 0 ? 0.55 : 0.1 });
      tl.set(".hol-hero-copy", { autoAlpha: 1 });
      if (reduced) return;
      tl.fromTo(".hol-hero-copy .hol-char", { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.035, ease: "power4.out" })
        .fromTo(".hol-hero-tag, .hol-hero-sub, .hol-eyebrow", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }, "-=0.6")
        .fromTo(".hol-hero-copy .mk-btn", { y: 20, autoAlpha: 0, scale: 0.9 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, "-=0.5");
    }, heroRef);
    return () => ctx.revert();
  }, [slide, loaded]);

  // The preloader re-measures the page; keep trigger positions right after the frame reveal.
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 1600);
    return () => clearTimeout(id);
  }, []);

  if (!banner) return null;

  return (
    <section className="mk-container hol-hero-wrap" ref={heroRef} aria-roledescription="carousel" aria-label="Featured holidays">
      <div className="hol-hero">
        <div className="hol-hero-bg">
          {banners.map((b, i) => (
            <div
              key={b.id || i}
              className={`hol-slide${i === slide ? " is-active" : ""}`}
              style={{ backgroundImage: `url("${b.image}")` }}
              aria-hidden={i !== slide}
            />
          ))}
        </div>
        <div className="hol-hero-shade" />
        <div className="hol-hero-copy" key={slide} aria-live="polite">
          <p className="hol-eyebrow">{banner.eyebrow || "Karnish Holidays"}</p>
          <h1><Letters text={banner.title} /></h1>
          {banner.subtitle && <p className="hol-hero-tag">{banner.subtitle}</p>}
          {banner.description && <p className="hol-hero-sub">{banner.description}</p>}
          <Link className="mk-btn mk-btn-light hol-hero-cta" href={banner.ctaHref || "/holidays"}>
            {banner.ctaLabel || "Book Now"}
          </Link>
        </div>
        {count > 1 && (
          <div className="hol-dots" role="tablist" aria-label="Choose banner">
            {banners.map((b, i) => (
              <button
                key={b.id || i}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={b.title}
                className={i === slide ? "is-active" : ""}
                onClick={() => setSlide(i)}
              >
                <i style={i === slide && loaded ? { animationDuration: `${SLIDE_MS}ms` } : undefined} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default HolidayHero;
