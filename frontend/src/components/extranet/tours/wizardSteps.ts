import type { MessageKey } from "@/lib/i18n";

/**
 * Sihirbazın 3 grup / 18 alt-adım iskeleti — Spesifikasyon Bölüm 2.1, Şekil 2.1.
 * Tek doğruluk kaynağı: sol nav ve ileri/geri navigasyonu buradan okur.
 * MVP + FAZ2 + FAZ3 tamamlandığı için 18 adımın hepsi canlıdır.
 */

export type WizardGroupId = "detaylar" | "fiyatlandirma" | "rezervasyon";

export type WizardStepId =
  | "baslik-ve-tur"
  | "kategori"
  | "tur-programi"
  | "konaklama-programi"
  | "aciklama"
  | "fotograf-video"
  | "dahil-olanlar"
  | "bilinmesi-gerekenler"
  | "yaninda-ne-getirmeli"
  | "bulusma-noktalari"
  | "fiyatlandirma"
  | "ucretlendirme"
  | "rezervasyon-odeme"
  | "iptal-iade"
  | "musteri-bilgi-formu"
  | "sosyal-medya"
  | "tur-ekstralari"
  | "sozlesme";

export type WizardStep = {
  id: WizardStepId;
  groupId: WizardGroupId;
  labelKey: MessageKey;
};

export const WIZARD_GROUPS: { id: WizardGroupId; labelKey: MessageKey }[] = [
  { id: "detaylar", labelKey: "tourWizard.group.detaylar" },
  { id: "fiyatlandirma", labelKey: "tourWizard.group.fiyatlandirma" },
  { id: "rezervasyon", labelKey: "tourWizard.group.rezervasyon" },
];

export const WIZARD_STEPS: WizardStep[] = [
  { id: "baslik-ve-tur", groupId: "detaylar", labelKey: "tourWizard.step.baslikVeTur" },
  { id: "kategori", groupId: "detaylar", labelKey: "tourWizard.step.kategori" },
  { id: "tur-programi", groupId: "detaylar", labelKey: "tourWizard.step.turProgrami" },
  { id: "konaklama-programi", groupId: "detaylar", labelKey: "tourWizard.step.konaklamaProgrami" },
  { id: "aciklama", groupId: "detaylar", labelKey: "tourWizard.step.aciklama" },
  { id: "fotograf-video", groupId: "detaylar", labelKey: "tourWizard.step.fotografVideo" },
  { id: "dahil-olanlar", groupId: "detaylar", labelKey: "tourWizard.step.dahilOlanlar" },
  { id: "bilinmesi-gerekenler", groupId: "detaylar", labelKey: "tourWizard.step.bilinmesiGerekenler" },
  { id: "yaninda-ne-getirmeli", groupId: "detaylar", labelKey: "tourWizard.step.yanindaNeGetirmeli" },
  { id: "bulusma-noktalari", groupId: "detaylar", labelKey: "tourWizard.step.bulusmaNoktalari" },

  { id: "fiyatlandirma", groupId: "fiyatlandirma", labelKey: "tourWizard.step.fiyatlandirma" },
  { id: "ucretlendirme", groupId: "fiyatlandirma", labelKey: "tourWizard.step.ucretlendirme" },

  { id: "rezervasyon-odeme", groupId: "rezervasyon", labelKey: "tourWizard.step.rezervasyonOdeme" },
  { id: "iptal-iade", groupId: "rezervasyon", labelKey: "tourWizard.step.iptalIade" },
  { id: "musteri-bilgi-formu", groupId: "rezervasyon", labelKey: "tourWizard.step.musteriBilgiFormu" },
  { id: "sosyal-medya", groupId: "rezervasyon", labelKey: "tourWizard.step.sosyalMedya" },
  { id: "tur-ekstralari", groupId: "rezervasyon", labelKey: "tourWizard.step.turEkstralari" },
  { id: "sozlesme", groupId: "rezervasyon", labelKey: "tourWizard.step.sozlesme" },
];

export function firstStepId(): WizardStepId {
  return WIZARD_STEPS[0].id;
}

export function nextStepId(current: WizardStepId): WizardStepId | null {
  const index = WIZARD_STEPS.findIndex((step) => step.id === current);
  return WIZARD_STEPS[index + 1]?.id ?? null;
}

export function previousStepId(current: WizardStepId): WizardStepId | null {
  const index = WIZARD_STEPS.findIndex((step) => step.id === current);
  return index > 0 ? WIZARD_STEPS[index - 1].id : null;
}
