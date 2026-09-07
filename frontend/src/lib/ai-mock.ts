import type { TourDraft, TourTranslation } from "./tour";

/**
 * "İçerik Zekası Servisi" (Bölüm 6, Mimari Not) yerine geçen simülasyon.
 *
 * Gerçek bir LLM/görsel-üretim API'si bu prototipte yok (bkz. READINESS.md).
 * Aşağıdaki fonksiyonlar tamamen deterministiktir (mock.ts'in "hiç
 * Math.random yok" kuralıyla tutarlı) — aynı girdi her zaman aynı çıktıyı
 * verir, böylece ekran görüntüleri ve testler tekrarlanabilir kalır.
 * Gerçek bir sağlayıcıya geçilirse yalnızca bu dosyanın içi değişir.
 */

/** Basit, deterministik string hash — renk/varyasyon seçimi için. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 3.5 "Yapay Zeka ile Benzersiz Hale Getirin" — cümleleri deterministik yeniden sıralar/başlıklar. */
export function uniqueify(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return `Öne çıkan deneyim: ${trimmed}`;
  // Pivot hiçbir zaman 0 olmaz: rotasyon her zaman görünür bir değişiklik yaratır.
  const pivot = 1 + (hash(trimmed) % (sentences.length - 1));
  const reordered = [...sentences.slice(pivot), ...sentences.slice(0, pivot)];
  return reordered.join(" ");
}

/** 3.5 "Yapay Zeka ile İsteğe Göre Üret" — talimat + mevcut taslak bağlamından metin üretir. */
export function generateFromPrompt(
  prompt: string,
  context: Pick<TourDraft, "title" | "startLocation">,
): string {
  const place = context.startLocation.trim() || "bulunduğu bölge";
  const title = context.title.trim() || "Bu tur";
  const instruction = prompt.trim() || "unutulmaz bir deneyim odaklı";
  return `${title}, ${place} çevresinde ${instruction} bir güzergah sunar. Katılımcılar yerel rehber eşliğinde bölgenin öne çıkan noktalarını keşfeder ve deneyimi kişisel temposunda yaşar.`;
}

/** 6. "Tek Tıkla Tur Üretimi" — yalnızca başlıktan tam bir taslak üretir. */
export function generateFullDraftFromTitle(title: string): Partial<TourDraft> {
  const description = generateFromPrompt("keşif ve doğa odaklı", {
    title,
    startLocation: "",
  });
  return {
    title,
    description,
    includes: ["Rehberlik", "Ulaşım", "Sigorta"],
    excludes: ["Kişisel harcamalar", "Bahşiş"],
    knowBeforeYouGo: "Rahat kıyafet ve yürüyüş ayakkabısı önerilir.",
    whatToBring: "Güneş kremi, şapka, su şişesi.",
  };
}

/** 3.6 "AI ile Görsel Oluştur" — gerçek görsel yerine deterministik bir ton (bkz. Product.imageTone). */
export function generateImageTone(prompt: string): string {
  const palette = [
    "#b8623a", "#4a6b47", "#8f6a30", "#5c6bc0", "#a83232", "#2f7d6b", "#9c6710",
  ];
  return palette[hash(prompt || "tur") % palette.length];
}

const MINI_DICTIONARY: Record<string, string> = {
  tur: "tour", turu: "tour", gezi: "trip", gün: "day", günü: "day",
  doğumu: "sunrise", balon: "balloon", vadi: "valley", vadisi: "valley",
  müze: "museum", rehber: "guide", rehberlik: "guiding", öğle: "lunch",
  yemeği: "meal", ulaşım: "transport", sigorta: "insurance", giriş: "entrance",
  girişleri: "entrance fees", bahşiş: "tips", kişisel: "personal",
  harcamalar: "expenses", içecekler: "drinks", saat: "hour", saatlik: "hour",
  otelden: "from the hotel", alış: "pickup", kapadokya: "cappadocia",
};

/** 6. "Çoklu Dil Otomatik Çeviri" — küçük bir kelime sözlüğüyle en iyi çaba taslağı. */
function translateWord(word: string): string {
  const clean = word.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, "");
  return MINI_DICTIONARY[clean] ?? word;
}

/** Tek bir metni İngilizceye "taslak" çevirir — gözden geçirilmeden yayınlanmamalı. */
export function translateTextToEnglish(text: string): string {
  if (!text.trim()) return "";
  return text
    .split(/\s+/)
    .map(translateWord)
    .join(" ");
}

/** Bir taslağın çevrilebilir alanlarının tamamını tek seferde İngilizceye çevirir. */
export function translateDraftToEnglish(
  draft: Pick<
    TourDraft,
    "title" | "description" | "includes" | "excludes" | "knowBeforeYouGo" | "whatToBring"
  >,
): TourTranslation {
  return {
    title: translateTextToEnglish(draft.title),
    description: translateTextToEnglish(draft.description),
    includes: draft.includes.map(translateTextToEnglish),
    excludes: draft.excludes.map(translateTextToEnglish),
    knowBeforeYouGo: translateTextToEnglish(draft.knowBeforeYouGo),
    whatToBring: translateTextToEnglish(draft.whatToBring),
    auto: true,
  };
}

/** 5.4 "Sosyal Medya İçerik Üretimi" — ürün açıklamasından kısa bir gönderi taslağı türetir. */
export function generateSocialPost(draft: Pick<TourDraft, "title" | "description">): string {
  const hook = draft.title.trim() || "Yeni turumuz";
  const detail = draft.description.trim().slice(0, 120) || "detaylar yakında";
  return `${hook} ✨ ${detail}${detail.length >= 120 ? "…" : ""} Hemen rezervasyon yapın!`;
}
