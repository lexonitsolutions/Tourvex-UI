"use client";

import { useRouter } from "next/navigation";
import { StateMessage } from "./VisaParts";

export default function VisaLoadError() {
  const router = useRouter();
  return (
    <div className="hol-page vis-page mk-container vis-section">
      <StateMessage
        title="We could not load this visa"
        text="Something went wrong while fetching the visa details. Please try again in a moment."
        action="Try again"
        onAction={() => router.refresh()}
      />
    </div>
  );
}
