import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/vitrin/SearchResults";

export const metadata: Metadata = { title: "Deneyimler" };

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
