"use client";

import Link from "next/link";
import { CmsLink } from "./CmsLink";
import { useHeaderContent } from "./ContentProvider";
import { InlineRichText } from "./RichText";
import { fmt } from "../lib/format";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { holdAmbient } from "../lib/motion";
import AccountDrawer from "./AccountDrawer";
import { CartLink, CartWatcher } from "./CartWatcher";
import { useApp } from "./AppProvider";
import LocaleModal from "./LocaleModal";
import { flagSrc } from "../lib/currencies";
import { buildTabs, isTabCurrent } from "./navTabs";
import MegaMenu from "./MegaMenu";
import { Search } from "lucide-react";
import "../mega-menu.css";

function LocaleButton({ onOpen }) {
  const { currency } = useApp();
  const labels = useHeaderContent().labels;
  return (
    <button
      type="button"
      className="mk-pill mk-locale-pill"
      aria-haspopup="dialog"
      onClick={onOpen}
      aria-label={fmt(labels.localeAriaLabel, { currency })}
    >
      <img className="mk-pill-flag" src={flagSrc(currency)} alt="" width="22" height="16" />
      {fmt(labels.localeLabel, { currency })}
    </button>
  );
}

function AccountMenu({ onOpenLocale }) {
  const { user } = useApp();
  const labels = useHeaderContent().labels;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const initial = user ? (user.firstName || user.email || "?").charAt(0).toUpperCase() : null;

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("mk:open-account", onOpen);
    return () => window.removeEventListener("mk:open-account", onOpen);
  }, []);

  return (
    <>
      <button
        type="button"
        className="mk-avatar"
        aria-label={labels.accountAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {initial || (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </button>
      <AccountDrawer open={open} onClose={close} onOpenLocale={onOpenLocale} />
    </>
  );
}

function Dock({ openMega, closeMega }) {
  const header = useHeaderContent();
  const tabs = useMemo(() => buildTabs(header.tabs), [header.tabs]);
  const dock = useRef(null);
  const [ind, setInd] = useState({ x: 0, w: 0, visible: false, snap: true });
  const pathname = usePathname();
  const isCurrent = (tab) => isTabCurrent(tab, pathname);

  const point = useCallback((e) => {
    const box = dock.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (!box) return;
    setInd((prev) => ({ x: r.left - box.left, w: r.width, visible: true, snap: !prev.visible }));
  }, []);

  return (
    <nav
      className="mk-dock"
      aria-label={header.dockAriaLabel}
      ref={dock}
      onMouseLeave={() => {
        setInd((prev) => ({ ...prev, visible: false, snap: false }));
        closeMega();
      }}
    >
      <span
        className={`mk-dock-glow${ind.snap ? " is-snap" : ""}${ind.visible ? " is-visible" : ""}`}
        aria-hidden="true"
        style={{ transform: `translate3d(${ind.x}px, 0, 0)`, width: ind.w }}
      />
      {tabs.map((tab) => (
        <CmsLink
          key={tab.id}
          href={tab.href}
          className={`mk-dock-item${isCurrent(tab) ? " is-current" : ""}`}
          aria-current={isCurrent(tab) ? "page" : undefined}
          onMouseEnter={(e) => {
            point(e);
            if (tab.mega) openMega(tab.megaMenu);
            else closeMega();
          }}
          onFocus={(e) => {
            point(e);
            if (tab.mega) openMega(tab.megaMenu);
            else closeMega();
          }}
        >
          {tab.icon}
          <span className="mk-dock-label">{tab.label}</span>
        </CmsLink>
      ))}
    </nav>
  );
}

export default function SiteHeader() {
  const header = useHeaderContent();
  const [engaged, setEngaged] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState("default");
  const closeTimer = useRef(null);
  const headerRef = useRef(null);

  const openLocale = useCallback(() => setLocaleOpen(true), []);
  const closeLocale = useCallback(() => setLocaleOpen(false), []);

  const openMega = useCallback((menu = "default") => {
    clearTimeout(closeTimer.current);
    setMegaMenu(menu);
    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setMegaOpen(false);
    }, 180);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // While the pointer is in the header, pause the hero's ambient loops so nothing competes with the
  // menu/highlight transitions underneath it. They resume the moment the pointer leaves.
  useEffect(() => {
    holdAmbient("header", engaged);
    return () => holdAmbient("header", false);
  }, [engaged]);

  // The mobile "More" sheet opens the language and currency dialog through this event.
  useEffect(() => {
    window.addEventListener("mk:open-locale", openLocale);
    return () => window.removeEventListener("mk:open-locale", openLocale);
  }, [openLocale]);

  useEffect(() => {
    let frame = 0;
    let scrollStopTimer = 0;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const supportsScrollEnd = "onscrollend" in window;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealHeader = () => {
      window.clearTimeout(scrollStopTimer);
      scrollStopTimer = window.setTimeout(() => {
        headerRef.current?.classList.remove("is-scrolling");
      }, 100);
    };

    const updateHeader = () => {
      frame = 0;
      const currentScrollY = window.scrollY;
      const rawProgress = reduceMotion ? 0 : Math.min(Math.max(currentScrollY / 96, 0), 1);
      // Smoothstep keeps both ends of the morph soft without adding delayed, springy motion.
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      headerRef.current?.style.setProperty("--mk-header-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      const isAtTop = currentScrollY <= 4;

      if (!frame) frame = window.requestAnimationFrame(updateHeader);

      if (isAtTop) {
        // Boundary scroll events must never hide or delay the navbar at the page top.
        window.clearTimeout(scrollStopTimer);
        headerRef.current?.classList.remove("is-scrolling");
        headerRef.current?.classList.add("is-at-top");
      } else if (scrollDelta >= 1) {
        window.clearTimeout(scrollStopTimer);
        headerRef.current?.classList.remove("is-at-top");
        headerRef.current?.classList.add("is-scrolling");
        // Native scrollend avoids false "stops" between trackpad/wheel momentum events.
        if (!supportsScrollEnd) revealHeader();
      }

      lastScrollY = Math.max(0, currentScrollY);
    };

    updateHeader();
    if (window.scrollY <= 4) {
      headerRef.current?.classList.add("is-at-top");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) window.addEventListener("scrollend", revealHeader, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (supportsScrollEnd) window.removeEventListener("scrollend", revealHeader);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(scrollStopTimer);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="mk-header"
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => {
        setEngaged(false);
        closeMega();
      }}
    >
      <div className="mk-container mk-header-row" style={{ position: "relative" }}>
        <Link href="/" className="mk-logo" aria-label={header.logoAriaLabel}>
          <img src={header.logo.url} alt={header.logo.alt} />
        </Link>

        {/* Categories dock */}
        <Dock openMega={openMega} closeMega={closeMega} />

        {/* Search for Holidays input pill */}
        <Link
          href="/search"
          className="mk-header-search-pill mk-hide-md"
          aria-label={header.search?.ariaLabel || "Search for holidays"}
        >
          <Search size={14} className="mk-header-search-icon" aria-hidden="true" />
          <span className="mk-header-search-text">Search for Holidays</span>
        </Link>

        {/* Right header actions */}
        <div className="mk-header-actions">
          <CmsLink className="mk-pill mk-hide-md" href={header.help.href}>{header.help.label}</CmsLink>
          <LocaleButton onOpen={openLocale} />
          <AccountMenu onOpenLocale={openLocale} />
          <CartLink />
        </div>

        {/* Full-width Mega Menu Dropdown */}
        <MegaMenu
          isOpen={megaOpen}
          menu={megaMenu}
          onMouseEnter={() => openMega(megaMenu)}
          onMouseLeave={closeMega}
          onClose={() => setMegaOpen(false)}
        />
      </div>
      <CartWatcher />
      <LocaleModal open={localeOpen} onClose={closeLocale} />
    </header>
  );
}
