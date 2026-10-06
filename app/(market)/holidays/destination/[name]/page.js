import { Suspense } from "react";
import HolidayListing from "../../../../components/holidays/HolidayListing";

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
  const name = decode((await params).name);
  return {
    title: `Holiday Packages in ${name} | Karnish Tourism`,
    description: `Browse holiday packages in ${name} with day-by-day itineraries and clear starting prices.`,
  };
}

export default async function HolidayDestinationPage({ params }) {
  const name = decode((await params).name);
  return (
    <Suspense fallback={<div className="hol-page hol-list-head"><div className="mk-container"><h1>Holiday Packages in {name}</h1></div></div>}>
      <HolidayListing name={name} />
    </Suspense>
  );
}
