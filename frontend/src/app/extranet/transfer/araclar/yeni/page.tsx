"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransferCatalog } from "@/lib/transfer-store";

/** Yeni araç taslağı oluşturur ve sihirbaza yönlendirir. */
export default function YeniAracPage() {
  const router = useRouter();
  const { createVehicle } = useTransferCatalog();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const vehicle = createVehicle();
    router.replace(`/extranet/transfer/araclar/${vehicle.id}`);
  }, [createVehicle, router]);

  return null;
}
