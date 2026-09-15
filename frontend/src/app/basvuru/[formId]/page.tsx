import { getPublicVisaForm } from "@/lib/visas/public";
import { PublicApplicationForm } from "@/components/extranet/visa/PublicApplicationForm";

/** Girişsiz public başvuru sayfası: form sunucuda okunur, gönderim sunucu eylemiyle yazılır. */
export default async function BasvuruPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const form = await getPublicVisaForm(formId);
  return <PublicApplicationForm form={form} />;
}
