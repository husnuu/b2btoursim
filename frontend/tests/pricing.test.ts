import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { salePrice, marginAmount } from "../src/lib/types.ts";
import {
  BOOKING_STATUSES,
  STATUS_META,
  canTransition,
  fromApi,
  isTerminal,
  needsConfirmation,
} from "../src/lib/booking-status.ts";
import { deriveActionTokens, contrastRatio } from "../src/lib/theme.ts";
import { BRAND_PALETTE } from "../src/lib/theme.ts";

/**
 * Buradaki hatalar acentenin cebinden çıkar: yanlış satış fiyatı ya müşteriye
 * fazla yansır ya acenteyi zarara sokar. Kuruş bazında kontrol.
 */
describe("fiyat hesabı", () => {
  test("marj yüzdesi net fiyatın üstüne eklenir", () => {
    assert.equal(salePrice(1_240_00, 18), 1_463_20);
    assert.equal(salePrice(520_00, 24), 644_80);
    assert.equal(salePrice(285_00, 30), 370_50);
  });

  test("sıfır marj net fiyatı değiştirmez", () => {
    assert.equal(salePrice(999_99, 0), 999_99);
    assert.equal(marginAmount(999_99, 0), 0);
  });

  test("marj tutarı ile satış fiyatı her zaman tutarlı", () => {
    for (const net of [1, 99, 100_00, 1_240_00, 4_850_00]) {
      for (const pct of [0, 1, 7, 18, 33, 100, 200]) {
        assert.equal(
          net + marginAmount(net, pct),
          salePrice(net, pct),
          `net=${net} marj=%${pct} tutarsız`,
        );
      }
    }
  });

  test("yuvarlama kuruş kaybettirmez", () => {
    // 333 kuruş + %33 = 442.89 -> 443. Aşağı yuvarlanırsa acente zarar eder.
    assert.equal(salePrice(333, 33), 443);
    assert.equal(marginAmount(333, 33), 110);
  });

  test("sonuç her zaman tam sayı kuruş", () => {
    for (const net of [1_240_00, 705_00, 190_00]) {
      for (const pct of [7, 13, 18, 22, 37]) {
        assert.ok(Number.isInteger(salePrice(net, pct)));
        assert.ok(Number.isInteger(marginAmount(net, pct)));
      }
    }
  });

  test("marj arttıkça satış fiyatı monoton artar", () => {
    let prev = -1;
    for (let pct = 0; pct <= 200; pct++) {
      const p = salePrice(1_240_00, pct);
      assert.ok(p > prev, `%${pct} önceki değerden büyük değil`);
      prev = p;
    }
  });
});

describe("rezervasyon durum makinesi", () => {
  test("her durumun etiketi, tonu ve işareti var", () => {
    for (const s of BOOKING_STATUSES) {
      const m = STATUS_META[s];
      assert.ok(m.label, `${s} etiketsiz`);
      assert.ok(m.glyph, `${s} işaretsiz — renk tek başına anlam taşıyamaz`);
      assert.ok(m.tone, `${s} tonsuz`);
    }
  });

  test("geçişler yalnız tanımlı yönde yapılabilir", () => {
    assert.ok(canTransition("draft", "pending"));
    assert.ok(canTransition("pending", "confirmed"));
    assert.ok(canTransition("pending", "failed"), "ödeme reddi PENDING'den gelir");
    assert.ok(canTransition("confirmed", "completed"), "seyahat tarihi geçince");
    assert.ok(canTransition("confirmed", "cancelled"));
    assert.ok(!canTransition("cancelled", "confirmed"), "iptal geri alınamaz");
    assert.ok(!canTransition("refunded", "confirmed"), "iade geri alınamaz");
    assert.ok(!canTransition("confirmed", "draft"), "onay taslağa dönemez");
    assert.ok(!canTransition("failed", "pending"), "başarısız nihai durumdur");
  });

  test("hiçbir durum kendine geçemez", () => {
    for (const s of BOOKING_STATUSES) {
      assert.ok(!canTransition(s, s), `${s} kendine geçiyor`);
    }
  });

  test("nihai durumlardan çıkış yok", () => {
    for (const s of ["refunded", "failed", "completed"] as const) {
      assert.deepEqual(STATUS_META[s].next, [], `${s} nihai olmalı`);
      assert.ok(isTerminal(s), `${s} terminal işaretli olmalı`);
    }
  });

  test("TDD enum karşılıkları çift yönlü eşleşir", () => {
    for (const s of BOOKING_STATUSES) {
      assert.equal(fromApi(STATUS_META[s].apiValue), s);
    }
    assert.equal(fromApi("PARTIALLY_CANCELLED"), "partiallyCancelled");
    assert.throws(() => fromApi("HOLD"), /Bilinmeyen/);
  });

  test("tedarikçiye giden geçişler onay ister, diğerleri geri alınabilir", () => {
    assert.ok(needsConfirmation("cancelled"), "iptal onay istemeli");
    assert.ok(needsConfirmation("confirmed"), "onay geri alınamaz");
    assert.ok(!needsConfirmation("draft"), "sepetteki taslak geri alınabilir olmalı");
  });

  test("her geçiş hedefi geçerli bir durum", () => {
    for (const s of BOOKING_STATUSES) {
      for (const n of STATUS_META[s].next) {
        assert.ok(BOOKING_STATUSES.includes(n), `${s} -> ${n} tanımsız durum`);
      }
    }
  });
});

describe("tema motoru", () => {
  test("paletteki her marka rengi AA kontrastı tutturur", () => {
    for (const brand of BRAND_PALETTE) {
      const t = deriveActionTokens(brand.hex);
      assert.ok(
        t.contrast >= 4.5,
        `${brand.name} (${brand.hex}) -> ${t.primary}: ${t.contrast}:1`,
      );
    }
  });

  test("çok açık bir marka rengi verilse bile eşik korunur", () => {
    // Tenant paletin dışına çıkarsa motor yine de düşürmek zorunda.
    for (const hex of ["#ffff00", "#a0e0ff", "#dddddd", "#7cf17c"]) {
      const t = deriveActionTokens(hex);
      assert.ok(
        contrastRatio(t.primary, t.onAction) >= 4.5,
        `${hex} -> ${t.primary} kontrast ${t.contrast}`,
      );
      assert.ok(t.adjusted, `${hex} için düzeltme yapılmalıydı`);
    }
  });

  test("hover ve active tonları birincilden koyu", () => {
    for (const brand of BRAND_PALETTE) {
      const t = deriveActionTokens(brand.hex);
      const lum = (h: string) => contrastRatio(h, "#ffffff");
      assert.ok(lum(t.hover) >= lum(t.primary), `${brand.name} hover açık kalmış`);
      assert.ok(lum(t.active) >= lum(t.hover), `${brand.name} active açık kalmış`);
    }
  });

  test("tint zemin olarak kullanılacak kadar açık", () => {
    for (const brand of BRAND_PALETTE) {
      const t = deriveActionTokens(brand.hex);
      assert.ok(
        contrastRatio(t.tint, "#16242b") >= 4.5,
        `${brand.name} tint üzerinde ana metin okunmuyor`,
      );
    }
  });
});
