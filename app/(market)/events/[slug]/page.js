import { cache } from "react";
import { notFound } from "next/navigation";
import EventDetail from "../../../components/events/EventDetail";
import EventLoadError from "../../../components/events/EventLoadError";
import { getEvent, isNotFound } from "../../../lib/events";
import { getServerCurrency } from "../../../lib/currencyServer";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Deduped between generateMetadata and the page for one request. Returns { data } or { notFound } or { failed }. */
const load = cache(async (slug, currency) => {
  try {
    return { data: await getEvent(slug, { currency }) };
  } catch (error) {
    return isNotFound(error) ? { notFound: true } : { failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (!result.data) {
    return {
      title: result.notFound ? "Event not found | Karnish Tourism" : "Events | Karnish Tourism",
      description: "Events from Karnish Tourism.",
    };
  }
  const event = result.data.event;
  const description = event.summary || `${event.title}: dates, ticket types and indicative prices, with Karnish Tourism.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${event.title} | Karnish Tourism`,
    description,
    openGraph: { title: event.title, description, type: "website", ...(event.coverImage ? { images: [event.coverImage] } : {}) },
    twitter: { card: "summary_large_image", title: event.title, description },
  };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (result.notFound) notFound();
  if (result.failed) return <EventLoadError title="We could not load this event" text="Something went wrong while fetching the event details. Please try again in a moment." />;
  return <EventDetail event={result.data.event} related={result.data.related || []} />;
}
