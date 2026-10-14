import EventLoadError from "../../components/events/EventLoadError";
import EventsHome from "../../components/events/EventsHome";
import { getEventHome } from "../../lib/events";
import { getServerCurrency } from "../../lib/currencyServer";
import { getPageContent } from "../../lib/content";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Events | Karnish Tourism",
  description: "Browse concerts, sport, festivals, comedy, family shows and more by city and category, then send us a ticket request.",
};

export default async function EventsPage() {
  let home;
  try {
    const currency = await getServerCurrency();
    const [eventHome, content] = await Promise.all([getEventHome({ currency }), getPageContent("events")]);
    home = eventHome;
    return <EventsHome home={home} contentSections={content.sections} />;
  } catch {
    return <EventLoadError />;
  }
}
