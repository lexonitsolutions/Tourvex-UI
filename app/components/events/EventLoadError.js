"use client";

import { useRouter } from "next/navigation";
import { StateMessage } from "./EventParts";

export default function EventLoadError({ title = "We could not load events", text = "Something went wrong while fetching our events. Please try again in a moment." }) {
  const router = useRouter();
  return (
    <div className="hol-page ev-page mk-container ev-section">
      <StateMessage title={title} text={text} action="Try again" onAction={() => router.refresh()} />
    </div>
  );
}
