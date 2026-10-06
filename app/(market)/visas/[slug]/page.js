import { cache } from "react";
import { notFound } from "next/navigation";
import VisaDetail from "../../../components/visas/VisaDetail";
import VisaLoadError from "../../../components/visas/VisaLoadError";
import { getVisa, isNotFound } from "../../../lib/visas";
import { getServerCurrency } from "../../../lib/currencyServer";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Deduped between generateMetadata and the page for one request. Returns { data } or { notFound } or { failed }. */
const load = cache(async (slug, currency) => {
  try {
    return { data: await getVisa(slug, { currency }) };
  } catch (error) {
    return isNotFound(error) ? { notFound: true } : { failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (!result.data) {
    return {
      title: result.notFound ? "Visa not found | Karnish Tourism" : "Visa Services | Karnish Tourism",
      description: "Visa services from Karnish Tourism.",
    };
  }
  const visa = result.data.visa;
  const description = visa.summary || `${visa.title} requirements, documents and processing time, with Karnish Tourism.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${visa.title} | Karnish Tourism`,
    description,
    openGraph: { title: visa.title, description, type: "website" },
    twitter: { card: "summary", title: visa.title, description },
  };
}

export default async function VisaPage({ params }) {
  const { slug } = await params;
  const result = await load(slug, await getServerCurrency());
  if (result.notFound) notFound();
  if (result.failed) return <VisaLoadError />;
  return <VisaDetail visa={result.data.visa} related={result.data.related || []} />;
}
