import { BookingsByOrder } from "../../../../components/bookings/BookingDetail";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = { title: "Your order | Karnish Tourism", robots: { index: false, follow: false } };

export default async function OrderPage({ params }) {
  const { orderReference } = await params;
  return <BookingsByOrder orderReference={orderReference} />;
}
