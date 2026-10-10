"use client";

import { useState } from "react";

const samples = {
  JSON: `GET /v1/products?category=boat&region=cesme

{
  "id": "PRD-1042",
  "title": "Çeşme Tekne Turu",
  "supplier": "Ege Koyları Denizcilik",
  "date": "2026-06-14",
  "availability": 18,
  "pricing": {
    "currency": "TRY",
    "net": 1250,
    "commission_rate": 0.15
  }
}`,
  XML: `<ProductSearchRS>
  <Product id="PRD-1042">
    <Title>Çeşme Tekne Turu</Title>
    <Supplier>Ege Koyları Denizcilik</Supplier>
    <Date>2026-06-14</Date>
    <Availability>18</Availability>
    <Pricing currency="TRY">
      <Net>1250</Net>
      <CommissionRate>0.15</CommissionRate>
    </Pricing>
  </Product>
</ProductSearchRS>`,
};

type Lang = keyof typeof samples;

/** Planlanan API'nin nasıl görüneceğine dair temsili örnek. */
export function CodeTabs() {
  const [lang, setLang] = useState<Lang>("JSON");
  return (
    <div className="overflow-hidden rounded-[24px] bg-ink text-white shadow-[var(--shadow-photo)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div role="tablist" aria-label="Örnek format" className="flex gap-1">
          {(Object.keys(samples) as Lang[]).map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={lang === l}
              onClick={() => setLang(l)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${lang === l ? "bg-pop text-ink" : "text-white/60 hover:text-white"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/50">Temsili örnek · Henüz yayında değil</span>
      </div>
      <pre key={lang} className="tab-in overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-white/80">
        {samples[lang]}
      </pre>
    </div>
  );
}
