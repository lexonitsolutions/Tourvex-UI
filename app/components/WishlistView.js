"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getHoliday, isNotFound, subscribeWishlist, toggleWishlist } from "../lib/holidays";
import { useApp } from "./AppProvider";
import { CardSkeletons, HolidayCard } from "./holidays/HolidayParts";

const WISHLIST_KEY = "tourvex.wishlistHoliday";
function readRaw() {
  try {
    return window.localStorage.getItem(WISHLIST_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function parseSlugs(raw) {
  if (raw == null) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function HeartButton({ slug, title }) {
  return (
    <button type="button" className="mk-wl-heart" aria-label={`Remove ${title} from wishlist`} onClick={() => toggleWishlist(slug)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
    </button>
  );
}

function MissingCard({ slug }) {
  return (
    <li className="mk-wl-card mk-wl-gone">
      <div className="mk-wl-body">
        <h3>Package unavailable</h3>
        <span className="mk-wl-meta">This holiday is no longer available.</span>
      </div>
      <HeartButton slug={slug} title="unavailable package" />
    </li>
  );
}

function SignInPrompt() {
  return (
    <div className="mk-pg-card mk-pg-center">
      <span className="mk-pg-ico" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      </span>
      <h2>Sign in to see your wishlist</h2>
      <p>Save holidays you love with the heart button and find them here on any visit.</p>
      <div className="mk-pg-actions">
        <Link className="mk-btn" href="/sign-in?redirect_url=%2Fwishlist&reason=wishlist">Log in</Link>
        <Link className="mk-btn mk-btn-ghost" href="/sign-up?redirect_url=%2Fwishlist&reason=wishlist">Create account</Link>
      </div>
    </div>
  );
}

export default function WishlistView() {
  const { user, ready, currency } = useApp();
  // null on the server and during hydration, so the page never flashes an empty state.
  const raw = useSyncExternalStore(subscribeWishlist, readRaw, () => null);
  const slugs = useMemo(() => parseSlugs(raw), [raw]);
  const [results, setResults] = useState({});
  const requested = useRef(new Set());
  const mounted = useRef(false);

  // Keyed by currency too: switching currency refetches every saved holiday while the old cards stay visible.
  const load = useCallback((slug, cur) => {
    const id = `${cur}:${slug}`;
    if (requested.current.has(id)) return;
    requested.current.add(id);
    const done = (value) => {
      if (value.state === "error") requested.current.delete(id); // allow a retry
      if (!mounted.current) return;
      setResults((prev) => (value.state === "error" && prev[slug]?.state === "ok" ? prev : { ...prev, [slug]: value }));
    };
    getHoliday(slug, { currency: cur })
      .then((data) => done({ state: "ok", pkg: data.package }))
      .catch((error) => done({ state: isNotFound(error) ? "missing" : "error" }));
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    slugs?.forEach((slug) => load(slug, currency));
  }, [slugs, load, currency]);

  const retry = () => {
    slugs.forEach((slug) => {
      if (results[slug]?.state === "error") load(slug, currency);
    });
  };

  const failed = slugs?.some((slug) => results[slug]?.state === "error");

  let body;
  if (ready && !user) {
    body = <SignInPrompt />;
  } else if (!slugs || !ready) {
    body = (
      <ul className="hol-grid" aria-busy="true">
        <CardSkeletons count={4} />
      </ul>
    );
  } else if (!slugs.length) {
    body = (
      <div className="mk-pg-card mk-pg-center">
        <span className="mk-pg-ico" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </span>
        <h2>Your wishlist is empty</h2>
        <p>Tap the heart on a holiday package to save it here for later.</p>
        <div className="mk-pg-actions">
          <Link className="mk-btn" href="/holidays">Browse holidays</Link>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        {failed && (
          <p className="mk-error" role="alert">
            Some saved holidays could not be loaded.{" "}
            <button type="button" className="mk-pg-linkbtn" onClick={retry}>Try again</button>
          </p>
        )}
        <ul className="hol-grid">
          {slugs.map((slug, i) => {
            const entry = results[slug];
            if (entry?.state === "ok") return <li className="hol-grid-item" key={slug} style={{ "--i": i % 8 }}><HolidayCard item={entry.pkg} reveal={false} /></li>;
            if (entry?.state === "missing") return <MissingCard key={slug} slug={slug} />;
            if (entry?.state === "error") return null;
            return <li key={slug} className="hol-grid-item" aria-hidden="true"><CardSkeletons count={1} /></li>;
          })}
        </ul>
      </>
    );
  }

  return (
    <section className="mk-container mk-pg">
      <h1 className="mk-pg-title">Wishlist</h1>
      {body}
    </section>
  );
}
