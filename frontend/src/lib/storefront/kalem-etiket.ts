import { formatMoney, t } from "@/lib/i18n";
import type { Kalem } from "./kalemler";

/** Döküm satırının metni — i18n burada, hesap `kalemler.ts`te. */
export function kalemEtiketi(k: Kalem, currency = "TRY"): string {
  switch (k.tip) {
    case "indirim":
      return t("b2c.kalem.indirim", { pct: k.pct });
    case "kaptan":
      return t("b2c.kalem.kaptan", { n: k.n, birim: t(k.birim === "saatlik" ? "b2c.unit.perHour" : "b2c.unit.perDay") });
    default:
      return t(`b2c.kalem.${k.tip}`, { fiyat: formatMoney(k.birimFiyat, currency), n: k.n });
  }
}

/** Liste anahtarı: aynı tipten iki satır çıkmaz. */
export function kalemKey(k: Kalem): string {
  return k.tip;
}
