"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { generateImageTone } from "@/lib/ai-mock";
import type { BoatStepProps } from "./shared";

/** 3.4 Fotoğraf/Video — yayınlama için en az 3 görsel zorunlu (Bölüm 2). */
export function MediaStep({ boat, onChange }: BoatStepProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [imagePrompt, setImagePrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => {
      const id = crypto.randomUUID();
      setPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
      return { id, alt: file.name };
    });
    onChange({ images: [...boat.images, ...added], coverImageId: boat.coverImageId ?? added[0].id });
  };

  const generateImage = () => {
    setGenerating(true);
    setTimeout(() => {
      const id = crypto.randomUUID();
      const prompt = imagePrompt.trim() || boat.title || "tekne";
      onChange({
        images: [...boat.images, { id, alt: `AI görsel: ${prompt}`, tone: generateImageTone(prompt) }],
        coverImageId: boat.coverImageId ?? id,
      });
      setImagePrompt("");
      setGenerating(false);
    }, 600);
  };

  const remove = (id: string) => {
    onChange({ images: boat.images.filter((i) => i.id !== id), coverImageId: boat.coverImageId === id ? null : boat.coverImageId });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Fotoğraf Ekleyin<span className="ms-0.5 text-danger">*</span>
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="text-[length:var(--font-ui-sm)] text-ink-2 file:me-3 file:rounded-[var(--radius)] file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[length:var(--font-ui-sm)] file:text-ink hover:file:bg-sunken"
        />
        <span className={`text-[length:var(--font-ui-sm)] ${boat.images.length < 3 ? "text-danger" : "text-ink-3"}`}>
          {boat.images.length} / 3 görsel yüklendi — yayınlamak için en az 3 gerekir.
        </span>
      </label>

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">AI ile Görsel Oluştur</span>
        <div className="flex gap-2">
          <input
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="ör. mavi sularda gulet, gün batımı"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
          <Button type="button" size="sm" onClick={generateImage} disabled={generating}>
            {generating ? "Oluşturuluyor…" : "Oluştur"}
          </Button>
        </div>
      </div>

      {boat.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {boat.images.map((image) => {
            const isCover = boat.coverImageId === image.id;
            return (
              <div key={image.id} className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border p-2 ${isCover ? "border-action" : "border-line"}`}>
                <div
                  className="flex h-24 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-sunken"
                  style={image.tone && !previews[image.id] ? { backgroundColor: image.tone } : undefined}
                >
                  {previews[image.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[image.id]} alt={image.alt} className="h-full w-full object-cover" />
                  ) : (
                    <span className={`px-2 text-center text-[length:var(--font-ui-xs)] ${image.tone ? "text-white/90" : "text-ink-3"}`}>{image.alt}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ coverImageId: image.id })}
                    className={`text-[length:var(--font-ui-xs)] underline decoration-line-strong underline-offset-2 ${isCover ? "text-action" : "text-ink-3 hover:text-ink"}`}
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

      <TextField label="YouTube / Vimeo Linki" value={boat.videoUrl ?? ""} onChange={(e) => onChange({ videoUrl: e.target.value || null })} placeholder="https://youtube.com/watch?v=..." />
    </div>
  );
}
