import PublicVoucher from "../../../components/bookings/PublicVoucher";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = { title: "Ticket check | Karnish Tourism", robots: { index: false, follow: false } };

export default async function VoucherCheckPage({ params }) {
  const { code } = await params;
  return <PublicVoucher code={code} />;
}
