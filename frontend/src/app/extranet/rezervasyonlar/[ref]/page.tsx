import { getWorkingAgency } from "@/lib/auth/agency";
import { getTenantBookingByRef } from "@/lib/bookings/load";
import { t } from "@/lib/i18n";
import { BookingDetail } from "@/components/extranet/BookingDetail";
import { EmptyState } from "@/components/primitives/States";
import { ButtonLink } from "@/components/primitives/Button";

export default async function BookingDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const agency = await getWorkingAgency();
  const booking = agency ? await getTenantBookingByRef(agency.tenantId, ref) : null;

  if (!booking || (agency?.type === "sub_agency" && booking.agencyId !== agency.agencyId)) {
    return (
      <EmptyState
        title={t("booking.notFound")}
        body={t("booking.notFoundBody")}
        action={
          <ButtonLink href="/extranet/rezervasyonlar" variant="primary">
            {t("booking.back")}
          </ButtonLink>
        }
      />
    );
  }

  return <BookingDetail booking={booking} />;
}
