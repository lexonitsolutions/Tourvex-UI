import CompanyPage from "../../components/CompanyPage";
import { enabledSections, getPageContent } from "../../lib/content";
import { getHolidayHome } from "../../lib/holidays";

export const instant = false;
export const metadata = { title: "About Karnish — Karnish Tourism", description: "Discover Karnish Tourism, our services, values, people and approach to memorable travel." };

export default async function AboutPage() {
  const [content, teamContent, holidayHome] = await Promise.all([
    getPageContent("about"),
    getPageContent("team"),
    getHolidayHome().catch(() => null),
  ]);
  const team = teamContent.sections.find((section) => section.type === "companyTeam")?.data?.members || [];
  const destinations = (holidayHome?.cities || []).slice(0, 6).map((city) => ({
    id: `destination-${city.name}`,
    title: city.name,
    text: [city.country, city.count ? `${city.count} package${city.count === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · "),
    image: { url: city.image, alt: `${city.name} travel packages` },
    link: { label: "Explore packages", href: `/holidays?destination=${encodeURIComponent(city.name)}` },
  }));
  const sections = enabledSections(content.sections).map((section) => {
    if (section.id === "about-team" && team.length) return { ...section, data: { ...section.data, members: team.slice(0, 3) } };
    if (section.type === "aboutDestinations" && destinations.length) return { ...section, data: { ...section.data, items: destinations } };
    return section;
  });
  return <CompanyPage page="about" sections={sections} />;
}
