"use client";

import { use } from "react";
import { VisaCatalogProvider } from "@/lib/visa-store";
import { PublicApplicationForm } from "@/components/extranet/visa/PublicApplicationForm";

export default function BasvuruPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  return (
    <VisaCatalogProvider>
      <PublicApplicationForm formId={formId} />
    </VisaCatalogProvider>
  );
}
