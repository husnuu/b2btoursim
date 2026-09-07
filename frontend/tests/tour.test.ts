import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  emptyTourDraft,
  missingRequiredFields,
  slugify,
  tourCompletionPct,
  canPublish,
} from "../src/lib/tour.ts";
import {
  TOUR_STATUSES,
  TOUR_STATUS_META,
  canTransition,
  isTerminal,
} from "../src/lib/tour-status.ts";
import {
  generateFullDraftFromTitle,
  generateImageTone,
  translateTextToEnglish,
  uniqueify,
} from "../src/lib/ai-mock.ts";
import { clearTranslation, emptyTranslation, patchTranslation } from "../src/lib/translation.ts";

describe("slugify", () => {
  test("Türkçe karakterleri ASCII karşılığına çevirir", () => {
    assert.equal(slugify("Göreme Gün Doğumu"), "goreme-gun-dogumu");
    assert.equal(slugify("Şık Çadır İncelemesi"), "sik-cadir-incelemesi");
  });

  test("boşlukları ve tekrar eden ayraçları tek tireye indirger", () => {
    assert.equal(slugify("  Kapadokya   Balon Turu!! "), "kapadokya-balon-turu");
  });
});

describe("zorunlu alanlar", () => {
  test("boş taslakta dört alan da eksik", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    assert.deepEqual(missingRequiredFields(draft), [
      "title",
      "slug",
      "description",
      "itinerary",
    ]);
    assert.ok(!canPublish(draft));
  });

  test("dört alan da dolunca yayınlanabilir", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    draft.title = "Kapadokya balon turu";
    draft.slug = slugify(draft.title);
    draft.description = "Gün doğumunda bir saatlik uçuş.";
    draft.itinerary = [{ id: "s1", name: "Göreme", durationMinutes: 60, description: "" }];
    assert.deepEqual(missingRequiredFields(draft), []);
    assert.ok(canPublish(draft));
  });
});

describe("tur içeriği yüzdesi", () => {
  test("boş taslak %0", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    assert.equal(tourCompletionPct(draft), 0);
  });

  test("her alan dolunca %100", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    draft.title = "Tur";
    draft.slug = "tur";
    draft.description = "Açıklama";
    draft.itinerary = [{ id: "s1", name: "Durak", durationMinutes: 30, description: "" }];
    draft.tourKind = "gunubirlik";
    draft.startLocation = "Kapadokya";
    draft.images = [{ id: "i1", alt: "foto.jpg" }];
    draft.categoryIds = ["cat1"];
    draft.includes = ["Rehberlik"];
    draft.knowBeforeYouGo = "Bilgi";
    draft.whatToBring = "Ayakkabı";
    draft.meetingPointId = "mp1";
    draft.ageTiers = draft.ageTiers.map((t) =>
      t.key === "adult" ? { ...t, price: 100_00 } : t,
    );
    assert.equal(tourCompletionPct(draft), 100);
  });

  test("yüzde her zaman 0-100 aralığında", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    const pct = tourCompletionPct(draft);
    assert.ok(pct >= 0 && pct <= 100);
  });
});

describe("tur yayın durumu", () => {
  test("her durumun etiketi, tonu ve işareti var", () => {
    for (const status of TOUR_STATUSES) {
      const meta = TOUR_STATUS_META[status];
      assert.ok(meta.label, `${status} etiketsiz`);
      assert.ok(meta.glyph, `${status} işaretsiz`);
      assert.ok(meta.tone, `${status} tonsuz`);
    }
  });

  test("taslak/aktif/pasif geri alınabilir, arşivlendi geri alınamaz", () => {
    for (const status of ["taslak", "aktif", "pasif"] as const) {
      assert.ok(TOUR_STATUS_META[status].reversible, `${status} geri alınamaz işaretli`);
    }
    assert.ok(!TOUR_STATUS_META.arsivlendi.reversible, "arşivlendi geri alınabilir işaretli");
    assert.ok(isTerminal("arsivlendi"));
    assert.ok(!isTerminal("aktif"));
  });

  test("aktif ve pasif birbirine serbestçe gider", () => {
    assert.ok(canTransition("taslak", "aktif"));
    assert.ok(canTransition("aktif", "pasif"));
    assert.ok(canTransition("pasif", "aktif"));
    assert.ok(!canTransition("aktif", "aktif"), "kendine geçemez");
  });

  test("her durumdan arşive kalıcı kaldırma yapılabilir, arşivden çıkış yok", () => {
    for (const status of ["taslak", "aktif", "pasif"] as const) {
      assert.ok(canTransition(status, "arsivlendi"), `${status} arşivlenemiyor`);
    }
    assert.deepEqual(TOUR_STATUS_META.arsivlendi.next, []);
  });

  test("her geçiş hedefi geçerli bir durum", () => {
    for (const status of TOUR_STATUSES) {
      for (const next of TOUR_STATUS_META[status].next) {
        assert.ok(TOUR_STATUSES.includes(next), `${status} -> ${next} tanımsız durum`);
      }
    }
  });
});

describe("ai-mock (deterministik simülasyon)", () => {
  test("uniqueify aynı girdi için her zaman aynı çıktıyı verir", () => {
    const text = "Göreme'de gün doğumu. Balon uçuşu bir saat sürer. Sertifika verilir.";
    assert.equal(uniqueify(text), uniqueify(text));
  });

  test("uniqueify metni anlamlı biçimde değiştirir", () => {
    const text = "Göreme'de gün doğumu. Balon uçuşu bir saat sürer. Sertifika verilir.";
    assert.notEqual(uniqueify(text), text);
  });

  test("generateFullDraftFromTitle zorunlu alanları doldurur", () => {
    const patch = generateFullDraftFromTitle("Kapadokya Yeraltı Şehri Turu");
    assert.equal(patch.title, "Kapadokya Yeraltı Şehri Turu");
    assert.ok(patch.description && patch.description.length > 0);
    assert.ok((patch.includes ?? []).length > 0);
  });

  test("generateImageTone deterministik ve geçerli bir hex renk döner", () => {
    assert.equal(generateImageTone("balon turu"), generateImageTone("balon turu"));
    assert.match(generateImageTone("balon turu"), /^#[0-9a-f]{6}$/i);
  });

  test("translateTextToEnglish boş metinde boş döner, deterministiktir", () => {
    assert.equal(translateTextToEnglish(""), "");
    const text = "Rehberlik ve öğle yemeği dahildir";
    assert.equal(translateTextToEnglish(text), translateTextToEnglish(text));
  });
});

describe("çoklu dil (translation.ts)", () => {
  test("patchTranslation önceki alanları korur, yalnızca verileni değiştirir", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    const step1 = patchTranslation(draft, { title: "Cappadocia Tour" });
    const merged = { ...draft, ...step1 };
    const step2 = patchTranslation(merged, { description: "A great trip" });
    const result = { ...merged, ...step2 };
    assert.equal(result.translations.en?.title, "Cappadocia Tour");
    assert.equal(result.translations.en?.description, "A great trip");
  });

  test("clearTranslation tüm alternatif dilleri sıfırlar", () => {
    const draft = emptyTourDraft("t1", "2026-09-07T00:00:00.000Z");
    const withEn = { ...draft, ...patchTranslation(draft, { title: "Test" }) };
    const cleared = { ...withEn, ...clearTranslation() };
    assert.deepEqual(cleared.translations, {});
  });

  test("emptyTranslation auto:false ile başlar", () => {
    assert.equal(emptyTranslation().auto, false);
  });
});
