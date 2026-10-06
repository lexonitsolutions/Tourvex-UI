import { Suspense } from "react";
import SearchPage from "../../components/SearchPage";

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
