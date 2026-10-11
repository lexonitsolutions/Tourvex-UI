import { cacheLife, cacheTag } from "next/cache";
import HomeSections from "../components/HomeSections";
import { getPartnersSafe } from "../lib/partners";
import { enabledSections, getPageContent } from "../lib/content";

export const metadata = {
  title: "Karnish Tourism — Activities, Holidays, Visas & Cruises",
  description: "Book top experiences, holidays, visas and cruises with Karnish Tourism.",
};

// The home page has no per-visitor data on the server (prices and listings load in the browser as sections scroll
// into view, in the visitor's currency), so the whole page is cached and served from the prerendered shell.
export default async function Home() {
  "use cache";
  const isDev = process.env.NODE_ENV === "development";
  cacheLife(isDev ? { stale: 1, revalidate: 1, expire: 5 } : { stale: 300, revalidate: 60, expire: 86400 });
  cacheTag("cms", "home");
  const [partners, { sections }] = await Promise.all([getPartnersSafe("home"), getPageContent("home")]);
  return <HomeSections sections={enabledSections(sections)} partners={partners} />;
}
