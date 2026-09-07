"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { useTourCatalog } from "@/lib/tour-store";
import type { StepProps } from "./shared";

/** 3.2 Kategori — Tur Kategorileri kütüphanesinden çoklu seçim. */
export function CategoryStep({ draft, onChange }: StepProps) {
  const { categories, addTourCategory } = useTourCatalog();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const toggle = (id: string) => {
    onChange({
      categoryIds: draft.categoryIds.includes(id)
        ? draft.categoryIds.filter((c) => c !== id)
        : [...draft.categoryIds, id],
    });
  };

  const save = () => {
    const name = title.trim();
    if (!name) return;
    const created = addTourCategory({
      title: name,
      slug: name.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-"),
    });
    onChange({ categoryIds: [...draft.categoryIds, created.id] });
    setTitle("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        {categories.map((category) => {
          const on = draft.categoryIds.includes(category.id);
          return (
            <label
              key={category.id}
              className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 ${
                on ? "border-action bg-action-tint" : "border-line"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(category.id)}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="text-[length:var(--font-ui)] text-ink">{category.title}</span>
            </label>
          );
        })}
      </div>

      {!adding ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
          + Yeni kategori ekle
        </Button>
      ) : (
        <div className="flex items-end gap-2">
          <TextField label="Kategori başlığı" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="button" onClick={() => setAdding(false)}>
            Vazgeç
          </Button>
          <Button type="button" variant="primary" onClick={save}>
            Ekle ve seç
          </Button>
        </div>
      )}

      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Ana kategori/ikincil kategori ayrımı ve hiyerarşik ağaç bu sürümde
        yok; tüm seçimler eşit ağırlıkta kategori olarak uygulanır.
      </p>
    </div>
  );
}
