import { Suspense } from "react";
import SearchPage from "../../components/SearchPage";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Search — Karnish Tourism",
  description: "Search activities, holidays, visas, cruises and yachts across the UAE and beyond.",
};

export default function Search() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
