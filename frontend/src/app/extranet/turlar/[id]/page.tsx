"use client";

import { use } from "react";
import { TourWizard } from "@/components/extranet/tours/TourWizard";

export default function TurDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TourWizard id={id} />;
}
