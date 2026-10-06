import WishlistView from "../../components/WishlistView";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Wishlist — Karnish Tourism",
  description: "Holiday packages you have saved.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
