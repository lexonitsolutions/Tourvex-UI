"use client";

import { CmsLink } from "./CmsLink";
import { useHeaderContent } from "./ContentProvider";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import MobileSearchCard from "./MobileSearchCard";

const Ico = ({ children }) => (
  <svg className="mk-tab-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TAB_ICONS = {
  home: <Ico><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></Ico>,
  bookings: <Ico><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4z" /><path d="M14 6v12" strokeDasharray="2 2.4" /></Ico>,
  wishlist: <Ico><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Ico>,
};

// Labels, links and order come from the CMS (global.header). The home link only matches "/" exactly.
const isActive = (href, pathname) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

const TEXT_INPUT = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]), textarea, select";

/** Fixed bottom navigation for phones (hidden on larger screens by CSS). */
export default function MobileTabBar() {
  const pathname = usePathname();
  const header = useHeaderContent();
  const copy = header.mobile;
  const items = useMemo(
    () => copy.tabBarItems.map((item) => ({ id: item.id, label: item.link.label, href: item.link.href, icon: TAB_ICONS[item.icon] })),
    [copy.tabBarItems]
  );
  const accountIndex = items.length;
  const { user } = useApp();
  const [typing, setTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const initial = user ? (user.firstName || user.email || "?").charAt(0).toUpperCase() : null;

  const routeTab = useMemo(() => {
    if (pathname.startsWith("/account") || pathname.startsWith("/profile")) return accountIndex;
    return items.findIndex((item) => isActive(item.href, pathname));
  }, [pathname, items, accountIndex]);

  const [optimisticTab, setOptimisticTab] = useState(routeTab);

  useEffect(() => {
    setOptimisticTab(routeTab);
  }, [routeTab]);

  const currentTab = optimisticTab !== -1 ? optimisticTab : routeTab;

  // Close the search card whenever the page changes.
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  // Tuck the bar away while the virtual keyboard is up.
  useEffect(() => {
    const onIn = (e) => setTyping(!!e.target.matches?.(TEXT_INPUT));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  // The account card grows out of this tab (transform-origin) and the same tab closes it again.
  const toggleAccount = (e) => {
    setSearchOpen(false);
    const root = document.querySelector(".mk");
    const open = root?.querySelector(".mk-acc.is-open");
    if (open) {
      open.querySelector(".mk-acc-scrim")?.click();
      setOptimisticTab(routeTab);
      return;
    }
    setOptimisticTab(accountIndex);
    const rect = e.currentTarget.getBoundingClientRect();
    root?.style.setProperty("--mk-acc-ox", `${Math.round(rect.left + rect.width / 2 - 12)}px`);
    window.dispatchEvent(new Event("mk:open-account"));
  };

  const toggleSearch = (e) => {
    const root = document.querySelector(".mk");
    if (searchOpen) {
      setSearchOpen(false);
      return;
    }
    root?.querySelector(".mk-acc.is-open .mk-acc-scrim")?.click();
    const rect = e.currentTarget.getBoundingClientRect();
    root?.style.setProperty("--mk-sq-ox", `${Math.round(rect.left + rect.width / 2 - 12)}px`);
    setSearchOpen(true);
  };

  return (
    <>
      <nav className={`mk-tabbar${typing ? " is-typing" : ""}`} aria-label={copy.tabBarAriaLabel}>
        <div className="mk-tabbar-pill">
          <span
            className="mk-tabbar-hl"
            aria-hidden="true"
            style={{
              transform: `translate3d(${Math.max(currentTab, 0) * 100}%, 0, 0)`,
              opacity: currentTab < 0 ? 0 : 1,
            }}
          />
          {items.map((item, i) => {
            const isCurrent = i === currentTab;
            return (
              <CmsLink
                key={item.id}
                href={item.href}
                className={`mk-tab${isCurrent ? " is-active" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => setOptimisticTab(i)}
              >
                {item.icon}
                <span>{item.label}</span>
              </CmsLink>
            );
          })}
          <button
            type="button"
            className={`mk-tab${currentTab === accountIndex ? " is-active" : ""}`}
            aria-haspopup="dialog"
            onClick={toggleAccount}
          >
            {initial ? (
              <span className="mk-tab-initial" aria-hidden="true">{initial}</span>
            ) : (
              <Ico><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Ico>
            )}
            <span>{copy.accountTabLabel}</span>
          </button>
        </div>
        <button
          type="button"
          className={`mk-tabbar-ai${searchOpen ? " is-active" : ""}`}
          aria-label={copy.smartSearchLabel}
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          onClick={toggleSearch}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M10 3.5l1.7 4.6 4.6 1.7-4.6 1.7L10 16.1l-1.7-4.6L3.7 9.8l4.6-1.7z" />
            <path d="M17.5 13l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" />
          </svg>
        </button>
      </nav>
      <MobileSearchCard open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
