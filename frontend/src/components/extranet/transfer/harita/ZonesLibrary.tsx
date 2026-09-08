"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { useTransferCatalog } from "@/lib/transfer-store";

/**
 * 3.1 Harita Alanları (Simetrik/Önerilen, Faz3) — basitleştirilmiş
 * simülasyon: gerçek polygon çizimi yerine ad + şehir/ülke + anahtar
 * kelime listesiyle tanımlanan bir bölge (bkz. plan Varsayım 1).
 */
export function ZonesLibrary() {
  const { mapZones, addMapZone, removeMapZone } = useTransferCatalog();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", cityCountry: "", keywords: "" });

  const save = () => {
    if (!form.name.trim()) return;
    addMapZone(form);
    setForm({ name: "", cityCountry: "", keywords: "" });
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Gerçek harita üzerinde çokgen (polygon) çizimi bu prototipte yok;
        bölge, adres eşleştirmesi için anahtar kelimelerle tanımlanır.
      </p>

      {mapZones.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {mapZones.map((zone) => (
            <li key={zone.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[length:var(--font-ui)] text-ink">{zone.name}</p>
                <p className="truncate text-[length:var(--font-ui-sm)] text-ink-3">
                  {zone.cityCountry} · anahtar kelimeler: {zone.keywords || "—"}
                </p>
              </div>
              <Button type="button" size="sm" variant="danger" onClick={() => removeMapZone(zone.id)}>
                Sil
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
          Harita Alanı Oluştur
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <TextField label="Alan Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='ör. "Belek Otel Bölgesi"' />
          <TextField label="Şehir / Ülke" value={form.cityCountry} onChange={(e) => setForm({ ...form, cityCountry: e.target.value })} />
          <TextField
            label="Anahtar kelimeler (virgülle ayırın)"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            hint="Rezervasyon aramasında girilen adres bu kelimelerden biriyle eşleşirse bu bölge seçilir."
            placeholder="Belek, Otel Bölgesi"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setAdding(false)}>
              Vazgeç
            </Button>
            <Button type="button" variant="primary" onClick={save}>
              Kaydet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
