"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/motion";

const MotionContext = createContext({ loaded: false, setScrollLocked: () => {} });
export const useMotion = () => useContext(MotionContext);

const BRAND = "KARNISH".split("");

function Preloader({ onDone }) {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const path = el.querySelector("path");
    const letters = el.querySelectorAll(".mk-loader-char");
    const bar = el.querySelector(".mk-loader-bar i");
    const label = el.querySelector(".mk-loader-inner p");
    const curve = "M0 502S175 272 500 272s500 230 500 230V0H0Z";
    const flat = "M0 2S175 1 500 1s500 1 500 1V0H0Z";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: onDone });
      tl.fromTo(letters, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: "power4.out" })
        .fromTo(label, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, "-=0.5")
        .to(".mk-loader-inner", { y: -90, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.1")
        .to(path, { duration: 0.5, attr: { d: curve }, ease: "power2.in" }, "<0.1")
        .to(path, { duration: 0.5, attr: { d: flat }, ease: "power2.out" })
        .to(el, { yPercent: -110, duration: 0.8, ease: "power3.inOut" }, "<")
        .call(() => window.dispatchEvent(new Event("mk:revealed")), null, "<0.25");
      // Phones: the same sequence, played faster so it never feels heavy.
      if (window.matchMedia("(max-width: 760px)").matches) tl.timeScale(1.6);
    }, root);
    return () => ctx.revert();
  }, [onDone]);

  return (
    <div className="mk-loader" ref={root} aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <path d="M0,1005S175,995,500,995s500,5,500,5V0H0Z" />
      </svg>
      <div className="mk-loader-inner">
        <div className="mk-loader-text">
          {BRAND.map((c, i) => (
            <span key={i} className="mk-loader-mask">
              <span className="mk-loader-char">{c}</span>
            </span>
          ))}
        </div>
        <p>Tourism</p>
        <div className="mk-loader-bar"><i /></div>
      </div>
    </div>
  );
}

export default function MotionShell({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const lenisRef = useRef(null);
  // Must keep the same identity across renders: Preloader's animation effect depends on it, and the
  // page-reveal event re-renders this component mid-animation. A fresh function here used to reset
  // the curtain and replay the whole loader a second time.
  const hideLoader = useCallback(() => setShowLoader(false), []);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  // Overlays (e.g. the account panel) pause smooth scrolling while open; never resume it mid-preloader.
  const setScrollLocked = useCallback((locked) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (locked) lenis.stop();
    else if (loadedRef.current) lenis.start();
  }, []);

  // Smooth scrolling, synced with ScrollTrigger.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.stop(); // locked until the preloader lifts
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onRevealed = () => {
      setLoaded(true);
      lenisRef.current?.start();
    };
    window.addEventListener("mk:revealed", onRevealed);
    // Failsafe: never leave visitors behind the loader if the animation stalls.
    const failsafe = setTimeout(() => {
      onRevealed();
      hideLoader();
    }, 8000);
    return () => {
      clearTimeout(failsafe);
      window.removeEventListener("mk:revealed", onRevealed);
    };
  }, [hideLoader]);

  return (
    <MotionContext.Provider value={{ loaded, setScrollLocked }}>
      <div className={`mk ${loaded ? "mk-loaded" : "mk-preloading"}`}>
        {showLoader && <Preloader onDone={hideLoader} />}
        {children}
      </div>
    </MotionContext.Provider>
  );
}
