"use client";

import { useState } from "react";
import { ButtonLink, Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { formatDate } from "@/lib/i18n";
import type { VisaApplicationStatus } from "@/lib/visa";
import { useVisaCatalog } from "@/lib/visa-store";
import { ApplicationProcessBanner } from "./ApplicationProcessBanner";

const STATUS_LABELS: Record<VisaApplicationStatus, string> = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  belgeBekleniyor: "Belge Bekleniyor",
  konsoloslugaIletildi: "Konsolosluğa İletildi",
  tamamlandi: "Tamamlandı",
  reddedildi: "Reddedildi",
};

/** 5. Vize Başvuruları. */
export function ApplicationsView() {
  const { applications, setApplicationStatus, sendExtraDocRequest } = useVisaCatalog();
  const { notify } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);

  const changeStatus = (id: string, status: VisaApplicationStatus) => {
    const message = `Başvurunuzun durumu "${STATUS_LABELS[status]}" olarak güncellendi.`;
    setApplicationStatus(id, status, message);
    notify(`Durum güncellendi — başvuru sahibine bildirim gönderildi (simüle).`);
  };

  const requestExtraDoc = (id: string) => {
    sendExtraDocRequest(id);
    notify("Ek belge talebi linki gönderildi (simüle).");
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <ApplicationProcessBanner />

      <div className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Vize Başvuruları</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {applications.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-start gap-2 px-[var(--pad-x)] py-14">
            <h2 className="text-lg font-medium text-ink">Henüz başvuru yok</h2>
            <p className="max-w-[52ch] text-ink-2">
              Bir başvuru formu oluşturup linkini paylaştığınızda gelen başvurular burada
              listelenir.
            </p>
            <ButtonLink href="/extranet/vize/basvuru-formlari" variant="primary" className="mt-3">
              Başvuru formlarına git
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-col">
            <div role="row" className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
              <span className="w-32">Başvuru Sahibi</span>
              <span className="min-w-0 flex-1">Form Adı</span>
              <span className="w-28">Gönderim Tarihi</span>
              <span className="w-20 text-end">Belgeler</span>
              <span className="w-44">Durum</span>
              <span className="w-24 text-end">İşlemler</span>
            </div>
            {applications.map((app) => (
              <div key={app.id} className="border-b border-line">
                <div role="row" className="flex items-center gap-[var(--gap)] px-[var(--pad-x)] py-2">
                  <span className="w-32 truncate text-[length:var(--font-ui)] text-ink">{app.applicantName}</span>
                  <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui-sm)] text-ink-2">{app.formNameSnapshot}</span>
                  <span className="tnum w-28 text-[length:var(--font-ui-sm)] text-ink-2">{formatDate(app.submittedAt)}</span>
                  <span className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-ink-2">{app.documentNames.length}</span>
                  <span className="w-44">
                    <select
                      aria-label="Durum"
                      value={app.status}
                      onChange={(e) => changeStatus(app.id, e.target.value as VisaApplicationStatus)}
                      className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="flex w-24 justify-end">
                    <Button type="button" size="sm" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                      {expanded === app.id ? "Kapat" : "Detay"}
                    </Button>
                  </span>
                </div>
                {expanded === app.id && (
                  <div className="flex flex-col gap-3 border-t border-line bg-sunken px-[var(--pad-x)] py-3">
                    {Object.keys(app.answers).length > 0 && (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[length:var(--font-ui-sm)]">
                        {Object.entries(app.answers).map(([key, value]) => (
                          <div key={key} className="contents">
                            <dt className="text-ink-3">{key}</dt>
                            <dd className="text-ink">{value || "—"}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {app.documentNames.length > 0 && (
                      <p className="text-[length:var(--font-ui-sm)] text-ink-2">Belgeler: {app.documentNames.join(", ")}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button type="button" size="sm" onClick={() => requestExtraDoc(app.id)}>
                        Ek Belge Talebi Gönder
                      </Button>
                      {app.extraDocRequestSentAt && (
                        <span className="text-[length:var(--font-ui-sm)] text-ink-3">Gönderildi: {formatDate(app.extraDocRequestSentAt)}</span>
                      )}
                    </div>
                    {app.notifications.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-3">Bildirim Geçmişi</span>
                        {app.notifications.map((n) => (
                          <p key={n.id} className="text-[length:var(--font-ui-sm)] text-ink-2">
                            {formatDate(n.sentAt)} — {n.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
