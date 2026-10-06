import { CheckoutGate } from "../../components/checkout/CheckoutShell";

// Checkout pages are private: never indexed, and they need a signed-in account.
export const metadata = {
  title: "Checkout | Karnish Tourism",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }) {
  return <CheckoutGate>{children}</CheckoutGate>;
}
