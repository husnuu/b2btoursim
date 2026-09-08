import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applyTimeMargin,
  computeHourlyPrice,
  computeKmFormulaPrice,
  computePointPrice,
  computeZonePrice,
  emptyKmFormula,
  emptyVehicle,
  findPointPrice,
  matchAddressToZone,
  missingVehicleFields,
  reachablePoints,
  type MapZone,
  type PointPriceRow,
  type TimeMarginRule,
  type ZonePriceRow,
} from "../src/lib/transfer.ts";

describe("araç zorunlu alanları", () => {
  test("boş araçta başlık eksik", () => {
    const vehicle = emptyVehicle("v1", "2026-09-08T00:00:00.000Z");
    assert.deepEqual(missingVehicleFields(vehicle), ["title"]);
  });

  test("saatlik kiralama modelinde saatlik ücret de zorunlu", () => {
    const vehicle = emptyVehicle("v1", "2026-09-08T00:00:00.000Z");
    vehicle.title = "VIP Van";
    vehicle.pricingModel = "saatlikKiralama";
    assert.deepEqual(missingVehicleFields(vehicle), ["hourlyRate"]);
    vehicle.hourlyRate = 500_00;
    assert.deepEqual(missingVehicleFields(vehicle), []);
  });
});

describe("nokta bazlı fiyat matrisi", () => {
  const matrix: PointPriceRow[] = [
    { id: "r1", fromPointId: "havalimani", toPointId: "goreme", vehicleType: "private", price: 100_00, currency: "TRY" },
    { id: "r2", fromPointId: "havalimani", toPointId: "urgup", vehicleType: "private", price: 120_00, currency: "TRY" },
    { id: "r3", fromPointId: "havalimani", toPointId: "goreme", vehicleType: "shuttle", price: 40_00, currency: "TRY" },
  ];

  test("reachablePoints yalnızca tanımlı hedefleri döner (Mimari Not)", () => {
    assert.deepEqual(reachablePoints(matrix, "havalimani").sort(), ["goreme", "urgup"]);
    assert.deepEqual(reachablePoints(matrix, "goreme"), []);
  });

  test("findPointPrice araç tipine göre ayrı satır bulur", () => {
    assert.equal(findPointPrice(matrix, "havalimani", "goreme", "private")?.price, 100_00);
    assert.equal(findPointPrice(matrix, "havalimani", "goreme", "shuttle")?.price, 40_00);
    assert.equal(findPointPrice(matrix, "goreme", "havalimani", "private"), undefined);
  });

  test("computePointPrice satır yoksa null döner", () => {
    assert.equal(
      computePointPrice(matrix, [], { fromPointId: "goreme", toPointId: "urgup", vehicleType: "private", vehicleId: "v1", time: "10:00" }),
      null,
    );
  });
});

describe("saat marjı kural motoru", () => {
  const rules: TimeMarginRule[] = [
    {
      id: "m1",
      scope: "point",
      startLocationId: null,
      endLocationId: null,
      startTime: "00:00",
      endTime: "06:00",
      percentPct: 20,
      vehicleIds: [],
    },
  ];

  test("gece penceresi içindeki saatte ek ücret uygulanır", () => {
    const price = applyTimeMargin(100_00, rules, { scope: "point", fromId: "a", toId: "b", time: "02:00", vehicleId: "v1" });
    assert.equal(price, 120_00);
  });

  test("pencere dışındaki saatte marj uygulanmaz", () => {
    const price = applyTimeMargin(100_00, rules, { scope: "point", fromId: "a", toId: "b", time: "14:00", vehicleId: "v1" });
    assert.equal(price, 100_00);
  });

  test("negatif yüzde indirim uygular", () => {
    const discount: TimeMarginRule[] = [{ ...rules[0], percentPct: -10 }];
    const price = applyTimeMargin(100_00, discount, { scope: "point", fromId: "a", toId: "b", time: "02:00", vehicleId: "v1" });
    assert.equal(price, 90_00);
  });

  test("scope uyuşmazlığında kural uygulanmaz", () => {
    const price = applyTimeMargin(100_00, rules, { scope: "zone", fromId: "a", toId: "b", time: "02:00", vehicleId: "v1" });
    assert.equal(price, 100_00);
  });
});

describe("harita bazlı (Faz3, simüle)", () => {
  const zones: MapZone[] = [
    { id: "z1", name: "Belek Otel Bölgesi", cityCountry: "Antalya", keywords: "belek, otel" },
    { id: "z2", name: "Antalya Havalimanı Bölgesi", cityCountry: "Antalya", keywords: "havalimanı, airport" },
  ];

  test("matchAddressToZone anahtar kelimeyle eşleşir", () => {
    assert.equal(matchAddressToZone("Belek, Kadriye Mah. No:5", zones)?.id, "z1");
    assert.equal(matchAddressToZone("Antalya Airport Terminal 1", zones)?.id, "z2");
  });

  test("eşleşme yoksa null döner (sahte bölge uydurulmaz)", () => {
    assert.equal(matchAddressToZone("İstanbul Kadıköy", zones), null);
  });

  test("computeZonePrice ve computeKmFormulaPrice tutarlı çalışır", () => {
    const matrix: ZonePriceRow[] = [
      { id: "zp1", fromZoneId: "z1", toZoneId: "z2", vehicleType: "private", price: 800_00, currency: "TRY" },
    ];
    assert.equal(
      computeZonePrice(matrix, [], { fromZoneId: "z1", toZoneId: "z2", vehicleType: "private", vehicleId: "v1", time: "10:00" }),
      800_00,
    );
    const formula = { ...emptyKmFormula(), enabled: true, baseFare: 50_00, perKm: 5_00 };
    assert.equal(computeKmFormulaPrice(formula, 20, "private"), 50_00 + 5_00 * 20);
    assert.equal(computeKmFormulaPrice(formula, 20, "shuttle"), Math.round((50_00 + 5_00 * 20) * 0.7));
  });
});

describe("saatlik kiralama", () => {
  test("fiyat yalnızca süre × saatlik ücrettir", () => {
    assert.equal(computeHourlyPrice(500_00, 4), 2_000_00);
    assert.equal(computeHourlyPrice(333, 3), 999);
  });
});
