import VisasHome from "../../components/visas/VisasHome";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Visa Services | Karnish Tourism",
  description: "Find the visa you need for your next trip. See typical requirements, documents and processing times, then send us an enquiry.",
};

export default function VisasPage() {
  return <VisasHome />;
}
