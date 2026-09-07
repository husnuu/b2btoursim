/**
 * İletişim hatları — tek kaynak.
 *
 * Numaraları buraya yazın, sayfa kendiliğinden güncellenir. `+90 5XX XXX XX XX`
 * biçimindeki değerler henüz doldurulmamış sayılır: sayfada tıklanabilir bir
 * `tel:` bağlantısı yerine "numara eklenecek" olarak görünür, böylece yanlışlıkla
 * başkasına ait bir numara aranmaz.
 */

export type ContactLine = {
  id: string;
  /** Hattın ne işe yaradığı — ziyaretçinin hangisini arayacağına karar verdiği yer. */
  label: string;
  hours: string;
  number: string;
};

export const CONTACT_LINES: ContactLine[] = [
  {
    id: "satis",
    label: "Satış",
    hours: "Hafta içi 09.00 – 18.00",
    number: "+90 5XX XXX XX XX",
  },
  {
    id: "destek",
    label: "Acente desteği",
    hours: "Hafta içi 08.00 – 20.00",
    number: "+90 5XX XXX XX XX",
  },
  {
    id: "nobet",
    label: "Nöbetçi operasyon",
    hours: "Her gün, 24 saat",
    number: "+90 5XX XXX XX XX",
  },
];

export const CONTACT_EMAIL = "merhaba@kontuar.example";

/** Doldurulmamış numaralar X taşır. */
export function isPlaceholder(number: string): boolean {
  return /x/i.test(number);
}

/** tel: bağlantısı için boşluk ve ayraçlar temizlenir. */
export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}
