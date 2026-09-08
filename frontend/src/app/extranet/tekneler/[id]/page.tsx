"use client";

import { use } from "react";
import { BoatWizard } from "@/components/extranet/boats/BoatWizard";

export default function TekneDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoatWizard id={id} />;
}
