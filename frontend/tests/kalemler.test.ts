import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kalemler, toplam, type Secim } from "../src/lib/storefront/kalemler.ts";

describe("tutar dökümü — tek kaynak (VITRIN.md §4.8)", () => {
  it("tur: birim × kişi", () => {
    const s = { kind: "tur", birimFiyat: 145_000, kisi: 3 } as const;
    assert.equal(toplam(s), 435_000);
    assert.equal(kalemler(s).length, 1);
  });

  it("villa: gecelik × gece; sıfır gece teklif değil boş", () => {
    assert.equal(toplam({ kind: "villa", gecelik: 900_000, gece: 4 }), 3_600_000);
    assert.equal(toplam({ kind: "villa", gecelik: 900_000, gece: 0 }), null);
  });

  it("rota bazlı transfer teklifle: kalem yok", () => {
    assert.equal(toplam({ kind: "transfer", saatlik: null, saat: 3 }), null);
    assert.equal(toplam({ kind: "transfer", saatlik: 250_000, saat: 3 }), 750_000);
  });

  it("tekne saatlik: süre indirimi ve kaptan ayrı kalem, toplam kuruşa yuvarlanır", () => {
    const s: Secim = {
      kind: "tekne",
      model: "saatlik",
      saatlik: 100_000,
      saat: 6,
      kademeler: [{ afterHours: 4, discountPct: 10 }, { afterHours: 8, discountPct: 20 }],
      kaptan: { ucret: 20_000, birim: "saatlik" },
    };
    const list = kalemler(s);
    assert.equal(list.length, 3);
    assert.equal(list[1].tutar, -60_000);
    assert.equal(toplam(s), 600_000 - 60_000 + 120_000);
  });

  it("tekne çok günlü: kaptan günlükse gün sayısıyla çarpılır", () => {
    assert.equal(
      toplam({ kind: "tekne", model: "cokGunlu", birimFiyat: 500_000, birim: "gece", adet: 3, kaptan: { ucret: 50_000, birim: "gunluk" } }),
      1_500_000 + 150_000,
    );
  });

  it("aynı seçim her çağrıda aynı rakam (widget, sepet, özet aynı kaynağı okur)", () => {
    const s = { kind: "vize", birimFiyat: 320_000, kisi: 2 } as const;
    assert.equal(toplam(s), toplam(s));
    assert.equal(toplam(s), 640_000);
  });
});
