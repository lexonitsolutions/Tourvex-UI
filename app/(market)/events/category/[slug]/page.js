import { Suspense } from "react";
import EventListing from "../../../../components/events/EventListing";
import { listEvents, listingQuery, parseListingParams, titleizeSlug } from "../../../../lib/events";
import { getServerCurrency } from "../../../../lib/currencyServer";

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }) {
  const name = titleizeSlug(decode((await params).slug));
  return {
    title: `${name} events | Karnish Tourism`,
    description: `Browse upcoming ${name.toLowerCase()} events: dates, ticket types and indicative per-ticket prices.`,
  };
}

export default async function EventsCategoryPage({ params, searchParams }) {
  const slug = decode((await params).slug);
  const filters = parseListingParams(await searchParams);
  const scope = { category: slug };
  const query = listingQuery(scope, filters, 1);
  const currency = await getServerCurrency();

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
          <div className="mk-container"><h1>{titleizeSlug(slug)}</h1></div>
        </div>
      }
    >
      <EventListing scope={scope} initial={{ key: `${JSON.stringify(query)}#${currency}`, data }} />
    </Suspense>
  );
}
