import { Suspense } from "react";
import CompleteView from "../../../components/checkout/CompleteView";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = { title: "Payment status | Karnish Tourism", robots: { index: false, follow: false } };

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteView />
    </Suspense>
  );
}
