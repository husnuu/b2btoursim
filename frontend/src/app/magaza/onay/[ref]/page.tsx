import { StoreConfirmation } from "@/components/b2c/StoreConfirmation";

/** Rezervasyon onay sayfası — Sitemap Bölüm 3 (MVP). */
export default async function OnayPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <StoreConfirmation orderRef={ref} />;
}
