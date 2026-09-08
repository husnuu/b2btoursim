import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  boatCompletionPct,
  computeHourlyBoatPrice,
  computeMultiDayPrice,
  computePerPersonPrice,
  emptyBoatDraft,
  hasBoatConflict,
  hasCaptainConflict,
  missingBoatFields,
  type BoatBooking,
} from "../src/lib/boat.ts";

function draft() {
  return emptyBoatDraft("b1", "2026-09-08T00:00:00.000Z");
}

describe("tekne zorunlu alanları", () => {
  test("boş taslakta zorunlu alanların tümü eksik", () => {
    const missing = missingBoatFields(draft());
    assert.ok(missing.includes("title"));
    assert.ok(missing.includes("category"));
    assert.ok(missing.includes("marina"));
    assert.ok(missing.includes("images"));
    assert.ok(missing.includes("captainFee"), "varsayılan kaptanOption=kaptanli iken ücret zorunlu");
  });

  test("kaptansız seçilince kaptan ücreti zorunlu olmaktan çıkar", () => {
    const b = draft();
    b.captainOption = "kaptansiz";
    assert.ok(!missingBoatFields(b).includes("captainFee"));
  });

  test("tüm zorunlu alanlar dolunca (3 görsel dahil) yayınlanabilir", () => {
    const b = draft();
    b.title = "Gulet";
    b.slug = "gulet";
    b.categoryId = "cat1";
    b.legalCapacity = 10;
    b.mainMarinaId = "mp1";
    b.description = "Açıklama";
    b.images = [
      { id: "i1", alt: "1" },
      { id: "i2", alt: "2" },
      { id: "i3", alt: "3" },
    ];
    b.captainOption = "kaptansiz";
    assert.deepEqual(missingBoatFields(b), []);
  });

  test("boatCompletionPct her zaman 0-100 aralığında", () => {
    const pct = boatCompletionPct(draft());
    assert.ok(pct >= 0 && pct <= 100);
  });
});

describe("fiyat hesaplayıcılar", () => {
  test("saatlik fiyat kademeli indirim uygular (en yüksek eşik kazanır)", () => {
    const tiers = [
      { id: "t1", afterHours: 4, discountPct: 10 },
      { id: "t2", afterHours: 8, discountPct: 20 },
    ];
    assert.equal(computeHourlyBoatPrice(1000, 2, tiers), 2000);
    assert.equal(computeHourlyBoatPrice(1000, 4, tiers), Math.round(1000 * 4 * 0.9));
    assert.equal(computeHourlyBoatPrice(1000, 10, tiers), Math.round(1000 * 10 * 0.8));
  });

  test("çok günlü ve kişi başı fiyatlar basit çarpımdır", () => {
    assert.equal(computeMultiDayPrice({ unit: "gece", unitPrice: 5000, minUnits: 1, maxUnits: 10 }, 3), 15000);
    assert.equal(computePerPersonPrice({ pricePerPerson: 200, minGroupSize: 2 }, 6), 1200);
  });
});

describe("çakışma önleme (Bölüm 6, MVP)", () => {
  const base: Omit<BoatBooking, "id" | "createdAt"> = {
    boatId: "b1",
    boatTitleSnapshot: "Gulet",
    fromDate: "2026-09-10",
    fromTime: "10:00",
    toDate: "2026-09-10",
    toTime: "14:00",
    captainOption: "kaptanli",
    assignedCaptainName: "Ahmet",
    pricingModel: "saatlik",
    price: 1000,
    currency: "TRY",
    securityDeposit: 0,
    securityDepositStatus: "iadeEdildi",
    operationStatus: "planlamaBekliyor",
  };
  const existing: BoatBooking[] = [{ ...base, id: "r1", createdAt: "now" }];

  test("aynı tekne için çakışan aralık engellenir", () => {
    assert.ok(hasBoatConflict(existing, "b1", { fromDate: "2026-09-10", fromTime: "12:00", toDate: "2026-09-10", toTime: "16:00" }));
  });

  test("aynı tekne için çakışmayan aralık serbesttir", () => {
    assert.ok(!hasBoatConflict(existing, "b1", { fromDate: "2026-09-10", fromTime: "14:00", toDate: "2026-09-10", toTime: "18:00" }));
  });

  test("farklı tekne için aynı aralık çakışma sayılmaz", () => {
    assert.ok(!hasBoatConflict(existing, "b2", { fromDate: "2026-09-10", fromTime: "10:00", toDate: "2026-09-10", toTime: "14:00" }));
  });

  test("düzenlenen rezervasyonun kendisi hariç tutulabilir", () => {
    assert.ok(!hasBoatConflict(existing, "b1", { fromDate: "2026-09-10", fromTime: "10:00", toDate: "2026-09-10", toTime: "14:00" }, "r1"));
  });

  test("kaptan çakışması isim ve saat eşleşmesiyle tespit edilir (Faz3 simülasyon)", () => {
    assert.ok(hasCaptainConflict(existing, "Ahmet", { fromDate: "2026-09-10", fromTime: "13:00", toDate: "2026-09-10", toTime: "15:00" }));
    assert.ok(!hasCaptainConflict(existing, "Mehmet", { fromDate: "2026-09-10", fromTime: "13:00", toDate: "2026-09-10", toTime: "15:00" }));
    assert.ok(!hasCaptainConflict(existing, "", { fromDate: "2026-09-10", fromTime: "13:00", toDate: "2026-09-10", toTime: "15:00" }));
  });
});
