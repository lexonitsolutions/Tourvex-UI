import BookingsView from "../../components/BookingsView";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "My bookings — Karnish Tourism",
  description: "See your Karnish Tourism bookings.",
};

export default function BookingsPage() {
  return <BookingsView />;
}
