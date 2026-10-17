import CompanyPage from "../../components/CompanyPage";
import { enabledSections, getPageContent } from "../../lib/content";

export const metadata = { title: "Our Team — Karnish Tourism", description: "Meet the verified team members behind Karnish Tourism journeys." };
export default async function TeamPage() { const content = await getPageContent("team"); return <CompanyPage page="team" sections={enabledSections(content.sections)} />; }
