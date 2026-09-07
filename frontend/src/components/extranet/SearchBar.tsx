"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { useSearchHotkey } from "@/lib/use-shortcuts";
import { Button } from "@/components/primitives/Button";

/**
 * Extranet arama çubuğu — sekmesiz tek satır.
 *
 * Alanlar dikey hairline ile ayrılıyor, her alan kendi genişliğini alıyor.
 * Yoğunluk token'dan geldiği için aynı bileşen B2C'de comfortable ölçekte
 * daha yüksek ve daha ferah çiziliyor.
 */
export function SearchBar({
  kind = "tour",
  defaultDestination = "",
  defaultDate = "2026-09-18",
  defaultCheckout = "2026-10-15",
  autoFocus = false,
}: {
  /** Otel araması tarih aralığı ve oda ister; tur tek tarih ve katılımcı. */
  kind?: "tour" | "hotel";
  defaultDestination?: string;
  defaultDate?: string;
  defaultCheckout?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const destRef = useRef<HTMLInputElement>(null);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [checkout, setCheckout] = useState(defaultCheckout);
  const [rooms, setRooms] = useState(1);

  useSearchHotkey(destRef);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      nereye: destination || "Kapadokya",
      tarih: date,
      yetiskin: String(adults),
      cocuk: String(children),
      ...(kind === "hotel" ? { cikis: checkout, oda: String(rooms) } : {}),
    });
    router.push(`/extranet/arama/${kind === "hotel" ? "otel" : "tur"}?${params}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-[var(--radius-lg)]
                 border border-line-strong bg-line-strong sm:flex-nowrap"
    >
      <Field label={t("search.destination")} className="min-w-56 flex-[2]">
        <input
          ref={destRef}
          autoFocus={autoFocus}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={t("search.destinationPlaceholder")}
          className="w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink
                     outline-none placeholder:text-ink-3"
        />
      </Field>

      <Field
        label={kind === "hotel" ? t("search.checkIn") : t("search.date")}
        className="min-w-36 flex-1"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="tnum w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink outline-none"
        />
      </Field>

      {kind === "hotel" && (
        <Field label={t("search.checkOut")} className="min-w-36 flex-1">
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            className="tnum w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink outline-none"
          />
        </Field>
      )}

      {kind === "hotel" && (
        <Field label={t("search.rooms")} className="w-20">
          <input
            type="number"
            min={1}
            max={9}
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="tnum w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink outline-none"
          />
        </Field>
      )}

      <Field label={t("search.adults")} className="w-24">
        <input
          type="number"
          min={1}
          max={30}
          value={adults}
          onChange={(e) => setAdults(Number(e.target.value))}
          className="tnum w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink outline-none"
        />
      </Field>

      <Field label={t("search.children")} className="w-24">
        <input
          type="number"
          min={0}
          max={20}
          value={children}
          onChange={(e) => setChildren(Number(e.target.value))}
          className="tnum w-full bg-transparent text-[length:calc(var(--font-ui)*1.05)] text-ink outline-none"
        />
      </Field>

      <Button
        type="submit"
        variant="primary"
        className="h-auto shrink-0 rounded-none border-0 px-6 text-[length:calc(var(--font-ui)*1.05)]"
      >
        {t("search.submit")}
      </Button>
    </form>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex flex-col justify-center bg-surface px-3 py-2 focus-within:bg-action-tint ${className}`}
    >
      <span className="mb-0.5 text-[length:var(--font-ui-xs)] text-ink-3">{label}</span>
      {children}
    </label>
  );
}
