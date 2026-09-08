"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { EmptyState } from "@/components/primitives/States";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { useVillaCatalog } from "@/lib/villa-store";
import type { VillaStatus } from "@/lib/villa-status";

const STATUS_CHIPS: ChipDef[] = [
  { id: "taslak", label: "villaStatus.taslak" },
  { id: "aktif", label: "villaStatus.aktif" },
  { id: "pasif", label: "villaStatus.pasif" },
  { id: "arsivlendi", label: "villaStatus.arsivlendi" },
];

export function VillaListView() {
  const router = useRouter();
  const { villas, regions, setVillaStatus, removeVilla, restoreVilla, duplicateVilla } = useVillaCatalog();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = villas;
    if (statuses.length) list = list.filter((v) => statuses.includes(v.status));
    if (q) list = list.filter((v) => v.title.toLocaleLowerCase("tr").includes(q));
    return list;
  }, [villas, query, statuses]);

  const handleDelete = (id: string) => {
    const index = villas.findIndex((v) => v.id === id);
    const villa = villas[index];
    if (!villa) return;
    removeVilla(id);
    notify(`${villa.title || "Villa"} silindi.`, () => restoreVilla(villa, index));
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Villalar</h1>
        <ButtonLink href="/extranet/villalar/yeni" variant="primary" size="sm" className="ms-auto">
          Villa Ekle
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line px-[var(--pad-x)] py-2.5">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Ara</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Villa adına göre ara"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar chips={STATUS_CHIPS} active={statuses} onToggle={(id) => setStatuses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))} onClear={() => setStatuses([])} />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">{rows.length} villa</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={villas.length === 0 ? "Henüz villa eklenmedi" : "Sonuç bulunamadı"}
          body={villas.length === 0 ? "İlk villanızı ekleyerek envanterinizi oluşturun." : "Arama veya filtreleri değiştirip tekrar deneyin."}
          action={villas.length === 0 ? <ButtonLink href="/extranet/villalar/yeni" variant="primary">Villa Ekle</ButtonLink> : undefined}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div role="row" className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
            <span className="w-28">Villa ID</span>
            <span className="min-w-0 flex-1">Villa Adı</span>
            <span className="w-32">Bölge / Konum</span>
            <span className="w-20 text-end">Kapasite</span>
            <span className="w-24 text-end">Etiket Fiyatı</span>
            <span className="w-24">Durum</span>
            <span className="w-52 text-end">İşlemler</span>
          </div>

          {rows.map((villa) => {
            const regionNames = villa.regionIds.map((id) => regions.find((r) => r.id === id)?.name).filter(Boolean).join(", ");
            return (
              <div key={villa.id} role="row" className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2">
                <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">{villa.id}</span>
                <button type="button" onClick={() => router.push(`/extranet/villalar/${villa.id}`)} className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui)] text-ink hover:underline">
                  {villa.title || "(Başlıksız villa)"}
                </button>
                <span className="w-32 truncate text-[length:var(--font-ui-sm)] text-ink-2">{regionNames || villa.province || "—"}</span>
                <span className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-ink-2">{villa.capacity}</span>
                <span className="tnum w-24 text-end text-[length:var(--font-ui-sm)] text-ink-2">{formatMoney(villa.nightlyRate, villa.priceCurrency)}</span>
                <span className="w-24">
                  {villa.status === "arsivlendi" ? (
                    <span className="text-[length:var(--font-ui-sm)] text-ink-3">Arşivlendi</span>
                  ) : (
                    <select aria-label="Durum" value={villa.status} onChange={(e) => setVillaStatus(villa.id, e.target.value as VillaStatus)} className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action">
                      <option value="taslak">Taslak</option>
                      <option value="aktif">Aktif</option>
                      <option value="pasif">Pasif</option>
                    </select>
                  )}
                </span>
                <span className="flex w-52 justify-end gap-1.5">
                  <Button type="button" size="sm" onClick={() => router.push(`/extranet/villalar/${villa.id}`)}>
                    Düzenle
                  </Button>
                  <Button type="button" size="sm" onClick={() => duplicateVilla(villa.id)}>
                    Kopyala
                  </Button>
                  {villa.status !== "arsivlendi" && (
                    <Button type="button" size="sm" onClick={() => setArchiveTarget(villa.id)}>
                      Kalıcı kaldır
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(villa.id)}>
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
        body="Bu villa arşivlenecek; yeni satışa kapanır ve bu işlem geri alınamaz."
        confirmLabel="Kalıcı kaldır"
        tone="danger"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) setVillaStatus(archiveTarget, "arsivlendi");
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}
