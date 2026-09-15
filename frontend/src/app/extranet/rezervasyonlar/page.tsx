import { getWorkingAgency } from "@/lib/auth/agency";
import { listTenantBookings } from "@/lib/bookings/load";
import { BookingsTable } from "@/components/extranet/BookingsTable";

/** Rezervasyon listesi tablodan (RLS); alt acente yalnız kendi acentesini görür. */
export default async function RezervasyonlarPage() {
  const agency = await getWorkingAgency();
  const bookings = agency ? await listTenantBookings(agency.tenantId, agency.type === "sub_agency" ? agency.agencyId : null) : [];
  return <BookingsTable bookings={bookings} />;
}
