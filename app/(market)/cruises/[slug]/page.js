import { cache } from "react";
import { notFound } from "next/navigation";
import CruiseDetail from "../../../components/cruises/CruiseDetail";
import CruiseLoadError from "../../../components/cruises/CruiseLoadError";
import { getCruise, isNotFound } from "../../../lib/cruises";
import { getServerCurrency } from "../../../lib/currencyServer";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Deduped between generateMetadata and the page for one request. Returns { data } or { notFound } or { failed }. */
const load = cache(async (slug, currency) => {
  try {
    return { data: await getCruise(slug, { currency }) };
  } catch (error) {
    return isNotFound(error) ? { notFound: true } : { failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (!result.data) {
    return {
      title: result.notFound ? "Cruise not found | Karnish Tourism" : "Cruises | Karnish Tourism",
      description: "Cruises from Karnish Tourism.",
    };
  }
  const cruise = result.data.cruise;
  const description = cruise.summary || `${cruise.title}: itinerary, departure dates and indicative fares, with Karnish Tourism.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${cruise.title} | Karnish Tourism`,
    description,
    openGraph: { title: cruise.title, description, type: "website", ...(cruise.coverImage ? { images: [cruise.coverImage] } : {}) },
    twitter: { card: "summary_large_image", title: cruise.title, description },
  };
}

export default async function CruisePage({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (result.notFound) notFound();
  if (result.failed) return <CruiseLoadError title="We could not load this cruise" text="Something went wrong while fetching the cruise details. Please try again in a moment." />;
  return <CruiseDetail cruise={result.data.cruise} related={result.data.related || []} />;
}
