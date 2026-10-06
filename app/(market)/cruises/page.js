import CruiseLoadError from "../../components/cruises/CruiseLoadError";
import CruisesHome from "../../components/cruises/CruisesHome";
import { getCruiseHome } from "../../lib/cruises";
import { getServerCurrency } from "../../lib/currencyServer";

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
