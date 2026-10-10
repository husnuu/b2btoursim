import { redirect } from "next/navigation";

/** Eski tur adresi: Seyyah vitrininde ürün sayfası `/magaza/urun/[slug]`. */
export default async function LegacyTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/magaza/urun/${id}`);
}
