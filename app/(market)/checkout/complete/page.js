import { Suspense } from "react";
import CompleteView from "../../../components/checkout/CompleteView";

export const metadata = { title: "Payment status | Karnish Tourism", robots: { index: false, follow: false } };

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteView />
    </Suspense>
  );
}
