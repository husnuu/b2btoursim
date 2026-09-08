"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { useTransferCatalog } from "@/lib/transfer-store";

/** 2.1 Araç Noktaları — tekrar kullanılabilir nokta kütüphanesi. */
export function PointsLibrary() {
  const { points, addPoint, removePoint } = useTransferCatalog();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", description: "" });

  const save = () => {
    if (!form.name.trim()) return;
    addPoint(form);
    setForm({ name: "", address: "", description: "" });
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {points.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {points.map((point) => (
            <li key={point.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[length:var(--font-ui)] text-ink">{point.name}</p>
                <p className="truncate text-[length:var(--font-ui-sm)] text-ink-3">{point.address}</p>
              </div>
              <Button type="button" size="sm" variant="danger" onClick={() => removePoint(point.id)}>
                Sil
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
          Nokta Oluştur
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <TextField label="Nokta Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Harita konumu / adres" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
