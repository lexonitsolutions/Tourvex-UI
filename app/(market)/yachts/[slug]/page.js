import { redirect } from "next/navigation";

/**
 * Compatibility route for old cart links and bookmarks. Yachts are activity
 * catalogue records, so their canonical detail page remains /activities/:slug.
 */
export default async function LegacyYachtPage({ params, searchParams }) {
  const { slug } = await params;
  const incoming = (await searchParams) || {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry));
    else if (value != null) query.set(key, value);
  }

  const suffix = query.toString();
  redirect(`/activities/${encodeURIComponent(slug)}${suffix ? `?${suffix}` : ""}`);
}
