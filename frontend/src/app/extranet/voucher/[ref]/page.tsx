import { getWorkingAgency } from "@/lib/auth/agency";
import { getAgencyFinance } from "@/lib/finance/load";
import { VoucherView } from "@/components/extranet/VoucherView";

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const agency = await getWorkingAgency();
  const finance = agency ? await getAgencyFinance(agency.tenantId, agency.agencyId) : null;
  return <VoucherView voucherRef={ref} agencyName={finance?.name ?? ""} />;
}
