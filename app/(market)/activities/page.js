import ActivitiesListing from "../../components/ActivitiesListing";
import PartnersStrip from "../../components/PartnersStrip";
import "../../activities.css";
import { fetchAllActivities } from "../../lib/api";
import { getServerCurrency } from "../../lib/currencyServer";
import { getPartnersSafe } from "../../lib/partners";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// A single value only: several (comma list or repeated) means a multi-filter, which gets the generic title.
const one = (v) => {
  const list = (Array.isArray(v) ? v : [v]).flatMap((x) => String(x || "").split(",")).map((x) => x.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : "";
};

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const destination = one(params?.destination);
  const activity = one(params?.activity);
  const subject = destination ? `Things to do in ${destination}` : activity ? `${activity} experiences` : "Activities & Experiences";
  return {
    title: `${subject} | Karnish Tourism`,
    description: destination
      ? `Book top-rated tours, attractions and experiences in ${destination} with Karnish Tourism.`
      : "Browse tours, attractions and experiences across the UAE and beyond. Filter by city and category, then book with Karnish Tourism.",
  };
}

/** Only the fields the listing renders, so the server-rendered payload stays small. */
const slim = (it) => ({
  _id: it._id,
  slug: it.slug,
  title: it.title,
  imageUrl: it.imageUrl,
  categories: it.categories,
  destinations: it.destinations,
  tripTypes: it.tripTypes,
  durationDays: it.durationDays,
  durationNights: it.durationNights,
  price: it.price,
  salePrice: it.salePrice,
});

export default async function ActivitiesPage() {
  const currency = await getServerCurrency();
  const [catalog, partners] = await Promise.all([
    fetchAllActivities({ currency }).then((items) => items.map(slim)).catch(() => null),
    getPartnersSafe("activities"),
  ]);
  return (
    <>
      <ActivitiesListing initial={catalog ? { currency, items: catalog } : null} />
      <div className="ac-partners"><PartnersStrip data={partners} id="activities-partners" /></div>
    </>
  );
}
