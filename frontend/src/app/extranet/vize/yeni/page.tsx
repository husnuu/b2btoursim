"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVisaCatalog } from "@/lib/visa-store";

export default function YeniVizePage() {
  const router = useRouter();
  const { createVisa } = useVisaCatalog();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const visa = createVisa();
    router.replace(`/extranet/vize/${visa.id}`);
  }, [createVisa, router]);

  return null;
}
