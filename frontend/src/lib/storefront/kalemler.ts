/**
 * Tutar dökümü — TEK KAYNAK (VITRIN.md §4.8).
 *
 * Rezervasyon kutusu, talep formu, sepet ve ödeme özeti aynı fonksiyonu
 * çağırır; üç ekranda üç farklı rakam çıkması mümkün değil. Burası
 * yalnız GÖSTERİM içindir: sunucu (`create_storefront_booking`) tutarı
 * kendisi hesaplar, istemci fiyat göndermez. Onay sayfası sunucu değerini
 * basar; buradaki rakamla farklıysa sunucu kazanır.
 *
 * Bu dosya bilerek hiçbir şey içe almaz: Node'un test koşucusu `@/` takma
 * adını çözmez. Etiket metni `kalem-etiket.ts`te (i18n orada).
 * Para her yerde kuruş; yuvarlama yalnız indirim hesabında, tek yerde.
 */
export type Kaptan = { ucret: number; birim: "saatlik" | "gunluk" } | null;

export type Secim =
  | { kind: "tur"; birimFiyat: number; kisi: number }
  | { kind: "tekne"; model: "saatlik"; saatlik: number; saat: number; kademeler: { afterHours: number; discountPct: number }[]; kaptan: Kaptan }
  | { kind: "tekne"; model: "cokGunlu"; birimFiyat: number; birim: "gece" | "gun"; adet: number; kaptan: Kaptan }
  | { kind: "tekne"; model: "kisiBasi"; birimFiyat: number; kisi: number; kaptan: Kaptan }
  | { kind: "villa"; gecelik: number; gece: number }
  | { kind: "transfer"; saatlik: number | null; saat: number }
  | { kind: "vize"; birimFiyat: number; kisi: number };

export type Kalem =
  | { tip: "kisi" | "basvuru" | "gece" | "gun" | "saat"; birimFiyat: number; n: number; tutar: number }
  | { tip: "indirim"; pct: number; tutar: number }
  | { tip: "kaptan"; n: number; birim: "saatlik" | "gunluk"; tutar: number };

/** Fiyat satırları. Teklifle çalışan ürünlerde (rota bazlı transfer) boş. */
export function kalemler(secim: Secim): Kalem[] {
  switch (secim.kind) {
    case "tur":
    case "vize": {
      const n = Math.max(0, secim.kisi);
      return n > 0 ? [{ tip: secim.kind === "tur" ? "kisi" : "basvuru", birimFiyat: secim.birimFiyat, n, tutar: secim.birimFiyat * n }] : [];
    }
    case "villa":
      return secim.gece > 0 ? [{ tip: "gece", birimFiyat: secim.gecelik, n: secim.gece, tutar: secim.gecelik * secim.gece }] : [];
    case "transfer":
      if (secim.saatlik == null || secim.saat <= 0) return [];
      return [{ tip: "saat", birimFiyat: secim.saatlik, n: secim.saat, tutar: secim.saatlik * secim.saat }];
    case "tekne": {
      const out: Kalem[] = [];
      let saat = 0;
      let gun = 1;
      if (secim.model === "saatlik") {
        if (secim.saat <= 0) return [];
        saat = secim.saat;
        gun = Math.max(1, Math.ceil(saat / 24));
        const brut = secim.saatlik * saat;
        out.push({ tip: "saat", birimFiyat: secim.saatlik, n: saat, tutar: brut });
        const pct = secim.kademeler.filter((k) => k.afterHours <= saat).reduce((mx, k) => Math.max(mx, k.discountPct), 0);
        if (pct > 0) out.push({ tip: "indirim", pct, tutar: -Math.round((brut * pct) / 100) });
      } else if (secim.model === "cokGunlu") {
        if (secim.adet <= 0) return [];
        gun = secim.adet;
        saat = gun * 24;
        out.push({ tip: secim.birim === "gun" ? "gun" : "gece", birimFiyat: secim.birimFiyat, n: gun, tutar: secim.birimFiyat * gun });
      } else {
        if (secim.kisi <= 0) return [];
        out.push({ tip: "kisi", birimFiyat: secim.birimFiyat, n: secim.kisi, tutar: secim.birimFiyat * secim.kisi });
      }
      if (secim.kaptan && secim.kaptan.ucret > 0) {
        const n = secim.kaptan.birim === "saatlik" ? saat || 1 : gun;
        out.push({ tip: "kaptan", n, birim: secim.kaptan.birim, tutar: secim.kaptan.ucret * n });
      }
      return out;
    }
  }
}

/** Toplam; kalem yoksa (teklifle) `null`. */
export function toplam(secim: Secim): number | null {
  const list = kalemler(secim);
  if (!list.length) return null;
  return list.reduce((s, k) => s + k.tutar, 0);
}
