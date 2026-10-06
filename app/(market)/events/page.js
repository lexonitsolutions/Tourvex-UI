import EventLoadError from "../../components/events/EventLoadError";
import EventsHome from "../../components/events/EventsHome";
import { getEventHome } from "../../lib/events";
import { getServerCurrency } from "../../lib/currencyServer";

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
    home = await getEventHome({ currency: await getServerCurrency() });
  } catch {
    return <EventLoadError />;
  }
  return <EventsHome home={home} />;
}
