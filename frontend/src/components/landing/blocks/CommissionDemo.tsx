"use client";

import { useState } from "react";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";

const fmt = (n: number) => "₺" + Math.round(n).toLocaleString("tr-TR");

const agencies = [
  { name: "Mavi Rota Turizm", initials: "MR" },
  { name: "Anadolu Gezi", initials: "AG" },
  { name: "Kuzey Seyahat", initials: "KS" },
];

/**
 * Tedarikçi için oyuncak bir hesaplayıcı: komisyon oranını ve ürünü görecek
 * acenteleri seçer, sonucu anında görür. Rakamlar örnektir; gerçek bir fiyat değildir.
 */
export function CommissionDemo() {
  const [price, setPrice] = useState(1500);
  const [rate, setRate] = useState(15);
  const [visible, setVisible] = useState<string[]>(["MR", "AG"]);
  const commission = (price * rate) / 100;
  const net = price - commission;

  return (
    <section className="py-24 sm:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Heading>{"Kontrol\ntamamen sizde."}</Heading>
          <p data-reveal style={delay(150)} className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
            Satış fiyatını, acente komisyonunu ve ürününüzü hangi acentelerin görebileceğini siz belirlersiniz. Kaydırıcıyla
            deneyin.
          </p>
          <p data-reveal style={delay(200)} className="mt-4 text-sm text-ink-3">Örnek hesaplama · Rakamlar temsilidir.</p>
        </div>

        <div data-reveal style={delay(100)} className="rounded-[28px] bg-ink p-7 text-white sm:p-10">
          <p className="text-sm font-bold tracking-wide text-pop uppercase">Çeşme Tekne Turu</p>

          <label className="mt-7 block">
            <span className="flex items-baseline justify-between text-sm text-white/70">
              Satış fiyatı <b className="font-display text-3xl text-white tabular-nums">{fmt(price)}</b>
            </span>
            <input
              type="range"
              min={500}
              max={4000}
              step={50}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-3 w-full accent-pop"
            />
          </label>

          <label className="mt-6 block">
            <span className="flex items-baseline justify-between text-sm text-white/70">
              Acente komisyonu <b className="font-display text-3xl text-white tabular-nums">%{rate}</b>
            </span>
            <input
              type="range"
              min={5}
              max={30}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-3 w-full accent-pop"
            />
          </label>

          {/* Paylaşım çubuğu */}
          <p className="mt-8 flex justify-between text-sm text-white/70">
            <span>Size kalan</span>
            <span>Acente kazancı · <b className="text-white tabular-nums">{fmt(commission)}</b></span>
          </p>
          <div className="mt-3 flex h-14 overflow-hidden rounded-xl text-sm font-bold" aria-live="polite">
            <div className="flex items-center bg-pop px-4 whitespace-nowrap text-ink transition-[flex-basis] duration-500" style={{ flexBasis: `${100 - rate}%` }}>
              {fmt(net)}
            </div>
            <div className="flex items-center justify-end overflow-hidden bg-white px-3 whitespace-nowrap text-ink transition-[flex-basis] duration-500" style={{ flexBasis: `${rate}%` }}>
              {rate >= 14 ? fmt(commission) : ""}
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="text-sm text-white/70">Bu ürünü görebilecek acenteler</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {agencies.map((a) => {
                const on = visible.includes(a.initials);
                return (
                  <button
                    key={a.initials}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setVisible((v) => (on ? v.filter((x) => x !== a.initials) : [...v, a.initials]))}
                    className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pr-4 pl-1.5 text-sm font-semibold transition-colors ${
                      on ? "border-pop bg-pop text-ink" : "border-white/25 text-white/60 hover:border-white/60"
                    }`}
                  >
                    <span className={`grid size-7 place-items-center rounded-full text-[11px] ${on ? "bg-ink text-pop" : "bg-white/10"}`}>{a.initials}</span>
                    {a.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-white/60">
              {visible.length === 0 ? "Ürün şu an hiçbir acenteye açık değil." : `Ürün ${visible.length} acenteye açık.`}
            </p>
          </fieldset>
        </div>
      </Container>
    </section>
  );
}
