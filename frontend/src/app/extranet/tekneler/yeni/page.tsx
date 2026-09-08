"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBoatCatalog } from "@/lib/boat-store";

export default function YeniTeknePage() {
  const router = useRouter();
  const { createBoat } = useBoatCatalog();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const boat = createBoat();
    router.replace(`/extranet/tekneler/${boat.id}`);
  }, [createBoat, router]);

  return null;
}
