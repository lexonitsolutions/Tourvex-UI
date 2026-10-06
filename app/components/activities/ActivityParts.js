"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { IconCheck, IconChevron, IconPin, IconStar, IconX, FALLBACK_IMG, showFallback, StateMessage } from "../holidays/HolidayParts";
import "../../holidays.css";
import "../../activity-detail.css";

export { IconCheck, IconChevron, IconPin, IconStar, IconX, FALLBACK_IMG, showFallback, StateMessage };

const icon = (paths, props = {}) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {paths}
  </svg>
);

export const IconClock = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
export const IconBolt = (p) => icon(<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />, p);
export const IconPhone = (p) => icon(<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>, p);
export const IconCar = (p) => icon(<><path d="M5 16V11l2-5h10l2 5v5M3 16h18M7.5 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></>, p);
export const IconShield = (p) => icon(<><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>, p);
export const IconGlobe = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>, p);
export const IconMap = (p) => icon(<><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>, p);
export const IconShare = (p) => icon(<><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></>, p);
export const IconUsers = (p) => icon(<><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6M16 4.8a3.4 3.4 0 010 6.4M18 14.6c2 .6 3.5 2.2 3.5 4.6" /></>, p);
export const IconCalendar = (p) => icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>, p);
export const IconCart = (p) => icon(<><path d="M3 4h2l2.4 11h10.2l2-8H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></>, p);
export const IconTrash = (p) => icon(<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />, p);
export const IconEdit = (p) => icon(<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />, p);
export const IconLock = (p) => icon(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>, p);
export const IconCamera = (p) => icon(<><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.4" /></>, p);
export const IconInfo = (p) => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></>, p);

/** Run `callback` when the media query changes; the server and the hydration pass report `false`. */
export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * Popover / bottom-sheet behaviour: Escape closes and returns focus to the trigger, a press outside closes,
 * and focus moves into the panel when it opens (to `[data-autofocus]` when present, otherwise the first control).
 */
export function usePopover(open, onClose, triggerRef) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const target = panel?.querySelector("[data-autofocus]") || panel?.querySelector("button:not([disabled]), [href], input, select, [tabindex='0']");
    const focusTimer = setTimeout(() => target?.focus({ preventScroll: true }), 30);
    const trigger = triggerRef?.current;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        trigger?.focus({ preventScroll: true });
      }
    };
    const onDown = (e) => {
      if (panel?.contains(e.target) || trigger?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, triggerRef]);
  return panelRef;
}

/** Read-only star row. Partial values are drawn by clipping a filled row over an empty one. */
export function Stars({ value = 0, size = 16 }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls) => (
    <span className={`act-stars-row ${cls}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <IconStar key={i} width={size} height={size} />)}
    </span>
  );
  return (
    <span className="act-stars" role="img" aria-label={`${Number(value).toFixed(1)} out of 5 stars`}>
      {row("is-empty")}
      <span className="act-stars-fill" style={{ width: `${pct}%` }}>{row("is-full")}</span>
    </span>
  );
}
