import { Suspense } from "react";
import "../market.css";
import "../mobile.css";
import "../mega-menu.css";
import AppProvider from "../components/AppProvider";
import CurrencySeed from "../components/CurrencySeed";
import MotionShell from "../components/MotionShell";
import SiteHeader from "../components/SiteHeader";
import MobileTiles from "../components/MobileTiles";
import MobileTabBar from "../components/MobileTabBar";
import SiteFooter from "../components/SiteFooter";
import { ContentProvider } from "../components/ContentProvider";
import { fetchAllActivities } from "../lib/api";
import { getGlobalContent } from "../lib/content";
import { getCruiseMenu, getEventMenu, getHolidayMenu } from "../lib/menus";
import { getVisaHome } from "../lib/visas";

export const instant = false;

// The shell (header, footer, tab bar) is prerendered: its CMS content is cached (lib/content.js) and nothing here reads
// request data. The visitor's currency cookie streams in through <CurrencySeed /> instead of being awaited up here.
export default async function MarketLayout({ children }) {
  const [{ header, footer }, visaHome, activityItems, holidayMenu, cruiseMenu, eventMenu] = await Promise.all([
    getGlobalContent(),
    getVisaHome().catch(() => ({ sections: [] })),
    fetchAllActivities({ currency: "AED" }).catch(() => null),
    getHolidayMenu().catch(() => null),
    getCruiseMenu().catch(() => null),
    getEventMenu().catch(() => null),
  ]);
  return (
    <AppProvider>
      <Suspense fallback={null}>
        <CurrencySeed />
      </Suspense>
      <ContentProvider header={header} visaSections={visaHome.sections} activityItems={activityItems} menus={{ holidays: holidayMenu, cruises: cruiseMenu, events: eventMenu }}>
        <MotionShell>
          <SiteHeader />
          <MobileTiles />
          <main className="mk-main">{children}</main>
          <SiteFooter content={footer} />
          <MobileTabBar />
        </MotionShell>
      </ContentProvider>
    </AppProvider>
  );
}
