import CompanyPage from "../../components/CompanyPage";
import { enabledSections, getPageContent } from "../../lib/content";

export const metadata = { title: "Our Services — Karnish Tourism", description: "Explore activities, holidays, visas, cruises, yachts and events." };
export default async function ServicesPage() { const content = await getPageContent("services"); return <CompanyPage page="services" sections={enabledSections(content.sections)} />; }
