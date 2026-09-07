"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, TextAreaField, TextField } from "@/components/primitives/Field";
import type { ItineraryStop } from "@/lib/tour";
import type { StepProps } from "./shared";

function reorder<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** 3.3 Tur Programı (Tur Rotası + Gidilecek Yerler). */
export function ItineraryStep({ draft, onChange }: StepProps) {
  const [routeInput, setRouteInput] = useState("");

  const addStop = () => {
    const stop: ItineraryStop = {
      id: crypto.randomUUID(),
      name: "",
      durationMinutes: 60,
      description: "",
    };
    onChange({ itinerary: [...draft.itinerary, stop] });
  };

  const updateStop = (id: string, patch: Partial<ItineraryStop>) => {
    onChange({
      itinerary: draft.itinerary.map((stop) =>
        stop.id === id ? { ...stop, ...patch } : stop,
      ),
    });
  };

  const removeStop = (id: string) => {
    onChange({ itinerary: draft.itinerary.filter((stop) => stop.id !== id) });
  };

  const moveStop = (index: number, dir: -1 | 1) =>
    onChange({ itinerary: reorder(draft.itinerary, index, dir) });

  const addRouteStop = () => {
    const value = routeInput.trim();
    if (!value) return;
    onChange({ routeStops: [...draft.routeStops, value] });
    setRouteInput("");
  };

  const removeRouteStop = (index: number) =>
    onChange({ routeStops: draft.routeStops.filter((_, i) => i !== index) });

  const moveRouteStop = (index: number, dir: -1 | 1) =>
    onChange({ routeStops: reorder(draft.routeStops, index, dir) });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Başlangıç ülkesi / şehri"
          value={draft.startLocation}
          onChange={(e) => onChange({ startLocation: e.target.value })}
          placeholder="Türkiye, Kapadokya"
        />
        <TextField
          label="Bitiş ülkesi / şehri"
          value={draft.endLocation}
          onChange={(e) => onChange({ endLocation: e.target.value })}
          placeholder="Tek nokta turlarında başlangıçla aynı olabilir"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Tur Rotası</span>
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Turun sırayla geçtiği ülke/şehirler; Gidilecek Yerler&apos;den
          ayrı, yalnızca güzergah özeti.
        </p>
        <div className="flex gap-2">
          <input
            value={routeInput}
            onChange={(e) => setRouteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRouteStop();
              }
            }}
            placeholder="ör. Nevşehir"
            className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
          <Button type="button" size="sm" onClick={addRouteStop}>
            Rota noktası ekle
          </Button>
        </div>
        {draft.routeStops.length > 0 && (
          <ol className="flex flex-wrap items-center gap-1.5">
            {draft.routeStops.map((stop, index) => (
              <li
                key={`${stop}-${index}`}
                className="flex items-center gap-1 rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[length:var(--font-ui-sm)]"
              >
                <span className="tnum text-ink-3">{index + 1}.</span>
                {stop}
                <button type="button" onClick={() => moveRouteStop(index, -1)} disabled={index === 0} className="text-ink-3 hover:text-ink disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveRouteStop(index, 1)} disabled={index === draft.routeStops.length - 1} className="text-ink-3 hover:text-ink disabled:opacity-30">
                  ↓
                </button>
                <button type="button" onClick={() => removeRouteStop(index)} aria-label={`${stop} kaldır`} className="text-ink-3 hover:text-danger">
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
            Gidilecek Yerler
            <span aria-hidden="true" className="ms-0.5 text-danger">*</span>
          </span>
          <Button type="button" size="sm" onClick={addStop}>
            Durak ekle
          </Button>
        </div>

        {draft.itinerary.length === 0 && (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">
            Henüz durak eklenmedi. Yayınlamak için en az bir durak gerekir.
          </p>
        )}

        {draft.itinerary.map((stop, index) => (
          <div
            key={stop.id}
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="mt-2 shrink-0 text-[length:var(--font-ui-sm)] tnum text-ink-3">
                {index + 1}.
              </span>
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_8rem]">
                <TextField
                  label="Yer adı"
                  value={stop.name}
                  onChange={(e) => updateStop(stop.id, { name: e.target.value })}
                />
                <NumberField
                  label="Süre (dakika)"
                  min={0}
                  value={stop.durationMinutes}
                  onChange={(e) =>
                    updateStop(stop.id, { durationMinutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <TextAreaField
              label="Açıklama"
              rows={2}
              value={stop.description}
              onChange={(e) => updateStop(stop.id, { description: e.target.value })}
            />
            <div className="flex justify-end gap-1.5">
              <Button type="button" size="sm" onClick={() => moveStop(index, -1)} disabled={index === 0}>
                Yukarı
              </Button>
              <Button type="button" size="sm" onClick={() => moveStop(index, 1)} disabled={index === draft.itinerary.length - 1}>
                Aşağı
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={() => removeStop(stop.id)}>
                Kaldır
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
