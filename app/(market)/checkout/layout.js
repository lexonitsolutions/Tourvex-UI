import { CheckoutGate } from "../../components/checkout/CheckoutShell";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Checkout pages are private: never indexed, and they need a signed-in account.
export const metadata = {
  title: "Checkout | Karnish Tourism",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }) {
  return <CheckoutGate>{children}</CheckoutGate>;
}
