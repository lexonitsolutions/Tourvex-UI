import CheckoutProvider from "../../../components/checkout/CheckoutProvider";
import CheckoutShell from "../../../components/checkout/CheckoutShell";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// One layout for the five steps, so the stepper and the loaded cart persist while the visitor moves between them.
export default function CheckoutFlowLayout({ children }) {
  return (
    <CheckoutProvider>
      <CheckoutShell>{children}</CheckoutShell>
    </CheckoutProvider>
  );
}
