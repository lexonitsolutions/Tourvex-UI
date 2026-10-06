import CruiseLoadError from "../../components/cruises/CruiseLoadError";
import CruisesHome from "../../components/cruises/CruisesHome";
import { getCruiseHome } from "../../lib/cruises";
import { getServerCurrency } from "../../lib/currencyServer";

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
    home = await getCruiseHome({ currency: await getServerCurrency() });
  } catch {
    return <CruiseLoadError />;
  }
  return <CruisesHome home={home} />;
}
