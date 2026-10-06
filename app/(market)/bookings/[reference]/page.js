import { BookingByReference } from "../../../components/bookings/BookingDetail";

export const metadata = { title: "Your booking | Karnish Tourism", robots: { index: false, follow: false } };

export default async function BookingPage({ params }) {
  const { reference } = await params;
  return <BookingByReference reference={reference} />;
}
