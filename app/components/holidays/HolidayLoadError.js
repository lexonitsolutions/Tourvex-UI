"use client";

import { useRouter } from "next/navigation";
import { StateMessage } from "./HolidayParts";

export default function HolidayLoadError() {
  const router = useRouter();
  return (
    <div className="hol-page mk-container hol-section">
      <StateMessage
        title="We could not load this holiday"
        text="Something went wrong while fetching the package. Please try again in a moment."
        action="Try again"
        onAction={() => router.refresh()}
      />
    </div>
  );
}
