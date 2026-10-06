"use client";

import { CmsLink } from "./CmsLink";
import { fmt } from "../lib/format";
import { memo, useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionShell";

const ADVANCE_MS = 6000;
const RESUME_MS = 8000;
const GAP = 12;

/**
 * Phone hero: horizontally snapping cards with the next one peeking in. The dot indicator is a single
 * moving dot (transform only) that follows the scroll position. Auto-advance runs only while the
 * carousel is on screen, the tab is visible and the visitor is not touching it.
 */
const MobileHero = memo(function MobileHero({ slides, content }) {
  const { loaded } = useMotion();
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const state = useRef({ visible: false, touchedAt: 0, raf: 0 });

  const pitch = () => {
    const first = track.current?.firstElementChild;
    return first ? first.getBoundingClientRect().width + GAP : 1;
  };

  const onScroll = () => {
    cancelAnimationFrame(state.current.raf);
    state.current.raf = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const next = Math.min(slides.length - 1, Math.max(0, Math.round(el.scrollLeft / pitch())));
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
      }
    });
  };

  const touch = () => {
    state.current.touchedAt = Date.now();
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const s = state.current;
    const io = new IntersectionObserver(([entry]) => (s.visible = entry.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(s.raf);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    const s = state.current;
    const id = setInterval(() => {
      const el = track.current;
      if (!el || !s.visible || document.hidden || Date.now() - s.touchedAt < RESUME_MS) return;
      const next = (indexRef.current + 1) % slides.length;
      el.scrollTo({ left: next * pitch(), behavior: "smooth" });
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, [loaded, slides.length]);

  return (
    <section className="mk-mh" aria-roledescription="carousel" aria-label={content.slidesAriaLabel}>
      <div className="mk-mh-track" ref={track} onScroll={onScroll} onTouchStart={touch} onTouchMove={touch} onPointerDown={touch} tabIndex={-1}>
        {slides.map((s, i) => (
          <article key={s.id} className="mk-mh-card" aria-roledescription="slide" aria-label={fmt(content.slideCounterLabel, { index: i + 1, total: slides.length })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image.url} alt={s.image.alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
            <div className="mk-mh-shade" />
            <div className="mk-mh-copy">
              <h2>{s.title}</h2>
              <p>{s.tagline}</p>
              <CmsLink className="mk-mh-btn" href={s.cta.href}>{s.cta.label}</CmsLink>
            </div>
            <div className="mk-mh-dots" aria-hidden="true">
              {slides.map((d) => <b key={d.id} />)}
              <i style={{ transform: `translate3d(${index * 14}px, 0, 0)` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export default MobileHero;
