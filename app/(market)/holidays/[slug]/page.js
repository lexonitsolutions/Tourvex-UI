import { cache } from "react";
import { notFound } from "next/navigation";
import HolidayDetail from "../../../components/holidays/HolidayDetail";
import { withStock } from "../../../components/StockBadge";
import HolidayLoadError from "../../../components/holidays/HolidayLoadError";
import { getHoliday, isNotFound } from "../../../lib/holidays";
import { getServerCurrency } from "../../../lib/currencyServer";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Deduped between generateMetadata and the page for one request. Returns { data } or { notFound } or { failed }. */
const load = cache(async (slug, currency) => {
  try {
    return { data: await getHoliday(slug, { currency }) };
  } catch (error) {
    return isNotFound(error) ? { notFound: true } : { failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (!result.data) {
    return {
      title: result.notFound ? "Holiday not found | Karnish Tourism" : "Holiday Package | Karnish Tourism",
      description: "Holiday packages from Karnish Tourism.",
    };
  }
  const pkg = result.data.package;
  const image = pkg.images?.[0]?.url || pkg.coverImage;
  const description = pkg.summary || `${pkg.title} holiday package from Karnish Tourism.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${pkg.title} | Karnish Tourism`,
    description,
    openGraph: {
      title: pkg.title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: pkg.images?.[0]?.alt || pkg.title }] } : {}),
    },
    twitter: { card: "summary_large_image", title: pkg.title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function HolidayPage({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (result.notFound) notFound();
  if (result.failed) return <HolidayLoadError />;
  return <HolidayDetail pkg={withStock(result.data.package, result.data.stock)} related={result.data.related || []} />;
}
