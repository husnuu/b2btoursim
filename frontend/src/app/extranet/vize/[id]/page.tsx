"use client";

import { use } from "react";
import { VisaWizard } from "@/components/extranet/visa/VisaWizard";

export default function VizeDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VisaWizard id={id} />;
}
