"use client";

import { use } from "react";
import { FormEditView } from "@/components/extranet/visa/FormEditView";

export default function FormDuzenlePage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  return <FormEditView formId={formId} />;
}
