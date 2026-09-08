"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { EmptyState } from "@/components/primitives/States";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { useBoatCatalog } from "@/lib/boat-store";
import type { CaptainOption } from "@/lib/boat";
import type { BoatStatus } from "@/lib/boat-status";

const STATUS_CHIPS: ChipDef[] = [
  { id: "taslak", label: "boatStatus.taslak" },
  { id: "aktif", label: "boatStatus.aktif" },
  { id: "pasif", label: "boatStatus.pasif" },
  { id: "arsivlendi", label: "boatStatus.arsivlendi" },
];

const CAPTAIN_LABELS: Record<CaptainOption, string> = {
  kaptanli: "Kaptanlı",
  kaptansiz: "Kaptansız",
  herIkisi: "Her İkisi",
};

export function BoatListView() {
  const router = useRouter();
  const { boats, categories, marinaPoints, setBoatStatus, removeBoat, restoreBoat, duplicateBoat } = useBoatCatalog();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = boats;
    if (statuses.length) list = list.filter((b) => statuses.includes(b.status));
    if (q) list = list.filter((b) => b.title.toLocaleLowerCase("tr").includes(q));
    return list;
  }, [boats, query, statuses]);

  const handleDelete = (id: string) => {
    const index = boats.findIndex((b) => b.id === id);
    const boat = boats[index];
    if (!boat) return;
    removeBoat(id);
    notify(`${boat.title || "Tekne"} silindi.`, () => restoreBoat(boat, index));
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Tekneler</h1>
        <ButtonLink href="/extranet/tekneler/yeni" variant="primary" size="sm" className="ms-auto">
          Tekne Ekle
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line px-[var(--pad-x)] py-2.5">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Ara</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tekne adına göre ara"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar chips={STATUS_CHIPS} active={statuses} onToggle={(id) => setStatuses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))} onClear={() => setStatuses([])} />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">{rows.length} tekne</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={boats.length === 0 ? "Henüz tekne eklenmedi" : "Sonuç bulunamadı"}
          body={boats.length === 0 ? "İlk teknenizi ekleyerek filonuzu oluşturun." : "Arama veya filtreleri değiştirip tekrar deneyin."}
          action={boats.length === 0 ? <ButtonLink href="/extranet/tekneler/yeni" variant="primary">Tekne Ekle</ButtonLink> : undefined}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div role="row" className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
            <span className="w-28">Tekne ID</span>
            <span className="min-w-0 flex-1">Tekne Adı</span>
            <span className="w-24">Kategori</span>
            <span className="w-28">Konum</span>
            <span className="w-24">Kaptan</span>
            <span className="w-24 text-end">Etiket Fiyatı</span>
            <span className="w-24">Durum</span>
            <span className="w-52 text-end">İşlemler</span>
          </div>

          {rows.map((boat) => {
            const category = categories.find((c) => c.id === boat.categoryId);
            const marina = marinaPoints.find((p) => p.id === boat.mainMarinaId);
            const price = boat.pricingModel === "saatlik" ? boat.hourlyRate ?? 0 : boat.pricingModel === "cokGunlu" ? boat.multiDay.unitPrice : boat.perPerson.pricePerPerson;
            return (
              <div key={boat.id} role="row" className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2">
                <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">{boat.id}</span>
                <button type="button" onClick={() => router.push(`/extranet/tekneler/${boat.id}`)} className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui)] text-ink hover:underline">
                  {boat.title || "(Başlıksız tekne)"}
                </button>
                <span className="w-24 truncate text-[length:var(--font-ui-sm)] text-ink-2">{category?.title ?? "—"}</span>
                <span className="w-28 truncate text-[length:var(--font-ui-sm)] text-ink-2">{marina?.name ?? "—"}</span>
                <span className="w-24 text-[length:var(--font-ui-sm)] text-ink-2">{CAPTAIN_LABELS[boat.captainOption]}</span>
                <span className="tnum w-24 text-end text-[length:var(--font-ui-sm)] text-ink-2">{formatMoney(price, boat.currency)}</span>
                <span className="w-24">
                  {boat.status === "arsivlendi" ? (
                    <span className="text-[length:var(--font-ui-sm)] text-ink-3">Arşivlendi</span>
                  ) : (
                    <select
                      aria-label="Durum"
                      value={boat.status}
                      onChange={(e) => setBoatStatus(boat.id, e.target.value as BoatStatus)}
                      className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                    >
                      <option value="taslak">Taslak</option>
                      <option value="aktif">Aktif</option>
                      <option value="pasif">Pasif</option>
                    </select>
                  )}
                </span>
                <span className="flex w-52 justify-end gap-1.5">
                  <Button type="button" size="sm" onClick={() => router.push(`/extranet/tekneler/${boat.id}`)}>
                    Düzenle
                  </Button>
                  <Button type="button" size="sm" onClick={() => duplicateBoat(boat.id)}>
                    Kopyala
                  </Button>
                  {boat.status !== "arsivlendi" && (
                    <Button type="button" size="sm" onClick={() => setArchiveTarget(boat.id)}>
                      Kalıcı kaldır
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(boat.id)}>
                    Sil
                  </Button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Kalıcı kaldır"
        body="Bu tekne arşivlenecek; yeni satışa kapanır ve bu işlem geri alınamaz."
        confirmLabel="Kalıcı kaldır"
        tone="danger"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) setBoatStatus(archiveTarget, "arsivlendi");
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}
