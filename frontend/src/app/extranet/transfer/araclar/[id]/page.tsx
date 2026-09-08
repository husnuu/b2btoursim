"use client";

import { use } from "react";
import { VehicleWizard } from "@/components/extranet/transfer/vehicle/VehicleWizard";

export default function AracDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VehicleWizard id={id} />;
}
