import { BookingsByOrder } from "../../../../components/bookings/BookingDetail";

export const metadata = { title: "Your order | Karnish Tourism", robots: { index: false, follow: false } };

export default async function OrderPage({ params }) {
  const { orderReference } = await params;
  return <BookingsByOrder orderReference={orderReference} />;
}
