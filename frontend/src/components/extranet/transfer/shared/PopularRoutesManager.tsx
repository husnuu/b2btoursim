"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { formatMoney } from "@/lib/i18n";
import { slugify } from "@/lib/tour";
import { emptyPopularRoute, type PopularRoute } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

type LocationOption = { id: string; name: string };

/**
 * 2.3 Araç Popüler Rotalar / 3.3 Popüler Harita Rotaları — belge bu ikisinin
 * "aynı işlevi gördüğünü" belirtiyor; `kind` ile ayrışan tek bileşen.
 */
export function PopularRoutesManager({
  kind,
  locations,
  emptyLocationsHint,
}: {
  kind: "point" | "zone";
  locations: LocationOption[];
  emptyLocationsHint: string;
}) {
  const { popularRoutes, vehicles, addPopularRoute, updatePopularRoute, removePopularRoute } = useTransferCatalog();
  const [editing, setEditing] = useState<PopularRoute | null>(null);

  const rows = popularRoutes.filter((route) => route.kind === kind);
  const locationName = (id: string | null) => locations.find((l) => l.id === id)?.name ?? "—";

  const startNew = () => setEditing(emptyPopularRoute(crypto.randomUUID(), kind));

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    const exists = rows.some((r) => r.id === editing.id);
    if (exists) {
      updatePopularRoute(editing.id, editing);
    } else {
      addPopularRoute(editing);
    }
    setEditing(null);
  };

  if (locations.length === 0) {
    return <p className="text-[length:var(--font-ui-sm)] text-ink-3">{emptyLocationsHint}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rows.map((route) => (
            <li
              key={route.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[length:var(--font-ui)] text-ink">{route.title}</p>
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                  {locationName(route.startId)} → {locationName(route.endId)}
                  {route.priceOverride != null && ` · ${formatMoney(route.priceOverride, route.currency)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button type="button" size="sm" onClick={() => setEditing(route)}>
                  Düzenle
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => removePopularRoute(route.id)}>
                  Kaldır
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!editing ? (
        <Button type="button" size="sm" className="self-start" onClick={startNew}>
          + Yeni popüler rota ekle
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <TextField
            label="Nokta Adı"
            value={editing.title}
            onChange={(e) => {
              const title = e.target.value;
              const slugFollowsTitle = editing.slug === slugify(editing.title);
              setEditing({ ...editing, title, slug: slugFollowsTitle ? slugify(title) : editing.slug });
            }}
            placeholder="ör. Kapadokya Havalimanı Transferi"
          />
          <TextField label="Slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
          <TextAreaField
            label="Nokta Açıklaması"
            rows={4}
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Başlangıç Noktası" value={editing.startId ?? ""} onChange={(e) => setEditing({ ...editing, startId: e.target.value || null })}>
              <option value="">Seçilmedi</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Bitiş Noktası" value={editing.endId ?? ""} onChange={(e) => setEditing({ ...editing, endId: e.target.value || null })}>
              <option value="">Seçilmedi</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem]">
            <SelectField label="Zaman Tipi" value={editing.durationUnit} onChange={(e) => setEditing({ ...editing, durationUnit: e.target.value as "dakika" | "saat" })}>
              <option value="dakika">Dakika</option>
              <option value="saat">Saat</option>
            </SelectField>
            <NumberField label="Zaman" min={0} value={editing.durationMinutes} onChange={(e) => setEditing({ ...editing, durationMinutes: Number(e.target.value) })} />
            <NumberField
              label="Öne çıkan fiyat"
              min={0}
              value={(editing.priceOverride ?? 0) / 100}
              onChange={(e) => setEditing({ ...editing, priceOverride: Math.round(Number(e.target.value) * 100) })}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[length:var(--font-ui-sm)] font-medium text-ink">Araçlar</span>
            <MultiSelectChips
              options={vehicles.map((v) => ({ id: v.id, label: v.title || "(Başlıksız)" }))}
              selectedIds={editing.vehicleIds}
              onToggle={(id) =>
                setEditing({
                  ...editing,
                  vehicleIds: editing.vehicleIds.includes(id)
                    ? editing.vehicleIds.filter((v) => v !== id)
                    : [...editing.vehicleIds, id],
                })
              }
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.useCustomTitleInListing}
              onChange={(e) => setEditing({ ...editing, useCustomTitleInListing: e.target.checked })}
              className="h-4 w-4 accent-[var(--action-primary)]"
            />
            <span className="text-[length:var(--font-ui)] text-ink">Listelemede rota başlığını kullan</span>
          </label>
          <p className="-mt-2 text-[length:var(--font-ui-sm)] text-ink-3">
            Kapalıyken sistem &quot;Nereden → Nereye&quot; formatını otomatik üretir.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(null)}>
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
