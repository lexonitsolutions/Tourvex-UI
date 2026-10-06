import SupportView from "../../components/support/SupportView";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Help and Support — Karnish Tourism",
  description: "Contact Karnish Tourism support about a booking, payment or voucher.",
  robots: { index: false, follow: true },
};

export default function SupportPage() {
  return <SupportView />;
}
