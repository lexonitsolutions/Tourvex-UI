import { Suspense } from "react";
import EventListing from "../../../../components/events/EventListing";
import { listEvents, listingQuery, parseListingParams } from "../../../../lib/events";
import { getServerCurrency } from "../../../../lib/currencyServer";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
    title: `Events in ${city} | Karnish Tourism`,
    description: `Browse upcoming events in ${city}: dates, ticket types and indicative per-ticket prices.`,
  };
}

export default async function EventsInCityPage({ params, searchParams }) {
  const city = decode((await params).city);
  const filters = parseListingParams(await searchParams);
  const scope = { city };
  const query = listingQuery(scope, filters, 1);
  const currency = await getServerCurrency();

  // First page is rendered on the server for SEO; a failure falls back to the client fetch (with its own error state).
  let data = null;
  try {
    data = await listEvents(query, { currency });
  } catch {
    data = null;
  }

  return (
    <Suspense
      fallback={
        <div className="hol-page hol-list-head">
          <div className="mk-container"><h1>Events in {city}</h1></div>
        </div>
      }
    >
      <EventListing scope={scope} initial={{ key: `${JSON.stringify(query)}#${currency}`, data }} />
    </Suspense>
  );
}
