import "../market.css";
import "../mobile.css";
import "../mega-menu.css";
import AppProvider from "../components/AppProvider";
import { getServerCurrency } from "../lib/currencyServer";
import MotionShell from "../components/MotionShell";
import SiteHeader from "../components/SiteHeader";
import MobileTiles from "../components/MobileTiles";
import MobileTabBar from "../components/MobileTabBar";
import SiteFooter from "../components/SiteFooter";

export default async function MarketLayout({ children }) {
  const currency = await getServerCurrency();
  return (
    <AppProvider initialCurrency={currency}>
      <MotionShell>
        <SiteHeader />
        <MobileTiles />
        <main className="mk-main">{children}</main>
        <SiteFooter />
        <MobileTabBar />
      </MotionShell>
    </AppProvider>
  );
}
