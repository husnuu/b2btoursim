import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  canPublishVisa,
  effectiveThankYouMessage,
  emptyApplicationForm,
  emptyVisaDraft,
  missingApplicationAnswers,
  missingFormFields,
  missingVisaFields,
  visaCompletionPct,
  type VisaApplicationFormField,
} from "../src/lib/visa.ts";
import { generateFormFieldsFromDocument } from "../src/lib/ai-mock.ts";

describe("vize ürünü zorunlu alanları", () => {
  test("boş taslakta yalnızca başlık eksik", () => {
    assert.deepEqual(missingVisaFields(emptyVisaDraft("v1", "2026-09-08T00:00:00.000Z")), ["title"]);
  });

  test("başlık dolunca yayınlanabilir", () => {
    const visa = emptyVisaDraft("v1", "2026-09-08T00:00:00.000Z");
    visa.title = "Schengen Vizesi";
    assert.ok(canPublishVisa(visa));
  });

  test("visaCompletionPct her zaman 0-100 aralığında", () => {
    const pct = visaCompletionPct(emptyVisaDraft("v1", "2026-09-08T00:00:00.000Z"));
    assert.ok(pct >= 0 && pct <= 100);
  });
});

describe("başvuru formu", () => {
  test("boş formda ad eksik", () => {
    assert.deepEqual(missingFormFields(emptyApplicationForm("f1", "2026-09-08T00:00:00.000Z")), ["name"]);
  });

  test("teşekkür mesajı boşsa standart mesaj kullanılır", () => {
    const form = emptyApplicationForm("f1", "2026-09-08T00:00:00.000Z");
    assert.ok(effectiveThankYouMessage(form).length > 0);
    form.thankYouMessage = "Özel mesaj";
    assert.equal(effectiveThankYouMessage(form), "Özel mesaj");
  });

  test("zorunlu alan boş bırakılırsa missingApplicationAnswers yakalar", () => {
    const form = emptyApplicationForm("f1", "2026-09-08T00:00:00.000Z");
    const field: VisaApplicationFormField = { id: "field1", label: "Pasaport No", type: "text", required: true, options: [] };
    form.fields = [field];
    assert.deepEqual(missingApplicationAnswers(form, {}), ["field1"]);
    assert.deepEqual(missingApplicationAnswers(form, { field1: "  " }), ["field1"]);
    assert.deepEqual(missingApplicationAnswers(form, { field1: "P123456" }), []);
  });

  test("zorunlu olmayan alan boş bırakılabilir", () => {
    const form = emptyApplicationForm("f1", "2026-09-08T00:00:00.000Z");
    form.fields = [{ id: "field1", label: "Not", type: "text", required: false, options: [] }];
    assert.deepEqual(missingApplicationAnswers(form, {}), []);
  });
});

describe("ai-mock: Yapay Zekâ ile Form Oku (Faz3, deterministik simülasyon)", () => {
  test("aynı dosya adı her zaman aynı alan setini üretir", () => {
    const a = generateFormFieldsFromDocument("schengen-basvuru.pdf");
    const b = generateFormFieldsFromDocument("schengen-basvuru.pdf");
    assert.deepEqual(a, b);
  });

  test("temel alanlar her zaman bulunur", () => {
    const fields = generateFormFieldsFromDocument("herhangi-bir-belge.pdf");
    const labels = fields.map((f) => f.label);
    assert.ok(labels.includes("Pasaport Numarası"));
    assert.ok(labels.includes("Doğum Tarihi"));
  });

  test("schengen ipucu ek sigorta alanı ekler", () => {
    const withHint = generateFormFieldsFromDocument("schengen-vize-formu.pdf");
    const withoutHint = generateFormFieldsFromDocument("genel-form.pdf");
    assert.ok(withHint.some((f) => f.label.includes("Sigorta")));
    assert.ok(!withoutHint.some((f) => f.label.includes("Sigorta")));
  });
});
