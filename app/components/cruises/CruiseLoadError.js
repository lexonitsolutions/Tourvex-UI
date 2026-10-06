"use client";

import { useRouter } from "next/navigation";
import { StateMessage } from "./CruiseParts";

export default function CruiseLoadError({ title = "We could not load cruises", text = "Something went wrong while fetching our cruises. Please try again in a moment." }) {
  const router = useRouter();
  return (
    <div className="hol-page cr-page mk-container cr-section">
      <StateMessage title={title} text={text} action="Try again" onAction={() => router.refresh()} />
    </div>
  );
}
