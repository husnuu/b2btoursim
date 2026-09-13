import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { StoreCheckout } from "@/components/b2c/StoreCheckout";

/**
 * B2C ödeme sayfası — Sitemap Bölüm 3, /odeme (MVP).
 * Kiracı vitrininde gerçek sipariş (rezervasyon talebi, ödeme sonra);
 * örnek vitrinde sahte kart formu.
 */
export default async function OdemePage() {
  const tenant = await getStorefrontTenant();
  return <StoreCheckout mode={tenant ? "order" : "demo"} />;
}
