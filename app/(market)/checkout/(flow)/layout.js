import CheckoutProvider from "../../../components/checkout/CheckoutProvider";
import CheckoutShell from "../../../components/checkout/CheckoutShell";

// One layout for the five steps, so the stepper and the loaded cart persist while the visitor moves between them.
export default function CheckoutFlowLayout({ children }) {
  return (
    <CheckoutProvider>
      <CheckoutShell>{children}</CheckoutShell>
    </CheckoutProvider>
  );
}
