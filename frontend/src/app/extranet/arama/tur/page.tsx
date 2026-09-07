import { Suspense } from "react";
import { ResultsView } from "@/components/extranet/ResultsView";
import { ResultRowSkeleton } from "@/components/primitives/Skeleton";

export default function AramaPage() {
  return (
    <Suspense fallback={<ResultRowSkeleton rows={8} />}>
      <ResultsView />
    </Suspense>
  );
}
