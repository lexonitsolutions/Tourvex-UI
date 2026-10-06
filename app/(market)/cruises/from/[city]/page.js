import { Suspense } from "react";
import CruiseListing from "../../../../components/cruises/CruiseListing";
import { listCruises, listingQuery, parseListingParams } from "../../../../lib/cruises";
import { getServerCurrency } from "../../../../lib/currencyServer";

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }) {
  const city = decode((await params).city);
  return {
    title: `Cruises from ${city} | Karnish Tourism`,
    description: `Browse cruises departing from ${city}: itineraries, upcoming sailing dates and indicative per-person fares.`,
  };
}

export default async function CruisesFromCityPage({ params, searchParams }) {
  const city = decode((await params).city);
  const filters = parseListingParams(await searchParams);
  const query = listingQuery(city, filters, 1);
  const currency = await getServerCurrency();

  // First page is rendered on the server for SEO; a failure falls back to the client fetch (with its own error state).
  let data = null;
  try {
    data = await listCruises(query, { currency });
  } catch {
    data = null;
  }

  return (
    <Suspense
      fallback={
        <div className="hol-page hol-list-head">
          <div className="mk-container"><h1>Cruises from {city}</h1></div>
        </div>
      }
    >
      <CruiseListing city={city} initial={{ key: `${JSON.stringify(query)}#${currency}`, data }} />
    </Suspense>
  );
}
