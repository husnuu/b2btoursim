import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeNightlyTotal,
  emptyVillaDraft,
  hasVillaConflict,
  missingVillaFields,
  villaCompletionPct,
  type VillaBooking,
} from "../src/lib/villa.ts";

function draft() {
  return emptyVillaDraft("v1", "2026-09-08T00:00:00.000Z");
}

describe("villa zorunlu alanları", () => {
  test("boş taslakta title/slug/regions eksik (capacity sensible varsayılanla dolu gelir)", () => {
    assert.deepEqual(missingVillaFields(draft()), ["title", "slug", "regions"]);
  });

  test("kapasite sıfırlanırsa da zorunlu alan olarak eksik sayılır", () => {
    const v = draft();
    v.capacity = 0;
    assert.ok(missingVillaFields(v).includes("capacity"));
  });

  test("açıklama ve fotoğraf eksik olsa da 4 zorunlu alan dolunca yayınlanabilir", () => {
    const v = draft();
    v.title = "Villa";
    v.slug = "villa";
    v.regionIds = ["r1"];
    v.capacity = 8;
    assert.deepEqual(missingVillaFields(v), []);
    assert.equal(v.description, "", "açıklama boş kalabilir, zorunlu değil (bkz. plan Varsayım 2)");
    assert.equal(v.images.length, 0, "fotoğraf boş kalabilir, zorunlu değil");
  });

  test("villaCompletionPct her zaman 0-100 aralığında", () => {
    const pct = villaCompletionPct(draft());
    assert.ok(pct >= 0 && pct <= 100);
  });

  test("7 varsayılan mesafe kalemiyle başlar", () => {
    assert.equal(draft().poiDistances.length, 7);
  });
});

describe("gecelik fiyat hesabı", () => {
  test("gece sayısı × gecelik fiyat", () => {
    const { nights, total } = computeNightlyTotal(1000_00, "2026-09-10", "2026-09-13");
    assert.equal(nights, 3);
    assert.equal(total, 3000_00);
  });

  test("aynı gün check-in/check-out sıfır gece verir", () => {
    const { nights, total } = computeNightlyTotal(1000_00, "2026-09-10", "2026-09-10");
    assert.equal(nights, 0);
    assert.equal(total, 0);
  });
});

describe("çakışma önleme (Bölüm 6, MVP)", () => {
  const base: Omit<VillaBooking, "id" | "createdAt"> = {
    villaId: "v1",
    villaTitleSnapshot: "Villa",
    checkInDate: "2026-09-10",
    checkOutDate: "2026-09-15",
    guests: 4,
    nights: 5,
    price: 5000_00,
    currency: "TRY",
    bookingMethod: "onlineOdemeIleAl",
    operationStatus: "planlamaBekliyor",
  };
  const existing: VillaBooking[] = [{ ...base, id: "b1", createdAt: "now" }];

  test("çakışan tarih aralığı engellenir", () => {
    assert.ok(hasVillaConflict(existing, "v1", "2026-09-12", "2026-09-18"));
  });

  test("çakışmayan (bitişik) tarih aralığı serbesttir", () => {
    assert.ok(!hasVillaConflict(existing, "v1", "2026-09-15", "2026-09-18"));
  });

  test("farklı villa için aynı aralık çakışma sayılmaz", () => {
    assert.ok(!hasVillaConflict(existing, "v2", "2026-09-10", "2026-09-15"));
  });

  test("düzenlenen rezervasyonun kendisi hariç tutulabilir", () => {
    assert.ok(!hasVillaConflict(existing, "v1", "2026-09-10", "2026-09-15", "b1"));
  });
});
