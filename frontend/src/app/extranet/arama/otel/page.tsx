import { Suspense } from "react";
import { HotelResultsView } from "@/components/extranet/HotelResultsView";
import { ResultRowSkeleton } from "@/components/primitives/Skeleton";

export default function OtelAramaPage() {
  return (
    <Suspense fallback={<ResultRowSkeleton rows={8} />}>
      <HotelResultsView />
    </Suspense>
  );
}
