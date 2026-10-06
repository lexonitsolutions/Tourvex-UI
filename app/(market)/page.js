import HomeSections from "../components/HomeSections";
import { getPartnersSafe } from "../lib/partners";

export const metadata = {
  title: "Karnish Tourism — Activities, Holidays, Visas & Cruises",
  description: "Book top experiences, holidays, visas and cruises with Karnish Tourism.",
};

export default async function Home() {
  const partners = await getPartnersSafe("home");
  return <HomeSections partners={partners} />;
}
