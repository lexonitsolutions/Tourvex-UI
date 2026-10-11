// Shared line icons and helpers for the category dock (SiteHeader) and the mobile tiles/sheet/tab bar.
// Labels, links, order and which tabs open the mega menu come from the CMS (global.header); only the icon
// artwork lives here, selected by the CMS `icon` key.
import { splitMatch } from "../lib/format";

// The icon lives in a fixed 20x20 box; only the svg inside scales on hover, so the tab's
// layout (and the navbar around it) can never move.
export const Icon = ({ children }) => (
  <span className="mk-dock-ico" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </span>
);

export const NAV_ICONS = {
  activities: <Icon><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></Icon>,
  holidays: <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>,
  visas: <Icon><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></Icon>,
  cruises: <Icon><path d="M3 17l2 3h14l2-3-9-3z" /><path d="M7 14V8h10v6M12 8V4" /></Icon>,
  yachts: <Icon><path d="M12 3v13M12 4c4 2 6 6 6 10h-6M12 7c-3 1-5 4-5 7h5" /><path d="M4 19c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0" /></Icon>,
  events: <Icon><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V6H4z" /><path d="M12 9l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 11.3l2-.3z" /></Icon>,
  destinations: <Icon><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></Icon>,
  help: <Icon><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icon>,
};

/** Which dropdown a tab opens, by its CMS icon key. Tabs with another icon keep the editorial CMS menu. */
const MENU_BY_ICON = { activities: "activities", holidays: "holidays", visas: "visas", cruises: "cruises", events: "events", yachts: "yachts" };

/** CMS tab entries -> the shape the header and mobile tiles use. */
export function buildTabs(tabs) {
  return (tabs || []).map((tab) => ({
    id: tab.id,
    label: tab.link.label,
    href: tab.link.href,
    // Every catalog tab (activities, holidays, visas, cruises, events, yachts) opens a dropdown built from its live catalog;
    // the CMS `mega` flag still opens the editorial menu for any other tab.
    mega: Boolean(tab.mega) || tab.icon in MENU_BY_ICON,
    megaMenu: MENU_BY_ICON[tab.icon] || "default",
    match: splitMatch(tab.match),
    icon: NAV_ICONS[tab.icon] || null,
    mobileTile: Boolean(tab.mobileTile),
  }));
}

export const isTabCurrent = (tab, pathname) =>
  !!tab.match?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
