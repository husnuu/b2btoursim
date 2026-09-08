"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { useToast } from "@/components/primitives/Toast";
import { useTransferCatalog } from "@/lib/transfer-store";
import type { VehicleStatus } from "@/lib/transfer";

const STATUS_CHIPS: ChipDef[] = [
  { id: "aktif", label: "transferVehicleStatus.aktif" },
  { id: "pasif", label: "transferVehicleStatus.pasif" },
];

export function VehicleListView() {
  const router = useRouter();
  const { vehicles, setVehicleStatus, removeVehicle, restoreVehicle, duplicateVehicle } = useTransferCatalog();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = vehicles;
    if (statuses.length) list = list.filter((v) => statuses.includes(v.status));
    if (q) list = list.filter((v) => v.title.toLocaleLowerCase("tr").includes(q));
    return list;
  }, [vehicles, query, statuses]);

  const handleDelete = (id: string) => {
    const index = vehicles.findIndex((v) => v.id === id);
    const vehicle = vehicles[index];
    if (!vehicle) return;
    removeVehicle(id);
    notify(`${vehicle.title || "Araç"} silindi.`, () => restoreVehicle(vehicle, index));
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Araçlar</h1>
        <ButtonLink href="/extranet/transfer/araclar/yeni" variant="primary" size="sm" className="ms-auto">
          Araç Oluştur
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line px-[var(--pad-x)] py-2.5">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Ara</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Araç adına göre ara"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar
          chips={STATUS_CHIPS}
          active={statuses}
          onToggle={(id) => setStatuses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          onClear={() => setStatuses([])}
        />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">{rows.length} araç</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={vehicles.length === 0 ? "Henüz araç eklenmedi" : "Sonuç bulunamadı"}
          body={
            vehicles.length === 0
              ? "İlk aracınızı ekleyerek filonuzu oluşturun."
              : "Arama veya filtreleri değiştirip tekrar deneyin."
          }
          action={
            vehicles.length === 0 ? (
              <ButtonLink href="/extranet/transfer/araclar/yeni" variant="primary">
                Araç Oluştur
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            role="row"
            className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3"
          >
            <span className="w-28">Araç ID</span>
            <span className="min-w-0 flex-1">Araç Adı</span>
            <span className="w-20 text-end">Bagaj</span>
            <span className="w-20 text-end">Koltuk</span>
            <span className="w-24">Araç Tipi</span>
            <span className="w-20">Durum</span>
            <span className="w-40 text-end">İşlemler</span>
          </div>

          {rows.map((vehicle) => (
            <div key={vehicle.id} role="row" className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2">
              <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">{vehicle.id}</span>
              <button
                type="button"
                onClick={() => router.push(`/extranet/transfer/araclar/${vehicle.id}`)}
                className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui)] text-ink hover:underline"
              >
                {vehicle.title || "(Başlıksız araç)"}
              </button>
              <span className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {vehicle.luggageCapacity}
              </span>
              <span className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {vehicle.seatCapacity}
              </span>
              <span className="w-24 text-[length:var(--font-ui-sm)] text-ink-2">
                {vehicle.vehicleType === "private" ? "Private" : "Shuttle"}
              </span>
              <span className="w-20">
                <select
                  aria-label="Durum"
                  value={vehicle.status}
                  onChange={(e) => setVehicleStatus(vehicle.id, e.target.value as VehicleStatus)}
                  className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                >
                  <option value="aktif">Aktif</option>
                  <option value="pasif">Pasif</option>
                </select>
              </span>
              <span className="flex w-40 justify-end gap-1.5">
                <Button type="button" size="sm" onClick={() => router.push(`/extranet/transfer/araclar/${vehicle.id}`)}>
                  Düzenle
                </Button>
                <Button type="button" size="sm" onClick={() => duplicateVehicle(vehicle.id)}>
                  Kopyala
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(vehicle.id)}>
                  Sil
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
