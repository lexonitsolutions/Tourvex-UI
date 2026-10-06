import PartnerApplication from "../../components/PartnerApplication";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Partners — Karnish Tourism",
  description: "Travel agents and companies can apply for a Karnish partner account with contract pricing.",
};

export default function PartnersPage() {
  return <PartnerApplication />;
}
