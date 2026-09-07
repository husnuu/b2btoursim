import type { TourDraft, TourTranslation } from "./tour";

/**
 * Çoklu dil yardımcıları — Bölüm 6 "Çoklu Dil Otomatik Çeviri". Kapsam tek
 * alternatif dille (İngilizce) sınırlı (bkz. plan Varsayım 2); mekanizma
 * (`translations` map'i) başka dil eklemeyi zorlaştırmaz.
 *
 * "Bir dile daha önce elle içerik girildiyse otomatik çeviri onu ezmez"
 * (Bölüm 2.2) kuralı `auto` bayrağıyla izlenir: elle her düzenleme `auto`yu
 * false yapar, yalnızca "Alternatif Dilleri Temizle" sıfırlar.
 */

export function emptyTranslation(): TourTranslation {
  return {
    title: "",
    description: "",
    includes: [],
    excludes: [],
    knowBeforeYouGo: "",
    whatToBring: "",
    auto: false,
  };
}

/** İngilizce alanına elle/otomatik bir alan yaması uygular. */
export function patchTranslation(
  draft: TourDraft,
  patch: Partial<TourTranslation>,
): Pick<TourDraft, "translations"> {
  const current = draft.translations.en ?? emptyTranslation();
  return { translations: { ...draft.translations, en: { ...current, ...patch } } };
}

export function clearTranslation(): Pick<TourDraft, "translations"> {
  return { translations: {} };
}
