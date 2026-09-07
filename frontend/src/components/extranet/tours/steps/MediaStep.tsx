"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { generateImageTone } from "@/lib/ai-mock";
import type { StepProps } from "./shared";

/**
 * 3.6 Fotoğraf/Video — yükleme + kapak seçimi (MVP).
 *
 * Gerçek dosya depolama yok: önizleme yalnızca bu oturumda `URL.createObjectURL`
 * ile üretilir ve sekme kapanınca kaybolur (dürüst prototip sınırlaması —
 * bkz. READINESS.md). Taslağa yalnızca dosya adı + kapak seçimi yazılır.
 */
export function MediaStep({ draft, onChange }: StepProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [imagePrompt, setImagePrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateImage = () => {
    setGenerating(true);
    setTimeout(() => {
      const id = crypto.randomUUID();
      const prompt = imagePrompt.trim() || draft.title || "tur";
      const tone = generateImageTone(prompt);
      onChange({
        images: [...draft.images, { id, alt: `AI görsel: ${prompt}`, tone }],
        coverImageId: draft.coverImageId ?? id,
      });
      setImagePrompt("");
      setGenerating(false);
    }, 600);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => {
      const id = crypto.randomUUID();
      setPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
      return { id, alt: file.name };
    });
    onChange({
      images: [...draft.images, ...added],
      coverImageId: draft.coverImageId ?? added[0].id,
    });
  };

  const remove = (id: string) => {
    onChange({
      images: draft.images.filter((image) => image.id !== id),
      coverImageId: draft.coverImageId === id ? null : draft.coverImageId,
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

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          AI ile Görsel Oluştur
        </span>
        <p className="text-[length:var(--font-ui-xs)] text-ink-3">
          Profesyonel çekimi olmayan tedarikçiler için hızlı vitrin
          görseli — gerçek görsel üretimi yerine temsili bir ton kullanılır.
        </p>
        <div className="flex gap-2">
          <input
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="ör. Kapadokya gün doğumu, sıcak tonlar"
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
          <Button type="button" size="sm" onClick={generateImage} disabled={generating}>
            {generating ? "Oluşturuluyor…" : "Oluştur"}
          </Button>
        </div>
      </div>

      <TextField
        label="YouTube / Vimeo Linki"
        hint="Galeri içinde oynatıcı olarak gömülür."
        value={draft.videoUrl ?? ""}
        onChange={(e) => onChange({ videoUrl: e.target.value || null })}
        placeholder="https://youtube.com/watch?v=..."
      />

      {draft.images.length === 0 ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Henüz görsel eklenmedi.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {draft.images.map((image) => {
            const isCover = draft.coverImageId === image.id;
            return (
              <div
                key={image.id}
                className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border p-2 ${
                  isCover ? "border-action" : "border-line"
                }`}
              >
                <div
                  className="flex h-24 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-sunken"
                  style={image.tone && !previews[image.id] ? { backgroundColor: image.tone } : undefined}
                >
                  {previews[image.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[image.id]}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className={`px-2 text-center text-[length:var(--font-ui-xs)] ${image.tone ? "text-white/90" : "text-ink-3"}`}
                    >
                      {image.alt}
                    </span>
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
    </div>
  );
}
