import CruiseLoadError from "../../components/cruises/CruiseLoadError";
import CruisesHome from "../../components/cruises/CruisesHome";
import { getCruiseHome } from "../../lib/cruises";
import { getServerCurrency } from "../../lib/currencyServer";
import { getPageContent } from "../../lib/content";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Cruises | Karnish Tourism",
  description: "Explore cruises by departure city, compare itineraries and indicative fares, then send us an enquiry.",
};

export default async function CruisesPage() {
  let home;
  try {
    const [catalogue, content] = await Promise.all([getCruiseHome({ currency: await getServerCurrency() }), getPageContent("voyager")]);
    home = { ...catalogue, cmsSections: content.sections };
  } catch {
    return <CruiseLoadError />;
  }
  return <CruisesHome home={home} />;
}
