"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import type { VehicleStepProps } from "./shared";

/**
 * 1.2 adım 4 — Fotoğraf/Video. Tur Oluştur sihirbazındaki `MediaStep` ile
 * aynı davranış (bkz. Tur Oluşturma Sihirbazı Spesifikasyonu Bölüm 3.6);
 * farklı taslak tipine (Vehicle) bağlı olduğu için ayrı bileşen.
 */
export function VehicleMediaStep({ vehicle, onChange }: VehicleStepProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => {
      const id = crypto.randomUUID();
      setPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
      return { id, alt: file.name };
    });
    onChange({
      images: [...vehicle.images, ...added],
      coverImageId: vehicle.coverImageId ?? added[0].id,
    });
  };

  const remove = (id: string) => {
    onChange({
      images: vehicle.images.filter((image) => image.id !== id),
      coverImageId: vehicle.coverImageId === id ? null : vehicle.coverImageId,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Fotoğraf ekleyin
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="text-[length:var(--font-ui-sm)] text-ink-2 file:me-3 file:rounded-[var(--radius)]
                     file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5
                     file:text-[length:var(--font-ui-sm)] file:text-ink hover:file:bg-sunken"
        />
      </label>

      {vehicle.images.length === 0 ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">Henüz görsel eklenmedi.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {vehicle.images.map((image) => {
            const isCover = vehicle.coverImageId === image.id;
            return (
              <div
                key={image.id}
                className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border p-2 ${
                  isCover ? "border-action" : "border-line"
                }`}
              >
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-sunken">
                  {previews[image.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[image.id]} alt={image.alt} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-[length:var(--font-ui-xs)] text-ink-3">{image.alt}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ coverImageId: image.id })}
                    className={`text-[length:var(--font-ui-xs)] underline decoration-line-strong underline-offset-2 ${
                      isCover ? "text-action" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {isCover ? "Kapak fotoğrafı" : "Kapak yap"}
                  </button>
                  <Button type="button" size="sm" variant="danger" onClick={() => remove(image.id)}>
                    Sil
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TextField
        label="YouTube / Vimeo Linki"
        value={vehicle.videoUrl ?? ""}
        onChange={(e) => onChange({ videoUrl: e.target.value || null })}
        placeholder="https://youtube.com/watch?v=..."
      />
    </div>
  );
}
