import HolidaysHome from "../../components/holidays/HolidaysHome";
import { getPageContent } from "../../lib/content";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Holiday Packages | Karnish Tourism",
  description: "Explore holiday packages by city and country, with day-by-day itineraries and clear starting prices.",
};

export default async function HolidaysPage() {
  const content = await getPageContent("holidays");
  return <HolidaysHome content={content} />;
}
