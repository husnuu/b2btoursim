import { VoucherView } from "@/components/extranet/VoucherView";

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <VoucherView voucherRef={ref} />;
}
