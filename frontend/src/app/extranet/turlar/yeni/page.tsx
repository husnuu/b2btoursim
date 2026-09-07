"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTourCatalog } from "@/lib/tour-store";

/** Yeni taslak oluşturur ve sihirbaza yönlendirir (Bölüm 2.1). */
export default function YeniTurPage() {
  const router = useRouter();
  const { createTour } = useTourCatalog();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const draft = createTour();
    router.replace(`/extranet/turlar/${draft.id}`);
  }, [createTour, router]);

  return null;
}
