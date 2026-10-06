import { cache } from "react";
import { notFound } from "next/navigation";
import ActivityDetail from "../../../components/activities/ActivityDetail";
import { StateMessage } from "../../../components/holidays/HolidayParts";
import { getActivity, getRelatedActivities, getReviews, isNotFound } from "../../../lib/booking";
import { getServerCurrency } from "../../../lib/currencyServer";
import "../../../holidays.css";
import "../../../activity-detail.css";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Deduped between generateMetadata and the page for one request. */
const load = cache(async (slug, currency) => {
  try {
    return { data: await getActivity(slug, { currency }) };
  } catch (error) {
    return isNotFound(error) ? { notFound: true } : { failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (!result.data) {
    return { title: result.notFound ? "Activity not found | Karnish Tourism" : "Activities | Karnish Tourism", description: "Activities and experiences from Karnish Tourism." };
  }
  const a = result.data;
  const where = a.destinations?.[0];
  const description =
    (a.description || "").split(/\n{2,}/)[0].slice(0, 200) ||
    `${a.title}${where ? ` in ${where}` : ""}: details, photos and prices with Karnish Tourism.`;
  const image = a.gallery?.[0]?.url || a.imageUrl;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${a.title} | Karnish Tourism`,
    description,
    openGraph: { title: a.title, description, type: "website", ...(image ? { images: [image] } : {}) },
    twitter: { card: "summary_large_image", title: a.title, description },
  };
}

const one = (v) => (Array.isArray(v) ? v[0] : v) || "";
const int = (v, fallback) => {
  const n = parseInt(one(v), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export default async function ActivityPage({ params, searchParams }) {
  const { slug } = await params;
  const query = (await searchParams) || {};
  const currency = await getServerCurrency();
  const result = await load(slug, currency);
  if (result.notFound) notFound();
  if (result.failed) {
    return (
      <div className="hol-page act-page mk-container act-failed">
        <StateMessage title="We could not load this activity" text="Something went wrong while fetching the details. Please try again in a moment." href={`/activities/${slug}`} actionLabel="Try again" />
      </div>
    );
  }
  const activity = result.data;
  const bookable = Array.isArray(activity.options) && activity.options.length > 0;
  const [related, reviews] = await Promise.all([
    getRelatedActivities(activity, { currency }).catch(() => []),
    bookable || activity.rating ? getReviews(slug, { limit: 6 }).catch(() => null) : Promise.resolve(null),
  ]);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(one(query.date)) ? one(query.date) : "";
  return (
    <ActivityDetail
      activity={activity}
      related={related}
      reviews={reviews}
      initial={{ date, adults: int(query.adults, 2) || 2, children: int(query.children, 0), option: one(query.option), modify: one(query.modify) }}
    />
  );
}
