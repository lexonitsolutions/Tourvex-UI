import CompanyPage from "../../components/CompanyPage";
import { enabledSections, getPageContent } from "../../lib/content";

// This page combines CMS content with authenticated partner-application state.
// Allow it to block rather than requiring the whole route to be instant-prerenderable.
export const instant = false;

export const metadata = { title: "Partner with Us — Karnish Tourism", description: "Apply to collaborate with Karnish Tourism as a travel or service partner." };
export default async function PartnersPage() { const content = await getPageContent("partners"); return <CompanyPage page="partners" sections={enabledSections(content.sections)} />; }
