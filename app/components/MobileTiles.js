"use client";

import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { holdAmbient } from "../lib/motion";
import { useMotion } from "./MotionShell";
import { useHeaderContent } from "./ContentProvider";
import { CmsLink } from "./CmsLink";
import { Icon, NAV_ICONS, buildTabs, isTabCurrent } from "./navTabs";

const MoreIcon = (
  <Icon>
    <circle cx="6" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="18" cy="12" r="1.4" />
  </Icon>
);

const LOCALE_ICON = <Icon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" /></Icon>;

/**
 * "More" bottom sheet. Same approach as LocaleModal: built hidden after hydration and portalled into
 * the .mk root, so opening is only a class toggle (transform) and closing plays the same motion backwards.
 */
const MoreSheet = memo(function MoreSheet({ open, onClose, copy }) {
  const { setScrollLocked } = useMotion();
  const [host, setHost] = useState(null);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(document.querySelector(".mk"));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    setScrollLocked(true);
    holdAmbient("more", true);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const scrim = document.querySelector(".mk-sheet-scrim");
    const block = (e) => e.preventDefault();
    scrim?.addEventListener("touchmove", block, { passive: false });
    const focusTimer = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      clearTimeout(focusTimer);
      setScrollLocked(false);
      holdAmbient("more", false);
      document.removeEventListener("keydown", onKey);
      scrim?.removeEventListener("touchmove", block);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, setScrollLocked]);

  if (!host) return null;

  const openLocale = () => {
    onClose();
    setTimeout(() => window.dispatchEvent(new Event("mk:open-locale")), 260);
  };

  return createPortal(
    <div className={`mk-sheet${open ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="mk-sheet-scrim" aria-label={copy.closeLabel} tabIndex={-1} onClick={onClose} />
      <div className="mk-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="mk-sheet-title">
        <span className="mk-sheet-grab" aria-hidden="true" />
        <div className="mk-sheet-head">
          <h2 id="mk-sheet-title">{copy.sheetTitle}</h2>
          <button ref={closeRef} type="button" className="mk-sheet-close" onClick={onClose} aria-label={copy.closeLabel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
        </div>
        <ul className="mk-sheet-list">
          {copy.moreLinks
            .filter(
              (item) =>
                item?.icon !== "yachts" &&
                !item?.link?.href?.toLowerCase().includes("yacht") &&
                item?.link?.label?.toLowerCase() !== "yachts"
            )
            .map((item) => (
            <li key={item.id}>
              <CmsLink className="mk-sheet-row" href={item.link.href} onClick={onClose}>
                <span className="mk-sheet-ico">{NAV_ICONS[item.icon]}</span>
                <span className="mk-sheet-label">{item.link.label}</span>
                <svg className="mk-sheet-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </CmsLink>
            </li>
          ))}
          <li>
            <button type="button" className="mk-sheet-row" aria-haspopup="dialog" onClick={openLocale}>
              <span className="mk-sheet-ico">{LOCALE_ICON}</span>
              <span className="mk-sheet-label">{copy.localeRowLabel}</span>
              <svg className="mk-sheet-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>,
    host
  );
});

/** Rounded category tiles under the mobile header, then "More" (hidden on larger screens by CSS). */
export default function MobileTiles() {
  const header = useHeaderContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const tiles = useMemo(() => buildTabs(header.tabs).filter((tab) => tab.mobileTile), [header.tabs]);
  const moreIndex = tiles.length;

  const routeIndex = useMemo(() => {
    if (open) return moreIndex;
    for (let i = 0; i < tiles.length; i++) {
      if (isTabCurrent(tiles[i], pathname)) return i;
    }
    return -1;
  }, [pathname, open, tiles, moreIndex]);
  const [optimisticIndex, setOptimisticIndex] = useState(routeIndex);

  useEffect(() => {
    setOptimisticIndex(routeIndex);
  }, [routeIndex]);

  const effectiveIndex = optimisticIndex !== -1 ? optimisticIndex : routeIndex;

  const handleTileClick = useCallback((idx) => {
    setOptimisticIndex(idx);
  }, []);

  const copy = header.mobile;

  return (
    <>
      <nav className="mk-tiles" aria-label={copy.tilesAriaLabel}>
        <ul className="mk-tiles-track">
          <li
            className="mk-tiles-glass-hl"
            aria-hidden="true"
            style={{
              transform: `translate3d(calc(${Math.max(effectiveIndex, 0)} * (100% + var(--mk-tile-gap, 8px))), 0, 0)`,
              opacity: effectiveIndex >= 0 ? 1 : 0,
            }}
          />
          {tiles.map((tab, idx) => {
            const current = effectiveIndex === idx;
            return (
              <li key={tab.id} className="mk-tile-slot">
                <CmsLink
                  className={`mk-tile${current ? " is-current" : ""}`}
                  href={tab.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => handleTileClick(idx)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </CmsLink>
              </li>
            );
          })}
          <li className="mk-tile-slot">
            <button
              type="button"
              className={`mk-tile${effectiveIndex === moreIndex ? " is-current" : ""}`}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => {
                setOptimisticIndex(moreIndex);
                setOpen(true);
              }}
            >
              {MoreIcon}
              <span>{copy.moreLabel}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={open} onClose={close} copy={copy} />
    </>
  );
}
