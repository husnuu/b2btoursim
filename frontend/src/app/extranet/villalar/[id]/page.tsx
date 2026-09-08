"use client";

import { use } from "react";
import { VillaWizard } from "@/components/extranet/villas/VillaWizard";

export default function VillaDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VillaWizard id={id} />;
}
