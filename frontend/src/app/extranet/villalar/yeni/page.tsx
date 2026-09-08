"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVillaCatalog } from "@/lib/villa-store";

export default function YeniVillaPage() {
  const router = useRouter();
  const { createVilla } = useVillaCatalog();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const villa = createVilla();
    router.replace(`/extranet/villalar/${villa.id}`);
  }, [createVilla, router]);

  return null;
}
