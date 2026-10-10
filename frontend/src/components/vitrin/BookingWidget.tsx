"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays, CalendarCheck, ChevronDown, Flame, Info, Minus, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvailabilityCalendar, formatTr } from "./AvailabilityCalendar";
import { availability, tl, type Product } from "@/content/vitrin";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/primitives/Toast";


/**
 * Tarih, seçenek ve bilet adedi seçimi; toplam anında hesaplanır.
 * Önizleme olduğu için gönderimde rezervasyon oluşturulmaz ve bu açıkça söylenir.
 */
export function BookingWidget({ p }: { p: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const { notify } = useToast();
  const [date, setDate] = useState("");
  const [calOpen, setCalOpen] = useState(true);
  const [opt, setOpt] = useState(0);
  const [qty, setQty] = useState<number[]>(() => p.options[0].tickets.map((_, i) => (i === 0 ? 1 : 0)));
  const group = useId();
  const [msg, setMsg] = useState<{ tone: "warn" | "info"; text: string } | null>(null);

  const option = p.options[opt];
  const total = useMemo(() => option.tickets.reduce((s, t, i) => s + t.price * (qty[i] ?? 0), 0), [option, qty]);
  const count = qty.reduce((a, b) => a + b, 0);

  const pick = (k: number) => {
    setOpt(k);
    setQty(p.options[k].tickets.map((_, i) => (i === 0 ? 1 : 0)));
    setMsg(null);
  };
  const change = (i: number, d: number) => {
    setQty((q) => q.map((v, k) => (k === i ? Math.max(0, Math.min(20, v + d)) : v)));
    setMsg(null);
  };
  const submit = (go = false) => {
    if (!date) {
      setCalOpen(true);
      return setMsg({ tone: "warn", text: "Lütfen bir tarih seçin." });
    }
    if (!count) return setMsg({ tone: "warn", text: "En az bir bilet seçin." });
    if (!p.cart) {
      return setMsg({ tone: "info", text: "Bu bir önizleme; rezervasyon oluşturulmadı. Canlı sitede bu adım ödeme sayfasına gider." });
    }
    // Kiracı vitrini: seçilen günün ilk kalkışı sepete girer; tutar sunucuda yeniden hesaplanır.
    const v = p.cart.variants.find((x) => x.startsAt.slice(0, 10) === date) ?? p.cart.variants[0];
    if (!v) return setMsg({ tone: "warn", text: "Bu tarihte kalkış yok." });
    add({
      id: `${v.id}-${Date.now()}`,
      productId: p.cart.productId,
      variantId: v.id,
      title: p.title,
      supplier: p.cart.supplier,
      optionName: `${option.name} · ${v.name}`,
      startsAt: v.startsAt,
      pax: { adults: count, children: 0 },
      net: v.net,
      marginPct: p.cart.marginPct,
    });
    notify(`${p.title} sepete eklendi`);
    setMsg({ tone: "info", text: "Sepete eklendi." });
    if (go) router.push("/magaza/sepet");
  };

  return (
    <div id="rezervasyon" className="scroll-mt-40 rounded-[24px] border-2 border-ink/10 bg-white p-6 shadow-[var(--shadow-lift)]">
      <h2 className="text-2xl font-extrabold tracking-tight">Müsaitlik ve fiyatlar</h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-pop-deep">
        {p.instant ? <><Zap className="size-4" /> Anında onay</> : <><CalendarCheck className="size-4" /> Tedarikçi onaylı rezervasyon</>}
      </p>

      <div className="mt-5">
        <button
          type="button"
          aria-expanded={calOpen}
          onClick={() => setCalOpen((o) => !o)}
          className={`flex h-14 w-full items-center gap-3 rounded-xl border-[1.5px] px-4 text-left transition-colors ${calOpen ? "border-ink" : "border-ink/15 hover:border-ink/40"}`}
        >
          <CalendarDays className="size-5 text-ink-3" />
          <span className="flex-1">
            <span className="block text-[11px] font-semibold text-ink-3 uppercase">Tarih</span>
            <span className="block font-semibold">{date ? formatTr(date) : "Tarih seçin"}</span>
          </span>
          <ChevronDown className={`size-5 transition-transform ${calOpen ? "rotate-180" : ""}`} />
        </button>
        {calOpen && (
          <div className="tab-in mt-2">
            <AvailabilityCalendar
              slug={p.slug}
              available={p.available}
              value={date}
              onChange={(v) => {
                setDate(v);
                setCalOpen(false);
                setMsg(null);
              }}
            />
          </div>
        )}
        {date && availability(p.slug, date, p.available) === "few" && (
          <p className="tab-in mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber"><Flame className="size-4" /> Bu tarih için son yerler</p>
        )}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Seçenek</legend>
        <div className="mt-2 flex flex-col gap-2">
          {p.options.map((o, k) => (
            <label key={o.name} className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-ink/15 p-3.5 transition-colors has-checked:border-ink has-checked:bg-pop-soft">
              <input type="radio" name={group} checked={opt === k} onChange={() => pick(k)} className="size-4.5 accent-ink" />
              <span className="flex-1 font-semibold">{o.name}</span>
              <span className="text-sm text-ink-3 tabular-nums">{tl(o.tickets[0].price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <p className="text-sm font-semibold">Biletler</p>
        <ul className="mt-2 divide-y divide-line">
          {option.tickets.map((t, i) => (
            <li key={t.label} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-semibold">{t.label}</span>
                <span className="text-sm text-ink-3 tabular-nums">{tl(t.price)}</span>
              </span>
              <span className="flex items-center gap-3">
                <button type="button" aria-label={`${t.label} azalt`} onClick={() => change(i, -1)} disabled={!qty[i]} className="grid size-10 place-items-center rounded-xl border-[1.5px] border-ink/15 transition-colors hover:border-ink disabled:opacity-30">
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-lg font-bold tabular-nums" aria-live="polite">{qty[i] ?? 0}</span>
                <button type="button" aria-label={`${t.label} artır`} onClick={() => change(i, 1)} className="grid size-10 place-items-center rounded-xl border-[1.5px] border-ink bg-ink text-white transition-transform active:scale-90">
                  <Plus className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 flex items-baseline justify-between border-t-2 border-ink pt-4">
        <span className="text-lg font-bold">Toplam</span>
        <span key={total} className="tab-in text-3xl font-extrabold tracking-tight tabular-nums">{tl(total)}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => submit(false)} className="h-13 rounded-xl border-[1.5px] border-ink font-semibold transition-colors hover:bg-mist">Sepete ekle</button>
        <button type="button" onClick={() => submit(true)} className="h-13 rounded-xl bg-ink font-semibold text-white transition-colors hover:bg-ink-2">Rezervasyon yap</button>
      </div>

      {msg && (
        <p role="status" className={`tab-in mt-4 flex gap-2 rounded-xl p-3 text-sm ${msg.tone === "warn" ? "bg-amber-soft text-amber" : "bg-pop-soft text-ink"}`}>
          <Info className="mt-0.5 size-4 shrink-0" /> {msg.text}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 text-sm text-ink-3">
        <CalendarCheck className="mt-0.5 size-4 shrink-0" /> {p.cancellation}
      </p>
    </div>
  );
}
