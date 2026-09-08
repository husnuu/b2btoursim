"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { SelectField, TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { useVisaCatalog } from "@/lib/visa-store";
import type { VisaStatus } from "@/lib/visa-status";

/** 2.1 Vizeler — Liste/Boş Durum Ekranı. */
export function VisaSalesView() {
  const router = useRouter();
  const { visas, bookings, setVisaStatus, removeVisa, restoreVisa, duplicateVisa, createBooking } = useVisaCatalog();
  const { notify } = useToast();
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const activeVisas = useMemo(() => visas.filter((v) => v.status === "aktif"), [visas]);
  const [visaId, setVisaId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const visa = activeVisas.find((v) => v.id === visaId);

  const handleDelete = (id: string) => {
    const index = visas.findIndex((v) => v.id === id);
    const target = visas[index];
    if (!target) return;
    removeVisa(id);
    notify(`${target.title || "Vize"} silindi.`, () => restoreVisa(target, index));
  };

  const book = () => {
    if (!visa || !customerName.trim()) return;
    createBooking({
      visaId: visa.id,
      visaTitleSnapshot: visa.title,
      customerName,
      price: visa.price,
      currency: visa.currency,
      operationStatus: "planlamaBekliyor",
    });
    notify("Rezervasyon oluşturuldu.");
    setCustomerName("");
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Vizeler</h1>
        <ButtonLink href="/extranet/vize/yeni" variant="primary" size="sm" className="ms-auto">
          Vize Oluştur
        </ButtonLink>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visas.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-start gap-2 px-[var(--pad-x)] py-14">
            <div aria-hidden="true" className="mb-3 flex w-28 flex-col gap-1.5">
              <span className="h-px w-full bg-line-strong" />
              <span className="h-px w-full bg-line" />
              <span className="h-px w-2/3 bg-line" />
            </div>
            <h2 className="text-lg font-medium text-ink">Vizelerinizi ekleyin</h2>
            <p className="max-w-[52ch] text-ink-2">
              Bu sayfa vize satışı içindir: eklenen vizeler sitede listelenir ve rezervasyon olarak
              satılır.
            </p>
            <ButtonLink href="/extranet/vize/yeni" variant="primary" className="mt-3">
              Vize Oluştur
            </ButtonLink>

            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
              <Link href="/extranet/vize/basvuru-formlari" className="rounded-[var(--radius-lg)] border border-line p-3 hover:border-ink-3">
                <p className="font-medium text-ink">Başvuru Formları</p>
                <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                  Tek dilli form tasarlayın, public linkle bilgi ve belge toplayın.
                </p>
              </Link>
              <Link href="/extranet/vize/basvurular" className="rounded-[var(--radius-lg)] border border-line p-3 hover:border-ink-3">
                <p className="font-medium text-ink">Vize Başvuruları</p>
                <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                  Dosyaları görüntüleyin, durum takibi yapın, link gönderin.
                </p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div role="row" className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
              <span className="w-28">Vize ID</span>
              <span className="min-w-0 flex-1">Başlık / Ülke</span>
              <span className="w-24 text-end">Fiyat</span>
              <span className="w-24">Durum</span>
              <span className="w-52 text-end">İşlemler</span>
            </div>
            {visas.map((v) => (
              <div key={v.id} role="row" className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2">
                <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">{v.id}</span>
                <button type="button" onClick={() => router.push(`/extranet/vize/${v.id}`)} className="min-w-0 flex-1 truncate text-start text-[length:var(--font-ui)] text-ink hover:underline">
                  {v.title || "(Başlıksız vize)"} {v.country && <span className="text-ink-3">· {v.country}</span>}
                </button>
                <span className="tnum w-24 text-end text-[length:var(--font-ui-sm)] text-ink-2">{formatMoney(v.price, v.currency)}</span>
                <span className="w-24">
                  {v.status === "arsivlendi" ? (
                    <span className="text-[length:var(--font-ui-sm)] text-ink-3">Arşivlendi</span>
                  ) : (
                    <select aria-label="Durum" value={v.status} onChange={(e) => setVisaStatus(v.id, e.target.value as VisaStatus)} className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action">
                      <option value="taslak">Taslak</option>
                      <option value="aktif">Aktif</option>
                      <option value="pasif">Pasif</option>
                    </select>
                  )}
                </span>
                <span className="flex w-52 justify-end gap-1.5">
                  <Button type="button" size="sm" onClick={() => router.push(`/extranet/vize/${v.id}`)}>
                    Düzenle
                  </Button>
                  <Button type="button" size="sm" onClick={() => duplicateVisa(v.id)}>
                    Kopyala
                  </Button>
                  {v.status !== "arsivlendi" && (
                    <Button type="button" size="sm" onClick={() => setArchiveTarget(v.id)}>
                      Kalıcı kaldır
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(v.id)}>
                    Sil
                  </Button>
                </span>
              </div>
            ))}

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-[var(--pad-x)] py-6">
              <h2 className="font-dense text-base font-medium text-ink">Rezervasyon Oluştur</h2>
              <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                Bölüm 6 (Önerilen) — Tur/Villa modüllerindeki rezervasyon paneli iskeleti.
              </p>
              {activeVisas.length === 0 ? (
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">Önce bir vizeyi yayınlayın (Aktif).</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <SelectField label="Vize" value={visaId} onChange={(e) => setVisaId(e.target.value)}>
                    <option value="">Seçilmedi</option>
                    {activeVisas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </SelectField>
                  <TextField label="Müşteri adı" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Button type="button" variant="primary" className="self-end" disabled={!visa || !customerName.trim()} onClick={book}>
                    Rezervasyon Oluştur
                  </Button>
                </div>
              )}

              {bookings.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[length:var(--font-ui)] text-ink">{b.visaTitleSnapshot}</p>
                        <p className="text-[length:var(--font-ui-sm)] text-ink-3">{b.customerName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tnum text-[length:var(--font-ui-sm)] font-medium text-ink">{formatMoney(b.price, b.currency)}</span>
                        <TransferOperationStatusBadge status={b.operationStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Kalıcı kaldır"
        body="Bu vize arşivlenecek; yeni satışa kapanır ve bu işlem geri alınamaz."
        confirmLabel="Kalıcı kaldır"
        tone="danger"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) setVisaStatus(archiveTarget, "arsivlendi");
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}
