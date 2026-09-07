"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { SelectField, TextField } from "@/components/primitives/Field";
import { EmptyState } from "@/components/primitives/States";
import { useToast } from "@/components/primitives/Toast";
import { generateFullDraftFromTitle } from "@/lib/ai-mock";
import { formatMoney } from "@/lib/i18n";
import { slugify } from "@/lib/tour";
import { useTourCatalog } from "@/lib/tour-store";
import { TOUR_STATUS_META, type TourStatus } from "@/lib/tour-status";

const STATUS_CHIPS: ChipDef[] = [
  { id: "taslak", label: "tourStatus.taslak" },
  { id: "aktif", label: "tourStatus.aktif" },
  { id: "pasif", label: "tourStatus.pasif" },
  { id: "arsivlendi", label: "tourStatus.arsivlendi" },
];

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

const STATUS_LABELS: Record<TourStatus, string> = {
  taslak: "Taslak",
  aktif: "Aktif",
  pasif: "Pasif",
  arsivlendi: "Arşivlendi",
};

export function TourListView() {
  const router = useRouter();
  const {
    tours,
    updateTour,
    setStatus,
    removeTour,
    restoreTour,
    duplicateTour,
    createTour,
    tenantSettings,
    setAlternateDisplayCurrency,
  } = useTourCatalog();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiWorking, setAiWorking] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = tours;
    if (statuses.length) list = list.filter((tour) => statuses.includes(tour.status));
    if (q) {
      list = list.filter(
        (tour) =>
          tour.id.toLocaleLowerCase("tr").includes(q) ||
          tour.title.toLocaleLowerCase("tr").includes(q),
      );
    }
    return list;
  }, [tours, query, statuses]);

  const handleDelete = (id: string) => {
    const index = tours.findIndex((tour) => tour.id === id);
    const tour = tours[index];
    if (!tour) return;
    removeTour(id);
    notify(`${tour.title || "Tur"} silindi.`, () => restoreTour(tour, index));
  };

  const generateWithAi = () => {
    if (!aiTitle.trim()) return;
    setAiWorking(true);
    setTimeout(() => {
      const draft = createTour();
      updateTour(draft.id, { ...generateFullDraftFromTitle(aiTitle), slug: slugify(aiTitle) });
      setAiWorking(false);
      setAiOpen(false);
      setAiTitle("");
      router.push(`/extranet/turlar/${draft.id}`);
    }, 700);
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Tüm Turlar</h1>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          Genel Ürün Ayarları
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAiOpen(true)}>
          Yapay Zeka ile Tur Üret
        </Button>
        <ButtonLink href="/extranet/turlar/yeni" variant="primary" size="sm" className="ms-auto">
          Tur Oluştur
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line px-[var(--pad-x)] py-2.5">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Ara</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı / kodu ara"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui)] text-ink outline-none
                       placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar
          chips={STATUS_CHIPS}
          active={statuses}
          onToggle={(id) =>
            setStatuses((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onClear={() => setStatuses([])}
        />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">
          {rows.length} ürün
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={tours.length === 0 ? "Henüz tur oluşturulmadı" : "Sonuç bulunamadı"}
          body={
            tours.length === 0
              ? "İlk tur ürününüzü oluşturarak kataloğunuzu başlatın."
              : "Arama veya filtreleri değiştirip tekrar deneyin."
          }
          action={
            tours.length === 0 ? (
              <ButtonLink href="/extranet/turlar/yeni" variant="primary">
                Tur Oluştur
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            role="row"
            className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5
                       text-[length:var(--font-ui-xs)] text-ink-3"
          >
            <span className="w-28">Ürün ID</span>
            <span className="min-w-0 flex-1">Ürün Adı</span>
            <span className="w-16">Tedarikçi</span>
            <span className="w-20 text-center">Öne Çıkar</span>
            <span className="w-32 text-center">Anasayfada Göster</span>
            <span className="w-28 text-end">Etiket Fiyatı</span>
            <span className="w-24">Durum</span>
            <span className="w-52 text-end">İşlemler</span>
          </div>

          {rows.map((tour) => {
            const adultPrice = tour.ageTiers.find((tier) => tier.key === "adult")?.price ?? 0;
            const alt = tenantSettings.alternateDisplayCurrency;
            const meta = TOUR_STATUS_META[tour.status];
            const statusOptions = [tour.status, ...meta.next.filter((s) => s !== "arsivlendi")];
            return (
              <div
                key={tour.id}
                role="row"
                className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2"
              >
                <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">
                  {tour.id}
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/extranet/turlar/${tour.id}`)}
                  className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui)] text-ink hover:underline"
                >
                  {tour.title || "(Başlıksız taslak)"}
                </button>
                <span className="w-16 text-[length:var(--font-ui-sm)] text-ink-3">-</span>
                <span className="flex w-20 justify-center">
                  <input
                    type="checkbox"
                    aria-label="Öne çıkar"
                    checked={tour.featured}
                    onChange={(e) => updateTour(tour.id, { featured: e.target.checked })}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                </span>
                <span className="flex w-32 justify-center">
                  <input
                    type="checkbox"
                    aria-label="Anasayfada göster"
                    checked={tour.showOnWebsite}
                    onChange={(e) => updateTour(tour.id, { showOnWebsite: e.target.checked })}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                </span>
                <span className="tnum w-28 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                  {formatMoney(adultPrice, tour.pricingCurrency)}
                  {alt && alt !== tour.pricingCurrency && (
                    <span className="ms-1 text-ink-3">({formatMoney(adultPrice, alt)})</span>
                  )}
                </span>
                <span className="w-24">
                  {tour.status === "arsivlendi" ? (
                    <span className="text-[length:var(--font-ui-sm)] text-ink-3">Arşivlendi</span>
                  ) : (
                    <select
                      aria-label="Durum"
                      value={tour.status}
                      onChange={(e) => setStatus(tour.id, e.target.value as TourStatus)}
                      className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface
                                 text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
                <span className="flex w-52 justify-end gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/extranet/turlar/${tour.id}`)}
                  >
                    Düzenle
                  </Button>
                  <Button type="button" size="sm" onClick={() => duplicateTour(tour.id)}>
                    Kopyala
                  </Button>
                  {tour.status !== "arsivlendi" && (
                    <Button type="button" size="sm" onClick={() => setArchiveTarget(tour.id)}>
                      Kalıcı kaldır
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(tour.id)}
                  >
                    Sil
                  </Button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <SettingsDialog
        open={settingsOpen}
        currency={tenantSettings.alternateDisplayCurrency}
        onSave={(currency) => {
          setAlternateDisplayCurrency(currency);
          setSettingsOpen(false);
        }}
        onClose={() => setSettingsOpen(false)}
      />

      <AiCreateDialog
        open={aiOpen}
        title={aiTitle}
        working={aiWorking}
        onTitleChange={setAiTitle}
        onGenerate={generateWithAi}
        onClose={() => setAiOpen(false)}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Kalıcı kaldır"
        body="Bu ürün arşivlenecek; yeni satışa kapanır ve bu işlem geri alınamaz. Geçmiş kayıtlarla ilişkisi korunur."
        confirmLabel="Kalıcı kaldır"
        tone="danger"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) setStatus(archiveTarget, "arsivlendi");
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}

function SettingsDialog({
  open,
  currency,
  onSave,
  onClose,
}: {
  open: boolean;
  currency: string | null;
  onSave: (currency: string | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currency ?? "");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-dense text-lg font-medium text-ink">Genel Ürün Ayarları</h2>
        <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
          Tüm ürünler için varsayılan alternatif gösterim para birimi. Satış
          veya ödeme akışını etkilemez; her ürün kendi düzenleme adımından
          bunu geçersiz kılabilir.
        </p>
        <div className="mt-4">
          <SelectField label="Alternatif gösterim para birimi" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">Yok</option>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Kapat
          </Button>
          <Button type="button" variant="primary" onClick={() => onSave(value || null)}>
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

function AiCreateDialog({
  open,
  title,
  working,
  onTitleChange,
  onGenerate,
  onClose,
}: {
  open: boolean;
  title: string;
  working: boolean;
  onTitleChange: (v: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-dense text-lg font-medium text-ink">Yapay Zeka ile Tur Üret</h2>
        <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
          Sadece başlık girin; açıklama, dahil olanlar ve bilinmesi
          gerekenler dahil bir taslak otomatik oluşturulur.
        </p>
        <div className="mt-4">
          <TextField
            label="Başlık"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="ör. Kapadokya yeraltı şehri turu"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="button" variant="primary" onClick={onGenerate} disabled={working || !title.trim()}>
            {working ? "Oluşturuluyor…" : "Taslak Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  );
}
