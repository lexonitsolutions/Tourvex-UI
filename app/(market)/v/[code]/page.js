import PublicVoucher from "../../../components/bookings/PublicVoucher";

export const metadata = { title: "Ticket check | Karnish Tourism", robots: { index: false, follow: false } };

export default async function VoucherCheckPage({ params }) {
  const { code } = await params;
  return <PublicVoucher code={code} />;
}
