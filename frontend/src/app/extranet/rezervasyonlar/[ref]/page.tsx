import { bookingByRef, expandedBookings } from "@/data/mock";
import { t } from "@/lib/i18n";
import { BookingDetail } from "@/components/extranet/BookingDetail";
import { EmptyState } from "@/components/primitives/States";
import { ButtonLink } from "@/components/primitives/Button";

/** Liste 500 satır ürettiği için detay da o kümede aranır. */
const ALL = expandedBookings(500);

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const booking = bookingByRef(ref) ?? ALL.find((b) => b.ref === ref) ?? null;

  if (!booking) {
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
