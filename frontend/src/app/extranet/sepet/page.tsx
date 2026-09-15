import { getWorkingAgency } from "@/lib/auth/agency";
import { getAgencyFinance } from "@/lib/finance/load";
import { CheckoutView } from "@/components/extranet/CheckoutView";

/** Kullanılabilir bakiye defterden; checkout bu sınıra göre uyarır. */
export default async function SepetPage() {
  const agency = await getWorkingAgency();
  const finance = agency ? await getAgencyFinance(agency.tenantId, agency.agencyId) : null;
  return <CheckoutView available={finance?.available ?? 0} />;
}
